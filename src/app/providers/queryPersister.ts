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
 * Removes the persisted cache from AsyncStorage. The caller is
 * responsible for `queryClient.clear()` to flush the in-memory cache
 * — do both on sign-out / account deletion so the next session
 * doesn't rehydrate the previous user's data.
 *
 * Hits the persister directly (rather than `AsyncStorage.removeItem`)
 * so we don't race with the persister's throttled write of an
 * otherwise-empty cache.
 */
export async function clearPersistedQueries(): Promise<void> {
  await queryPersister.removeClient();
}
