/** Minimal product shape passed to an adapter. */
export interface ProductInput {
  barcode: string;
  name: string;
}

/** What an adapter returns for a found product. `null` means "not found here". */
export interface PriceResult {
  /** Price in the store's currency (EUR for PT). */
  price: number;
  /** Direct product-page URL, if known. */
  url: string | null;
  /** Whether the store reports the item in stock, if known. */
  inStock: boolean | null;
}

/**
 * A store adapter resolves a product's current price at one store. It owns that
 * store's endpoint and parsing, and is responsible for returning `null` (not
 * throwing) when a product simply isn't listed. Throwing is reserved for
 * transient/unexpected failures, which the orchestrator retries and isolates.
 */
export type Adapter = (input: ProductInput) => Promise<PriceResult | null>;
