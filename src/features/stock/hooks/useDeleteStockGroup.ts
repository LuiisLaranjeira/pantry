import { useMutation, useQueryClient } from '@tanstack/react-query';

import { stockKeys } from '@/features/stock/api/queryKeys';
import { stockRepo } from '@/features/stock/api/stockRepo';
import type { StockItem } from '@/shared/types/domain';

export function useDeleteStockGroup(householdId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = stockKeys.list(householdId);

  return useMutation({
    mutationFn: (ids: string[]) => stockRepo.deleteMany(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StockItem[]>(queryKey);
      const removed = new Set(ids);
      if (previous) {
        queryClient.setQueryData<StockItem[]>(
          queryKey,
          previous.filter((i) => !removed.has(i.id)),
        );
      }
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
