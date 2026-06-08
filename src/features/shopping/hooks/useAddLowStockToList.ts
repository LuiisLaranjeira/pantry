import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppError } from '@/shared/api/errors';
import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo, type NewShoppingItem } from '@/features/shopping/api/shoppingRepo';
import { uuid } from '@/shared/lib/uuid';

export interface LowStockCandidate {
  product_id: string;
  name: string;
  unit_price: number | null;
}

interface Input {
  candidates: LowStockCandidate[];
  dedupBy: 'name' | 'product_id';
}

export function useAddLowStockToList(householdId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ candidates, dedupBy }: Input) => {
      if (!householdId) throw new AppError('not_found', 'No household.');
      if (candidates.length === 0) return { listId: null, added: 0 };

      const list = await shoppingRepo.getOrCreateActiveList(householdId, uuid());

      const existing =
        dedupBy === 'name'
          ? new Set(await shoppingRepo.listItemNames(list.id))
          : new Set(await shoppingRepo.listItemProductIds(list.id));

      const toAdd: NewShoppingItem[] = candidates
        .filter((c) => !existing.has(dedupBy === 'name' ? c.name : c.product_id))
        .map((c) => ({
          list_id: list!.id,
          product_id: c.product_id,
          name: c.name,
          quantity: 1,
          unit_price: c.unit_price,
          checked: false,
        }));

      await shoppingRepo.addItems(toAdd);
      return { listId: list.id, added: toAdd.length };
    },
    onSuccess: ({ listId }) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.activeList(householdId) });
      if (listId) queryClient.invalidateQueries({ queryKey: shoppingKeys.items(listId) });
    },
  });
}
