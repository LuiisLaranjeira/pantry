import { useMutation, useQueryClient } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo, type ShoppingItemPatch } from '@/features/shopping/api/shoppingRepo';
import type { ShoppingListItem } from '@/shared/types/domain';

interface Input {
  itemId: string;
  patch: ShoppingItemPatch;
}

export function useUpdateShoppingItem(listId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.items(listId);

  return useMutation({
    mutationFn: ({ itemId, patch }: Input) => shoppingRepo.updateItem(itemId, patch),
    onMutate: async ({ itemId, patch }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingListItem[]>(queryKey);
      if (previous) {
        queryClient.setQueryData<ShoppingListItem[]>(
          queryKey,
          previous.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
        );
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
