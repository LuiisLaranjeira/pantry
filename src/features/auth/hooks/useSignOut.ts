import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clearPersistedQueries } from '@/app/providers/queryPersister';
import { authRepo } from '@/features/auth/api/authRepo';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await authRepo.signOut();
      await AsyncStorage.multiRemove([STORAGE_KEYS.householdId, STORAGE_KEYS.householdName]);
    },
    onSuccess: async () => {
      // Drop any cached data for the signed-out user so the next sign-in
      // doesn't rehydrate the previous user's queries.
      // clearPersistedQueries hits the persister directly so we don't race
      // with its throttled write of the cleared in-memory state.
      queryClient.clear();
      await clearPersistedQueries();
    },
  });
}
