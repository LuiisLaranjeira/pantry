import { makeChain } from '../../../__helpers__/supabaseMock';

import { supabase } from '@/shared/api/supabaseClient';
import { stockRepo } from '@/features/stock/api/stockRepo';
import { AppError } from '@/shared/api/errors';

jest.mock('@/shared/api/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => jest.clearAllMocks());

const fakeItem = {
  id: 'si-1',
  household_id: 'hh-1',
  product_id: 'p-1',
  quantity: 5,
  low_stock_threshold: 1,
  product: {
    id: 'p-1',
    barcode: '111',
    name: 'Milk',
    brand: null,
    category: null,
    package_unit: null,
    unit_price: null,
    country: null,
  },
};

// ─── list ─────────────────────────────────────────────────────────────────────

describe('list', () => {
  it('returns the stock items array', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [fakeItem], error: null }));
    expect(await stockRepo.list('hh-1')).toEqual([fakeItem]);
  });

  it('returns an empty array when data is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    expect(await stockRepo.list('hh-1')).toEqual([]);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(stockRepo.list('hh-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── getByProductIds ──────────────────────────────────────────────────────────

describe('getByProductIds', () => {
  it('returns matching stock rows', async () => {
    const row = { id: 'si-1', product_id: 'p-1', quantity: 3 };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    expect(await stockRepo.getByProductIds('hh-1', ['p-1'])).toEqual([row]);
  });

  it('returns empty array immediately for empty productIds', async () => {
    expect(await stockRepo.getByProductIds('hh-1', [])).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(stockRepo.getByProductIds('hh-1', ['p-1'])).rejects.toBeInstanceOf(AppError);
  });
});

// ─── setQuantity ─────────────────────────────────────────────────────────────

describe('setQuantity', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(stockRepo.setQuantity('si-1', 10)).resolves.toBeUndefined();
  });

  it('calls update with the quantity and an updated_at timestamp', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await stockRepo.setQuantity('si-1', 10);
    expect(chain.update as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 10, updated_at: expect.any(String) }),
    );
    expect(chain.eq as jest.Mock).toHaveBeenCalledWith('id', 'si-1');
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(stockRepo.setQuantity('si-1', 1)).rejects.toBeInstanceOf(AppError);
  });
});

// ─── insert ───────────────────────────────────────────────────────────────────

describe('insert', () => {
  it('returns the new stock item row', async () => {
    const row = { id: 'si-new', quantity: 3, low_stock_threshold: 1 };
    mockFrom.mockReturnValue(makeChain({ data: row, error: null }));
    const result = await stockRepo.insert({ household_id: 'hh-1', product_id: 'p-1', quantity: 3 });
    expect(result).toEqual(row);
  });

  it('defaults low_stock_threshold to 1 when not provided', async () => {
    const chain = makeChain({
      data: { id: 'si-1', quantity: 2, low_stock_threshold: 1 },
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    await stockRepo.insert({ household_id: 'hh-1', product_id: 'p-1', quantity: 2 });
    expect(chain.insert as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ low_stock_threshold: 1 }),
    );
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(
      stockRepo.insert({ household_id: 'hh-1', product_id: 'p-1', quantity: 1 }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

// ─── insertMany ───────────────────────────────────────────────────────────────

describe('insertMany', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(
      stockRepo.insertMany([{ household_id: 'hh-1', product_id: 'p-1', quantity: 2 }]),
    ).resolves.toBeUndefined();
  });

  it('returns immediately for empty input without calling supabase', async () => {
    await stockRepo.insertMany([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('normalises missing low_stock_threshold to 1', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await stockRepo.insertMany([{ household_id: 'hh-1', product_id: 'p-1', quantity: 5 }]);
    expect(chain.insert as jest.Mock).toHaveBeenCalledWith([
      expect.objectContaining({ low_stock_threshold: 1 }),
    ]);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(
      stockRepo.insertMany([{ household_id: 'hh-1', product_id: 'p-1', quantity: 1 }]),
    ).rejects.toBeInstanceOf(AppError);
  });
});

// ─── delete ───────────────────────────────────────────────────────────────────

describe('delete', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(stockRepo.delete('si-1')).resolves.toBeUndefined();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(stockRepo.delete('si-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── deleteMany ───────────────────────────────────────────────────────────────

describe('deleteMany', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(stockRepo.deleteMany(['si-1', 'si-2'])).resolves.toBeUndefined();
  });

  it('returns immediately for empty input without calling supabase', async () => {
    await stockRepo.deleteMany([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(stockRepo.deleteMany(['si-1'])).rejects.toBeInstanceOf(AppError);
  });
});

// ─── logAction ────────────────────────────────────────────────────────────────

describe('logAction', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(
      stockRepo.logAction({
        household_id: 'hh-1',
        product_id: 'p-1',
        action: 'restock',
        quantity: 2,
        product_name: 'Milk',
      }),
    ).resolves.toBeUndefined();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(
      stockRepo.logAction({
        household_id: 'hh-1',
        product_id: 'p-1',
        action: 'add',
        quantity: 1,
        product_name: 'X',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

// ─── logMany ──────────────────────────────────────────────────────────────────

describe('logMany', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(
      stockRepo.logMany([
        { household_id: 'hh-1', product_id: 'p-1', action: 'add', quantity: 1, product_name: 'X' },
      ]),
    ).resolves.toBeUndefined();
  });

  it('returns immediately for empty input without calling supabase', async () => {
    await stockRepo.logMany([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(
      stockRepo.logMany([
        { household_id: 'hh-1', product_id: 'p-1', action: 'add', quantity: 1, product_name: 'X' },
      ]),
    ).rejects.toBeInstanceOf(AppError);
  });
});

// ─── recentLog ────────────────────────────────────────────────────────────────

describe('recentLog', () => {
  it('returns log records array', async () => {
    const entry = {
      id: 'log-1',
      action: 'consume',
      quantity: 1,
      product_name: 'Milk',
      created_at: '2024-01-01T00:00:00Z',
    };
    mockFrom.mockReturnValue(makeChain({ data: [entry], error: null }));
    expect(await stockRepo.recentLog('hh-1', 10)).toEqual([entry]);
  });

  it('returns empty array when data is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    expect(await stockRepo.recentLog('hh-1', 5)).toEqual([]);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(stockRepo.recentLog('hh-1', 10)).rejects.toBeInstanceOf(AppError);
  });
});
