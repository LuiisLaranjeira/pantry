import { authRepo } from '@/features/auth/api/authRepo';
import { parseReceipt } from '@/features/scan/api/parseReceipt';
import { AppError } from '@/shared/api/errors';
import { fakeSession, createFetchMock } from '../../../__helpers__/fetchMock';

jest.mock('@/config/env', () => ({
  env: { EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL: 'https://fn.test/functions/v1' },
}));

jest.mock('@/features/auth/api/authRepo', () => ({
  authRepo: { getSession: jest.fn() },
}));

const mockGetSession = authRepo.getSession as jest.Mock;
const { mockFetch, mockResponse } = createFetchMock();

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(fakeSession);
});

// ─── auth guards ──────────────────────────────────────────────────────────────

describe('auth guards', () => {
  it('throws AppError("auth") when there is no active session', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const err = await parseReceipt('imgdata').catch((e) => e);
    expect((err as AppError).code).toBe('auth');
  });
});

// ─── network / HTTP errors ────────────────────────────────────────────────────

describe('network and HTTP errors', () => {
  it('throws AppError("network") when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));
    const err = await parseReceipt('imgdata').catch((e) => e);
    expect((err as AppError).code).toBe('network');
  });

  it('throws AppError("unknown") when the response is not ok', async () => {
    mockResponse({}, false, 503);
    const err = await parseReceipt('imgdata').catch((e) => e);
    expect((err as AppError).code).toBe('unknown');
    expect((err as AppError).message).toContain('503');
  });
});

// ─── API-level errors ─────────────────────────────────────────────────────────

describe('API-level errors', () => {
  it('throws AppError("unknown") when the body has an error field', async () => {
    mockResponse({ error: 'GROQ error' });
    const err = await parseReceipt('imgdata').catch((e) => e);
    expect((err as AppError).code).toBe('unknown');
    expect((err as AppError).message).toBe('GROQ error');
  });

  it('throws AppError("not_found") when items array is empty', async () => {
    mockResponse({ store: 'Continente', items: [] });
    const err = await parseReceipt('imgdata').catch((e) => e);
    expect((err as AppError).code).toBe('not_found');
  });

  it('throws AppError("not_found") when items is not an array', async () => {
    mockResponse({ store: null, items: null });
    const err = await parseReceipt('imgdata').catch((e) => e);
    expect((err as AppError).code).toBe('not_found');
  });

  it('throws AppError("not_found") when all items normalise to null (no valid name)', async () => {
    mockResponse({ items: [{ name: '' }, { name: null }] });
    const err = await parseReceipt('imgdata').catch((e) => e);
    expect((err as AppError).code).toBe('not_found');
  });
});

// ─── happy path ───────────────────────────────────────────────────────────────

describe('happy path', () => {
  it('returns store and normalised items', async () => {
    mockResponse({
      store: 'Continente',
      items: [{ name: 'Milk', quantity: 2, unit_price: 0.89 }],
    });
    const result = await parseReceipt('imgdata');
    expect(result.store).toBe('Continente');
    expect(result.items).toEqual([{ name: 'Milk', quantity: 2, unit_price: 0.89 }]);
  });

  it('returns null store when store is absent from the response', async () => {
    mockResponse({ items: [{ name: 'Eggs', quantity: 1, unit_price: null }] });
    expect((await parseReceipt('imgdata')).store).toBeNull();
  });

  it('sends the image as the request body and includes the Bearer token', async () => {
    mockResponse({ items: [{ name: 'X', quantity: 1 }] });
    await parseReceipt('b64imgdata');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://fn.test/functions/v1/parse-receipt',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    );
    const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
    expect(body).toEqual({ image: 'b64imgdata' });
  });
});

// ─── normalizeItem behaviour ──────────────────────────────────────────────────

describe('normalizeItem (via parseReceipt)', () => {
  async function normalize(raw: unknown) {
    mockResponse({ items: [raw] });
    const result = await parseReceipt('img').catch(() => null);
    return result?.items[0] ?? null;
  }

  it('clamps quantity to minimum 1', async () => {
    expect((await normalize({ name: 'X', quantity: 0 }))?.quantity).toBe(1);
  });

  it('rounds fractional quantities', async () => {
    expect((await normalize({ name: 'X', quantity: 2.7 }))?.quantity).toBe(3);
  });

  it('defaults quantity to 1 when absent', async () => {
    expect((await normalize({ name: 'X' }))?.quantity).toBe(1);
  });

  it('returns null unit_price when unit_price is null', async () => {
    expect((await normalize({ name: 'X', quantity: 1, unit_price: null }))?.unit_price).toBeNull();
  });

  it('converts numeric string unit_price to a number', async () => {
    expect((await normalize({ name: 'X', quantity: 1, unit_price: '1.99' }))?.unit_price).toBe(
      1.99,
    );
  });

  it('returns null unit_price for non-numeric strings', async () => {
    expect(
      (await normalize({ name: 'X', quantity: 1, unit_price: 'free' }))?.unit_price,
    ).toBeNull();
  });

  it('returns null for non-object items', async () => {
    // All-null items array → not_found throw
    mockResponse({ items: ['not-an-object', 42] });
    const err = await parseReceipt('img').catch((e) => e);
    expect((err as AppError).code).toBe('not_found');
  });
});
