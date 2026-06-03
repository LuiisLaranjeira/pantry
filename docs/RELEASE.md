# Release runbook

Operator checklist for the things the codebase can't automate: Supabase
project setup, EAS env injection, store credentials, and the first
release. Living document — when you find something missing, add it.

The codebase assumes three environments mirrored across Supabase, EAS,
and the device:

| Environment   | Bundle ID                                    | Supabase project | EAS channel    | App display name      |
| ------------- | -------------------------------------------- | ---------------- | -------------- | --------------------- |
| `development` | `com.luiislaranjeira.pantry.development`     | `pantry-dev`     | `development`  | Pantry (Dev)          |
| `preview`     | `com.luiislaranjeira.pantry.preview`         | `pantry-dev`     | `preview`      | Pantry (Preview)      |
| `production`  | `com.luiislaranjeira.pantry`                 | `pantry-prod`    | `production`   | Pantry                |

`development` and `preview` share one Supabase project (cheaper, and
preview builds are still pre-production). Promote schema changes to
production by tagging a release.

---

## 1. One-time: provision Supabase projects

1. Create **`pantry-dev`** in the Supabase dashboard. Region close to
   your users. Copy the **project ref** (the part of the dashboard URL
   between `/project/` and `/`).
2. Create **`pantry-prod`**. Same region. Copy its project ref.
3. On `pantry-prod`, enable **Point-in-Time Recovery** under
   Settings → Database → Backups. (Paid plan required.)
4. For each project, capture:
   - `Project URL` (e.g. `https://abcd.supabase.co`)
   - `anon` public key
   - `service_role` secret key (never bundle into the client)

5. Apply the initial schema to both projects:
   ```sh
   supabase link --project-ref <ref>
   supabase db push --linked --include-all
   supabase functions deploy identify-product
   supabase functions deploy parse-receipt
   ```
   The CI workflow does this automatically going forward
   (`.github/workflows/supabase-deploy.yml`).

6. Set edge function secrets on each project:
   ```sh
   supabase secrets set --project-ref <ref> GROQ_API_KEY=<value>
   ```
   The functions also need `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   — Supabase provides those automatically; no action needed.

7. **Rotate the legacy `GROQ_API_KEY`** that lived in `pantry2/.env`
   before adopting this runbook. Anything in version-control history
   should be treated as compromised.

## 2. One-time: configure EAS

```sh
eas login
eas env:create --scope project --environment production
# Repeat for development and preview
```

Variables to set per environment (use `eas env:create` for each):

| Variable                              | development            | preview                | production              |
| ------------------------------------- | ---------------------- | ---------------------- | ----------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`            | dev project URL        | dev project URL        | prod project URL        |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`       | dev anon               | dev anon               | prod anon               |
| `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL`  | `<dev>/functions/v1`   | `<dev>/functions/v1`   | `<prod>/functions/v1`   |
| `EXPO_PUBLIC_SENTRY_DSN`              | dev DSN (optional)     | prod DSN               | prod DSN                |

`EXPO_PUBLIC_APP_VARIANT` is set automatically by the `env` block in
`eas.json` (see the table at the top of this file).

Configure EAS Update channels:

```sh
eas update:configure
eas branch:create development
eas branch:create preview
eas branch:create production
```

The `eas.json` already maps each build profile to the matching channel,
so `eas update --branch development` pushes a JS-only OTA to dev
builds.

## 3. One-time: store credentials

### iOS

1. Enrol the bundle IDs `com.luiislaranjeira.pantry`,
   `com.luiislaranjeira.pantry.preview`, and
   `com.luiislaranjeira.pantry.development` in App Store Connect.
2. Create an App Store Connect API key (Users → Keys → +). Download
   the `.p8`.
3. Fill in `eas.json` `submit.production.ios`:
   - `appleId` — your Apple ID
   - `ascAppId` — App Store Connect app ID for the *production* bundle
   - `appleTeamId` — from your Apple Developer account
4. `eas credentials` to manage signing certificates (one-time).

### Android

1. Create the app in Google Play Console for
   `com.luiislaranjeira.pantry`.
2. Create a service account in Google Cloud Console with the
   `Service Accounts → Service Account User` role; grant it access in
   Play Console under Users and permissions.
3. Download the JSON key as `google-play-service-account.json` in the
   repo root. **It's gitignored — do not commit.**
4. Bootstrap the upload key:
   ```sh
   eas credentials
   ```

## 4. GitHub repository secrets

Required for the CI / deploy workflows to run:

| Secret                          | Used by                          | Source                                          |
| ------------------------------- | -------------------------------- | ----------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN`         | supabase-deploy.yml              | Supabase Dashboard → Account → Access Tokens    |
| `SUPABASE_DEV_PROJECT_REF`      | supabase-deploy.yml (main push)  | The `pantry-dev` project ref from step 1        |
| `SUPABASE_PROD_PROJECT_REF`     | supabase-deploy.yml (tag push)   | The `pantry-prod` project ref from step 1       |

Optionally set GitHub **Environments** named `development` and
`production` and pin secrets to each — the deploy workflow already
selects the right environment based on the trigger (branch vs tag).

## 5. First release

1. Open a PR. CI runs:
   - Typecheck + lint + unit tests
   - RLS test suite (boots local Supabase via `supabase start`)
2. Merge to `main`. The supabase-deploy workflow pushes migrations and
   edge functions to `pantry-dev`.
3. Build a preview:
   ```sh
   eas build --profile preview --platform all
   ```
   Install on a tester device via the QR code.
4. Cut a release:
   ```sh
   git tag v1.0.0
   git push origin v1.0.0
   ```
   The supabase-deploy workflow pushes migrations and edge functions to
   `pantry-prod`. Then:
   ```sh
   eas build --profile production --platform all
   eas submit --profile production --platform all
   ```
5. After binary review, ship a JS-only update with:
   ```sh
   eas update --branch production --message "Tweak X"
   ```

## 6. Recurring: secret hygiene

- Rotate `GROQ_API_KEY` whenever it's been pasted into ChatGPT, Claude,
  Slack, etc.
- Rotate Supabase `service_role` keys at least quarterly; redeploy
  edge functions to pick up the new value.
- Sentry DSNs are project-public — safe to bundle — but rotating the
  project is the only mitigation if it's being abused.

## 7. Decommissioning pantry2

Once `pantry-prod` is live and pantry2 traffic is zero:

1. Drop the legacy `users can join households` policy on
   `household_users` (currently retained for pantry2 — see
   migration 20260602120000).
2. Optionally drop the `users can create households` permissive
   policy and require `create_household` exclusively.
3. Archive `pantry2/` (move out of the working dir or delete).
