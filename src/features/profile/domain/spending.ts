import type { MonthData } from '@/features/profile/types';

interface CompletedListRow {
  total_spent: number | null;
  completed_at: string | null;
}

const LOCALE = 'en-GB';

export function deriveMonthlySpending(
  rows: CompletedListRow[],
  now: Date = new Date(),
): MonthData[] {
  const byMonth = new Map<string, { total: number; trips: number }>();
  for (const list of rows) {
    if (!list.completed_at) continue;
    const d = new Date(list.completed_at);
    const key = monthKey(d);
    const prev = byMonth.get(key) ?? { total: 0, trips: 0 };
    byMonth.set(key, { total: prev.total + (list.total_spent ?? 0), trips: prev.trips + 1 });
  }

  const months: MonthData[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const data = byMonth.get(key) ?? { total: 0, trips: 0 };
    months.push({
      key,
      label: d.toLocaleDateString(LOCALE, { month: 'short', year: 'numeric' }),
      shortLabel: d.toLocaleDateString(LOCALE, { month: 'short' }),
      ...data,
    });
  }
  return months;
}

export function twelveMonthsAgoIso(now: Date = new Date()): string {
  return new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
