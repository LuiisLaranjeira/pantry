import { formatCurrency, toCSV } from '@/shared/lib/format';

describe('formatCurrency', () => {
  it('formats zero', () => expect(formatCurrency(0)).toBe('€0.00'));
  it('formats a positive decimal', () => expect(formatCurrency(1.5)).toBe('€1.50'));
  it('formats a negative value', () => expect(formatCurrency(-3.99)).toBe('€-3.99'));
  it('always produces exactly 2 decimal places', () => {
    // Avoid values affected by IEEE 754 rounding ambiguity (e.g. 1.555 → '1.55').
    expect(formatCurrency(1.1)).toBe('€1.10');
    expect(formatCurrency(1.23)).toBe('€1.23');
  });
  it('formats a whole number', () => expect(formatCurrency(10)).toBe('€10.00'));
});

describe('toCSV', () => {
  it('produces a single header row', () => {
    expect(toCSV([['Name', 'Qty']])).toBe('"Name","Qty"');
  });

  it('joins multiple rows with newlines', () => {
    expect(toCSV([['Name'], ['milk']])).toBe('"Name"\n"milk"');
  });

  it('escapes double quotes by doubling them', () => {
    expect(toCSV([['He said "hi"']])).toBe('"He said ""hi"""');
  });

  it('converts null and undefined cells to empty strings', () => {
    expect(toCSV([[null, undefined, 'ok']])).toBe('"","","ok"');
  });

  it('converts numbers to strings', () => {
    expect(toCSV([[1, 2.5]])).toBe('"1","2.5"');
  });

  it('returns empty string for empty input', () => {
    expect(toCSV([])).toBe('');
  });

  it('handles a full multi-row table', () => {
    const result = toCSV([
      ['Name', 'Brand', 'Qty'],
      ['Milk', 'Nestlé', 2],
      ['Eggs', null, 12],
    ]);
    expect(result).toBe('"Name","Brand","Qty"\n"Milk","Nestlé","2"\n"Eggs","","12"');
  });
});
