import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { QUERY_PERSIST_KEY } from '@/app/providers/QueryProvider';
import { authRepo } from '@/features/auth/api/authRepo';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

/**
 * Deletes the signed-in user and all local traces of them. The server side
 * (the delete-account edge function) removes orphan households and the
 * auth.users row. After it succeeds we clear AsyncStorage, drop the query
 * cache + persistence, sign out locally (best effort — the JWT is already
 * invalid), and trigger a state refresh so RootNavigator routes to the
 * auth stack.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: async () => {
      await authRepo.deleteAccount();
      queryClient.clear();
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.householdId,
        STORAGE_KEYS.householdName,
        STORAGE_KEYS.householdCountry,
      ]);
      await AsyncStorage.removeItem(QUERY_PERSIST_KEY);
      await authRepo.signOut().catch(() => {
        // The user is gone server-side; signOut might 401. The local session
        // gets cleared by supabase-js regardless.
      });
    },
    onSuccess: () => {
      refresh();
    },
  });
}
