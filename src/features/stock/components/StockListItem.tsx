import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/ui';
import type { StockItem } from '@/shared/types/domain';

interface Props {
  item: StockItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onLongPress: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function StockListItem({
  item,
  onIncrease,
  onDecrease,
  onLongPress,
  onCancelDelete,
  onDelete,
  isDeleting,
}: Props) {
  const { t } = useTranslation();
  const { colors, elevation } = useTheme();
  const styles = useMemo(() => makeStyles(colors, elevation), [colors, elevation]);

  const isLow = item.quantity <= item.low_stock_threshold;
  const stockStatus = item.quantity === 0 ? 'out' : isLow ? 'low' : 'ok';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={onLongPress}
      onPress={isDeleting ? onCancelDelete : undefined}
      style={[
        styles.card,
        isLow && !isDeleting && styles.cardLow,
        isDeleting && styles.cardDeleting,
      ]}
    >
      <View style={styles.info}>
        <Text style={[styles.name, isDeleting && styles.textDeleting]} numberOfLines={1}>
          {item.product.name}
        </Text>
        {item.product.brand && (
          <Text style={[styles.meta, isDeleting && styles.textDeleting]}>{item.product.brand}</Text>
        )}
        {item.product.package_unit && (
          <Text style={[styles.meta, isDeleting && styles.textDeleting]}>
            {item.product.package_unit}
          </Text>
        )}
        {!isDeleting && stockStatus === 'low' && (
          <Text style={styles.lowBadge}>{t('stock.lowBadge')}</Text>
        )}
        {!isDeleting && stockStatus === 'out' && (
          <Text style={styles.outBadge}>{t('stock.outBadge')}</Text>
        )}
      </View>

      {isDeleting ? (
        <TouchableOpacity style={styles.trashBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.text.inverse} />
        </TouchableOpacity>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={onDecrease}>
            <Text style={styles.btnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{item.quantity}</Text>
          <TouchableOpacity style={styles.btn} onPress={onIncrease}>
            <Text style={styles.btnText}>+</Text>
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
      marginVertical: 6,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      ...elevation.card,
    },
    cardLow: { borderLeftWidth: 3, borderLeftColor: colors.warning.base },
    cardDeleting: {
      backgroundColor: colors.danger.soft,
      borderLeftWidth: 3,
      borderLeftColor: colors.danger.base,
    },
    textDeleting: { color: colors.danger.base },
    trashBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.danger.base,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1, marginRight: 12 },
    name: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
    meta: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
    lowBadge: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
      color: colors.warning.text,
      backgroundColor: colors.warning.soft,
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    outBadge: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
      color: colors.danger.text,
      backgroundColor: colors.danger.soft,
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    btn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: { fontSize: 18, color: colors.primary.base, fontWeight: '600', lineHeight: 22 },
    qty: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      minWidth: 24,
      textAlign: 'center',
    },
  });
}
