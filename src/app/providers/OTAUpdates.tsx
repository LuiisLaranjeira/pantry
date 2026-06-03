import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { logger } from '@/shared/lib/logger';

/**
 * Surfaces expo-updates lifecycle events through the logger so OTA
 * rollouts are observable in Sentry. The runtime is already configured
 * to `checkAutomatically: "ON_LOAD"` in app.config.ts; this component
 * records transitions and applies updates without disrupting the user
 * mid-session.
 *
 * Reload policy: when an update finishes downloading, we DO NOT reload
 * immediately. Reloading mid-session would discard any in-progress UI
 * state (forms, camera view, half-built shopping lists). Instead we
 * wait for the next time the app comes back to the foreground from
 * background. If the user never backgrounds the app, the update applies
 * on the next cold start anyway (expo-updates' default).
 *
 * No-op in dev (Updates is not initialized) and on web.
 */
export function OTAUpdates() {
  const state = Updates.useUpdates();
  const pendingReloadRef = useRef(false);

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
    if (!state.isUpdatePending) return;

    logger.info('OTA update ready; will apply on next foreground');
    pendingReloadRef.current = true;

    const onAppStateChange = (next: AppStateStatus) => {
      if (next !== 'active' || !pendingReloadRef.current) return;
      Updates.reloadAsync()
        .then(() => {
          pendingReloadRef.current = false;
        })
        .catch((err: unknown) => {
          // Leave the flag set so the next foreground transition
          // retries. The cold-start path also applies the update
          // whenever the user eventually relaunches the app.
          logger.warn('OTA reload failed', { reason: errorMessage(err) });
        });
    };

    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
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
