import { useQuery } from '@tanstack/react-query';

import { priceKeys } from '@/features/prices/api/queryKeys';
import { pricesRepo } from '@/features/prices/api/pricesRepo';
import type { StorePriceWithStore } from '@/shared/types/domain';

export function usePriceComparison(productId: string | null) {
  return useQuery<StorePriceWithStore[]>({
    queryKey: priceKeys.comparison(productId),
    enabled: !!productId,
    queryFn: () => pricesRepo.storePricesForProduct(productId!),
  });
}
