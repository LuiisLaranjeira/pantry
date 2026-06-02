import { useMutation, useQueryClient } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import type { ShoppingListItem } from '@/shared/types/domain';

export function useDeleteShoppingItem(listId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.items(listId);

  return useMutation({
    mutationFn: (itemId: string) => shoppingRepo.deleteItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingListItem[]>(queryKey);
      if (previous) {
        queryClient.setQueryData<ShoppingListItem[]>(
          queryKey,
          previous.filter((i) => i.id !== itemId),
        );
      }
      return { previous };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
