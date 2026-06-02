import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { useTheme } from '@/shared/ui/theme';

interface Props extends PropsWithChildren {
  visible: boolean;
  onRequestClose: () => void;
  title?: string;
  /** Max height as a percentage string (e.g. "85%") or absolute number. */
  maxHeight?: number | `${number}%`;
  withKeyboardAvoidance?: boolean;
}

export function Sheet({
  visible,
  onRequestClose,
  title,
  maxHeight = '85%',
  withKeyboardAvoidance = true,
  children,
}: Props) {
  const { colors, radius, typography } = useTheme();

  const sheetBody = (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.bg.surface,
          borderTopLeftRadius: radius.xl + 8,
          borderTopRightRadius: radius.xl + 8,
          maxHeight,
        },
      ]}
    >
      {title && (
        <Text
          style={[
            styles.heading,
            { color: colors.text.primary, fontWeight: typography.weight.bold },
          ]}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onRequestClose}>
      {withKeyboardAvoidance ? (
        <KeyboardAvoidingView
          style={[styles.overlay, { backgroundColor: colors.overlay.modal }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {sheetBody}
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.overlay, { backgroundColor: colors.overlay.modal }]}>{sheetBody}</View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 24, paddingBottom: 36 },
  heading: { fontSize: 20, marginBottom: 16 },
});
