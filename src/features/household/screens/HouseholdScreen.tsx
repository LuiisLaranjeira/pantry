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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useCreateHousehold } from '@/features/household/hooks/useCreateHousehold';
import { useJoinHousehold } from '@/features/household/hooks/useJoinHousehold';
import { isAppError } from '@/shared/api/errors';
import { Button, TextField, useTheme } from '@/shared/ui';

type Mode = 'choose' | 'create' | 'join';

export function HouseholdScreen() {
  const { t } = useTranslation();
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
          const message = isAppError(err) ? err.message : t('common.somethingWentWrong');
          Alert.alert(t('household.couldNotCreate'), message);
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
            Alert.alert(t('household.notFound'), err.message);
            return;
          }
          const message = isAppError(err) ? err.message : t('common.somethingWentWrong');
          Alert.alert(t('household.couldNotJoin'), message);
        },
      },
    );
  };

  const isCreating = createMutation.isPending;
  const isJoining = joinMutation.isPending;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg.default }}>
      <KeyboardAvoidingView
        style={styles.container}
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
                {t('household.setupTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.subtle }]}>
                {t('household.setupSubtitle')}
              </Text>
              <Button
                label={t('household.create')}
                onPress={() => setMode('create')}
                size="lg"
                fullWidth
                style={styles.button}
              />
              <Button
                label={t('household.joinWithCode')}
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
                {t('household.nameTitle')}
              </Text>
              <TextField
                containerStyle={styles.field}
                placeholder={t('household.namePlaceholder')}
                value={householdName}
                onChangeText={setHouseholdName}
                editable={!isCreating}
              />
              <Button
                label={t('household.createBtn')}
                onPress={handleCreate}
                loading={isCreating}
                disabled={!householdName.trim()}
                size="lg"
                fullWidth
                style={styles.button}
              />
              <TouchableOpacity style={styles.link} onPress={() => setMode('choose')}>
                <Text style={[styles.linkText, { color: colors.primary.base }]}>
                  {t('common.back')}
                </Text>
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
                {t('household.joinTitle')}
              </Text>
              <TextField
                containerStyle={styles.field}
                placeholder={t('household.codePlaceholder')}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="none"
                editable={!isJoining}
              />
              <Button
                label={t('household.joinBtn')}
                onPress={handleJoin}
                loading={isJoining}
                disabled={!inviteCode.trim()}
                size="lg"
                fullWidth
                style={styles.button}
              />
              <TouchableOpacity style={styles.link} onPress={() => setMode('choose')}>
                <Text style={[styles.linkText, { color: colors.primary.base }]}>
                  {t('common.back')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
