import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import { AppError } from '@/shared/api/errors';
import { UTF8_BOM, toCSV } from '@/shared/lib/format';

const HEADER = [
  'Date',
  'List',
  'Item',
  'Qty',
  'Unit Price (€)',
  'Line Total (€)',
  'Purchased',
  'List Total (€)',
];

export function useExportHistory(householdId: string | null) {
  const { t } = useTranslation();
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

      // Lists come ordered by completed_at desc, so same-day lists are adjacent.
      // Number unnamed lists within each day ("List 1", "List 2", ...) so every
      // item can be traced back to its list and day.
      const rows: (string | number | null)[][] = [HEADER];
      let lastDateKey = '';
      let dayCount = 0;
      for (const list of lists) {
        const dateKey = list.completed_at?.slice(0, 10) ?? '';
        if (dateKey !== lastDateKey) {
          lastDateKey = dateKey;
          dayCount = 0;
        }
        dayCount += 1;

        const date = list.completed_at
          ? new Date(list.completed_at).toLocaleDateString('en-GB')
          : '';
        const listLabel = list.name?.trim() || t('shopping.listN', { n: dayCount });
        const listTotal = list.total_spent != null ? list.total_spent.toFixed(2) : '';

        for (const item of itemsByList.get(list.id) ?? []) {
          rows.push([
            date,
            listLabel,
            item.name,
            item.quantity,
            item.unit_price != null ? item.unit_price.toFixed(2) : '',
            item.unit_price != null ? (item.unit_price * item.quantity).toFixed(2) : '',
            item.checked ? 'Yes' : 'No',
            listTotal,
          ]);
        }
      }

      const csv = UTF8_BOM + toCSV(rows);
      const file = new File(Paths.cache, 'shopping_history.csv');
      file.write(csv);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export shopping history',
      });
    },
  });
}
