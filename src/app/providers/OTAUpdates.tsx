import * as Updates from 'expo-updates';
import { useEffect } from 'react';

import { logger } from '@/shared/lib/logger';

/**
 * Surfaces expo-updates lifecycle events through the logger so OTA
 * rollouts are observable in Sentry. The runtime is configured to
 * `checkAutomatically: "ON_LOAD"` in app.json, so it already fetches
 * available updates on cold start; this component just records the
 * outcome and tries to apply pending updates promptly.
 *
 * No-op in dev (Updates is not initialized) and on web.
 */
export function OTAUpdates() {
  const state = Updates.useUpdates();

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    if (state.isUpdateAvailable && !state.isDownloading) {
      logger.info('OTA update available', { updateId: state.availableUpdate?.updateId ?? null });
      Updates.fetchUpdateAsync().catch((err: unknown) => {
        logger.warn('OTA fetch failed', { reason: errorMessage(err) });
      });
    }
  }, [state.isUpdateAvailable, state.isDownloading, state.availableUpdate?.updateId]);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    if (state.isUpdatePending) {
      logger.info('OTA update ready; reloading');
      Updates.reloadAsync().catch((err: unknown) => {
        logger.warn('OTA reload failed', { reason: errorMessage(err) });
      });
    }
  }, [state.isUpdatePending]);

  useEffect(() => {
    if (state.downloadError) {
      logger.warn('OTA download error', { reason: state.downloadError.message });
    }
    if (state.checkError) {
      logger.warn('OTA check error', { reason: state.checkError.message });
    }
  }, [state.downloadError, state.checkError]);

  return null;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
