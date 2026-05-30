import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { authRepo } from '@/features/auth/api/authRepo';
import { householdRepo } from '@/features/household/api/householdRepo';
import { AppError } from '@/shared/api/errors';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';
import { uuid } from '@/shared/lib/uuid';

interface CreateHouseholdInput {
  name: string;
}

export function useCreateHousehold() {
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: async ({ name }: CreateHouseholdInput) => {
      const session = await authRepo.getSession();
      if (!session) throw new AppError('auth', 'Not signed in.');
      const id = uuid();
      await householdRepo.create({ id, name });
      await householdRepo.addMember(id, session.user.id);
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.householdId, id],
        [STORAGE_KEYS.householdName, name],
      ]);
      return { id, name };
    },
    onSuccess: () => {
      refresh();
    },
  });
}
