import { useQuery } from '@tanstack/react-query';

import { profileKeys } from '@/features/profile/api/queryKeys';
import { deriveMonthlySpending, twelveMonthsAgoIso } from '@/features/profile/domain/spending';
import type { MonthData } from '@/features/profile/types';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';

export function useMonthlySpending(householdId: string | null) {
  return useQuery<MonthData[]>({
    queryKey: profileKeys.monthlySpending(householdId),
    enabled: !!householdId,
    queryFn: async () => {
      const rows = await shoppingRepo.spendingSince(householdId!, twelveMonthsAgoIso());
      return deriveMonthlySpending(rows);
    },
  });
}
