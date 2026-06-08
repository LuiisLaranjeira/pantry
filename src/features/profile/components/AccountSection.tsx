import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { useProfileStyles } from '@/features/profile/components/styles';
import { useTheme } from '@/shared/ui';

interface Props {
  email: string | null | undefined;
  isDeletingAccount: boolean;
  onLogout: () => void;
  onLeaveHousehold: () => void;
  onDeleteAccount: () => void;
}

export function AccountSection({
  email,
  isDeletingAccount,
  onLogout,
  onLeaveHousehold,
  onDeleteAccount,
}: Props) {
  const styles = useProfileStyles();
  const { colors } = useTheme();
  return (
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
            <Text style={styles.rowValue}>{email ?? '—'}</Text>
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
        <TouchableOpacity style={styles.row} onPress={onDeleteAccount} disabled={isDeletingAccount}>
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
          {isDeletingAccount ? (
            <ActivityIndicator size="small" color={colors.danger.base} />
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
