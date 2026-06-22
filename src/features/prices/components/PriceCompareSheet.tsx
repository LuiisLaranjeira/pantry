import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePriceComparison } from '@/features/prices/hooks/usePriceComparison';
import { formatCurrency } from '@/shared/lib/format';
import { timeAgo } from '@/shared/lib/time';
import { EmptyState, Sheet, useTheme } from '@/shared/ui';

interface Props {
  productId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function PriceCompareSheet({ productId, visible, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const prices = usePriceComparison(visible ? productId : null);

  const rows = prices.data ?? [];

  return (
    <Sheet visible={visible} onRequestClose={onClose} title={t('prices.comparison')}>
      {prices.isPending ? (
        <ActivityIndicator style={styles.loader} color={colors.primary.base} size="large" />
      ) : rows.length === 0 ? (
        <EmptyState icon="pricetags-outline" title={t('prices.empty')} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {rows.map((row, index) => {
            const cheapest = index === 0;
            return (
              <View key={row.id} style={[styles.row, cheapest && styles.rowCheapest]}>
                <View style={styles.info}>
                  <Text style={styles.storeName}>{row.store?.name ?? row.store_id}</Text>
                  <Text style={styles.meta}>
                    {t('prices.updated', { time: timeAgo(row.scraped_at) })}
                  </Text>
                  {row.url && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(row.url!).catch(() => undefined)}
                    >
                      <Text style={styles.link}>{t('prices.viewProduct')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {cheapest && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary.base}
                    style={styles.cheapestIcon}
                  />
                )}
                <Text style={[styles.price, cheapest && styles.priceCheapest]}>
                  {formatCurrency(row.price)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Sheet>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    loader: { paddingVertical: 32 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: colors.bg.default,
    },
    rowCheapest: { backgroundColor: colors.primary.soft },
    info: { flex: 1 },
    storeName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
    meta: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
    link: { fontSize: 13, color: colors.primary.base, marginTop: 4, fontWeight: '600' },
    cheapestIcon: { marginRight: 8 },
    price: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
    priceCheapest: { color: colors.primary.base },
  });
}
