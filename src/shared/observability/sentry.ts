import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';

import { env } from '@/config/env';

let initialized = false;

const SENSITIVE_KEYS = new Set([
  'email',
  'password',
  'access_token',
  'refresh_token',
  'session',
  'token',
  'authorization',
  'invite_code',
  'user_id',
  'household_id',
  'product_id',
  'stock_item_id',
  'list_id',
  'item_id',
]);

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function scrubString(value: string): string {
  return value.replace(EMAIL_RE, '[email]');
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[max-depth]';
  if (value == null) return value;
  if (typeof value === 'string') return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = '[redacted]';
      } else {
        out[k] = scrubValue(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: true,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    release: Application.nativeApplicationVersion ?? undefined,
    dist: Application.nativeBuildVersion ?? undefined,
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    beforeSend(event) {
      if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
      if (event.contexts) event.contexts = scrubValue(event.contexts) as typeof event.contexts;
      if (event.user?.email) event.user.email = '[redacted]';
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data) {
        breadcrumb.data = scrubValue(breadcrumb.data) as Record<string, unknown>;
      }
      if (breadcrumb.message) {
        breadcrumb.message = scrubString(breadcrumb.message);
      }
      return breadcrumb;
    },
  });
}

export const sentry = Sentry;
