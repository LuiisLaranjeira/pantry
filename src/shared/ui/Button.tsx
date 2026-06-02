import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/shared/ui/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  style,
  testID,
}: Props) {
  const { colors, radius, typography } = useTheme();
  const sizeStyle = sizeStyles[size];

  const variantStyles = (() => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: colors.primary.base, borderColor: colors.primary.base },
          text: { color: colors.text.inverse },
          spinner: colors.text.inverse,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.bg.surface,
            borderColor: colors.primary.base,
          },
          text: { color: colors.primary.base },
          spinner: colors.primary.base,
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.danger.base, borderColor: colors.danger.base },
          text: { color: colors.text.inverse },
          spinner: colors.text.inverse,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent', borderColor: 'transparent' },
          text: { color: colors.primary.base },
          spinner: colors.primary.base,
        };
    }
  })();

  const isInactive = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.85}
      testID={testID}
      style={[
        styles.base,
        sizeStyle.container,
        { borderRadius: radius.lg, borderWidth: variant === 'secondary' ? 1.5 : 0 },
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isInactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.spinner} size="small" />
      ) : (
        <View style={styles.row}>
          {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}
          <Text
            style={[sizeStyle.text, { fontWeight: typography.weight.semibold }, variantStyles.text]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconSlot: { justifyContent: 'center', alignItems: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  inactive: { opacity: 0.5 },
});

const sizeStyles = {
  sm: {
    container: { paddingHorizontal: 14, paddingVertical: 10 },
    text: { fontSize: 14 },
  },
  md: {
    container: { paddingHorizontal: 18, paddingVertical: 14 },
    text: { fontSize: 15 },
  },
  lg: {
    container: { paddingHorizontal: 24, paddingVertical: 16 },
    text: { fontSize: 16 },
  },
} as const;
