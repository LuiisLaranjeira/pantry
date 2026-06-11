import { deriveMonthlySpending, twelveMonthsAgoIso } from '@/features/profile/domain/spending';

// Use a local-time Date (not a UTC string) so getMonth()/getFullYear() return
// the expected values in any timezone the tests run in.
const NOW = new Date(2024, 5, 15); // June 15, 2024 local midnight

describe('deriveMonthlySpending', () => {
  it('returns exactly 12 MonthData entries', () => {
    expect(deriveMonthlySpending([], NOW)).toHaveLength(12);
  });

  it('covers the 12 months ending at the current month (inclusive)', () => {
    const months = deriveMonthlySpending([], NOW);
    expect(months[0].key).toBe('2023-07');
    expect(months[11].key).toBe('2024-06');
  });

  it('keys are in ascending chronological order', () => {
    const months = deriveMonthlySpending([], NOW);
    for (let i = 1; i < months.length; i++) {
      expect(months[i].key > months[i - 1].key).toBe(true);
    }
  });

  it('initialises all months to zero total and zero trips when rows is empty', () => {
    const months = deriveMonthlySpending([], NOW);
    for (const m of months) {
      expect(m.total).toBe(0);
      expect(m.trips).toBe(0);
    }
  });

  it('aggregates total_spent and trip count for a month with multiple rows', () => {
    const rows = [
      { total_spent: 10, completed_at: '2024-06-01T00:00:00Z' },
      { total_spent: 20, completed_at: '2024-06-14T00:00:00Z' },
    ];
    const months = deriveMonthlySpending(rows, NOW);
    const june = months.find((m) => m.key === '2024-06')!;
    expect(june.total).toBe(30);
    expect(june.trips).toBe(2);
  });

  it('treats null total_spent as 0 but still counts the trip', () => {
    const rows = [{ total_spent: null, completed_at: '2024-06-01T00:00:00Z' }];
    const months = deriveMonthlySpending(rows, NOW);
    const june = months.find((m) => m.key === '2024-06')!;
    expect(june.total).toBe(0);
    expect(june.trips).toBe(1);
  });

  it('ignores rows with null completed_at', () => {
    const rows = [{ total_spent: 50, completed_at: null }];
    expect(deriveMonthlySpending(rows, NOW).every((m) => m.total === 0)).toBe(true);
  });

  it('ignores rows that fall outside the 12-month window', () => {
    const rows = [{ total_spent: 999, completed_at: '2020-01-01T00:00:00Z' }];
    expect(deriveMonthlySpending(rows, NOW).every((m) => m.total === 0)).toBe(true);
  });

  it('correctly places a row at the boundary (first month in the window)', () => {
    const rows = [{ total_spent: 7, completed_at: '2023-07-15T00:00:00Z' }];
    const months = deriveMonthlySpending(rows, NOW);
    const july2023 = months.find((m) => m.key === '2023-07')!;
    expect(july2023.total).toBe(7);
    expect(july2023.trips).toBe(1);
  });

  it('produces non-empty labels for every month', () => {
    const months = deriveMonthlySpending([], NOW);
    for (const m of months) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.shortLabel.length).toBeGreaterThan(0);
    }
  });
});

describe('twelveMonthsAgoIso', () => {
  it('returns the 1st day of the month 11 months before now (local time)', () => {
    // toISOString() is UTC-based. Verify via local getters, which are timezone-safe
    // because the function constructs a local-midnight date with new Date(y, m, 1).
    const d = new Date(twelveMonthsAgoIso(NOW));
    expect(d.getFullYear()).toBe(2023);
    expect(d.getMonth()).toBe(6); // July (0-indexed)
  });

  it('returns a valid ISO date string', () => {
    const result = twelveMonthsAgoIso(NOW);
    expect(() => new Date(result)).not.toThrow();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('uses the current date when no argument is provided', () => {
    const result = twelveMonthsAgoIso();
    expect(new Date(result).getTime()).toBeLessThan(Date.now());
  });
});
