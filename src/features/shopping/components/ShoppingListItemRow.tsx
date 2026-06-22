import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatCurrency } from '@/shared/lib/format';
import { useTheme } from '@/shared/ui';
import type { CheapestPrice, ShoppingListItem } from '@/shared/types/domain';

interface Props {
  item: ShoppingListItem;
  onToggleCheck: () => void;
  onEdit: () => void;
  onDelete: () => void;
  cheapest?: CheapestPrice;
  onCompare?: () => void;
}

export function ShoppingListItemRow({
  item,
  onToggleCheck,
  onEdit,
  onDelete,
  cheapest,
  onCompare,
}: Props) {
  const { t } = useTranslation();
  const { colors, elevation } = useTheme();
  const styles = useMemo(() => makeStyles(colors, elevation), [colors, elevation]);
  return (
    <TouchableOpacity
      style={[styles.itemCard, item.checked && styles.itemChecked]}
      onLongPress={onEdit}
      activeOpacity={1}
    >
      <TouchableOpacity style={styles.checkbox} onPress={onToggleCheck}>
        <Text style={styles.checkboxText}>{item.checked ? '✓' : ''}</Text>
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
        {(item.product?.brand || item.product?.package_unit) && (
          <Text style={styles.itemMeta}>
            {[item.product.brand, item.product.package_unit].filter(Boolean).join(' · ')}
          </Text>
        )}
        <Text style={styles.itemMeta}>
          {item.unit_price != null
            ? t('shopping.qtyEach', { qty: item.quantity, price: formatCurrency(item.unit_price) })
            : t('shopping.qty', { qty: item.quantity })}
        </Text>
        {cheapest && (
          <TouchableOpacity style={styles.cheapestBadge} onPress={onCompare} activeOpacity={0.7}>
            <Ionicons name="pricetag" size={11} color={colors.primary.base} />
            <Text style={styles.cheapestText} numberOfLines={1}>
              {t('prices.cheapestAt', { store: cheapest.store })} · {formatCurrency(cheapest.price)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {item.unit_price != null && (
        <Text style={styles.itemTotal}>{formatCurrency(item.unit_price * item.quantity)}</Text>
      )}
      <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
        <Ionicons name="pencil-outline" size={16} color={colors.text.muted} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Ionicons name="close-outline" size={18} color={colors.border.strong} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  elevation: ReturnType<typeof useTheme>['elevation'],
) {
  return StyleSheet.create({
    itemCard: {
      backgroundColor: colors.bg.surface,
      marginHorizontal: 16,
      marginVertical: 5,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      ...elevation.card,
    },
    itemChecked: { opacity: 0.55 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.primary.base,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    checkboxText: { color: colors.primary.base, fontSize: 16, fontWeight: '700' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
    itemNameChecked: { textDecorationLine: 'line-through' },
    itemMeta: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
    cheapestBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: colors.primary.soft,
    },
    cheapestText: { fontSize: 11, fontWeight: '600', color: colors.primary.base },
    itemTotal: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.primary,
      marginRight: 8,
    },
    editBtn: { padding: 4 },
    deleteBtn: { padding: 4, marginLeft: 4 },
  });
}
