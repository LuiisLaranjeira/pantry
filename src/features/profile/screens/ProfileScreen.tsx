import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppState } from '@/app/providers/AppStateProvider';
import { env } from '@/config/env';
import { useDeleteAccount } from '@/features/auth/hooks/useDeleteAccount';
import { useSignOut } from '@/features/auth/hooks/useSignOut';
import { ActivitySection } from '@/features/profile/components/ActivitySection';
import { CountryPicker } from '@/features/profile/components/CountryPicker';
import { SpendingSection } from '@/features/profile/components/SpendingSection';
import { useProfileStyles } from '@/features/profile/components/styles';
import { COUNTRIES } from '@/features/profile/constants';
import { useCheckLowStockNow } from '@/features/profile/hooks/useCheckLowStockNow';
import { useExportHistory } from '@/features/profile/hooks/useExportHistory';
import { useExportStock } from '@/features/profile/hooks/useExportStock';
import { useLeaveHousehold } from '@/features/profile/hooks/useLeaveHousehold';
import { useMonthlySpending } from '@/features/profile/hooks/useMonthlySpending';
import { useNotificationsState } from '@/features/profile/hooks/useNotificationsState';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { useRecentActivity } from '@/features/profile/hooks/useRecentActivity';
import { useToggleNotifications } from '@/features/profile/hooks/useToggleNotifications';
import { useUpdateHouseholdPrefs } from '@/features/profile/hooks/useUpdateHouseholdPrefs';
import { useUserEmail } from '@/features/profile/hooks/useUserEmail';
import { isAppError } from '@/shared/api/errors';
import { useTheme } from '@/shared/ui';

export function ProfileScreen() {
  const { householdId, refresh } = useAppState();
  const styles = useProfileStyles();
  const { colors } = useTheme();
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const household = useHousehold(householdId);
  const userEmail = useUserEmail();
  const recentActivity = useRecentActivity(householdId);
  const monthlySpending = useMonthlySpending(householdId);
  const notificationsState = useNotificationsState();

  const updatePrefs = useUpdateHouseholdPrefs(householdId);
  const exportStock = useExportStock(householdId);
  const exportHistory = useExportHistory(householdId);
  const leaveHousehold = useLeaveHousehold(householdId);
  const checkLowStock = useCheckLowStockNow(householdId);
  const toggleNotifs = useToggleNotifications();
  const signOut = useSignOut();
  const deleteAccount = useDeleteAccount();

  const loading = household.isPending || userEmail.isPending || notificationsState.isPending;

  if (loading) {
    return <ActivityIndicator style={styles.loader} color={colors.primary.base} size="large" />;
  }

  const hh = household.data;
  const notificationsOn = notificationsState.data ?? false;

  const copyCode = async () => {
    if (!hh) return;
    await Clipboard.setStringAsync(hh.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareCode = async () => {
    if (!hh) return;
    await Share.share({
      message: `Join my pantry household "${hh.name}" on Pantry!\nInvite code: ${hh.invite_code}`,
    });
  };

  const onUpdatePrefs = (patch: { country?: string; grouped_view?: boolean }) =>
    updatePrefs.mutate(patch, {
      onError: () =>
        Alert.alert(
          'Could not save',
          'Household settings failed to save. Make sure the DB migration has been applied.',
        ),
    });

  const onExportStock = () =>
    exportStock.mutate(undefined, {
      onError: () => Alert.alert('Export failed', 'Could not export pantry data.'),
    });

  const onExportHistory = () =>
    exportHistory.mutate(undefined, {
      onError: (err) => {
        if (isAppError(err) && err.code === 'not_found') {
          Alert.alert('No history', err.message);
          return;
        }
        Alert.alert('Export failed', 'Could not export shopping history.');
      },
    });

  const onToggleNotifs = (value: boolean) =>
    toggleNotifs.mutate(value, {
      onSuccess: (granted) => {
        if (value && !granted) {
          Alert.alert('Permission denied', 'Enable notifications in your device settings.');
        }
      },
    });

  const onCheckLowStock = () =>
    checkLowStock.mutate(undefined, {
      onSuccess: ({ low }) => {
        if (low.length === 0) Alert.alert('All good!', 'No items are low on stock.');
      },
    });

  const onLogout = () =>
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => signOut.mutate(undefined, { onSuccess: () => refresh() }),
      },
    ]);

  const onLeaveHousehold = () =>
    Alert.alert('Leave household', `Leave "${hh?.name}"? You will need an invite code to rejoin.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => leaveHousehold.mutate(),
      },
    ]);

  const onDeleteAccount = () =>
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, your data, and any households where you are the only member. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () =>
            deleteAccount.mutate(undefined, {
              onError: (err) => {
                const msg = isAppError(err) ? err.message : 'Could not delete account.';
                Alert.alert('Delete failed', msg);
              },
            }),
        },
      ],
    );

  const openUrl = (url: string) => Linking.openURL(url).catch(() => undefined);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="home-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Name</Text>
              <Text style={styles.rowValue}>{hh?.name ?? '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons
              name="people-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Members</Text>
              <Text style={styles.rowValue}>{hh?.member_count ?? '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons
              name="key-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Invite code</Text>
              <Text style={styles.inviteCode}>{hh?.invite_code ?? '—'}</Text>
            </View>
            <TouchableOpacity onPress={copyCode} style={styles.iconBtn}>
              <Ionicons
                name={codeCopied ? 'checkmark' : 'copy-outline'}
                size={20}
                color={codeCopied ? colors.primary.base : colors.text.muted}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={shareCode} style={styles.iconBtn}>
              <Ionicons name="share-outline" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SpendingSection monthlyData={monthlySpending.data ?? []} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => setCountryPickerVisible(true)}>
            <Ionicons
              name="globe-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Country</Text>
              <Text style={styles.rowValue}>
                {hh?.country
                  ? (COUNTRIES.find((c) => c.code === hh.country)?.name ?? hh.country)
                  : 'Not set'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons
              name="layers-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Grouped pantry view</Text>
              <Text style={styles.rowSubLabel}>Group items by type, ignoring brand</Text>
            </View>
            <Switch
              value={hh?.grouped_view ?? false}
              onValueChange={(value) => onUpdatePrefs({ grouped_view: value })}
              trackColor={{ false: colors.border.default, true: colors.primary.muted }}
              thumbColor={hh?.grouped_view ? colors.primary.base : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <ActivitySection log={recentActivity.data ?? []} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={onExportStock}
            disabled={exportStock.isPending}
          >
            <Ionicons
              name="archive-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Pantry stock</Text>
              <Text style={styles.rowSubLabel}>Export current stock as CSV</Text>
            </View>
            {exportStock.isPending ? (
              <ActivityIndicator size="small" color={colors.text.muted} />
            ) : (
              <Ionicons name="download-outline" size={20} color={colors.text.muted} />
            )}
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={onExportHistory}
            disabled={exportHistory.isPending}
          >
            <Ionicons
              name="receipt-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Shopping history</Text>
              <Text style={styles.rowSubLabel}>Export all past lists as CSV</Text>
            </View>
            {exportHistory.isPending ? (
              <ActivityIndicator size="small" color={colors.text.muted} />
            ) : (
              <Ionicons name="download-outline" size={20} color={colors.text.muted} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Low stock alerts</Text>
              <Text style={styles.rowSubLabel}>Notify when an item hits its threshold</Text>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={onToggleNotifs}
              trackColor={{ false: colors.border.default, true: colors.primary.muted }}
              thumbColor={notificationsOn ? colors.primary.base : '#f4f3f4'}
            />
          </View>
          {notificationsOn && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.row}
                onPress={onCheckLowStock}
                disabled={checkLowStock.isPending}
              >
                <Ionicons
                  name="scan-outline"
                  size={20}
                  color={colors.primary.base}
                  style={styles.rowIcon}
                />
                <View style={styles.rowBody}>
                  <Text style={styles.rowLabel}>Check low stock now</Text>
                  <Text style={styles.rowSubLabel}>
                    Send a notification for any items already low
                  </Text>
                </View>
                {checkLowStock.isPending ? (
                  <ActivityIndicator size="small" color={colors.text.muted} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{userEmail.data ?? '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={onLogout}>
            <Ionicons
              name="log-out-outline"
              size={20}
              color={colors.danger.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.rowLabel, styles.danger]}>Log out</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={onLeaveHousehold}>
            <Ionicons
              name="exit-outline"
              size={20}
              color={colors.danger.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.rowLabel, styles.danger]}>Leave household</Text>
              <Text style={styles.rowSubLabel}>You&apos;ll need a new invite code to rejoin</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={onDeleteAccount}
            disabled={deleteAccount.isPending}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={colors.danger.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.rowLabel, styles.danger]}>Delete account</Text>
              <Text style={styles.rowSubLabel}>Permanently removes your account and data</Text>
            </View>
            {deleteAccount.isPending ? (
              <ActivityIndicator size="small" color={colors.danger.base} />
            ) : (
              <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {(env.EXPO_PUBLIC_PRIVACY_POLICY_URL || env.EXPO_PUBLIC_TERMS_URL) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            {env.EXPO_PUBLIC_PRIVACY_POLICY_URL && (
              <TouchableOpacity
                style={styles.row}
                onPress={() => openUrl(env.EXPO_PUBLIC_PRIVACY_POLICY_URL!)}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={colors.primary.base}
                  style={styles.rowIcon}
                />
                <View style={styles.rowBody}>
                  <Text style={styles.rowLabel}>Privacy policy</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            )}
            {env.EXPO_PUBLIC_PRIVACY_POLICY_URL && env.EXPO_PUBLIC_TERMS_URL && (
              <View style={styles.divider} />
            )}
            {env.EXPO_PUBLIC_TERMS_URL && (
              <TouchableOpacity
                style={styles.row}
                onPress={() => openUrl(env.EXPO_PUBLIC_TERMS_URL!)}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={colors.primary.base}
                  style={styles.rowIcon}
                />
                <View style={styles.rowBody}>
                  <Text style={styles.rowLabel}>Terms of service</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <CountryPicker
        visible={countryPickerVisible}
        selectedCode={hh?.country ?? null}
        onSelect={(code) => {
          onUpdatePrefs({ country: code });
          setCountryPickerVisible(false);
        }}
        onClose={() => setCountryPickerVisible(false)}
      />
    </ScrollView>
  );
}
