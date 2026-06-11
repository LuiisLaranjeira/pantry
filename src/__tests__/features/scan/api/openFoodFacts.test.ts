import { lookupBarcode } from '@/features/scan/api/openFoodFacts';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

function respond(body: unknown, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    json: async () => body,
  } as Response);
}

afterEach(() => mockFetch.mockReset());

describe('lookupBarcode', () => {
  it('returns null when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'));
    expect(await lookupBarcode('1234567890')).toBeNull();
  });

  it('returns null when the HTTP response is not ok', async () => {
    respond({}, false);
    expect(await lookupBarcode('1234567890')).toBeNull();
  });

  it('returns null when API status is not 1', async () => {
    respond({ status: 0, product: null });
    expect(await lookupBarcode('1234567890')).toBeNull();
  });

  it('returns null when the product has no usable name', async () => {
    respond({ status: 1, product: { generic_name: '', product_name: '', product_name_en: '' } });
    expect(await lookupBarcode('1234567890')).toBeNull();
  });

  it('prefers generic_name over product_name', async () => {
    respond({
      status: 1,
      product: { generic_name: 'Whole Milk', product_name: 'Branded Milk', brands: 'Acme' },
    });
    expect((await lookupBarcode('1234567890'))?.name).toBe('Whole Milk');
  });

  it('falls back to product_name_en when generic_name is empty', async () => {
    respond({
      status: 1,
      product: { generic_name: '', product_name_en: 'Milk EN', product_name: '' },
    });
    expect((await lookupBarcode('1234567890'))?.name).toBe('Milk EN');
  });

  it('falls back to product_name when generic_name and product_name_en are empty', async () => {
    respond({
      status: 1,
      product: { generic_name: '', product_name_en: '', product_name: 'Milk' },
    });
    expect((await lookupBarcode('1234567890'))?.name).toBe('Milk');
  });

  it('uses the country-localised product name when country is provided', async () => {
    respond({
      status: 1,
      product: {
        generic_name: '',
        product_name_en: '',
        product_name_pt: 'Leite',
        product_name: 'Milk',
      },
    });
    expect((await lookupBarcode('1234567890', 'pt'))?.name).toBe('Leite');
  });

  it('returns only the first brand when multiple are listed', async () => {
    respond({ status: 1, product: { generic_name: 'Milk', brands: 'Nestlé, Dreyer, Other' } });
    expect((await lookupBarcode('1234567890'))?.brand).toBe('Nestlé');
  });

  it('returns null brand when brands field is absent', async () => {
    respond({ status: 1, product: { generic_name: 'Milk' } });
    expect((await lookupBarcode('1234567890'))?.brand).toBeNull();
  });

  it('strips the language prefix from categories_tags', async () => {
    respond({
      status: 1,
      product: { generic_name: 'Milk', categories_tags: ['en:dairy-products', 'en:milks'] },
    });
    expect((await lookupBarcode('1234567890'))?.category).toBe('dairy-products');
  });

  it('returns null category when categories_tags is absent', async () => {
    respond({ status: 1, product: { generic_name: 'Milk' } });
    expect((await lookupBarcode('1234567890'))?.category).toBeNull();
  });

  it('includes the original barcode in the returned product', async () => {
    respond({ status: 1, product: { generic_name: 'Milk' } });
    expect((await lookupBarcode('5449000000996'))?.barcode).toBe('5449000000996');
  });

  it('includes the quantity field as package_unit', async () => {
    respond({ status: 1, product: { generic_name: 'Milk', quantity: '1L' } });
    expect((await lookupBarcode('1234567890'))?.package_unit).toBe('1L');
  });

  it('returns null package_unit when quantity field is absent', async () => {
    respond({ status: 1, product: { generic_name: 'Milk' } });
    expect((await lookupBarcode('1234567890'))?.package_unit).toBeNull();
  });

  it('returns unit_price as null (OpenFoodFacts does not supply prices)', async () => {
    respond({ status: 1, product: { generic_name: 'Milk' } });
    expect((await lookupBarcode('1234567890'))?.unit_price).toBeNull();
  });
});
