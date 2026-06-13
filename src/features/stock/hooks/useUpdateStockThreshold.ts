import { useMutation, useQueryClient } from '@tanstack/react-query';

import { stockKeys } from '@/features/stock/api/queryKeys';
import { stockRepo } from '@/features/stock/api/stockRepo';
import type { StockItem } from '@/shared/types/domain';

export function useUpdateStockThreshold(householdId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = stockKeys.list(householdId);

  return useMutation({
    mutationFn: ({ ids, threshold }: { ids: string[]; threshold: number }) =>
      stockRepo.updateManyThresholds(ids, threshold),
    onMutate: async ({ ids, threshold }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StockItem[]>(queryKey);
      if (previous) {
        queryClient.setQueryData<StockItem[]>(
          queryKey,
          previous.map((i) => (ids.includes(i.id) ? { ...i, low_stock_threshold: threshold } : i)),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
