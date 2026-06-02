import { useQuery } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import type { ShoppingList } from '@/shared/types/domain';

export function useActiveList(householdId: string | null) {
  return useQuery<ShoppingList | null>({
    queryKey: shoppingKeys.activeList(householdId),
    enabled: !!householdId,
    queryFn: () => shoppingRepo.getActiveList(householdId!),
  });
}
