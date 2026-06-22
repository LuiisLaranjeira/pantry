import { appendFileSync } from 'node:fs';

import { adapters } from './adapters/index.js';
import { supabase } from './supabase.js';
import type { Adapter } from './types.js';

// Polite, low-volume crawling: a few in-flight requests with a delay between
// each, plus a couple of retries for transient failures.
const CONCURRENCY = 3;
const DELAY_MS = 600;
const MAX_RETRIES = 2;

// A "real" EAN barcode: 8 (EAN-8), 12 (UPC-A) or 13 (EAN-13) digits. Manual
// barcodes in the app are `manual_<uuid>`, which this naturally excludes.
const EAN_RE = /^(\d{8}|\d{12}|\d{13})$/;

interface StoreRow {
  id: string;
  slug: string;
  name: string;
}

interface ProductRow {
  id: string;
  barcode: string;
  name: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retry transient failures with linear backoff. `null` results don't throw. */
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(DELAY_MS * (attempt + 1));
    }
  }
  throw lastErr;
}

interface StoreSummary {
  store: string;
  checked: number;
  written: number;
  errors: number;
  skipped?: string;
}

async function scrapeStore(store: StoreRow, adapter: Adapter, products: ProductRow[]) {
  const startedAt = new Date().toISOString();
  let checked = 0;
  let written = 0;
  let errors = 0;

  const queue = [...products];

  async function worker() {
    for (;;) {
      const product = queue.shift();
      if (!product) return;
      checked++;
      try {
        const result = await withRetry(() =>
          adapter({ barcode: product.barcode, name: product.name }),
        );
        if (result) {
          const { error } = await supabase.from('store_prices').upsert(
            {
              store_id: store.id,
              product_id: product.id,
              barcode: product.barcode,
              price: result.price,
              in_stock: result.inStock,
              url: result.url,
              scraped_at: new Date().toISOString(),
            },
            { onConflict: 'store_id,product_id' },
          );
          if (error) {
            errors++;
            console.error(`[${store.slug}] upsert failed for ${product.barcode}:`, error.message);
          } else {
            written++;
          }
        }
      } catch (err) {
        // One product never aborts the run — count it and move on.
        errors++;
        console.error(`[${store.slug}] ${product.barcode} failed:`, err);
      }
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const { error: runErr } = await supabase.from('scrape_runs').insert({
    store_id: store.id,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    products_checked: checked,
    prices_written: written,
    errors,
    ok: errors === 0,
  });
  if (runErr) console.error(`[${store.slug}] scrape_runs insert failed:`, runErr.message);

  return { store: store.name, checked, written, errors } satisfies StoreSummary;
}

function writeJobSummary(summaries: StoreSummary[]) {
  const lines = [
    '## Price scrape',
    '',
    '| Store | Checked | Written | Errors |',
    '| --- | --- | --- | --- |',
    ...summaries.map(
      (s) =>
        `| ${s.store} | ${s.skipped ? '—' : s.checked} | ${s.skipped ? '—' : s.written} | ${
          s.skipped ?? s.errors
        } |`,
    ),
  ];
  const text = lines.join('\n') + '\n';
  console.log(text);
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) appendFileSync(summaryFile, text);
}

async function main() {
  const { data: stores, error: storesErr } = await supabase
    .from('stores')
    .select('id, slug, name')
    .eq('active', true);
  if (storesErr) throw new Error(`Could not load stores: ${storesErr.message}`);

  const { data: products, error: productsErr } = await supabase
    .from('products')
    .select('id, barcode, name');
  if (productsErr) throw new Error(`Could not load products: ${productsErr.message}`);

  const targets = (products ?? []).filter((p) => EAN_RE.test(p.barcode)) as ProductRow[];
  console.log(
    `Loaded ${stores?.length ?? 0} active stores and ${targets.length} EAN products ` +
      `(of ${products?.length ?? 0} total).`,
  );

  const summaries: StoreSummary[] = [];
  for (const store of (stores ?? []) as StoreRow[]) {
    const adapter = adapters[store.slug];
    if (!adapter) {
      console.warn(`No adapter registered for store "${store.slug}" — skipping.`);
      summaries.push({
        store: store.name,
        checked: 0,
        written: 0,
        errors: 0,
        skipped: 'no adapter',
      });
      continue;
    }
    summaries.push(await scrapeStore(store, adapter, targets));
  }

  writeJobSummary(summaries);
}

main().catch((err) => {
  console.error('Scrape run failed:', err);
  process.exit(1);
});
