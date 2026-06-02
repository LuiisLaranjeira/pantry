import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { householdRepo } from '@/features/household/api/householdRepo';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

interface JoinHouseholdInput {
  inviteCode: string;
}

export function useJoinHousehold() {
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: async ({ inviteCode }: JoinHouseholdInput) => {
      // join_household_by_invite_code RPC handles the lookup + insert
      // server-side so the client never reaches into household_users.
      // Throws AppError('not_found') when the code doesn't match.
      const household = await householdRepo.joinByInviteCode(inviteCode);
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
