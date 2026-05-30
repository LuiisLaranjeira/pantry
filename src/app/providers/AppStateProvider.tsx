import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { authRepo } from '@/features/auth/api/authRepo';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

export type AppState = 'loading' | 'auth' | 'household' | 'app';

interface AppStateContextValue {
  state: AppState;
  householdId: string | null;
  householdName: string | null;
  refresh: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>('loading');
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const session = await authRepo.getSession();
    if (!session) {
      setHouseholdId(null);
      setHouseholdName(null);
      setState('auth');
      return;
    }
    const [id, name] = await AsyncStorage.multiGet([
      STORAGE_KEYS.householdId,
      STORAGE_KEYS.householdName,
    ]);
    setHouseholdId(id[1]);
    setHouseholdName(name[1]);
    setState(id[1] ? 'app' : 'household');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async initial read of auth/household; setState fires after awaits, not synchronously
    refresh();
    const subscription = authRepo.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  return (
    <AppStateContext.Provider value={{ state, householdId, householdName, refresh }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error('useAppState must be used within AppStateProvider.');
  }
  return value;
}
