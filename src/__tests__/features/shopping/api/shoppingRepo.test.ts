import { makeChain } from '../../../__helpers__/supabaseMock';

import { supabase } from '@/shared/api/supabaseClient';
import { shoppingRepo } from '@/features/shopping/api/shoppingRepo';
import { AppError } from '@/shared/api/errors';

jest.mock('@/shared/api/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => jest.clearAllMocks());

const fakeList = {
  id: 'list-1',
  household_id: 'hh-1',
  status: 'active' as const,
  total_spent: null,
  created_at: '2024-01-01T00:00:00Z',
  completed_at: null,
};

const fakeItem = {
  id: 'item-1',
  list_id: 'list-1',
  product_id: null,
  name: 'Milk',
  quantity: 2,
  unit_price: 1.99,
  checked: false,
};

// ─── getActiveList ────────────────────────────────────────────────────────────

describe('getActiveList', () => {
  it('returns the first active list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [fakeList], error: null }));
    expect(await shoppingRepo.getActiveList('hh-1')).toEqual(fakeList);
  });

  it('returns null when no active list exists', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
    expect(await shoppingRepo.getActiveList('hh-1')).toBeNull();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.getActiveList('hh-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── createList ───────────────────────────────────────────────────────────────

describe('createList', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(
      shoppingRepo.createList({ id: 'list-new', household_id: 'hh-1' }),
    ).resolves.toBeUndefined();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.createList({ id: 'x', household_id: 'hh-1' })).rejects.toBeInstanceOf(
      AppError,
    );
  });
});

// ─── getOrCreateActiveList ────────────────────────────────────────────────────

describe('getOrCreateActiveList', () => {
  it('returns the existing list without creating one', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [fakeList], error: null }));
    expect(await shoppingRepo.getOrCreateActiveList('hh-1', 'list-new')).toEqual(fakeList);
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('creates a new list when no active list exists', async () => {
    // First call: getActiveList → empty
    mockFrom.mockReturnValueOnce(makeChain({ data: [], error: null }));
    // Second call: createList insert → success
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));
    const result = await shoppingRepo.getOrCreateActiveList('hh-1', 'list-new');
    expect(result.id).toBe('list-new');
    expect(result.status).toBe('active');
  });

  it('retries getActiveList on a conflict (23505) during insert', async () => {
    const conflictErr = { code: '23505', message: 'Duplicate', details: '', hint: '' };
    // getActiveList → empty, createList → conflict, getActiveList retry → found
    mockFrom.mockReturnValueOnce(makeChain({ data: [], error: null }));
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: conflictErr }));
    mockFrom.mockReturnValueOnce(makeChain({ data: [fakeList], error: null }));
    expect(await shoppingRepo.getOrCreateActiveList('hh-1', 'list-new')).toEqual(fakeList);
  });

  it('re-throws non-conflict errors from createList', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: [], error: null }));
    mockFrom.mockReturnValueOnce(
      makeChain({ data: null, error: { message: 'Network', status: 500 } }),
    );
    await expect(shoppingRepo.getOrCreateActiveList('hh-1', 'list-new')).rejects.toBeInstanceOf(
      AppError,
    );
  });
});

// ─── listItems ────────────────────────────────────────────────────────────────

describe('listItems', () => {
  it('returns the items array', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [fakeItem], error: null }));
    expect(await shoppingRepo.listItems('list-1')).toEqual([fakeItem]);
  });

  it('returns empty array when data is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    expect(await shoppingRepo.listItems('list-1')).toEqual([]);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.listItems('list-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── addItem ──────────────────────────────────────────────────────────────────

describe('addItem', () => {
  it('returns the inserted item', async () => {
    mockFrom.mockReturnValue(makeChain({ data: fakeItem, error: null }));
    const input = {
      list_id: 'list-1',
      product_id: null,
      name: 'Milk',
      quantity: 2,
      unit_price: 1.99,
      checked: false,
    };
    expect(await shoppingRepo.addItem(input)).toEqual(fakeItem);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    const input = {
      list_id: 'x',
      product_id: null,
      name: 'A',
      quantity: 1,
      unit_price: null,
      checked: false,
    };
    await expect(shoppingRepo.addItem(input)).rejects.toBeInstanceOf(AppError);
  });
});

// ─── addItems ─────────────────────────────────────────────────────────────────

describe('addItems', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const input = [
      { list_id: 'l', product_id: null, name: 'A', quantity: 1, unit_price: null, checked: false },
    ];
    await expect(shoppingRepo.addItems(input)).resolves.toBeUndefined();
  });

  it('returns immediately for empty input without calling supabase', async () => {
    await shoppingRepo.addItems([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    const input = [
      { list_id: 'l', product_id: null, name: 'A', quantity: 1, unit_price: null, checked: false },
    ];
    await expect(shoppingRepo.addItems(input)).rejects.toBeInstanceOf(AppError);
  });
});

// ─── updateItem ───────────────────────────────────────────────────────────────

describe('updateItem', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(shoppingRepo.updateItem('item-1', { checked: true })).resolves.toBeUndefined();
  });

  it('calls update with the correct patch and id filter', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await shoppingRepo.updateItem('item-1', { name: 'Oat Milk', quantity: 3 });
    expect(chain.update as jest.Mock).toHaveBeenCalledWith({ name: 'Oat Milk', quantity: 3 });
    expect(chain.eq as jest.Mock).toHaveBeenCalledWith('id', 'item-1');
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.updateItem('x', { checked: true })).rejects.toBeInstanceOf(AppError);
  });
});

// ─── deleteItem ───────────────────────────────────────────────────────────────

describe('deleteItem', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(shoppingRepo.deleteItem('item-1')).resolves.toBeUndefined();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.deleteItem('item-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── completeList ─────────────────────────────────────────────────────────────

describe('completeList', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(
      shoppingRepo.completeList('list-1', { total_spent: 15.5 }),
    ).resolves.toBeUndefined();
  });

  it('updates status to completed, total_spent, and completed_at', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await shoppingRepo.completeList('list-1', { total_spent: 15.5 });
    expect(chain.update as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        total_spent: 15.5,
        completed_at: expect.any(String),
      }),
    );
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.completeList('list-1', { total_spent: null })).rejects.toBeInstanceOf(
      AppError,
    );
  });
});

// ─── deleteList ───────────────────────────────────────────────────────────────

describe('deleteList', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(shoppingRepo.deleteList('list-1')).resolves.toBeUndefined();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.deleteList('list-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── spendingSince ────────────────────────────────────────────────────────────

describe('spendingSince', () => {
  it('returns spending rows', async () => {
    const rows = [{ total_spent: 10, completed_at: '2024-01-01T00:00:00Z' }];
    mockFrom.mockReturnValue(makeChain({ data: rows, error: null }));
    expect(await shoppingRepo.spendingSince('hh-1', '2024-01-01')).toEqual(rows);
  });

  it('returns empty array when data is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    expect(await shoppingRepo.spendingSince('hh-1', '2024-01-01')).toEqual([]);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.spendingSince('hh-1', '2024-01-01')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── listItemNames ────────────────────────────────────────────────────────────

describe('listItemNames', () => {
  it('returns an array of names', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ name: 'Milk' }, { name: 'Eggs' }], error: null }),
    );
    expect(await shoppingRepo.listItemNames('list-1')).toEqual(['Milk', 'Eggs']);
  });

  it('returns empty array when data is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    expect(await shoppingRepo.listItemNames('list-1')).toEqual([]);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.listItemNames('list-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── listItemProductIds ───────────────────────────────────────────────────────

describe('listItemProductIds', () => {
  it('returns only non-null product_ids', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: [{ product_id: 'p-1' }, { product_id: null }, { product_id: 'p-2' }],
        error: null,
      }),
    );
    expect(await shoppingRepo.listItemProductIds('list-1')).toEqual(['p-1', 'p-2']);
  });

  it('returns empty array when all product_ids are null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [{ product_id: null }], error: null }));
    expect(await shoppingRepo.listItemProductIds('list-1')).toEqual([]);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.listItemProductIds('list-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── completedLists ───────────────────────────────────────────────────────────

describe('completedLists', () => {
  it('returns completed lists ordered by completed_at desc', async () => {
    const rows = [{ id: 'l-2', completed_at: '2024-02-01', total_spent: 20 }];
    mockFrom.mockReturnValue(makeChain({ data: rows, error: null }));
    expect(await shoppingRepo.completedLists('hh-1')).toEqual(rows);
  });

  it('applies the limit option when provided', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await shoppingRepo.completedLists('hh-1', { limit: 5 });
    expect(chain.limit as jest.Mock).toHaveBeenCalledWith(5);
  });

  it('does not call limit when no limit option is provided', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await shoppingRepo.completedLists('hh-1');
    expect(chain.limit as jest.Mock).not.toHaveBeenCalled();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.completedLists('hh-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── itemsByListIds ───────────────────────────────────────────────────────────

describe('itemsByListIds', () => {
  it('returns items for the given list IDs', async () => {
    const rows = [{ list_id: 'l-1', name: 'Milk', quantity: 1, unit_price: null, checked: true }];
    mockFrom.mockReturnValue(makeChain({ data: rows, error: null }));
    expect(await shoppingRepo.itemsByListIds(['l-1'])).toEqual(rows);
  });

  it('returns empty array immediately for empty input without calling supabase', async () => {
    expect(await shoppingRepo.itemsByListIds([])).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(shoppingRepo.itemsByListIds(['l-1'])).rejects.toBeInstanceOf(AppError);
  });
});
