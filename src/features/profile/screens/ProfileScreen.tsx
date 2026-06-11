import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/app/providers/AppStateProvider';
import { env } from '@/config/env';
import { useDeleteAccount } from '@/features/auth/hooks/useDeleteAccount';
import { useSignOut } from '@/features/auth/hooks/useSignOut';
import { AccountSection } from '@/features/profile/components/AccountSection';
import { ActivitySection } from '@/features/profile/components/ActivitySection';
import { CountryPicker } from '@/features/profile/components/CountryPicker';
import { LanguagePicker } from '@/features/profile/components/LanguagePicker';
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
import { useLanguage } from '@/features/profile/hooks/useLanguage';
import { isAppError } from '@/shared/api/errors';
import { useTheme } from '@/shared/ui';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { householdId, refresh } = useAppState();
  const styles = useProfileStyles();
  const { colors } = useTheme();
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const { language, setLanguage } = useLanguage();

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
      onError: () => Alert.alert(t('profile.couldNotSave'), t('profile.couldNotSaveMessage')),
    });

  const onExportStock = () =>
    exportStock.mutate(undefined, {
      onError: () => Alert.alert(t('profile.exportFailed'), t('profile.exportStockFailed')),
    });

  const onExportHistory = () =>
    exportHistory.mutate(undefined, {
      onError: (err) => {
        if (isAppError(err) && err.code === 'not_found') {
          Alert.alert(t('profile.noHistory'), err.message);
          return;
        }
        Alert.alert(t('profile.exportFailed'), t('profile.exportHistoryFailed'));
      },
    });

  const onToggleNotifs = (value: boolean) =>
    toggleNotifs.mutate(value, {
      onSuccess: (granted) => {
        if (value && !granted) {
          Alert.alert(t('profile.permissionDenied'), t('profile.enableNotifications'));
        }
      },
    });

  const onCheckLowStock = () =>
    checkLowStock.mutate(undefined, {
      onSuccess: ({ low }) => {
        if (low.length === 0) Alert.alert(t('profile.allGood'), t('profile.noLowStock'));
      },
    });

  const onLogout = () =>
    Alert.alert(t('profile.logOutTitle'), t('profile.logOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logOutConfirm'),
        style: 'destructive',
        onPress: () => signOut.mutate(undefined, { onSuccess: () => refresh() }),
      },
    ]);

  const onLeaveHousehold = () =>
    Alert.alert(
      t('profile.leaveHouseholdTitle'),
      t('profile.leaveHouseholdMessage', { name: hh?.name ?? '' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.leaveConfirm'),
          style: 'destructive',
          onPress: () =>
            leaveHousehold.mutate(undefined, {
              onError: (err) => {
                const msg = isAppError(err) ? err.message : t('common.somethingWentWrong');
                Alert.alert(t('common.error'), msg);
              },
            }),
        },
      ],
    );

  const onDeleteAccount = () =>
    Alert.alert(t('profile.deleteAccountTitle'), t('profile.deleteAccountMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.deleteAccountConfirm'),
        style: 'destructive',
        onPress: () =>
          deleteAccount.mutate(undefined, {
            onError: (err) => {
              const msg = isAppError(err) ? err.message : t('common.somethingWentWrong');
              Alert.alert(t('profile.deleteAccountFailed'), msg);
            },
          }),
      },
    ]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <HouseholdSection household={hh} />

        <SpendingSection monthlyData={monthlySpending.data ?? []} />

        <PreferencesSection
          country={hh?.country}
          groupedView={hh?.grouped_view ?? false}
          language={language}
          onCountryPress={() => setCountryPickerVisible(true)}
          onLanguagePress={() => setLangPickerVisible(true)}
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
        <LanguagePicker
          visible={langPickerVisible}
          selectedCode={language}
          onSelect={(code) => {
            void setLanguage(code);
            setLangPickerVisible(false);
          }}
          onClose={() => setLangPickerVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
