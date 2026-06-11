import { AppError, isAppError, mapSupabaseError } from '@/shared/api/errors';
import type { AuthError } from '@supabase/supabase-js';

// PostgrestError gained non-optional fields (name, toJSON) in recent versions.
// Cast via unknown so the tests don't need to supply the full interface shape.
type PartialPostgrestError = { code: string; message: string; details: string; hint: string };

describe('AppError', () => {
  it('stores code, message, and optional cause', () => {
    const cause = new Error('root');
    const err = new AppError('auth', 'Sign-in failed.', cause);
    expect(err.code).toBe('auth');
    expect(err.message).toBe('Sign-in failed.');
    expect(err.cause).toBe(cause);
    expect(err.name).toBe('AppError');
  });

  it('is an instanceof Error', () => {
    expect(new AppError('network', 'oops')).toBeInstanceOf(Error);
  });

  it('works without a cause', () => {
    const err = new AppError('not_found', 'Missing resource.');
    expect(err.cause).toBeUndefined();
  });
});

describe('isAppError', () => {
  it('returns true for an AppError instance', () =>
    expect(isAppError(new AppError('auth', 'x'))).toBe(true));

  it('returns false for a plain Error', () => expect(isAppError(new Error('x'))).toBe(false));

  it('returns false for null', () => expect(isAppError(null)).toBe(false));
  it('returns false for a string', () => expect(isAppError('oops')).toBe(false));
  it('returns false for a number', () => expect(isAppError(42)).toBe(false));
  it('returns false for a plain object', () =>
    expect(isAppError({ code: 'auth', message: 'x' })).toBe(false));
});

describe('mapSupabaseError', () => {
  it('returns unknown AppError with fallback message when error is null', () => {
    const e = mapSupabaseError(null, 'fallback');
    expect(e).toBeInstanceOf(AppError);
    expect(e.code).toBe('unknown');
    expect(e.message).toBe('fallback');
  });

  it('returns unknown AppError with fallback message when error is undefined', () => {
    const e = mapSupabaseError(undefined, 'fallback');
    expect(e.code).toBe('unknown');
    expect(e.message).toBe('fallback');
  });

  it('maps a 401 AuthError to the "auth" code', () => {
    const authErr = { message: 'Invalid JWT', status: 401 } as AuthError;
    expect(mapSupabaseError(authErr, 'fb').code).toBe('auth');
  });

  it('maps a non-401 AuthError to "unknown"', () => {
    const authErr = { message: 'Server error', status: 500 } as AuthError;
    expect(mapSupabaseError(authErr, 'fb').code).toBe('unknown');
  });

  it('maps PostgrestError PGRST116 to "not_found"', () => {
    const pgErr = {
      code: 'PGRST116',
      message: 'Not found',
      details: '',
      hint: '',
    } as unknown as PartialPostgrestError;
    expect(mapSupabaseError(pgErr as never, 'fb').code).toBe('not_found');
  });

  it('maps PostgrestError 23505 to "conflict"', () => {
    const pgErr = {
      code: '23505',
      message: 'Duplicate key',
      details: '',
      hint: '',
    } as unknown as PartialPostgrestError;
    expect(mapSupabaseError(pgErr as never, 'fb').code).toBe('conflict');
  });

  it('maps PostgrestError 42501 to "forbidden"', () => {
    const pgErr = {
      code: '42501',
      message: 'Permission denied',
      details: '',
      hint: '',
    } as unknown as PartialPostgrestError;
    expect(mapSupabaseError(pgErr as never, 'fb').code).toBe('forbidden');
  });

  it('maps unknown PostgrestError to "unknown"', () => {
    const pgErr = {
      code: '99999',
      message: 'Something',
      details: '',
      hint: '',
    } as unknown as PartialPostgrestError;
    expect(mapSupabaseError(pgErr as never, 'fb').code).toBe('unknown');
  });

  it('preserves the original error as cause', () => {
    const pgErr = {
      code: '23505',
      message: 'Dup',
      details: '',
      hint: '',
    } as unknown as PartialPostgrestError;
    const appErr = mapSupabaseError(pgErr as never, 'fb');
    expect(appErr.cause).toBe(pgErr);
  });

  it('uses the error message when available (not the fallback)', () => {
    const authErr = { message: 'Token expired', status: 401 } as AuthError;
    expect(mapSupabaseError(authErr, 'fallback').message).toBe('Token expired');
  });
});
