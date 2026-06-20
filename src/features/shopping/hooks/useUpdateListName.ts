import { useMutation, useQueryClient } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import type { ShoppingList } from '@/shared/types/domain';

export function useUpdateListName(householdId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = shoppingKeys.activeList(householdId);

  return useMutation({
    mutationFn: ({ listId, name }: { listId: string; name: string }) =>
      shoppingRepo.updateListName(listId, name),
    onMutate: async ({ name }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingList>(queryKey);
      if (previous) {
        queryClient.setQueryData<ShoppingList>(queryKey, { ...previous, name });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
