import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '@/app/navigation/types';
import { validateAuthForm } from '@/features/auth/lib/validation';
import { useSignInWithGoogle } from '@/features/auth/hooks/useSignInWithGoogle';
import { useSignUp } from '@/features/auth/hooks/useSignUp';
import { isAppError } from '@/shared/api/errors';
import { Button, TextField, useTheme } from '@/shared/ui';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const signUp = useSignUp();
  const signInWithGoogle = useSignInWithGoogle();
  const { colors, typography } = useTheme();

  const handleRegister = () => {
    const trimmed = email.trim();
    const { emailError: eErr, passwordError: pErr } = validateAuthForm(trimmed, password);
    if (eErr) setEmailError(eErr);
    if (pErr) setPasswordError(pErr);
    if (eErr || pErr) return;
    Keyboard.dismiss();
    signUp.mutate(
      { email: trimmed, password },
      {
        onSuccess: () => {
          Alert.alert(
            'Check your email',
            `We sent a confirmation link to ${trimmed}. Open it to activate your account, then sign in.`,
            [
              {
                text: 'Go to sign in',
                onPress: () => navigation.navigate('Login', { email: trimmed }),
              },
            ],
          );
        },
        onError: (err) => {
          const message = isAppError(err) ? err.message : 'Something went wrong. Try again.';
          Alert.alert('Registration failed', message);
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

  const isPending = signUp.isPending || signInWithGoogle.isPending;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg.default }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <Text
              style={[
                styles.title,
                { color: colors.text.primary, fontWeight: typography.weight.bold },
              ]}
            >
              Create account
            </Text>

            <TextField
              containerStyle={styles.field}
              placeholder="Email"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isPending}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={emailError}
            />
            <TextField
              containerStyle={styles.field}
              placeholder="Password (min 6 characters)"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordError(null);
              }}
              secureTextEntry={!showPassword}
              editable={!isPending}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              inputRef={passwordRef}
              error={passwordError}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
              }
            />

            <Button
              label={signUp.isPending ? 'Creating account…' : 'Register'}
              onPress={handleRegister}
              loading={signUp.isPending}
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
                isPending && styles.dimmed,
              ]}
              onPress={handleGoogleSignIn}
              disabled={isPending}
              activeOpacity={0.7}
            >
              {signInWithGoogle.isPending ? (
                <Text style={[styles.googleLabel, { color: colors.text.secondary }]}>
                  Signing in…
                </Text>
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <Text style={[styles.googleLabel, { color: colors.text.primary }]}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => navigation.navigate('Login')}
              disabled={isPending}
            >
              <Text style={[styles.linkText, { color: colors.primary.base }]}>
                Already have an account? Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, marginBottom: 32 },
  field: { marginBottom: 12 },
  button: { marginTop: 8 },
  eyeBtn: { paddingHorizontal: 12 },
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
  googleLabel: { fontSize: 15, fontWeight: '500' },
  dimmed: { opacity: 0.5 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 14 },
});
