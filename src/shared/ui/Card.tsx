import { StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/shared/ui/theme';

interface Props extends PropsWithChildren {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  raised?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, padding = 'none', raised = false, style }: Props) {
  const { colors, radius, elevation, spacing } = useTheme();
  const padValue =
    padding === 'none' ? 0 : spacing[padding === 'sm' ? 'sm' : padding === 'lg' ? 'lg' : 'md'];
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.bg.surface,
          borderRadius: radius.xxl,
          padding: padValue,
        },
        raised ? elevation.raised : elevation.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
