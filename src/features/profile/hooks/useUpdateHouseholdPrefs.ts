import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { householdRepo, type HouseholdPatch } from '@/features/household/api/householdRepo';
import { householdKeys } from '@/features/household/api/queryKeys';
import type { HouseholdWithCount } from '@/features/household/hooks/useHousehold';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

export function useUpdateHouseholdPrefs(householdId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = householdKeys.detail(householdId);

  return useMutation({
    mutationFn: async (patch: HouseholdPatch) => {
      if (!householdId) throw new Error('No household.');
      await householdRepo.update(householdId, patch);
      if (typeof patch.country === 'string') {
        await AsyncStorage.setItem(STORAGE_KEYS.householdCountry, patch.country);
      }
      return patch;
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<HouseholdWithCount>(queryKey);
      if (previous) {
        queryClient.setQueryData<HouseholdWithCount>(queryKey, { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_err, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
