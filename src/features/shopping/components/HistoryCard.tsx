import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { HistoryRow } from '@/features/shopping/hooks/useShoppingHistory';
import { formatCurrency } from '@/shared/lib/format';
import { useTheme } from '@/shared/ui';

interface Props {
  list: HistoryRow;
  onPress: () => void;
  /** When provided, shown as the primary label instead of the date. Used in same-day groups. */
  label?: string;
}

export function HistoryCard({ list, onPress, label }: Props) {
  const { colors, elevation } = useTheme();
  const styles = useMemo(() => makeStyles(colors, elevation), [colors, elevation]);
  const dateLabel = list.completed_at
    ? new Date(list.completed_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.date}>{label ?? dateLabel}</Text>
      <View style={styles.right}>
        <Text style={list.total_spent != null ? styles.total : styles.totalEmpty}>
          {list.total_spent != null ? formatCurrency(list.total_spent) : '—'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  elevation: ReturnType<typeof useTheme>['elevation'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bg.surface,
      marginHorizontal: 20,
      marginVertical: 5,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...elevation.card,
    },
    date: { fontSize: 14, fontWeight: '500', color: colors.text.primary },
    right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    total: { fontSize: 14, fontWeight: '700', color: colors.primary.base },
    totalEmpty: { fontSize: 14, fontWeight: '700', color: colors.text.muted },
  });
}
