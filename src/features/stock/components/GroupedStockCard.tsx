import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/ui';
import type { GroupedStockItem } from '@/shared/types/domain';

interface Props {
  group: GroupedStockItem;
  onAdjust: (delta: number) => void;
  onLongPress: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function GroupedStockCard({
  group,
  onAdjust,
  onLongPress,
  onCancelDelete,
  onDelete,
  isDeleting,
}: Props) {
  const { t } = useTranslation();
  const { colors, elevation } = useTheme();
  const styles = useMemo(() => makeStyles(colors, elevation), [colors, elevation]);

  return (
    <TouchableOpacity
      style={[styles.card, isDeleting && styles.cardDeleting]}
      onLongPress={onLongPress}
      onPress={isDeleting ? onCancelDelete : undefined}
      activeOpacity={0.8}
    >
      <View style={styles.info}>
        <Text style={[styles.name, isDeleting && styles.textDeleting]}>{group.name}</Text>
        {(group.package_unit || group.category) && (
          <Text style={[styles.meta, isDeleting && styles.textDeleting]}>
            {[group.package_unit, group.category].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>
      {!isDeleting && group.quantity <= group.low_stock_threshold && (
        <View style={styles.lowBadge}>
          <Text style={styles.lowBadgeText}>{t('stock.lowBadge')}</Text>
        </View>
      )}
      {isDeleting ? (
        <TouchableOpacity style={styles.trashBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.text.inverse} />
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyControls}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => onAdjust(-1)}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{group.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => onAdjust(1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
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
      ...elevation.card,
    },
    cardDeleting: {
      backgroundColor: colors.danger.soft,
      borderLeftWidth: 3,
      borderLeftColor: colors.danger.base,
    },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
    meta: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
    textDeleting: { color: colors.danger.base },
    lowBadge: {
      backgroundColor: colors.warning.soft,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginRight: 10,
    },
    lowBadgeText: { fontSize: 11, fontWeight: '700', color: colors.warning.text },
    trashBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.danger.base,
      alignItems: 'center',
      justifyContent: 'center',
    },
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
