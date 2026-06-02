import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppState } from '@/app/providers/AppStateProvider';
import type { AppStackParamList, MainTabsParamList } from '@/app/navigation/types';
import { ReceiptModal } from '@/features/shopping/components/ReceiptModal';
import { ShoppingListItemRow } from '@/features/shopping/components/ShoppingListItemRow';
import { useActiveList } from '@/features/shopping/hooks/useActiveList';
import { useAddItemFromManual } from '@/features/shopping/hooks/useAddItemFromManual';
import { useConfirmPurchase } from '@/features/shopping/hooks/useConfirmPurchase';
import { useDeleteActiveList } from '@/features/shopping/hooks/useDeleteActiveList';
import { useDeleteShoppingItem } from '@/features/shopping/hooks/useDeleteShoppingItem';
import { useShoppingHistory, type HistoryRow } from '@/features/shopping/hooks/useShoppingHistory';
import { useShoppingItems } from '@/features/shopping/hooks/useShoppingItems';
import { useStartList } from '@/features/shopping/hooks/useStartList';
import { useToggleItemChecked } from '@/features/shopping/hooks/useToggleItemChecked';
import { useUpdateShoppingItem } from '@/features/shopping/hooks/useUpdateShoppingItem';
import { isAppError } from '@/shared/api/errors';
import { ProductConfirmSheet, type Destination } from '@/shared/components/ProductConfirmSheet';
import { formatCurrency } from '@/shared/lib/format';
import { Button, EmptyState, IconButton, useTheme } from '@/shared/ui';
import type { PartialProduct, ShoppingListItem } from '@/shared/types/domain';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Shopping'>,
  NativeStackScreenProps<AppStackParamList>
>;

const EMPTY_PRODUCT: PartialProduct = {
  barcode: '',
  name: '',
  brand: null,
  category: null,
  package_unit: null,
  unit_price: null,
  country: null,
};

export function ShoppingScreen({ navigation }: Props) {
  const { householdId } = useAppState();
  const { colors, elevation } = useTheme();
  const styles = useMemo(() => makeStyles(colors, elevation), [colors, elevation]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<HistoryRow | null>(null);

  const activeList = useActiveList(householdId);
  const history = useShoppingHistory(householdId);
  const items = useShoppingItems(activeList.data?.id ?? null);

  const startList = useStartList(householdId);
  const toggleChecked = useToggleItemChecked(activeList.data?.id ?? null);
  const deleteItem = useDeleteShoppingItem(activeList.data?.id ?? null);
  const updateItem = useUpdateShoppingItem(activeList.data?.id ?? null);
  const deleteList = useDeleteActiveList(householdId);
  const confirmPurchase = useConfirmPurchase(householdId);
  const addItem = useAddItemFromManual(householdId);

  useFocusEffect(
    useCallback(() => {
      activeList.refetch();
      history.refetch();
    }, [activeList, history]),
  );

  const itemList = useMemo(() => items.data ?? [], [items.data]);
  const checkedItems = useMemo(() => itemList.filter((i) => i.checked), [itemList]);
  const checkedCount = checkedItems.length;
  const runningTotal = useMemo(
    () =>
      checkedItems
        .filter((i) => i.unit_price != null)
        .reduce((sum, i) => sum + (i.unit_price ?? 0) * i.quantity, 0),
    [checkedItems],
  );

  const editProduct = useMemo<PartialProduct | null>(
    () =>
      editingItem
        ? {
            barcode: '',
            name: editingItem.name,
            brand: editingItem.product?.brand ?? null,
            category: null,
            package_unit: editingItem.product?.package_unit ?? null,
            unit_price: editingItem.unit_price,
            country: null,
          }
        : null,
    [editingItem],
  );

  const handleToggle = (item: ShoppingListItem) =>
    toggleChecked.mutate({ itemId: item.id, checked: !item.checked });

  const handleDelete = (item: ShoppingListItem) => deleteItem.mutate(item.id);

  const handleAdd = (
    product: PartialProduct,
    quantity: number,
    _destination: Destination,
    unitPrice: number | null,
  ) => {
    addItem.mutate(
      { product, quantity, unitPrice },
      {
        onSuccess: () => setShowAdd(false),
        onError: (err) => {
          const msg = isAppError(err) ? err.message : 'Could not add item.';
          Alert.alert('Could not add', msg);
        },
      },
    );
  };

  const handleSaveEdit = (
    product: PartialProduct,
    quantity: number,
    _destination: Destination,
    unitPrice: number | null,
  ) => {
    if (!editingItem) return;
    updateItem.mutate(
      {
        itemId: editingItem.id,
        patch: { name: product.name, quantity, unit_price: unitPrice },
      },
      { onSuccess: () => setEditingItem(null) },
    );
  };

  const handleConfirmPurchase = () => {
    if (!activeList.data || checkedCount === 0) {
      Alert.alert('No items checked', 'Check the items you actually bought.');
      return;
    }
    Alert.alert(
      'Confirm purchase',
      `${checkedCount} item${checkedCount > 1 ? 's' : ''}${
        runningTotal > 0 ? ` · ${formatCurrency(runningTotal)}` : ''
      }\n\nAdd checked items to pantry stock?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () =>
            confirmPurchase.mutate(
              {
                listId: activeList.data!.id,
                checkedItems,
                total: runningTotal,
              },
              {
                onError: () => Alert.alert('Could not confirm', 'Failed to complete the purchase.'),
              },
            ),
        },
      ],
    );
  };

  const handleDeleteList = () => {
    if (!activeList.data) return;
    Alert.alert('Delete list', 'Delete this shopping list and all its items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteList.mutate(activeList.data!.id),
      },
    ]);
  };

  const handleStartList = () => {
    startList.mutate(undefined, {
      onError: (err) => {
        const msg = isAppError(err) ? err.message : 'Could not start a shopping list.';
        Alert.alert('Error', msg);
      },
    });
  };

  if (activeList.isPending || history.isPending) {
    return <ActivityIndicator style={styles.loader} color={colors.primary.base} size="large" />;
  }

  if (!activeList.data) {
    return (
      <View style={styles.container}>
        <Button
          label={startList.isPending ? 'Starting…' : 'Start shopping list'}
          onPress={handleStartList}
          loading={startList.isPending}
          size="lg"
          style={styles.startBtn}
        />

        {(history.data?.length ?? 0) > 0 && (
          <>
            <Text style={styles.historyTitle}>Past lists</Text>
            <FlatList
              data={history.data ?? []}
              keyExtractor={(l) => l.id}
              renderItem={({ item: list }) => (
                <TouchableOpacity
                  style={styles.historyCard}
                  onPress={() => setViewingReceipt(list)}
                >
                  <Text style={styles.historyDate}>
                    {list.completed_at
                      ? new Date(list.completed_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </Text>
                  <View style={styles.historyRight}>
                    {list.total_spent != null && (
                      <Text style={styles.historyTotal}>{formatCurrency(list.total_spent)}</Text>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        <ReceiptModal list={viewingReceipt} onClose={() => setViewingReceipt(null)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <IconButton
          icon="trash-outline"
          size={20}
          color={colors.danger.text}
          accessibilityLabel="Delete list"
          onPress={handleDeleteList}
        />
        <Text style={styles.headerTitle}>Shopping</Text>
        <View style={styles.headerRightRow}>
          <IconButton
            icon="receipt-outline"
            size={22}
            color={colors.primary.base}
            accessibilityLabel="Scan receipt"
            onPress={() => navigation.navigate('ReceiptScan')}
          />
          <TouchableOpacity
            onPress={handleConfirmPurchase}
            disabled={checkedCount === 0 || confirmPurchase.isPending}
            accessibilityLabel="Confirm purchase"
            style={[
              styles.headerConfirmBtn,
              (checkedCount === 0 || confirmPurchase.isPending) && styles.disabled,
            ]}
          >
            {confirmPurchase.isPending ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={styles.headerConfirmText}>✓</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {checkedCount > 0 && (
        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>{checkedCount} checked</Text>
          <Text style={styles.totalAmount}>
            {runningTotal > 0 ? formatCurrency(runningTotal) : '—'}
          </Text>
        </View>
      )}

      <FlatList
        data={itemList}
        keyExtractor={(i) => i.id}
        contentContainerStyle={itemList.length === 0 ? styles.emptyContainer : undefined}
        renderItem={({ item }) => (
          <ShoppingListItemRow
            item={item}
            onToggleCheck={() => handleToggle(item)}
            onEdit={() => setEditingItem(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={<EmptyState title="List is empty" subtitle="Tap + to add items." />}
      />

      <View style={styles.bottomBar}>
        <Button
          label="+ Add item"
          onPress={() => setShowAdd(true)}
          fullWidth
          style={styles.bottomBtn}
        />
        <Button
          label="Scan"
          onPress={() => navigation.navigate('Scan', { defaultDestination: 'list' })}
          fullWidth
          style={styles.bottomBtn}
        />
      </View>

      <ProductConfirmSheet
        visible={showAdd}
        product={EMPTY_PRODUCT}
        fixedDestination="list"
        onConfirm={handleAdd}
        onCancel={() => setShowAdd(false)}
      />

      <ProductConfirmSheet
        visible={editingItem !== null}
        product={editProduct}
        fixedDestination="list"
        title="Edit item"
        defaultQuantity={editingItem?.quantity ?? 1}
        onConfirm={handleSaveEdit}
        onCancel={() => setEditingItem(null)}
      />
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  elevation: ReturnType<typeof useTheme>['elevation'],
) {
  return StyleSheet.create({
    loader: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.bg.default },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    headerTitle: {
      flex: 1,
      marginLeft: 8,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerConfirmBtn: {
      backgroundColor: colors.primary.base,
      borderRadius: 10,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerConfirmText: { color: colors.text.inverse, fontSize: 18, fontWeight: '700' },
    disabled: { opacity: 0.45 },
    totalBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.primary.base,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    totalLabel: { color: colors.text.inverse, fontSize: 14, fontWeight: '600' },
    totalAmount: { color: colors.text.inverse, fontSize: 18, fontWeight: '800' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bottomBar: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.bg.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    bottomBtn: { flex: 1 },
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
    historyCard: {
      backgroundColor: colors.bg.surface,
      marginHorizontal: 20,
      marginVertical: 5,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...elevation.card,
    },
    historyDate: { fontSize: 14, fontWeight: '500', color: colors.text.primary },
    historyRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    historyTotal: { fontSize: 14, fontWeight: '700', color: colors.primary.base },
  });
}
