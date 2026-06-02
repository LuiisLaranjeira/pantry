import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/shared/ui';

export function useProfileStyles() {
  const { colors, elevation } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        loader: { flex: 1 },
        container: { flex: 1, backgroundColor: colors.bg.default },
        content: { padding: 20, paddingBottom: 48 },
        section: { marginBottom: 28 },
        sectionTitle: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
          marginLeft: 4,
        },
        card: {
          backgroundColor: colors.bg.surface,
          borderRadius: 14,
          overflow: 'hidden',
          ...elevation.card,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        rowIcon: { marginRight: 14 },
        rowBody: { flex: 1 },
        rowLabel: { fontSize: 15, fontWeight: '500', color: colors.text.primary },
        rowSubLabel: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
        rowValue: { fontSize: 14, color: colors.text.secondary, marginTop: 2 },
        inviteCode: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.primary.base,
          letterSpacing: 2,
          marginTop: 2,
        },
        iconBtn: { padding: 6, marginLeft: 4 },
        divider: { height: 1, backgroundColor: colors.border.subtle, marginLeft: 50 },
        danger: { color: colors.danger.base },
        logQty: { fontSize: 15, fontWeight: '700', minWidth: 32, textAlign: 'right' },
      }),
    [colors, elevation],
  );
}
