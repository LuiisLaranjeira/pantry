import { useQuery } from '@tanstack/react-query';

import { stockKeys } from '@/features/stock/api/queryKeys';
import { stockRepo } from '@/features/stock/api/stockRepo';
import type { StockItem } from '@/shared/types/domain';

export function useStockList(householdId: string | null) {
  return useQuery<StockItem[]>({
    queryKey: stockKeys.list(householdId),
    enabled: !!householdId,
    queryFn: () => stockRepo.list(householdId!),
  });
}
