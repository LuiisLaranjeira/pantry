import { supabase } from '@/shared/api/supabaseClient';
import { authRepo } from '@/features/auth/api/authRepo';
import { AppError, isAppError } from '@/shared/api/errors';
import type { Session } from '@supabase/supabase-js';

jest.mock('@/shared/api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOAuth: jest.fn(),
      exchangeCodeForSession: jest.fn(),
    },
    functions: { invoke: jest.fn() },
  },
}));

jest.mock('@/shared/lib/appScheme', () => ({ appScheme: () => 'pantry.test' }));

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const mockFunctions = supabase.functions as jest.Mocked<typeof supabase.functions>;

const fakeSession: Session = {
  access_token: 'tok',
  refresh_token: 'rtok',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  user: {
    id: 'user-1',
    email: 'a@b.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
  },
};

beforeEach(() => jest.clearAllMocks());

// ─── getSession ───────────────────────────────────────────────────────────────

describe('getSession', () => {
  it('returns the session when present', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });
    expect(await authRepo.getSession()).toBe(fakeSession);
  });

  it('returns null when there is no session', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });
    expect(await authRepo.getSession()).toBeNull();
  });

  it('throws when supabase returns an error', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: 'fail', status: 500 },
    });
    await expect(authRepo.getSession()).rejects.toBeInstanceOf(AppError);
  });
});

// ─── signInWithPassword ───────────────────────────────────────────────────────

describe('signInWithPassword', () => {
  it('returns the session on success', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });
    expect(await authRepo.signInWithPassword('a@b.com', 'pass')).toBe(fakeSession);
  });

  it('throws AppError("auth") when supabase returns an error', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid creds' },
    });
    const err = await authRepo.signInWithPassword('a@b.com', 'wrong').catch((e) => e);
    expect(isAppError(err)).toBe(true);
    expect((err as AppError).code).toBe('auth');
    expect((err as AppError).message).toBe('Invalid creds');
  });

  it('throws AppError("auth") when session is null but no error object', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const err = await authRepo.signInWithPassword('a@b.com', 'pass').catch((e) => e);
    expect(isAppError(err)).toBe(true);
    expect((err as AppError).code).toBe('auth');
  });
});

// ─── signUp ───────────────────────────────────────────────────────────────────

describe('signUp', () => {
  it('calls supabase.auth.signUp with correct emailRedirectTo', async () => {
    (mockAuth.signUp as jest.Mock).mockResolvedValue({ error: null });
    await authRepo.signUp('a@b.com', 'pass123');
    expect(mockAuth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'a@b.com',
        password: 'pass123',
        options: { emailRedirectTo: 'pantry.test://' },
      }),
    );
  });

  it('throws AppError("auth") when supabase returns an error', async () => {
    (mockAuth.signUp as jest.Mock).mockResolvedValue({ error: { message: 'Email taken' } });
    const err = await authRepo.signUp('a@b.com', 'pass').catch((e) => e);
    expect(isAppError(err)).toBe(true);
    expect((err as AppError).code).toBe('auth');
  });
});

// ─── signOut ──────────────────────────────────────────────────────────────────

describe('signOut', () => {
  it('resolves without error on success', async () => {
    (mockAuth.signOut as jest.Mock).mockResolvedValue({ error: null });
    await expect(authRepo.signOut()).resolves.toBeUndefined();
  });

  it('throws AppError("auth") when supabase returns an error', async () => {
    (mockAuth.signOut as jest.Mock).mockResolvedValue({ error: { message: 'Network error' } });
    const err = await authRepo.signOut().catch((e) => e);
    expect(isAppError(err)).toBe(true);
    expect((err as AppError).code).toBe('auth');
  });
});

// ─── deleteAccount ────────────────────────────────────────────────────────────

describe('deleteAccount', () => {
  it('resolves when the edge function returns no error', async () => {
    (mockFunctions.invoke as jest.Mock).mockResolvedValue({ error: null });
    await expect(authRepo.deleteAccount()).resolves.toBeUndefined();
    expect(mockFunctions.invoke).toHaveBeenCalledWith('delete-account', { body: {} });
  });

  it('throws AppError with the error message when the edge function errors', async () => {
    (mockFunctions.invoke as jest.Mock).mockResolvedValue({ error: { message: 'Not found' } });
    const err = await authRepo.deleteAccount().catch((e) => e);
    expect(isAppError(err)).toBe(true);
    expect((err as AppError).message).toBe('Not found');
  });

  it('falls back to a generic message when the error has no message field', async () => {
    (mockFunctions.invoke as jest.Mock).mockResolvedValue({ error: 'string-error' });
    const err = await authRepo.deleteAccount().catch((e) => e);
    expect((err as AppError).message).toBe('Could not delete account.');
  });
});

// ─── getGoogleOAuthUrl ────────────────────────────────────────────────────────

describe('getGoogleOAuthUrl', () => {
  it('returns the OAuth URL on success', async () => {
    (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?...' },
      error: null,
    });
    expect(await authRepo.getGoogleOAuthUrl('pantry.test://callback')).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth?...',
    );
  });

  it('throws when supabase returns an error', async () => {
    (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
      data: { url: null },
      error: { message: 'fail', status: 500 },
    });
    await expect(authRepo.getGoogleOAuthUrl('x')).rejects.toBeInstanceOf(AppError);
  });

  it('throws when the URL is null even without an error object', async () => {
    (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: null }, error: null });
    await expect(authRepo.getGoogleOAuthUrl('x')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── exchangeOAuthCode ────────────────────────────────────────────────────────

describe('exchangeOAuthCode', () => {
  it('returns the session on success', async () => {
    (mockAuth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });
    expect(await authRepo.exchangeOAuthCode('code-123')).toBe(fakeSession);
  });

  it('throws when supabase errors', async () => {
    (mockAuth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: 'Code expired', status: 401 },
    });
    await expect(authRepo.exchangeOAuthCode('bad-code')).rejects.toBeInstanceOf(AppError);
  });

  it('throws when session is null but no explicit error', async () => {
    (mockAuth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    await expect(authRepo.exchangeOAuthCode('code')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── onAuthStateChange ────────────────────────────────────────────────────────

describe('onAuthStateChange', () => {
  it('returns the subscription object from supabase', () => {
    const fakeSub = { unsubscribe: jest.fn() };
    (mockAuth.onAuthStateChange as jest.Mock).mockReturnValue({ data: { subscription: fakeSub } });
    const sub = authRepo.onAuthStateChange(jest.fn());
    expect(sub).toBe(fakeSub);
  });

  it('forwards auth-state-change events to the callback', () => {
    const cb = jest.fn();
    (mockAuth.onAuthStateChange as jest.Mock).mockImplementation((handler) => {
      handler('SIGNED_IN', fakeSession);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
    authRepo.onAuthStateChange(cb);
    expect(cb).toHaveBeenCalledWith(fakeSession);
  });

  it('forwards null session to the callback on sign-out', () => {
    const cb = jest.fn();
    (mockAuth.onAuthStateChange as jest.Mock).mockImplementation((handler) => {
      handler('SIGNED_OUT', null);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
    authRepo.onAuthStateChange(cb);
    expect(cb).toHaveBeenCalledWith(null);
  });
});
