import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

import { useTheme } from '@/shared/ui/theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
}

export function TextField({
  label,
  error,
  containerStyle,
  inputStyle,
  editable = true,
  ...rest
}: Props) {
  const { colors, radius, typography } = useTheme();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: colors.text.secondary, fontWeight: typography.weight.semibold },
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        editable={editable}
        placeholderTextColor={colors.text.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.bg.surface,
            borderColor: error ? colors.danger.base : colors.border.default,
            borderRadius: radius.lg,
            color: colors.text.primary,
          },
          !editable && styles.disabled,
          inputStyle,
        ]}
        {...rest}
      />
      {error && <Text style={[styles.error, { color: colors.danger.base }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: { fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  disabled: { opacity: 0.6 },
  error: { fontSize: 12, marginTop: 4 },
});
