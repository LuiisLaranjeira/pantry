import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/shared/lib/format';
import { useTheme } from '@/shared/ui';

interface Props {
  checkedCount: number;
  runningTotal: number;
}

export function TotalBar({ checkedCount, runningTotal }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.bar}>
      <Text style={styles.label}>{checkedCount} checked</Text>
      <Text style={styles.amount}>{runningTotal > 0 ? formatCurrency(runningTotal) : '—'}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.primary.base,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    label: { color: colors.text.inverse, fontSize: 14, fontWeight: '600' },
    amount: { color: colors.text.inverse, fontSize: 18, fontWeight: '800' },
  });
}
