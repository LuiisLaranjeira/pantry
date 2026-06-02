import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/shared/ui/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface Props {
  title: string;
  subtitle?: string;
  icon?: IoniconsName;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ title, subtitle, icon, style }: Props) {
  const { colors, typography } = useTheme();
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <View style={styles.iconSlot}>
          <Ionicons name={icon} size={40} color={colors.text.muted} />
        </View>
      )}
      <Text
        style={[
          styles.title,
          { color: colors.text.secondary, fontWeight: typography.weight.semibold },
        ]}
      >
        {title}
      </Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.text.muted }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  iconSlot: { marginBottom: 6 },
  title: { fontSize: 18, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 2 },
});
