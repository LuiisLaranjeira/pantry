import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_PERSIST_KEY } from '@/app/providers/QueryProvider';
import { authRepo } from '@/features/auth/api/authRepo';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await AsyncStorage.multiRemove([STORAGE_KEYS.householdId, STORAGE_KEYS.householdName]);
      await authRepo.signOut();
    },
    onSuccess: async () => {
      // Drop any cached data for the signed-out user so the next sign-in
      // doesn't rehydrate the previous user's queries.
      queryClient.clear();
      await AsyncStorage.removeItem(QUERY_PERSIST_KEY);
    },
  });
}
