import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';

import { householdRepo } from '@/features/household/api/householdRepo';
import { householdKeys } from '@/features/household/api/queryKeys';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

export interface HouseholdWithCount {
  id: string;
  name: string;
  invite_code: string;
  country: string | null;
  grouped_view: boolean;
  member_count: number;
}

export function useHousehold(householdId: string | null) {
  return useQuery<HouseholdWithCount>({
    queryKey: householdKeys.detail(householdId),
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
