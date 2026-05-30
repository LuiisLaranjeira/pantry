import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { env } from '@/config/env';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantry — production scaffold</Text>
      <Text style={styles.body}>
        Env validated. Supabase URL host:{' '}
        <Text style={styles.mono}>{new URL(env.EXPO_PUBLIC_SUPABASE_URL).host}</Text>
      </Text>
      <Text style={styles.body}>
        Next: rewire screens to use TanStack Query + repos (Phase 1 of MIGRATION_PLAN.md).
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2D6A4F' },
  body: { fontSize: 14, color: '#444', textAlign: 'center' },
  mono: { fontFamily: 'monospace', color: '#111' },
});
