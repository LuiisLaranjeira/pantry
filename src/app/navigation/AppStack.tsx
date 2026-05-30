import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useSignOut } from '@/features/auth/hooks/useSignOut';
import { isAppError } from '@/shared/api/errors';

import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

function MainPlaceholderScreen() {
  const signOut = useSignOut();
  const onSignOut = () =>
    signOut.mutate(undefined, {
      onError: (err) => {
        const message = isAppError(err) ? err.message : 'Something went wrong.';
        Alert.alert('Sign out failed', message);
      },
    });
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantry — signed in</Text>
      <Text style={styles.body}>
        Main app screens (Pantry, Shopping, Profile) are migrated in upcoming phases.
      </Text>
      <TouchableOpacity
        style={[styles.button, signOut.isPending && styles.buttonDisabled]}
        onPress={onSignOut}
        disabled={signOut.isPending}
      >
        <Text style={styles.buttonText}>{signOut.isPending ? 'Signing out…' : 'Sign out'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainPlaceholderScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FA',
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#2D6A4F' },
  body: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  button: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
