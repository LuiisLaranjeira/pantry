import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useMutation } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { authRepo } from '@/features/auth/api/authRepo';
import { AppError } from '@/shared/api/errors';

// Dismisses the browser session on iOS after the OAuth redirect lands.
WebBrowser.maybeCompleteAuthSession();

export function useSignInWithGoogle() {
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: async () => {
      // Explicitly pass the scheme so makeRedirectUri() doesn't fall back
      // to localhost in EAS builds where auto-detection can fail.
      // Mirrors the appScheme() logic in app.config.ts.
      const variant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development';
      const scheme = variant === 'production' ? 'pantry' : `pantry.${variant}`;
      const redirectTo = makeRedirectUri({ scheme });
      const url = await authRepo.getGoogleOAuthUrl(redirectTo);

      const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
      if (result.type !== 'success') throw new AppError('auth', 'Google sign-in was cancelled.');

      const callbackUrl = new URL(result.url);

      // Supabase encodes errors in the redirect URL when the OAuth flow
      // fails server-side (e.g. duplicate email, access denied).
      const oauthError = callbackUrl.searchParams.get('error');
      const oauthErrorDesc = callbackUrl.searchParams.get('error_description');
      if (oauthError) {
        const isDuplicateEmail =
          oauthErrorDesc?.toLowerCase().includes('already') ||
          oauthErrorDesc?.toLowerCase().includes('registered');
        throw new AppError(
          isDuplicateEmail ? 'conflict' : 'auth',
          isDuplicateEmail
            ? 'An account with this email already exists. Sign in with email and password instead.'
            : (oauthErrorDesc ?? 'Google sign-in failed.'),
        );
      }

      const code = callbackUrl.searchParams.get('code');
      if (!code) throw new AppError('auth', 'No authorisation code in Google sign-in response.');

      return authRepo.exchangeOAuthCode(code);
    },
    onSuccess: () => refresh(),
  });
}
