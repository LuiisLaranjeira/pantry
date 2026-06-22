import { useQuery } from '@tanstack/react-query';

import { priceKeys } from '@/features/prices/api/queryKeys';
import { pricesRepo } from '@/features/prices/api/pricesRepo';
import type { CheapestPrice } from '@/shared/types/domain';

export function useCheapestPrices(productIds: string[]) {
  return useQuery<Record<string, CheapestPrice>>({
    queryKey: priceKeys.cheapest(productIds),
    enabled: productIds.length > 0,
    queryFn: () => pricesRepo.cheapestByProductIds(productIds),
  });
}
