// appScheme captures process.env at module-evaluation time, so each case
// must reset modules to force re-evaluation with the new env value.

const load = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/shared/lib/appScheme').appScheme();
};

describe('appScheme', () => {
  const origVariant = process.env.EXPO_PUBLIC_APP_VARIANT;

  afterEach(() => {
    if (origVariant === undefined) {
      delete process.env.EXPO_PUBLIC_APP_VARIANT;
    } else {
      process.env.EXPO_PUBLIC_APP_VARIANT = origVariant;
    }
    jest.resetModules();
  });

  it('returns "pantry" in production', () => {
    process.env.EXPO_PUBLIC_APP_VARIANT = 'production';
    jest.resetModules();
    expect(load()).toBe('pantry');
  });

  it('returns "pantry.preview" for the preview variant', () => {
    process.env.EXPO_PUBLIC_APP_VARIANT = 'preview';
    jest.resetModules();
    expect(load()).toBe('pantry.preview');
  });

  it('returns "pantry.development" for the development variant', () => {
    process.env.EXPO_PUBLIC_APP_VARIANT = 'development';
    jest.resetModules();
    expect(load()).toBe('pantry.development');
  });

  it('defaults to "pantry.development" when the env var is unset', () => {
    delete process.env.EXPO_PUBLIC_APP_VARIANT;
    jest.resetModules();
    expect(load()).toBe('pantry.development');
  });
});
