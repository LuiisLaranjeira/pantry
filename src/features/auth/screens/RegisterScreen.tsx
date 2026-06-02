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
import { useSignUp } from '@/features/auth/hooks/useSignUp';
import { isAppError } from '@/shared/api/errors';
import { Button, TextField, useTheme } from '@/shared/ui';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signUp = useSignUp();
  const { colors, typography } = useTheme();

  const handleRegister = () => {
    if (!email || !password) return;
    signUp.mutate(
      { email, password },
      {
        onError: (err) => {
          const message = isAppError(err) ? err.message : 'Something went wrong. Try again.';
          Alert.alert('Registration failed', message);
        },
      },
    );
  };

  const isPending = signUp.isPending;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg.default }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text
          style={[styles.title, { color: colors.primary.base, fontWeight: typography.weight.bold }]}
        >
          Create account
        </Text>

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
          placeholder="Password (min 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isPending}
        />

        <Button
          label={isPending ? 'Creating account…' : 'Register'}
          onPress={handleRegister}
          loading={isPending}
          disabled={!email || !password}
          size="lg"
          fullWidth
          style={styles.button}
        />

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.linkText, { color: colors.primary.base }]}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, marginBottom: 32 },
  field: { marginBottom: 12 },
  button: { marginTop: 8 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14 },
});
