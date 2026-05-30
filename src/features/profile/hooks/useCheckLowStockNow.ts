import { useMutation } from '@tanstack/react-query';

import { stockRepo } from '@/features/stock/api/stockRepo';
import { notifyLowStock } from '@/shared/lib/notifications';

export interface LowStockCheckResult {
  low: { name: string; quantity: number }[];
}

export function useCheckLowStockNow(householdId: string | null) {
  return useMutation<LowStockCheckResult>({
    mutationFn: async () => {
      if (!householdId) throw new Error('No household.');
      const items = await stockRepo.list(householdId);
      const low = items
        .filter((i) => i.quantity <= i.low_stock_threshold)
        .map((i) => ({ name: i.product.name, quantity: i.quantity }));
      if (low.length > 0) await notifyLowStock(low);
      return { low };
    },
  });
}
