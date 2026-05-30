import { useQuery } from '@tanstack/react-query';

import { profileKeys } from '@/features/profile/api/queryKeys';
import { areNotificationsEnabled } from '@/shared/lib/notifications';

export function useNotificationsState() {
  return useQuery<boolean>({
    queryKey: profileKeys.notificationsState(),
    queryFn: areNotificationsEnabled,
  });
}
