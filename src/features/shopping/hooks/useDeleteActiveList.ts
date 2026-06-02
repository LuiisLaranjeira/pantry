import { useMutation, useQueryClient } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';

export function useDeleteActiveList(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => shoppingRepo.deleteList(listId),
    onSuccess: (_data, listId) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.activeList(householdId) });
      queryClient.invalidateQueries({ queryKey: shoppingKeys.items(listId) });
    },
  });
}
