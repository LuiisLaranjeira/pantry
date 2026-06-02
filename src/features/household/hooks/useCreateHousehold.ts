import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { householdRepo } from '@/features/household/api/householdRepo';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

interface CreateHouseholdInput {
  name: string;
}

export function useCreateHousehold() {
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: async ({ name }: CreateHouseholdInput) => {
      // create_household RPC creates the row + adds the caller as the first
      // member atomically. No more separate household + household_users
      // inserts to keep in sync.
      const household = await householdRepo.create(name);
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.householdId, household.id],
        [STORAGE_KEYS.householdName, household.name],
      ]);
      return household;
    },
    onSuccess: () => {
      refresh();
    },
  });
}
