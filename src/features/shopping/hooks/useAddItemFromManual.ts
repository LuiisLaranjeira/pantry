import { useMutation, useQueryClient } from '@tanstack/react-query';

import { productRepo } from '@/shared/api/productRepo';
import { AppError } from '@/shared/api/errors';
import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import { manualBarcode, uuid } from '@/shared/lib/uuid';
import type { PartialProduct } from '@/shared/types/domain';

interface Input {
  product: PartialProduct;
  quantity: number;
  unitPrice: number | null;
}

export function useAddItemFromManual(householdId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ product, quantity, unitPrice }: Input) => {
      if (!householdId) throw new AppError('not_found', 'No household.');
      const barcode = product.barcode || manualBarcode();
      const saved = await productRepo.upsert({ ...product, barcode });

      const list = await shoppingRepo.getOrCreateActiveList(householdId, uuid());

      await shoppingRepo.addItem({
        list_id: list.id,
        product_id: saved.id,
        name: saved.name,
        quantity,
        unit_price: unitPrice,
        checked: false,
      });

      return { listId: list.id };
    },
    onSuccess: ({ listId }) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.activeList(householdId) });
      queryClient.invalidateQueries({ queryKey: shoppingKeys.items(listId) });
    },
  });
}
