import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCreateHousehold } from '@/features/household/hooks/useCreateHousehold';
import { useJoinHousehold } from '@/features/household/hooks/useJoinHousehold';
import { isAppError } from '@/shared/api/errors';

type Mode = 'choose' | 'create' | 'join';

export function HouseholdScreen() {
  const [mode, setMode] = useState<Mode>('choose');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {mode === 'choose' && (
          <>
            <Text style={styles.title}>Set up your household</Text>
            <Text style={styles.subtitle}>
              Create a new household or join an existing one with an invite code.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => setMode('create')}>
              <Text style={styles.buttonText}>Create household</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => setMode('join')}>
              <Text style={styles.buttonSecondaryText}>Join with invite code</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'create' && (
          <>
            <Text style={styles.title}>Name your household</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. The Smiths"
              value={householdName}
              onChangeText={setHouseholdName}
              placeholderTextColor="#999"
              editable={!isCreating}
            />
            <TouchableOpacity
              style={[styles.button, isCreating && styles.disabled]}
              onPress={handleCreate}
              disabled={isCreating}
            >
              <Text style={styles.buttonText}>{isCreating ? 'Creating…' : 'Create'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.link} onPress={() => setMode('choose')}>
              <Text style={styles.linkText}>Back</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'join' && (
          <>
            <Text style={styles.title}>Enter invite code</Text>
            <TextInput
              style={styles.input}
              placeholder="6-character code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              placeholderTextColor="#999"
              editable={!isJoining}
            />
            <TouchableOpacity
              style={[styles.button, isJoining && styles.disabled]}
              onPress={handleJoin}
              disabled={isJoining}
            >
              <Text style={styles.buttonText}>{isJoining ? 'Joining…' : 'Join'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.link} onPress={() => setMode('choose')}>
              <Text style={styles.linkText}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#2D6A4F', marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32, lineHeight: 20 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: '#111',
  },
  button: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonSecondary: {
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonSecondaryText: { color: '#2D6A4F', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#2D6A4F', fontSize: 14 },
});
