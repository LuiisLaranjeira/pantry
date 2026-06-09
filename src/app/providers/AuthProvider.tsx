import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { Linking } from 'react-native';
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

    // Handle deep links for email confirmation (pantry.preview://?code=xxx).
    // exchangeOAuthCode triggers onAuthStateChange which updates the session.
    const handleUrl = (url: string) => {
      try {
        const code = new URL(url).searchParams.get('code');
        if (code) authRepo.exchangeOAuthCode(code).catch(() => {});
      } catch {}
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const linkingSub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
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
