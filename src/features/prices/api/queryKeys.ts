export const priceKeys = {
  comparison: (productId: string | null) => ['prices', 'comparison', productId] as const,
  // Sorted ids keep the key stable regardless of item order on the list.
  cheapest: (productIds: string[]) =>
    ['prices', 'cheapest', [...productIds].sort().join(',')] as const,
};
