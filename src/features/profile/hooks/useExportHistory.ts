import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useMutation } from '@tanstack/react-query';

import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import { AppError } from '@/shared/api/errors';
import { toCSV } from '@/shared/lib/format';

const HEADER = ['Date', 'Item', 'Qty', 'Unit Price', 'Line Total', 'Purchased', 'List Total'];

export function useExportHistory(householdId: string | null) {
  return useMutation({
    mutationFn: async () => {
      if (!householdId) throw new Error('No household.');
      const lists = await shoppingRepo.completedLists(householdId);
      if (lists.length === 0) {
        throw new AppError('not_found', 'No completed shopping lists to export.');
      }

      // Chunk list IDs to avoid hitting Supabase's URL length limit with
      // large histories. 200 IDs per request is safely within the limit.
      const CHUNK = 200;
      const allIds = lists.map((l) => l.id);
      const items = (
        await Promise.all(
          Array.from({ length: Math.ceil(allIds.length / CHUNK) }, (_, i) =>
            shoppingRepo.itemsByListIds(allIds.slice(i * CHUNK, (i + 1) * CHUNK)),
          ),
        )
      ).flat();
      const itemsByList = new Map<string, typeof items>();
      for (const item of items) {
        const bucket = itemsByList.get(item.list_id) ?? [];
        bucket.push(item);
        itemsByList.set(item.list_id, bucket);
      }

      const rows: (string | number | null)[][] = [HEADER];
      for (const list of lists) {
        const date = list.completed_at
          ? new Date(list.completed_at).toLocaleDateString('en-GB')
          : '';
        const listItems = itemsByList.get(list.id) ?? [];
        for (const item of listItems) {
          rows.push([
            date,
            item.name,
            item.quantity,
            item.unit_price ?? '',
            item.unit_price != null ? (item.unit_price * item.quantity).toFixed(2) : '',
            item.checked ? 'Yes' : 'No',
            list.total_spent != null ? list.total_spent.toFixed(2) : '',
          ]);
        }
      }

      const csv = toCSV(rows);
      const file = new File(Paths.cache, 'shopping_history.csv');
      file.write(csv);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export shopping history',
      });
    },
  });
}
