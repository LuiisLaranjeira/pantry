import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

interface HouseholdContextValue {
  householdId: string | null;
  householdName: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: PropsWithChildren) {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const [[, id], [, name]] = await AsyncStorage.multiGet([
      STORAGE_KEYS.householdId,
      STORAGE_KEYS.householdName,
    ]);
    setHouseholdId(id ?? null);
    setHouseholdName(name ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async AsyncStorage read; setState fires after the await, not synchronously
    reload();
  }, [reload]);

  return (
    <HouseholdContext.Provider value={{ householdId, householdName, isLoading, reload }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHouseholdContext(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHouseholdContext must be used within HouseholdProvider.');
  return ctx;
}
