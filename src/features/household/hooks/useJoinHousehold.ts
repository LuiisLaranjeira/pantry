import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { authRepo } from '@/features/auth/api/authRepo';
import { householdRepo } from '@/features/household/api/householdRepo';
import { AppError } from '@/shared/api/errors';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

interface JoinHouseholdInput {
  inviteCode: string;
}

export function useJoinHousehold() {
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: async ({ inviteCode }: JoinHouseholdInput) => {
      const session = await authRepo.getSession();
      if (!session) throw new AppError('auth', 'Not signed in.');
      const household = await householdRepo.getByInviteCode(inviteCode);
      if (!household) {
        throw new AppError('not_found', 'No household found with that code.');
      }
      await householdRepo.addMember(household.id, session.user.id);
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
