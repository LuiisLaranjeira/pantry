import { useMutation, useQueryClient } from '@tanstack/react-query';

import { stockKeys } from '@/features/stock/api/queryKeys';
import { stockRepo } from '@/features/stock/api/stockRepo';
import type { StockItem } from '@/shared/types/domain';

export function useDeleteStockItem(householdId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = stockKeys.list(householdId);

  return useMutation({
    mutationFn: (id: string) => stockRepo.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StockItem[]>(queryKey);
      if (previous) {
        queryClient.setQueryData<StockItem[]>(
          queryKey,
          previous.filter((i) => i.id !== id),
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
