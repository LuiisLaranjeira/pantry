import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useMutation } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { authRepo } from '@/features/auth/api/authRepo';
import { AppError } from '@/shared/api/errors';

// Dismisses the browser session on iOS after the OAuth redirect lands.
// Called at module level so it fires whenever this hook is imported,
// regardless of which screen uses it.
WebBrowser.maybeCompleteAuthSession();

export function useSignInWithGoogle() {
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: async () => {
      const redirectTo = makeRedirectUri({ scheme: 'pantry' });
      const url = await authRepo.getGoogleOAuthUrl(redirectTo);

      const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
      if (result.type !== 'success') throw new AppError('auth', 'Google sign-in was cancelled.');

      const code = new URL(result.url).searchParams.get('code');
      if (!code) throw new AppError('auth', 'No authorisation code in Google sign-in response.');

      return authRepo.exchangeOAuthCode(code);
    },
    onSuccess: () => refresh(),
  });
}
