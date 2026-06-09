import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
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
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider.');
  return ctx;
}
