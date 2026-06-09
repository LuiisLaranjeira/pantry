import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView } from 'react-native';

import { useAppState } from '@/app/providers/AppStateProvider';
import { env } from '@/config/env';
import { useDeleteAccount } from '@/features/auth/hooks/useDeleteAccount';
import { useSignOut } from '@/features/auth/hooks/useSignOut';
import { AccountSection } from '@/features/profile/components/AccountSection';
import { ActivitySection } from '@/features/profile/components/ActivitySection';
import { CountryPicker } from '@/features/profile/components/CountryPicker';
import { ExportSection } from '@/features/profile/components/ExportSection';
import { HouseholdSection } from '@/features/profile/components/HouseholdSection';
import { LegalSection } from '@/features/profile/components/LegalSection';
import { NotificationsSection } from '@/features/profile/components/NotificationsSection';
import { PreferencesSection } from '@/features/profile/components/PreferencesSection';
import { SpendingSection } from '@/features/profile/components/SpendingSection';
import { useProfileStyles } from '@/features/profile/components/styles';
import { useCheckLowStockNow } from '@/features/profile/hooks/useCheckLowStockNow';
import { useExportHistory } from '@/features/profile/hooks/useExportHistory';
import { useExportStock } from '@/features/profile/hooks/useExportStock';
import { useLeaveHousehold } from '@/features/profile/hooks/useLeaveHousehold';
import { useMonthlySpending } from '@/features/profile/hooks/useMonthlySpending';
import { useNotificationsState } from '@/features/profile/hooks/useNotificationsState';
import { useRecentActivity } from '@/features/profile/hooks/useRecentActivity';
import { useToggleNotifications } from '@/features/profile/hooks/useToggleNotifications';
import { useUpdateHouseholdPrefs } from '@/features/profile/hooks/useUpdateHouseholdPrefs';
import { useUserEmail } from '@/features/profile/hooks/useUserEmail';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { isAppError } from '@/shared/api/errors';
import { useTheme } from '@/shared/ui';

export function ProfileScreen() {
  const { householdId, refresh } = useAppState();
  const styles = useProfileStyles();
  const { colors } = useTheme();
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

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
        onPress: () =>
          leaveHousehold.mutate(undefined, {
            onError: (err) => {
              const msg = isAppError(err) ? err.message : 'Could not leave household.';
              Alert.alert('Error', msg);
            },
          }),
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <HouseholdSection household={hh} />

      <SpendingSection monthlyData={monthlySpending.data ?? []} />

      <PreferencesSection
        country={hh?.country}
        groupedView={hh?.grouped_view ?? false}
        onCountryPress={() => setCountryPickerVisible(true)}
        onGroupedViewChange={(value) => onUpdatePrefs({ grouped_view: value })}
      />

      <ActivitySection log={recentActivity.data ?? []} />

      <ExportSection
        isExportingStock={exportStock.isPending}
        isExportingHistory={exportHistory.isPending}
        onExportStock={onExportStock}
        onExportHistory={onExportHistory}
      />

      <NotificationsSection
        notificationsOn={notificationsOn}
        isCheckingLowStock={checkLowStock.isPending}
        onToggle={onToggleNotifs}
        onCheckNow={onCheckLowStock}
      />

      <AccountSection
        email={userEmail.data}
        isDeletingAccount={deleteAccount.isPending}
        onLogout={onLogout}
        onLeaveHousehold={onLeaveHousehold}
        onDeleteAccount={onDeleteAccount}
      />

      <LegalSection
        privacyUrl={env.EXPO_PUBLIC_PRIVACY_POLICY_URL}
        termsUrl={env.EXPO_PUBLIC_TERMS_URL}
        onOpenUrl={(url) => Linking.openURL(url).catch(() => undefined)}
      />

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
