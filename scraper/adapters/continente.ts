import * as cheerio from 'cheerio';

import type { Adapter, PriceResult } from '../types.js';

const BASE = 'https://www.continente.pt';
const SEARCH = `${BASE}/pesquisa/`;

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * Parse a Portuguese-formatted price ("1,99 €", "€ 1.234,56") into a number.
 * Returns null if no parseable amount is found.
 */
export function parsePrice(raw: string | undefined | null): number | null {
  if (!raw) return null;
  // Keep digits, comma and dot; drop currency symbols and whitespace.
  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;
  // PT uses comma as decimal separator and dot as thousands separator.
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Continente runs on Salesforce Commerce Cloud. We query the public product
 * search by barcode and read the first product tile.
 *
 * NOTE: the site's markup/selectors change periodically and may be protected by
 * anti-bot measures. This adapter is intentionally defensive — any miss returns
 * null rather than throwing — and the selectors below are the maintenance
 * surface to revisit when results go quiet.
 */
export const continente: Adapter = async ({ barcode }) => {
  const res = await fetch(`${SEARCH}?q=${encodeURIComponent(barcode)}`, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-PT,pt;q=0.9',
    },
  });

  // 404 / empty search => not listed here. Non-2xx that isn't 404 is a
  // transient/unexpected failure: throw so the orchestrator can retry + count it.
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Continente search ${res.status} for ${barcode}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const tile = $('.product, .product-tile, [data-pid]').first();
  if (tile.length === 0) return null;

  const priceText =
    tile.find('.ct-price-formatted, .value, .sales .value, [itemprop="price"]').first().text() ||
    tile.find('[content]').filter('[itemprop="price"]').attr('content');
  const price = parsePrice(priceText);
  if (price == null) return null;

  const href = tile.find('a[href]').first().attr('href');
  const url = href ? new URL(href, BASE).toString() : null;

  // Continente marks unavailable items with an out-of-stock flag on the tile.
  const inStock = tile.find('.out-of-stock, .ct-tile--unavailable').length === 0;

  const result: PriceResult = { price, url, inStock };
  return result;
};
