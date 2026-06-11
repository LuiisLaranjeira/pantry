import { deriveGroupedItems, pickHighestQtyMember } from '@/features/stock/domain/grouping';
import type { StockItem } from '@/shared/types/domain';

function makeItem(
  id: string,
  name: string,
  qty: number,
  opts: {
    packageUnit?: string | null;
    lowStockThreshold?: number;
    category?: string | null;
  } = {},
): StockItem {
  return {
    id,
    household_id: 'hh-1',
    product_id: `prod-${id}`,
    quantity: qty,
    low_stock_threshold: opts.lowStockThreshold ?? 1,
    product: {
      id: `prod-${id}`,
      barcode: `bar-${id}`,
      name,
      brand: null,
      category: opts.category ?? null,
      package_unit: opts.packageUnit ?? null,
      unit_price: null,
      country: null,
    },
  };
}

describe('deriveGroupedItems', () => {
  it('returns an empty array for empty input', () => {
    expect(deriveGroupedItems([])).toEqual([]);
  });

  it('returns a single group for a single item', () => {
    const groups = deriveGroupedItems([makeItem('a', 'Milk', 3)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Milk');
    expect(groups[0].quantity).toBe(3);
    expect(groups[0].members).toHaveLength(1);
  });

  it('groups items with identical name and package_unit', () => {
    const items = [
      makeItem('a', 'Milk', 2, { packageUnit: '1L' }),
      makeItem('b', 'Milk', 3, { packageUnit: '1L' }),
    ];
    const groups = deriveGroupedItems(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].quantity).toBe(5);
    expect(groups[0].members).toHaveLength(2);
  });

  it('keeps different package_units as separate groups', () => {
    const items = [
      makeItem('a', 'Milk', 1, { packageUnit: '1L' }),
      makeItem('b', 'Milk', 1, { packageUnit: '2L' }),
    ];
    expect(deriveGroupedItems(items)).toHaveLength(2);
  });

  it('groups items with the same name when both have null package_unit', () => {
    const items = [makeItem('a', 'Eggs', 6), makeItem('b', 'Eggs', 6)];
    const groups = deriveGroupedItems(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].quantity).toBe(12);
  });

  it('keeps items with different names as separate groups', () => {
    const items = [makeItem('a', 'Milk', 1), makeItem('b', 'Juice', 2)];
    expect(deriveGroupedItems(items)).toHaveLength(2);
  });

  it('sets low_stock_threshold to the minimum across all members', () => {
    const items = [
      makeItem('a', 'Milk', 1, { lowStockThreshold: 3 }),
      makeItem('b', 'Milk', 1, { lowStockThreshold: 1 }),
      makeItem('c', 'Milk', 1, { lowStockThreshold: 2 }),
    ];
    expect(deriveGroupedItems(items)[0].low_stock_threshold).toBe(1);
  });

  it('preserves the correct group key format (name__package_unit)', () => {
    const groups = deriveGroupedItems([makeItem('a', 'Milk', 1, { packageUnit: '1L' })]);
    expect(groups[0].key).toBe('Milk__1L');
  });

  it('uses empty string for null package_unit in the group key', () => {
    const groups = deriveGroupedItems([makeItem('a', 'Eggs', 1)]);
    expect(groups[0].key).toBe('Eggs__');
  });

  it('handles a mix of grouped and ungrouped items', () => {
    const items = [
      makeItem('a', 'Milk', 2, { packageUnit: '1L' }),
      makeItem('b', 'Milk', 3, { packageUnit: '1L' }),
      makeItem('c', 'Juice', 1),
    ];
    const groups = deriveGroupedItems(items);
    expect(groups).toHaveLength(2);
    const milk = groups.find((g) => g.name === 'Milk')!;
    expect(milk.quantity).toBe(5);
  });
});

describe('pickHighestQtyMember', () => {
  it('returns the only item when there is one member', () => {
    const item = makeItem('a', 'Milk', 5);
    expect(pickHighestQtyMember([item])).toBe(item);
  });

  it('returns the member with the highest quantity', () => {
    const low = makeItem('low', 'Milk', 1);
    const high = makeItem('high', 'Milk', 10);
    const mid = makeItem('mid', 'Milk', 5);
    expect(pickHighestQtyMember([low, high, mid])).toBe(high);
  });

  it('returns the first item when quantities are equal', () => {
    const a = makeItem('a', 'Milk', 3);
    const b = makeItem('b', 'Milk', 3);
    const result = pickHighestQtyMember([a, b]);
    expect(result.quantity).toBe(3);
  });

  it('does not mutate the input array', () => {
    const items = [makeItem('a', 'Milk', 3), makeItem('b', 'Milk', 1)];
    const snapshot = [...items];
    pickHighestQtyMember(items);
    expect(items[0].id).toBe(snapshot[0].id);
    expect(items[1].id).toBe(snapshot[1].id);
  });
});
