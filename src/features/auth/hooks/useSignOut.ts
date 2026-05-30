import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

import { authRepo } from '@/features/auth/api/authRepo';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      await AsyncStorage.multiRemove([STORAGE_KEYS.householdId, STORAGE_KEYS.householdName]);
      await authRepo.signOut();
    },
  });
}
