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

export function ShoppingNoList({ history, onStartList, isStarting }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [viewingReceipt, setViewingReceipt] = useState<HistoryRow | null>(null);

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={
          history.length > 0 ? (
            <Text style={styles.historyTitle}>{t('shopping.pastLists')}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <HistoryCard list={item} onPress={() => setViewingReceipt(item)} />
        )}
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
  });
}
