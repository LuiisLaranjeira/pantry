import { makeChain } from '../../__helpers__/supabaseMock';

import { supabase } from '@/shared/api/supabaseClient';
import { productRepo } from '@/shared/api/productRepo';
import { AppError } from '@/shared/api/errors';

jest.mock('@/shared/api/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => jest.clearAllMocks());

const fakeProduct = {
  id: 'prod-1',
  barcode: '123456',
  name: 'Milk',
  brand: 'Nestlé',
  category: 'dairy',
  package_unit: '1L',
  unit_price: 1.99,
  country: 'pt',
};

// ─── byBarcode ────────────────────────────────────────────────────────────────

describe('byBarcode', () => {
  it('returns the product when found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: fakeProduct, error: null }));
    expect(await productRepo.byBarcode('123456')).toEqual(fakeProduct);
  });

  it('returns null when maybeSingle returns null data', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    expect(await productRepo.byBarcode('999')).toBeNull();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: null,
        error: { code: 'PGRST116', message: 'Not found', details: '', hint: '' },
      }),
    );
    await expect(productRepo.byBarcode('bad')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── upsert ───────────────────────────────────────────────────────────────────

describe('upsert', () => {
  it('returns the upserted product', async () => {
    mockFrom.mockReturnValue(makeChain({ data: fakeProduct, error: null }));
    const partial = {
      barcode: '123456',
      name: 'Milk',
      brand: null,
      category: null,
      package_unit: null,
      unit_price: null,
      country: null,
    };
    expect(await productRepo.upsert(partial)).toEqual(fakeProduct);
  });

  it('calls upsert with onConflict=barcode', async () => {
    const chain = makeChain({ data: fakeProduct, error: null });
    mockFrom.mockReturnValue(chain);
    const partial = {
      barcode: '123456',
      name: 'Milk',
      brand: null,
      category: null,
      package_unit: null,
      unit_price: null,
      country: null,
    };
    await productRepo.upsert(partial);
    expect(chain.upsert as jest.Mock).toHaveBeenCalledWith(partial, { onConflict: 'barcode' });
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: null, error: { code: '23505', message: 'Dup', details: '', hint: '' } }),
    );
    const partial = {
      barcode: '123456',
      name: 'Milk',
      brand: null,
      category: null,
      package_unit: null,
      unit_price: null,
      country: null,
    };
    await expect(productRepo.upsert(partial)).rejects.toBeInstanceOf(AppError);
  });
});

// ─── upsertMany ───────────────────────────────────────────────────────────────

describe('upsertMany', () => {
  it('returns id+barcode pairs on success', async () => {
    const rows = [
      { id: 'p1', barcode: '111' },
      { id: 'p2', barcode: '222' },
    ];
    mockFrom.mockReturnValue(makeChain({ data: rows, error: null }));
    const partial = {
      barcode: '111',
      name: 'A',
      brand: null,
      category: null,
      package_unit: null,
      unit_price: null,
      country: null,
    };
    expect(await productRepo.upsertMany([partial])).toEqual(rows);
  });

  it('returns empty array immediately for empty input', async () => {
    expect(await productRepo.upsertMany([])).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail' } }));
    const partial = {
      barcode: '111',
      name: 'A',
      brand: null,
      category: null,
      package_unit: null,
      unit_price: null,
      country: null,
    };
    await expect(productRepo.upsertMany([partial])).rejects.toBeInstanceOf(AppError);
  });
});

// ─── updatePrice ─────────────────────────────────────────────────────────────

describe('updatePrice', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(productRepo.updatePrice('prod-1', 2.49)).resolves.toBeUndefined();
  });

  it('calls update with the correct unit_price', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await productRepo.updatePrice('prod-1', 2.49);
    expect(chain.update as jest.Mock).toHaveBeenCalledWith({ unit_price: 2.49 });
    expect(chain.eq as jest.Mock).toHaveBeenCalledWith('id', 'prod-1');
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail' } }));
    await expect(productRepo.updatePrice('x', 1)).rejects.toBeInstanceOf(AppError);
  });
});
