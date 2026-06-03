import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as Application from 'expo-application';
import { useMemo, type PropsWithChildren } from 'react';

import { isAppError } from '@/shared/api/errors';

import { queryPersister } from './queryPersister';

export { QUERY_PERSIST_KEY, clearPersistedQueries } from './queryPersister';

const MAX_QUERY_RETRIES = 3;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Don't retry user-recoverable failures (auth, not_found, conflict, forbidden,
 * validation). Retry transient ones (network, unknown) with capped attempts.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  if (isAppError(error)) {
    switch (error.code) {
      case 'auth':
      case 'not_found':
      case 'conflict':
      case 'forbidden':
      case 'validation':
        return false;
      case 'network':
      case 'unknown':
        return true;
    }
  }
  // Non-AppError thrown values (rare; usually a programming bug). Retry once.
  return failureCount < 1;
}

function retryDelay(attempt: number): number {
  // 500ms, 1.5s, 4.5s. Capped at 10s.
  return Math.min(500 * 3 ** attempt, 10_000);
}

export function QueryProvider({ children }: PropsWithChildren) {
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: ONE_DAY_MS,
            retry: shouldRetry,
            retryDelay,
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Mutations are user-initiated; don't auto-retry. Callers can
            // explicitly retry from onError.
            retry: 0,
          },
        },
      }),
    [],
  );

  // Bust the persisted cache when the app version changes so a release
  // that reshapes a query payload doesn't surface stale data.
  const buster = Application.nativeApplicationVersion ?? 'dev';

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: queryPersister,
        maxAge: ONE_DAY_MS,
        buster,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
