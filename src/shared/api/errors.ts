import type { PostgrestError, AuthError } from '@supabase/supabase-js';

export type AppErrorCode =
  | 'auth'
  | 'not_found'
  | 'conflict'
  | 'forbidden'
  | 'network'
  | 'validation'
  | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

function classifyPostgrest(error: PostgrestError): AppErrorCode {
  if (error.code === 'PGRST116') return 'not_found';
  if (error.code === '23505') return 'conflict';
  if (error.code === '42501') return 'forbidden';
  return 'unknown';
}

export function mapSupabaseError(
  error: PostgrestError | AuthError | null | undefined,
  fallbackMessage: string,
): AppError {
  if (!error) return new AppError('unknown', fallbackMessage);
  // PostgrestError.details is always a string. AuthPKCEGrantCodeExchangeError and
  // AuthImplicitGrantRedirectError also have `details`, but as an object — so the
  // typeof check keeps them on the auth path.
  if ('details' in error && typeof (error as { details: unknown }).details === 'string') {
    return new AppError(classifyPostgrest(error as PostgrestError), error.message, error);
  }
  if ('status' in error && typeof error.status === 'number' && error.status === 401) {
    return new AppError('auth', error.message, error);
  }
  return new AppError('unknown', error.message || fallbackMessage, error);
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
