import type { Adapter } from '../types.js';

/**
 * Pingo Doce adapter — placeholder. Pingo Doce does not expose a stable public
 * product-search endpoint keyed by barcode at time of writing; wiring this up is
 * a follow-up (prefer an official feed/API over HTML scraping if one exists).
 *
 * Returning null keeps the store in the registry and the run green while no
 * prices are produced, so the orchestration + per-adapter isolation can be
 * exercised end-to-end before a second real adapter lands.
 */
export const pingoDoce: Adapter = async () => null;
