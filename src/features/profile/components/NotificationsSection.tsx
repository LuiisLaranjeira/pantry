import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Switch, Text, TouchableOpacity, View } from 'react-native';

import { useProfileStyles } from '@/features/profile/components/styles';
import { useTheme } from '@/shared/ui';

interface Props {
  notificationsOn: boolean;
  isCheckingLowStock: boolean;
  onToggle: (value: boolean) => void;
  onCheckNow: () => void;
}

export function NotificationsSection({
  notificationsOn,
  isCheckingLowStock,
  onToggle,
  onCheckNow,
}: Props) {
  const styles = useProfileStyles();
  const { colors } = useTheme();
  return (
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
            onValueChange={onToggle}
            trackColor={{ false: colors.border.default, true: colors.primary.muted }}
            thumbColor={notificationsOn ? colors.primary.base : '#f4f3f4'}
          />
        </View>
        {notificationsOn && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={onCheckNow} disabled={isCheckingLowStock}>
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
              {isCheckingLowStock ? (
                <ActivityIndicator size="small" color={colors.text.muted} />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
