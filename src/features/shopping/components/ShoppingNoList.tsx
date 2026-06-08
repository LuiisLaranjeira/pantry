import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [viewingReceipt, setViewingReceipt] = useState<HistoryRow | null>(null);

  return (
    <View style={styles.container}>
      <Button
        label={isStarting ? 'Starting…' : 'Start shopping list'}
        onPress={onStartList}
        loading={isStarting}
        size="lg"
        style={styles.startBtn}
      />
      {history.length > 0 && (
        <>
          <Text style={styles.historyTitle}>Past lists</Text>
          <FlatList
            data={history}
            keyExtractor={(l) => l.id}
            renderItem={({ item }) => (
              <HistoryCard list={item} onPress={() => setViewingReceipt(item)} />
            )}
          />
        </>
      )}
      <ReceiptModal list={viewingReceipt} onClose={() => setViewingReceipt(null)} />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.default },
    startBtn: { margin: 20 },
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
