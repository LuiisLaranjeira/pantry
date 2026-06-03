import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * Module-level singleton for the React Query cache persister. Lives
 * outside QueryProvider so callers that need to actively eject the
 * persisted cache (sign-out, account deletion) can do so via
 * persister.removeClient() instead of poking AsyncStorage directly and
 * racing with the persister's throttled writes.
 */
export const QUERY_PERSIST_KEY = 'pantry-query-cache-v1';

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_PERSIST_KEY,
  throttleTime: 1000,
});

/**
 * Clears the in-memory cache AND the persisted cache. Use after
 * sign-out / account deletion so the next session doesn't rehydrate
 * the previous user's data.
 *
 * persister.removeClient() removes the on-disk entry directly. The
 * caller is responsible for queryClient.clear() to flush memory.
 */
export async function clearPersistedQueries(): Promise<void> {
  await queryPersister.removeClient();
}
