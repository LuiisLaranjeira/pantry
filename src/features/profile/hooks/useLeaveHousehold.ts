import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { authRepo } from '@/features/auth/api/authRepo';
import { householdRepo } from '@/features/household/api/householdRepo';
import { AppError } from '@/shared/api/errors';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

export function useLeaveHousehold(householdId: string | null) {
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: async () => {
      if (!householdId) throw new Error('No household.');
      const session = await authRepo.getSession();
      if (!session) throw new AppError('auth', 'Not signed in.');
      await householdRepo.removeMember(householdId, session.user.id);
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.householdId,
        STORAGE_KEYS.householdName,
        STORAGE_KEYS.householdCountry,
      ]);
    },
    onSuccess: () => {
      refresh();
    },
  });
}
