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

import { useCreateHousehold } from '@/features/household/hooks/useCreateHousehold';
import { useJoinHousehold } from '@/features/household/hooks/useJoinHousehold';
import { isAppError } from '@/shared/api/errors';
import { Button, TextField, useTheme } from '@/shared/ui';

type Mode = 'choose' | 'create' | 'join';

export function HouseholdScreen() {
  const [mode, setMode] = useState<Mode>('choose');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const { colors, typography } = useTheme();

  const createMutation = useCreateHousehold();
  const joinMutation = useJoinHousehold();

  const handleCreate = () => {
    const name = householdName.trim();
    if (!name) return;
    createMutation.mutate(
      { name },
      {
        onError: (err) => {
          const message = isAppError(err) ? err.message : 'Something went wrong. Try again.';
          Alert.alert('Could not create household', message);
        },
      },
    );
  };

  const handleJoin = () => {
    const code = inviteCode.trim().toLowerCase();
    if (!code) return;
    joinMutation.mutate(
      { inviteCode: code },
      {
        onError: (err) => {
          if (isAppError(err) && err.code === 'not_found') {
            Alert.alert('Not found', err.message);
            return;
          }
          const message = isAppError(err) ? err.message : 'Something went wrong. Try again.';
          Alert.alert('Could not join household', message);
        },
      },
    );
  };

  const isCreating = createMutation.isPending;
  const isJoining = joinMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg.default }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {mode === 'choose' && (
          <>
            <Text
              style={[
                styles.title,
                { color: colors.primary.base, fontWeight: typography.weight.bold },
              ]}
            >
              Set up your household
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.subtle }]}>
              Create a new household or join an existing one with an invite code.
            </Text>
            <Button
              label="Create household"
              onPress={() => setMode('create')}
              size="lg"
              fullWidth
              style={styles.button}
            />
            <Button
              label="Join with invite code"
              onPress={() => setMode('join')}
              variant="secondary"
              size="lg"
              fullWidth
              style={styles.button}
            />
          </>
        )}

        {mode === 'create' && (
          <>
            <Text
              style={[
                styles.title,
                { color: colors.primary.base, fontWeight: typography.weight.bold },
              ]}
            >
              Name your household
            </Text>
            <TextField
              containerStyle={styles.field}
              placeholder="e.g. The Smiths"
              value={householdName}
              onChangeText={setHouseholdName}
              editable={!isCreating}
            />
            <Button
              label="Create"
              onPress={handleCreate}
              loading={isCreating}
              disabled={!householdName.trim()}
              size="lg"
              fullWidth
              style={styles.button}
            />
            <TouchableOpacity style={styles.link} onPress={() => setMode('choose')}>
              <Text style={[styles.linkText, { color: colors.primary.base }]}>Back</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'join' && (
          <>
            <Text
              style={[
                styles.title,
                { color: colors.primary.base, fontWeight: typography.weight.bold },
              ]}
            >
              Enter invite code
            </Text>
            <TextField
              containerStyle={styles.field}
              placeholder="6-character code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              editable={!isJoining}
            />
            <Button
              label="Join"
              onPress={handleJoin}
              loading={isJoining}
              disabled={!inviteCode.trim()}
              size="lg"
              fullWidth
              style={styles.button}
            />
            <TouchableOpacity style={styles.link} onPress={() => setMode('choose')}>
              <Text style={[styles.linkText, { color: colors.primary.base }]}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 26, marginBottom: 12 },
  subtitle: { fontSize: 14, marginBottom: 32, lineHeight: 20 },
  field: { marginBottom: 12 },
  button: { marginBottom: 12 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14 },
});
