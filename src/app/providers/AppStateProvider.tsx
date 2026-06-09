import { createContext, useCallback, useContext, useEffect, type PropsWithChildren } from 'react';

import { useAuthContext } from '@/app/providers/AuthProvider';
import { useHouseholdContext } from '@/app/providers/HouseholdProvider';

export type AppState = 'loading' | 'auth' | 'household' | 'app';

interface AppStateContextValue {
  state: AppState;
  householdId: string | null;
  householdName: string | null;
  refresh: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const auth = useAuthContext();
  const household = useHouseholdContext();

  // Re-read household state whenever the signed-in user changes (sign in,
  // sign out, account switch). Token refreshes keep the same user.id so
  // they don't trigger a reload.
  const userId = auth.session?.user.id ?? null;
  useEffect(() => {
    household.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const state: AppState =
    auth.isLoading || household.isLoading
      ? 'loading'
      : !auth.session
        ? 'auth'
        : !household.householdId
          ? 'household'
          : 'app';

  // refresh() re-reads household state from AsyncStorage. Auth transitions
  // (sign in, sign out, OAuth) are now driven automatically by the
  // onAuthStateChange subscription in AuthProvider — callers no longer need
  // refresh() for those cases, but it is kept for backward compatibility and
  // for household-specific transitions (create, join, leave).
  const refresh = useCallback(async () => {
    await household.reload();
  }, [household]);

  return (
    <AppStateContext.Provider
      value={{
        state,
        householdId: household.householdId,
        householdName: household.householdName,
        refresh,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider.');
  return ctx;
}
