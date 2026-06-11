/**
 * Fluent Supabase query-builder mock.
 *
 * All chainable methods return `this`, so any chain length works.
 * Terminal methods (.single(), .maybeSingle()) resolve to `result`.
 * The builder itself is also thenable so `await builder` resolves to `result`
 * (used by queries that skip .single(), e.g. SELECT returning an array).
 */
export type QueryResult = {
  data?: unknown;
  error?: unknown;
  count?: number | null;
};

export function makeChain(result: QueryResult = { data: null, error: null }) {
  const chain: Record<string, unknown> = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    // Thenable: makes `await chain` work without calling .single()
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}
