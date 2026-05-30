import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileKeys } from '@/features/profile/api/queryKeys';
import { disableNotifications, requestAndEnable } from '@/shared/lib/notifications';

export function useToggleNotifications() {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, boolean>({
    mutationFn: async (enable) => {
      if (enable) return requestAndEnable();
      await disableNotifications();
      return false;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.notificationsState() });
    },
  });
}
