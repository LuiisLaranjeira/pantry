import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { categoryLabel } from '@/shared/constants/categories';
import { useTheme } from '@/shared/ui';
import type { GroupedStockItem } from '@/shared/types/domain';

interface Props {
  group: GroupedStockItem;
  onAdjust: (delta: number) => void;
  onLongPress: () => void;
}

export function GroupedStockCard({ group, onAdjust, onLongPress }: Props) {
  const { t } = useTranslation();
  const { colors, elevation } = useTheme();
  const styles = useMemo(() => makeStyles(colors, elevation), [colors, elevation]);

  const isLow = group.quantity <= group.low_stock_threshold;

  return (
    <TouchableOpacity style={styles.card} onLongPress={onLongPress} activeOpacity={0.8}>
      {isLow && <View style={styles.lowAccent} />}
      <View style={styles.info}>
        <Text style={styles.name}>{group.name}</Text>
        {(group.package_unit || group.category) && (
          <Text style={styles.meta}>
            {[group.package_unit, group.category ? categoryLabel(group.category, t) : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        )}
      </View>
      {isLow && (
        <View style={styles.lowBadge}>
          <Text style={styles.lowBadgeText}>{t('stock.lowBadge')}</Text>
        </View>
      )}
      <View style={styles.qtyControls}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => onAdjust(-1)}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{group.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => onAdjust(1)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
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
      marginHorizontal: 16,
      marginVertical: 5,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      ...elevation.card,
    },
    lowAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: colors.warning.base,
    },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
    meta: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
    lowBadge: {
      backgroundColor: colors.warning.soft,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginRight: 10,
    },
    lowBadgeText: { fontSize: 11, fontWeight: '700', color: colors.warning.text },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qtyBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyBtnText: { fontSize: 20, color: colors.primary.base, fontWeight: '600', lineHeight: 24 },
    qtyValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      minWidth: 24,
      textAlign: 'center',
    },
  });
}
