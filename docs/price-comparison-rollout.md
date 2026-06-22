# Price Comparison — Rollout & Verification Runbook

Step-by-step plan to verify the multi-store price comparison feature **in
isolation** against a dedicated Supabase test project, then merge into the app.

- **Branch:** `feat/store-price-comparison` (draft PR #1)
- **Why isolated:** the changes are additive — a new migration, a standalone
  `scraper/` project, and new client files plus opt-in badges that simply
  render nothing when there's no price data. Existing app behavior is
  unaffected until merge.
- **Legend:** 🔑 = an input only you can provide (tokens, refs, keys, secrets).
  Check off each box as you go.

---

## Phase 0 — Provision a dedicated test project
- [ ] Create a new Supabase project (e.g. `pantry-pricetest`).
- [ ] 🔑 Capture from **Project Settings → API / Database**:
  - project ref
  - database connection string (`DB_URL`)
  - API URL, `anon` key, `service_role` key

> Using a throwaway project keeps all testing away from prod/dev. Nothing here
> touches your real data.

---

## Phase 1 — Bootstrap base schema + migrations
A fresh project has no tables. The repo's migrations are *incremental* and
assume the base schema (`households`, `products`, `stock_items`, …) already
exists, so apply `schema.sql` first, then the migrations.

```bash
supabase login                              # 🔑 access token (one-time)
supabase link --project-ref <NEW_REF>       # 🔑 new project ref

# 1) Base tables + policies (these live in schema.sql, not in migrations):
#    paste supabase/schema.sql into the SQL editor, OR run:
psql "<DB_URL>" -f supabase/schema.sql      # 🔑 DB_URL

# 2) Incremental migrations (includes 20260622120000_store_prices.sql):
supabase db push
```

**Verify:**
- [ ] `stores`, `store_prices`, `scrape_runs` tables exist.
- [ ] `stores` has the 3 seeded rows (Continente, Pingo Doce, Auchan).
- [ ] As an **authenticated** user: `select` on `stores`/`store_prices` works;
      `insert` is denied; `select` on `scrape_runs` is denied.

> Bonus: this fresh DB now contains the complete from-scratch schema. We reuse
> it in Phase 6 to generate the CI baseline — without touching prod.

---

## Phase 2 — Seed test products
The scraper only targets `products` rows with real EAN barcodes.

- [ ] 🔑 Insert 2–3 known Portuguese products, e.g.:
  ```sql
  insert into products (barcode, name) values
    ('5601234567890', 'Test product A'),
    ('5609876543210', 'Test product B');
  ```
- [ ] (Optional) add one `manual_<uuid>` barcode product to confirm it's
  excluded by the EAN filter.

---

## Phase 3 — Run the scraper against the test project
This is the real test — it tells us whether the Continente adapter works
against the live site.

```bash
cd scraper && npm ci
SUPABASE_URL=<api-url> SUPABASE_SERVICE_ROLE_KEY=<service-role-key> npm start
```
🔑 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from the test project.

**Verify:**
- [ ] `store_prices` has rows for the test barcodes.
- [ ] `scrape_runs` has a summary row per store.
- [ ] The `manual_*` product was skipped.
- [ ] A failing/empty adapter (Pingo Doce stub returns `null`) doesn't abort the run.

> ⚠️ Expect to iterate on `scraper/adapters/continente.ts`: retailer markup /
> anti-bot can require selector or endpoint tuning. Fix it here, before merge.

---

## Phase 4 — Test the GitHub workflow (manual dispatch)
- [ ] 🔑 In **GitHub → Settings → Environments → `development`**, add:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (pointing at the test project for now)
- [ ] Run **Actions → Scrape Prices → Run workflow → development**.
- [ ] Confirm the job summary table and fresh rows in `store_prices`.

> Production secrets come later, only when you're ready for the weekly cron.

---

## Phase 5 — Verify the client UI
Point the app at the test project and run it:
```bash
EXPO_PUBLIC_SUPABASE_URL=<api-url> \
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key> \
npx expo start
```

**Verify:**
- [ ] Open a product that now has prices → compare sheet lists stores sorted
      ascending, cheapest highlighted, with a freshness label and product link.
- [ ] Shopping-list rows show the "cheapest at {store}" badge; tapping it opens
      the compare sheet.

---

## Phase 6 — Get CI green, then merge
Two pre-existing CI items, independent of the feature itself:

- **`supabase-deploy.yml`** (fails on a fresh repo without secrets):
  - [ ] 🔑 Add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DEV_PROJECT_REF`,
        `SUPABASE_PROD_PROJECT_REF` to the `development`/`production`
        Environments — or ask me to guard the workflow to skip when unconfigured.
- **`rls` job** (`supabase start` can't build from scratch because base schema
  isn't in migrations):
  - [ ] Generate a true baseline from the Phase 1 fresh DB
        (`supabase db dump`), slot it before the first migration, and
        `supabase migration repair` it as applied on existing remotes so it's
        never re-run there. **Do this as its own small, reviewed PR** — it
        affects the deploy path and shouldn't block this feature.

**Merge:** once Phases 1–5 are verified and required checks are green, mark
PR #1 ready and merge.

---

## Recommended sequencing
Run **Phases 1–5 first** (all against the test project, no merge, no CI
dependency) to prove the feature end-to-end — especially the scraper. Treat
Phase 6's CI/deploy/baseline items as a parallel cleanup track, and only merge
after Phase 5 passes.
