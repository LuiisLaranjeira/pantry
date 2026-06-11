import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { authRepo } from '@/features/auth/api/authRepo';
import { AppError } from '@/shared/api/errors';
import { appScheme } from '@/shared/lib/appScheme';

// Dismisses the browser session on iOS after the OAuth redirect lands.
WebBrowser.maybeCompleteAuthSession();

export function useSignInWithGoogle() {
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: async () => {
      const redirectTo = makeRedirectUri({ scheme: appScheme() });
      const url = await authRepo.getGoogleOAuthUrl(redirectTo);

      // Register an independent Linking listener BEFORE opening the browser.
      // On Android, expo-web-browser uses a polyfill that races AppState 'active'
      // (→ 'dismiss') against Linking 'url' (→ 'success'). AppState sometimes
      // wins even when auth completed, discarding the redirect URL. Capturing it
      // here lets us detect success regardless of which branch the polyfill took.
      //
      // The code exchange itself is intentionally left to AuthProvider's Linking
      // handler — Supabase does not forward the OAuth `state` param to the final
      // app redirect, so both Google OAuth and email-confirmation codes arrive as
      // identical `scheme://?code=xxx` deep links. AuthProvider is the single
      // exchanger; we only detect the URL here to know whether auth succeeded.
      let capturedUrl: string | null = null;
      const linkingSub = Linking.addEventListener('url', ({ url: u }) => {
        if (u.startsWith(redirectTo)) capturedUrl = u;
      });

      const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
      linkingSub.remove();

      let effectiveUrl: string | null = result.type === 'success' ? result.url : capturedUrl;

      if (!effectiveUrl && result.type === 'dismiss') {
        // Android polyfill race: AppState 'active' won but the Linking event is
        // still in flight. Wait a brief window for it to arrive.
        effectiveUrl = await new Promise<string | null>((resolve) => {
          const sub = Linking.addEventListener('url', ({ url: u }) => {
            if (u.startsWith(redirectTo)) {
              sub.remove();
              resolve(u);
            }
          });
          setTimeout(() => {
            sub.remove();
            resolve(null);
          }, 300);
        });
      }

      if (!effectiveUrl) throw new AppError('auth', 'Google sign-in was cancelled.');

      const callbackUrl = new URL(effectiveUrl);

      // Check for server-side OAuth errors (e.g. duplicate email, access denied).
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

      if (!callbackUrl.searchParams.get('code')) {
        throw new AppError('auth', 'No authorisation code in Google sign-in response.');
      }
      // AuthProvider exchanges the code via its Linking listener.
    },
    onSuccess: () => refresh(),
  });
}
