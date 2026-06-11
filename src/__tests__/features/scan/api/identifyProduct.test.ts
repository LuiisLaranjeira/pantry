import { authRepo } from '@/features/auth/api/authRepo';
import { identifyProduct } from '@/features/scan/api/identifyProduct';
import { AppError } from '@/shared/api/errors';

jest.mock('@/config/env', () => ({
  env: { EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL: 'https://fn.test/functions/v1' },
}));

jest.mock('@/features/auth/api/authRepo', () => ({
  authRepo: { getSession: jest.fn() },
}));

jest.mock('@/shared/lib/uuid', () => ({
  uuid: jest.fn(() => 'mock-uuid'),
  manualBarcode: jest.fn(() => 'manual_mock-uuid'),
}));

const mockGetSession = authRepo.getSession as jest.Mock;
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const fakeSession = { access_token: 'tok' } as any;

function mockResponse(body: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok, status, json: async () => body } as Response);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(fakeSession);
});

// ─── auth guards ──────────────────────────────────────────────────────────────

describe('auth guards', () => {
  it('throws AppError("auth") when there is no active session', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const err = await identifyProduct({ base64: 'abc', barcode: null }).catch((e) => e);
    expect((err as AppError).code).toBe('auth');
  });
});

// ─── network / HTTP errors ────────────────────────────────────────────────────

describe('network and HTTP errors', () => {
  it('throws AppError("network") when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'));
    const err = await identifyProduct({ base64: 'abc', barcode: null }).catch((e) => e);
    expect((err as AppError).code).toBe('network');
  });

  it('throws AppError("unknown") when the response is not ok', async () => {
    mockResponse({}, false, 502);
    const err = await identifyProduct({ base64: 'abc', barcode: null }).catch((e) => e);
    expect((err as AppError).code).toBe('unknown');
    expect((err as AppError).message).toContain('502');
  });
});

// ─── API-level errors ─────────────────────────────────────────────────────────

describe('API-level errors', () => {
  it('throws AppError("unknown") when the response body contains an error field', async () => {
    mockResponse({ error: 'GROQ_API_KEY not configured' });
    const err = await identifyProduct({ base64: 'abc', barcode: null }).catch((e) => e);
    expect((err as AppError).code).toBe('unknown');
    expect((err as AppError).message).toBe('GROQ_API_KEY not configured');
  });

  it('throws AppError("not_found") when name is missing from the response', async () => {
    mockResponse({ brand: 'Nestlé' });
    const err = await identifyProduct({ base64: 'abc', barcode: null }).catch((e) => e);
    expect((err as AppError).code).toBe('not_found');
  });
});

// ─── happy path ───────────────────────────────────────────────────────────────

describe('happy path', () => {
  it('returns a PartialProduct with the provided barcode', async () => {
    mockResponse({ name: 'Milk', brand: 'Nestlé', category: 'dairy', package_unit: '1L' });
    const result = await identifyProduct({ base64: 'abc', barcode: '5449000000996' });
    expect(result).toEqual({
      barcode: '5449000000996',
      name: 'Milk',
      brand: 'Nestlé',
      category: 'dairy',
      package_unit: '1L',
      unit_price: null,
    });
  });

  it('generates a manual barcode when input.barcode is null', async () => {
    mockResponse({ name: 'Milk', brand: null, category: null, package_unit: null });
    const result = await identifyProduct({ base64: 'abc', barcode: null });
    expect(result.barcode).toBe('manual_mock-uuid');
  });

  it('coerces null brand/category/package_unit to null', async () => {
    mockResponse({ name: 'Milk' });
    const result = await identifyProduct({ base64: 'abc', barcode: 'B1' });
    expect(result.brand).toBeNull();
    expect(result.category).toBeNull();
    expect(result.package_unit).toBeNull();
    expect(result.unit_price).toBeNull();
  });

  it('sends the correct Authorization header', async () => {
    mockResponse({ name: 'X' });
    await identifyProduct({ base64: 'imgdata', barcode: 'B1' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://fn.test/functions/v1/identify-product',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    );
  });

  it('sends image and barcode in the request body', async () => {
    mockResponse({ name: 'X' });
    await identifyProduct({ base64: 'myimage', barcode: 'B1' });
    const call = mockFetch.mock.calls[0]!;
    const body = JSON.parse(call[1]!.body as string);
    expect(body).toEqual({ image: 'myimage', barcode: 'B1' });
  });
});
