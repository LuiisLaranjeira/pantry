import { useMutation, useQueryClient } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import type { ShoppingListItem } from '@/shared/types/domain';

interface Input {
  itemId: string;
  checked: boolean;
}

export function useToggleItemChecked(listId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.items(listId);

  return useMutation({
    mutationFn: ({ itemId, checked }: Input) => shoppingRepo.updateItem(itemId, { checked }),
    onMutate: async ({ itemId, checked }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingListItem[]>(queryKey);
      if (previous) {
        queryClient.setQueryData<ShoppingListItem[]>(
          queryKey,
          previous.map((i) => (i.id === itemId ? { ...i, checked } : i)),
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
