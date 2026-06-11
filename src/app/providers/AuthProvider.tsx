import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { Alert, Linking } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { authRepo } from '@/features/auth/api/authRepo';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cold-start: load the persisted session before the subscription
    // fires so the loading state resolves on the first render.
    authRepo
      .getSession()
      .then((s) => {
        setSession(s);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    const subscription = authRepo.onAuthStateChange((s) => {
      setSession(s);
      setIsLoading(false);
    });

    // Handle deep links for both email confirmation and Google OAuth.
    // Both flows produce identical scheme://?code=xxx redirects — Supabase does
    // not forward the OAuth `state` param to the final app redirect, so there is
    // no URL-level way to tell them apart. This handler is the single consumer
    // of PKCE codes; useSignInWithGoogle detects the URL to know whether auth
    // succeeded but intentionally does not call exchangeOAuthCode.
    let mounted = true;
    const handleUrl = (url: string) => {
      if (!mounted) return;
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (code) {
          authRepo.exchangeOAuthCode(code).catch(() => {
            if (!mounted) return;
            Alert.alert(
              'Confirmation failed',
              'Could not confirm your email. The link may have expired or there was a connection error — please try again or sign up again for a new link.',
            );
          });
        }
      } catch {}
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) handleUrl(url);
      })
      .catch(() => {});
    const linkingSub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      mounted = false;
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider.');
  return ctx;
}
