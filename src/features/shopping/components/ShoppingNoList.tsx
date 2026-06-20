import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HistoryCard } from '@/features/shopping/components/HistoryCard';
import { ReceiptModal } from '@/features/shopping/components/ReceiptModal';
import type { HistoryRow } from '@/features/shopping/hooks/useShoppingHistory';
import { Button, useTheme } from '@/shared/ui';

interface Props {
  history: HistoryRow[];
  onStartList: () => void;
  isStarting: boolean;
}

type FlatItem =
  | { type: 'day-header'; label: string; key: string }
  | { type: 'grouped'; list: HistoryRow; label: string; key: string };

function buildFlatItems(history: HistoryRow[], listFallback: (n: number) => string): FlatItem[] {
  const byDay = new Map<string, HistoryRow[]>();
  for (const row of history) {
    const dk = row.completed_at?.slice(0, 10) ?? 'unknown';
    const bucket = byDay.get(dk) ?? [];
    bucket.push(row);
    byDay.set(dk, bucket);
  }

  const result: FlatItem[] = [];
  for (const [dk, lists] of byDay) {
    const dateLabel = lists[0].completed_at
      ? new Date(lists[0].completed_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : dk;
    result.push({ type: 'day-header', label: dateLabel, key: `header-${dk}` });
    lists.forEach((l, i) => {
      result.push({
        type: 'grouped',
        list: l,
        label: l.name ?? listFallback(i + 1),
        key: l.id,
      });
    });
  }
  return result;
}

export function ShoppingNoList({ history, onStartList, isStarting }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [viewingReceipt, setViewingReceipt] = useState<HistoryRow | null>(null);

  const flatItems = useMemo(
    () => buildFlatItems(history, (n) => t('shopping.listN', { n })),
    [history, t],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={flatItems}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={
          flatItems.length > 0 ? (
            <Text style={styles.historyTitle}>{t('shopping.pastLists')}</Text>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.type === 'day-header') {
            return <Text style={styles.dayHeader}>{item.label}</Text>;
          }
          return (
            <HistoryCard
              list={item.list}
              label={item.label}
              onPress={() => setViewingReceipt(item.list)}
            />
          );
        }}
      />
      <View style={styles.footer}>
        <Button
          label={isStarting ? t('shopping.starting') : t('shopping.startList')}
          onPress={onStartList}
          loading={isStarting}
          size="lg"
          fullWidth
        />
      </View>
      <ReceiptModal list={viewingReceipt} onClose={() => setViewingReceipt(null)} />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.default },
    footer: {
      padding: 16,
      paddingBottom: 12,
      backgroundColor: colors.bg.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    historyTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginHorizontal: 24,
      marginTop: 8,
      marginBottom: 8,
    },
    dayHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginHorizontal: 24,
      marginTop: 16,
      marginBottom: 4,
    },
  });
}
