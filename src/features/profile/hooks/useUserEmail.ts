import { useQuery } from '@tanstack/react-query';

import { authRepo } from '@/features/auth/api/authRepo';
import { profileKeys } from '@/features/profile/api/queryKeys';

export function useUserEmail() {
  return useQuery<string | null>({
    queryKey: profileKeys.userEmail(),
    queryFn: async () => {
      const session = await authRepo.getSession();
      return session?.user?.email ?? null;
    },
  });
}
