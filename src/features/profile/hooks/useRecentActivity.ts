import { useQuery } from '@tanstack/react-query';

import { profileKeys } from '@/features/profile/api/queryKeys';
import { stockRepo, type StockLogRecord } from '@/features/stock/api/stockRepo';

const LIMIT = 5;

export function useRecentActivity(householdId: string | null) {
  return useQuery<StockLogRecord[]>({
    queryKey: profileKeys.recentActivity(householdId),
    enabled: !!householdId,
    queryFn: () => stockRepo.recentLog(householdId!, LIMIT),
  });
}
