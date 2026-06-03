# Privacy Policy — Pantry

**Last updated:** _[YYYY-MM-DD when you publish]_

This is a working template for the Pantry app's privacy policy.
Replace the bracketed placeholders, vet the wording with whoever
operates the published product, and host the rendered document at a
stable URL. Both Apple and Google require the URL to be entered in
their respective consoles, and the Pantry app surfaces the same URL
in the Profile screen via `EXPO_PUBLIC_PRIVACY_POLICY_URL`.

---

## Who runs Pantry

Pantry is published by **_[Operator / business / individual name]_**
(referred to below as "we", "us"). For privacy questions, contact
**_[privacy contact email]_**.

## Data we collect from you directly

| Category               | Examples                                                            | Why we collect it                                                       |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Account                | Email address, password                                             | Sign-in, account recovery                                               |
| Household              | Household name, invite code, country preference                     | Sharing pantry/shopping data between household members                  |
| Pantry contents        | Product names, brands, package units, quantities, low-stock log     | The app's core function                                                 |
| Shopping lists         | List items (name, quantity, price), purchase history                | The app's core function; spending charts in Profile                     |
| Product images         | Photos you take of barcodes and product labels                      | Sent to Groq for identification; not retained server-side               |
| Receipt images / text  | Photos of receipts or device-side OCR'd text                        | Sent to Groq for parsing; OCR text is logged for debugging the parser   |
| Device permissions     | Camera (for scanning), notifications (low-stock alerts, opt-in)     | Used only for the feature that triggered the prompt                     |

## Data we collect automatically

- Crash reports + structured logs via **Sentry** if `EXPO_PUBLIC_SENTRY_DSN`
  is configured. Personally identifying values (email, tokens, IDs, codes)
  are scrubbed by `beforeSend` and `beforeBreadcrumb` hooks before transmission.
- App version, OS version, and device model — included automatically in
  crash reports.
- API call counters per user, used only to enforce per-user rate limits on
  AI-powered functions. Kept in the `api_call_log` table; not exposed to
  any client.

## Data we do **not** collect

- Location.
- Contacts.
- Advertising identifiers.
- Anything from third-party trackers — there are none.

## Third parties we share with

| Provider                                             | What flows to them                                                    | Purpose                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Supabase** (database, auth, edge functions)        | Everything you store in the app                                       | Backend hosting and authentication                                        |
| **Groq** (LLM provider)                              | Product images, receipt images, OCR'd receipt text                    | Identify products and parse receipts into structured items                |
| **OpenFoodFacts** (open product database)            | Barcode strings                                                       | Look up a product when we don't have it in our catalog                    |
| **Sentry** (error monitoring; optional)              | Error stacks, breadcrumbs, scrubbed app context                       | Diagnose crashes and surface regressions                                  |
| **Expo / EAS** (Expo Application Services)           | Build artifacts, OTA update channel, push-notification tokens         | App distribution, over-the-air JS updates                                 |
| **Apple App Store / Google Play**                    | App binary, store-listing metadata                                    | Distribution                                                              |

We do not sell your data. We do not share with advertising networks.

## How long we keep your data

- Account and household data persist until you delete your account.
- The crash-reporting backend (Sentry) typically retains events for 90 days;
  see Sentry's retention policy.
- Rate-limit log rows are retained for **_[N days — pick a number, e.g. 30]_**.
- Images forwarded to Groq are not persisted on Pantry's servers; Groq's
  data-handling terms apply to the in-flight request.

## Your choices and rights

- **In-app account deletion.** Profile → Account → "Delete account" hard-deletes
  your account, all data tied to it, and any household where you are the only
  member. There is no soft-delete state.
- **Export.** Profile offers CSV export of your current pantry and your full
  shopping history.
- **Notifications.** Profile → Notifications toggle.
- **Camera.** Revoke at any time in the device's settings; only barcode and
  product-photo features need it.
- **Access / rectification / portability.** Email **_[privacy contact email]_**
  and we will respond within **_[N days]_** subject to applicable law.

## Children

Pantry is not directed at children under 13. We do not knowingly collect
personal information from children. If you believe a child has provided
data, contact us and we will remove it.

## Changes to this policy

We will update the "Last updated" date and bump the in-app reference if the
policy materially changes. Significant changes will be announced via an
in-app prompt before they take effect.

## Contact

_[Operator name]_
_[Mailing address]_
_[Privacy contact email]_
