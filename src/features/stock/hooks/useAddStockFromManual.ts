import { useMutation, useQueryClient } from '@tanstack/react-query';

import { productRepo } from '@/shared/api/productRepo';
import { AppError } from '@/shared/api/errors';
import { stockKeys } from '@/features/stock/api/queryKeys';
import { stockRepo } from '@/features/stock/api/stockRepo';
import { manualBarcode } from '@/shared/lib/uuid';
import type { PartialProduct } from '@/shared/types/domain';

interface Input {
  product: PartialProduct;
  quantity: number;
  unitPrice: number | null;
}

export function useAddStockFromManual(householdId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ product, quantity, unitPrice }: Input) => {
      if (!householdId) throw new AppError('not_found', 'No household.');
      const barcode = product.barcode || manualBarcode();
      const saved = await productRepo.upsert({
        ...product,
        barcode,
        unit_price: unitPrice ?? product.unit_price,
      });
      const matches = await stockRepo.getByProductIds(householdId, [saved.id]);
      const existing = matches[0];

      if (existing) {
        const newQty = existing.quantity + quantity;
        await stockRepo.setQuantity(existing.id, newQty);
        await stockRepo.logAction({
          household_id: householdId,
          product_id: saved.id,
          stock_item_id: existing.id,
          action: 'restock',
          quantity,
          product_name: saved.name,
        });
      } else {
        const inserted = await stockRepo.insert({
          household_id: householdId,
          product_id: saved.id,
          quantity,
        });
        await stockRepo.logAction({
          household_id: householdId,
          product_id: saved.id,
          stock_item_id: inserted.id,
          action: 'add',
          quantity,
          product_name: saved.name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.list(householdId) });
    },
  });
}
