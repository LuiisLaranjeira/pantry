import * as Sentry from '@sentry/react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { Button, useTheme } from '@/shared/ui';

interface FallbackProps {
  error: unknown;
  resetError: () => void;
}

function Fallback({ error, resetError }: FallbackProps) {
  const { colors, typography } = useTheme();
  const message =
    error instanceof Error && error.message ? error.message : 'Something unexpected happened.';
  return (
    <View style={[styles.container, { backgroundColor: colors.bg.default }]}>
      <View style={styles.inner}>
        <Text
          style={[styles.title, { color: colors.text.primary, fontWeight: typography.weight.bold }]}
        >
          We hit a snag
        </Text>
        <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text>
        <Button label="Try again" onPress={resetError} size="lg" style={styles.button} />
      </View>
    </View>
  );
}

export function ErrorBoundary({ children }: PropsWithChildren) {
  return (
    <Sentry.ErrorBoundary fallback={(props) => <Fallback {...(props as FallbackProps)} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  inner: { width: '100%', maxWidth: 360, alignItems: 'stretch' },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  button: { alignSelf: 'stretch' },
});
