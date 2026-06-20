import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useShoppingItems } from '@/features/shopping/hooks/useShoppingItems';
import { formatCurrency } from '@/shared/lib/format';
import { useTheme } from '@/shared/ui';

interface List {
  id: string;
  name?: string | null;
  completed_at: string | null;
  total_spent: number | null;
}

interface Props {
  list: List | null;
  onClose: () => void;
}

export function ReceiptModal({ list, onClose }: Props) {
  const { t } = useTranslation();
  const items = useShoppingItems(list?.id ?? null);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // A receipt reflects what was purchased, so only checked items belong here —
  // a checked item still appears even when no price was recorded for it.
  const receiptItems = useMemo(() => (items.data ?? []).filter((i) => i.checked), [items.data]);

  // Prefer the stored total; fall back to summing the purchased items that have
  // a price so a total still shows when total_spent was never stored.
  const displayTotal = useMemo(() => {
    if (list?.total_spent != null) return list.total_spent;
    const derived = receiptItems
      .filter((i) => i.unit_price != null)
      .reduce((sum, i) => sum + (i.unit_price ?? 0) * i.quantity, 0);
    return derived > 0 ? derived : null;
  }, [list, receiptItems]);

  return (
    <Modal
      visible={list !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{list?.name ?? t('shopping.receipt')}</Text>
            {list?.completed_at && (
              <Text style={styles.date}>
                {new Date(list.completed_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {items.isPending ? (
          <ActivityIndicator style={styles.loader} color={colors.primary.base} size="large" />
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            {receiptItems.map((item, index) => (
              <View key={item.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {(item.product?.brand || item.product?.package_unit) && (
                      <Text style={styles.meta}>
                        {[item.product.brand, item.product.package_unit]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    )}
                    <Text style={styles.meta}>
                      {item.unit_price != null
                        ? t('shopping.receiptQtyUnit', {
                            qty: item.quantity,
                            price: formatCurrency(item.unit_price),
                          })
                        : t('shopping.receiptQty', { qty: item.quantity })}
                    </Text>
                  </View>
                  {item.unit_price != null && (
                    <Text style={styles.itemTotal}>
                      {formatCurrency(item.unit_price * item.quantity)}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('shopping.receiptTotal')}</Text>
              <Text style={displayTotal != null ? styles.totalAmount : styles.totalAmountEmpty}>
                {displayTotal != null ? formatCurrency(displayTotal) : '—'}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.default },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 28,
      backgroundColor: colors.bg.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
    date: { fontSize: 12, color: colors.text.muted, marginTop: 4 },
    closeBtn: { padding: 6 },
    loader: { flex: 1 },
    body: { padding: 20 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    info: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
    meta: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
    itemTotal: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
    divider: { height: 1, backgroundColor: colors.border.subtle },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 20,
      marginTop: 8,
      borderTopWidth: 2,
      borderTopColor: colors.primary.base,
    },
    totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
    totalAmount: { fontSize: 20, fontWeight: '800', color: colors.primary.base },
    totalAmountEmpty: { fontSize: 20, fontWeight: '800', color: colors.text.muted },
  });
}
