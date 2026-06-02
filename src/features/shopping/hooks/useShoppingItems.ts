import { useQuery } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import type { ShoppingListItem } from '@/shared/types/domain';

export function useShoppingItems(listId: string | null) {
  return useQuery<ShoppingListItem[]>({
    queryKey: shoppingKeys.items(listId),
    enabled: !!listId,
    queryFn: () => shoppingRepo.listItems(listId!),
  });
}
