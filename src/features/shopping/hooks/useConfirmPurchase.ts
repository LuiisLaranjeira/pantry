import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileKeys } from '@/features/profile/api/queryKeys';
import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import { stockKeys } from '@/features/stock/api/queryKeys';
import { stockRepo, type StockLogEntry } from '@/features/stock/api/stockRepo';
import { AppError } from '@/shared/api/errors';
import { productRepo } from '@/shared/api/productRepo';
import { manualBarcode } from '@/shared/lib/uuid';
import type { ShoppingListItem } from '@/shared/types/domain';

interface Input {
  listId: string;
  checkedItems: ShoppingListItem[];
  total: number;
}

export function useConfirmPurchase(householdId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, checkedItems, total }: Input) => {
      if (!householdId) throw new AppError('not_found', 'No household.');

      // 1. Insert manual products (those without product_id).
      const resolvedIds = new Map<string, string>();
      const manualItems = checkedItems.filter((i) => !i.product_id);
      if (manualItems.length > 0) {
        const itemsWithBarcodes = manualItems.map((item) => ({
          itemId: item.id,
          barcode: manualBarcode(),
          name: item.name,
        }));
        const rows = itemsWithBarcodes.map(({ barcode, name }) => ({
          barcode,
          name,
          brand: null,
          category: null,
          package_unit: null,
          unit_price: null,
          country: null,
        }));
        const products = await productRepo.upsertMany(rows);
        const productIdByBarcode = new Map(products.map((p) => [p.barcode, p.id]));
        for (const { itemId, barcode } of itemsWithBarcodes) {
          const productId = productIdByBarcode.get(barcode);
          if (productId) resolvedIds.set(itemId, productId);
        }
      }

      // 2. Resolve product IDs for every checked item.
      const allProductIds = checkedItems
        .map((i) => i.product_id ?? resolvedIds.get(i.id) ?? null)
        .filter((id): id is string => !!id);

      if (allProductIds.length > 0) {
        // 3. Existing stock for those products.
        const existingStock = await stockRepo.getByProductIds(householdId, allProductIds);
        const stockMap = new Map(existingStock.map((s) => [s.product_id, s]));

        // 4. Aggregate quantity by product.
        const qtyByProduct = new Map<string, { qty: number; name: string }>();
        for (const item of checkedItems) {
          const productId = item.product_id ?? resolvedIds.get(item.id);
          if (!productId) continue;
          const prev = qtyByProduct.get(productId);
          qtyByProduct.set(productId, {
            qty: (prev?.qty ?? 0) + item.quantity,
            name: item.name,
          });
        }

        // 5. Build update/insert/log batches.
        const updates: { id: string; newQty: number }[] = [];
        const inserts: { household_id: string; product_id: string; quantity: number }[] = [];
        const logs: StockLogEntry[] = [];
        for (const [productId, { qty, name }] of qtyByProduct) {
          const existing = stockMap.get(productId);
          if (existing) {
            updates.push({ id: existing.id, newQty: existing.quantity + qty });
          } else {
            inserts.push({ household_id: householdId, product_id: productId, quantity: qty });
          }
          logs.push({
            household_id: householdId,
            product_id: productId,
            action: existing ? 'restock' : 'add',
            quantity: qty,
            product_name: name,
          });
        }

        // 6. Price updates from items that have a price.
        const priceUpdates = checkedItems
          .filter((i) => i.unit_price != null)
          .map((i) => ({
            productId: i.product_id ?? resolvedIds.get(i.id),
            price: i.unit_price!,
          }))
          .filter((u): u is { productId: string; price: number } => u.productId != null);

        // 7. Apply all writes in parallel.
        await Promise.all([
          ...updates.map((u) => stockRepo.setQuantity(u.id, u.newQty)),
          stockRepo.insertMany(inserts),
          ...priceUpdates.map((u) => productRepo.updatePrice(u.productId, u.price)),
          stockRepo.logMany(logs),
        ]);
      }

      // 8. Mark the list completed.
      await shoppingRepo.completeList(listId, { total_spent: total > 0 ? total : null });

      return { listId };
    },
    onSuccess: ({ listId }) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.activeList(householdId) });
      queryClient.invalidateQueries({ queryKey: shoppingKeys.items(listId) });
      queryClient.invalidateQueries({ queryKey: shoppingKeys.history(householdId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.list(householdId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.recentActivity(householdId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.monthlySpending(householdId) });
    },
  });
}
