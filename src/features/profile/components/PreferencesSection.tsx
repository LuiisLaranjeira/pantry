import { Ionicons } from '@expo/vector-icons';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

import { COUNTRIES } from '@/features/profile/constants';
import { useProfileStyles } from '@/features/profile/components/styles';
import { useTheme } from '@/shared/ui';

interface Props {
  country: string | null | undefined;
  groupedView: boolean;
  onCountryPress: () => void;
  onGroupedViewChange: (value: boolean) => void;
}

export function PreferencesSection({
  country,
  groupedView,
  onCountryPress,
  onGroupedViewChange,
}: Props) {
  const styles = useProfileStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={onCountryPress}>
          <Ionicons
            name="globe-outline"
            size={20}
            color={colors.primary.base}
            style={styles.rowIcon}
          />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>Country</Text>
            <Text style={styles.rowValue}>
              {country ? (COUNTRIES.find((c) => c.code === country)?.name ?? country) : 'Not set'}
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
            value={groupedView}
            onValueChange={onGroupedViewChange}
            trackColor={{ false: colors.border.default, true: colors.primary.muted }}
            thumbColor={groupedView ? colors.primary.base : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
}
