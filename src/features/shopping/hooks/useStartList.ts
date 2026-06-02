import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppError } from '@/shared/api/errors';
import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import { uuid } from '@/shared/lib/uuid';

export function useStartList(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!householdId) throw new AppError('not_found', 'No household.');
      const id = uuid();
      await shoppingRepo.createList({ id, household_id: householdId });
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.activeList(householdId) });
    },
  });
}
