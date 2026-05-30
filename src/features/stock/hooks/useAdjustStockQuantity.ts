import { useMutation, useQueryClient } from '@tanstack/react-query';

import { stockKeys } from '@/features/stock/api/queryKeys';
import { stockRepo } from '@/features/stock/api/stockRepo';
import { notifyLowStock } from '@/shared/lib/notifications';
import type { StockItem } from '@/shared/types/domain';

interface Input {
  item: StockItem;
  delta: number;
}

export function useAdjustStockQuantity(householdId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = stockKeys.list(householdId);

  return useMutation({
    mutationFn: async ({ item, delta }: Input) => {
      const newQty = Math.max(0, item.quantity + delta);
      const actualDelta = newQty - item.quantity;
      if (actualDelta === 0) return { item, newQty, actualDelta };

      await stockRepo.setQuantity(item.id, newQty);
      if (householdId) {
        await stockRepo.logAction({
          household_id: householdId,
          product_id: item.product.id,
          stock_item_id: item.id,
          action: actualDelta < 0 ? 'consume' : 'restock',
          quantity: Math.abs(actualDelta),
          product_name: item.product.name,
        });
      }

      if (
        actualDelta < 0 &&
        item.quantity > item.low_stock_threshold &&
        newQty <= item.low_stock_threshold
      ) {
        await notifyLowStock([{ name: item.product.name, quantity: newQty }]);
      }

      return { item, newQty, actualDelta };
    },
    onMutate: async ({ item, delta }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StockItem[]>(queryKey);
      const newQty = Math.max(0, item.quantity + delta);
      if (previous) {
        queryClient.setQueryData<StockItem[]>(
          queryKey,
          previous.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)),
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
