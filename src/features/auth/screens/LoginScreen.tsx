import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '@/app/navigation/types';
import { useSignIn } from '@/features/auth/hooks/useSignIn';
import { isAppError } from '@/shared/api/errors';
import { Button, TextField, useTheme } from '@/shared/ui';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signIn = useSignIn();
  const { colors, typography } = useTheme();

  const handleLogin = () => {
    if (!email || !password) return;
    signIn.mutate(
      { email, password },
      {
        onError: (err) => {
          const message = isAppError(err) ? err.message : 'Something went wrong. Try again.';
          Alert.alert('Login failed', message);
        },
      },
    );
  };

  const isPending = signIn.isPending;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg.default }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text
          style={[styles.title, { color: colors.primary.base, fontWeight: typography.weight.bold }]}
        >
          Pantry
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>Household stock manager</Text>

        <TextField
          containerStyle={styles.field}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isPending}
        />
        <TextField
          containerStyle={styles.field}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isPending}
        />

        <Button
          label="Sign in"
          onPress={handleLogin}
          loading={isPending}
          disabled={!email || !password}
          size="lg"
          fullWidth
          style={styles.button}
        />

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.linkText, { color: colors.primary.base }]}>
            No account? Register
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 36, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 40 },
  field: { marginBottom: 12 },
  button: { marginTop: 8 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14 },
});
