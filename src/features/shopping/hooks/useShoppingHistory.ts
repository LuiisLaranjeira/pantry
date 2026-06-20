import { useQuery } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';

const LIMIT = 20;

export interface HistoryRow {
  id: string;
  name: string | null;
  total_spent: number | null;
  completed_at: string | null;
}

export function useShoppingHistory(householdId: string | null) {
  return useQuery<HistoryRow[]>({
    queryKey: shoppingKeys.history(householdId),
    enabled: !!householdId,
    queryFn: () => shoppingRepo.completedLists(householdId!, { limit: LIMIT }),
  });
}
