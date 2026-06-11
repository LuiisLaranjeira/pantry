import { timeAgo } from '@/shared/lib/time';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const BASE = new Date('2024-06-15T12:00:00Z').getTime();
const iso = (msAgo: number) => new Date(BASE - msAgo).toISOString();

describe('timeAgo', () => {
  it('returns "just now" for 0 minutes ago', () => expect(timeAgo(iso(0), BASE)).toBe('just now'));

  it('returns "just now" for exactly 1 minute ago', () =>
    expect(timeAgo(iso(MIN), BASE)).toBe('just now'));

  it('returns "2m ago" for 2 minutes ago', () =>
    expect(timeAgo(iso(2 * MIN), BASE)).toBe('2m ago'));

  it('returns "59m ago" for 59 minutes ago', () =>
    expect(timeAgo(iso(59 * MIN), BASE)).toBe('59m ago'));

  it('returns "1h ago" for exactly 1 hour ago', () =>
    expect(timeAgo(iso(HOUR), BASE)).toBe('1h ago'));

  it('returns "23h ago" for 23 hours ago', () =>
    expect(timeAgo(iso(23 * HOUR), BASE)).toBe('23h ago'));

  it('returns "yesterday" for exactly 1 day ago', () =>
    expect(timeAgo(iso(DAY), BASE)).toBe('yesterday'));

  it('returns "2d ago" for 2 days ago', () => expect(timeAgo(iso(2 * DAY), BASE)).toBe('2d ago'));

  it('returns "7d ago" for 7 days ago', () => expect(timeAgo(iso(7 * DAY), BASE)).toBe('7d ago'));

  it('clamps negative diff (future timestamp) to "just now"', () =>
    expect(timeAgo(iso(-5_000), BASE)).toBe('just now'));

  it('uses Date.now() as default when now is not provided', () => {
    const recentIso = new Date(Date.now() - 30_000).toISOString();
    expect(timeAgo(recentIso)).toBe('just now');
  });
});
