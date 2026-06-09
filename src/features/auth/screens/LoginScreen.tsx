import { Ionicons } from '@expo/vector-icons';
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
import { useSignInWithGoogle } from '@/features/auth/hooks/useSignInWithGoogle';
import { isAppError } from '@/shared/api/errors';
import { Button, TextField, useTheme } from '@/shared/ui';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const signIn = useSignIn();
  const signInWithGoogle = useSignInWithGoogle();
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

  const handleGoogleSignIn = () => {
    signInWithGoogle.mutate(undefined, {
      onError: (err) => {
        const message = isAppError(err) ? err.message : 'Google sign-in failed. Try again.';
        Alert.alert('Google sign-in failed', message);
      },
    });
  };

  const isPending = signIn.isPending || signInWithGoogle.isPending;

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
          loading={signIn.isPending}
          disabled={!email || !password || isPending}
          size="lg"
          fullWidth
          style={styles.button}
        />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]} />
          <Text style={[styles.dividerText, { color: colors.text.muted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]} />
        </View>

        <TouchableOpacity
          style={[
            styles.googleButton,
            { borderColor: colors.border.default, backgroundColor: colors.bg.surface },
            isPending && styles.disabled,
          ]}
          onPress={handleGoogleSignIn}
          disabled={isPending}
          activeOpacity={0.7}
        >
          {signInWithGoogle.isPending ? (
            <Text style={[styles.googleLabel, { color: colors.text.secondary }]}>Signing in…</Text>
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#4285F4" style={styles.googleIcon} />
              <Text style={[styles.googleLabel, { color: colors.text.primary }]}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('Register')}
          disabled={isPending}
        >
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    gap: 10,
  },
  googleIcon: {},
  googleLabel: { fontSize: 15, fontWeight: '500' },
  disabled: { opacity: 0.5 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 14 },
});
