import type { GroupedStockItem, StockItem } from '@/shared/types/domain';

export function deriveGroupedItems(items: StockItem[]): GroupedStockItem[] {
  const map = new Map<string, GroupedStockItem>();
  for (const item of items) {
    const key = `${item.product.name}__${item.product.package_unit ?? ''}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      existing.members.push(item);
    } else {
      map.set(key, {
        key,
        name: item.product.name,
        package_unit: item.product.package_unit,
        category: item.product.category,
        quantity: item.quantity,
        low_stock_threshold: item.low_stock_threshold,
        members: [item],
      });
    }
  }
  for (const g of map.values()) {
    g.low_stock_threshold = Math.min(...g.members.map((m) => m.low_stock_threshold));
  }
  return Array.from(map.values());
}

export function pickHighestQtyMember(members: StockItem[]): StockItem {
  return [...members].sort((a, b) => b.quantity - a.quantity)[0];
}
