import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { stockRepo } from '@/features/stock/api/stockRepo';
import { categoryLabel } from '@/shared/constants/categories';
import { UTF8_BOM, toCSV } from '@/shared/lib/format';

const HEADER = ['Name', 'Brand', 'Category', 'Package', 'Quantity', 'Low Stock Threshold'];

export function useExportStock(householdId: string | null) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async () => {
      if (!householdId) throw new Error('No household.');
      const items = await stockRepo.list(householdId);
      const rows: (string | number | null)[][] = [
        HEADER,
        ...items.map((item) => [
          item.product.name,
          item.product.brand,
          item.product.category ? categoryLabel(item.product.category, t) : '',
          item.product.package_unit,
          item.quantity,
          item.low_stock_threshold,
        ]),
      ];
      const csv = UTF8_BOM + toCSV(rows);
      const file = new File(Paths.cache, 'pantry_stock.csv');
      file.write(csv);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export pantry stock',
      });
    },
  });
}
