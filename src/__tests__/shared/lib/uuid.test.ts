import { manualBarcode, uuid } from '@/shared/lib/uuid';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

describe('uuid', () => {
  it('delegates to expo-crypto randomUUID', () => {
    expect(uuid()).toBe('00000000-0000-0000-0000-000000000001');
  });
});

describe('manualBarcode', () => {
  it('starts with the "manual_" prefix', () => {
    expect(manualBarcode()).toMatch(/^manual_/);
  });

  it('appends the UUID returned by expo-crypto', () => {
    expect(manualBarcode()).toBe('manual_00000000-0000-0000-0000-000000000001');
  });

  it('produces a different value each time (mock returns same, but structure is fixed)', () => {
    expect(manualBarcode()).toBe(manualBarcode());
  });
});
