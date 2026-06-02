import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/shared/ui/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface Props {
  icon: IoniconsName;
  onPress: () => void;
  size?: number;
  color?: string;
  accessibilityLabel: string;
  disabled?: boolean;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  size = 22,
  color,
  accessibilityLabel,
  disabled = false,
  hitSlop = 8,
  style,
}: Props) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.text.muted;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
      style={[styles.base, disabled && styles.inactive, style]}
    >
      <Ionicons name={icon} size={size} color={resolvedColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { padding: 6, alignItems: 'center', justifyContent: 'center' },
  inactive: { opacity: 0.45 },
});
