import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';

import { householdRepo } from '@/features/household/api/householdRepo';
import { profileKeys } from '@/features/profile/api/queryKeys';
import type { HouseholdInfo } from '@/features/profile/types';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

export function useProfileHousehold(householdId: string | null) {
  return useQuery<HouseholdInfo>({
    queryKey: profileKeys.household(householdId),
    enabled: !!householdId,
    queryFn: async () => {
      const id = householdId!;
      const [household, count] = await Promise.all([
        householdRepo.getById(id),
        householdRepo.memberCount(id),
      ]);
      if (household.country) {
        await AsyncStorage.setItem(STORAGE_KEYS.householdCountry, household.country);
      }
      return { ...household, member_count: count };
    },
  });
}
