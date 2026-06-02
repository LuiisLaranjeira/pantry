import { useMutation, useQueryClient } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { shoppingRepo, type NewShoppingItem } from '@/features/shopping/api/shoppingRepo';
import { AppError } from '@/shared/api/errors';
import { uuid } from '@/shared/lib/uuid';

export interface ItemToAdd {
  name: string;
  quantity: number;
  unit_price: number | null;
}

interface Input {
  items: ItemToAdd[];
}

export function useAddItemsToList(householdId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items }: Input) => {
      if (!householdId) throw new AppError('not_found', 'No household.');
      if (items.length === 0) throw new AppError('validation', 'No items provided.');

      let list = await shoppingRepo.getActiveList(householdId);
      if (!list) {
        const id = uuid();
        await shoppingRepo.createList({ id, household_id: householdId });
        list = {
          id,
          household_id: householdId,
          status: 'active',
          total_spent: null,
          created_at: new Date().toISOString(),
          completed_at: null,
        };
      }

      const rows: NewShoppingItem[] = items.map((item) => ({
        list_id: list!.id,
        product_id: null,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        checked: true,
      }));

      await shoppingRepo.addItems(rows);
      return { listId: list.id, count: rows.length };
    },
    onSuccess: ({ listId }) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.activeList(householdId) });
      queryClient.invalidateQueries({ queryKey: shoppingKeys.items(listId) });
    },
  });
}
