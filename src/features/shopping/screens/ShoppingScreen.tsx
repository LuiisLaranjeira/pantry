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
    return <ActivityIndicator style={styles.loader} color="#2D6A4F" size="large" />;
  }

  if (!activeList.data) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.startBtn, startList.isPending && styles.disabled]}
          onPress={handleStartList}
          disabled={startList.isPending}
        >
          <Text style={styles.startBtnText}>
            {startList.isPending ? 'Starting…' : 'Start shopping list'}
          </Text>
        </TouchableOpacity>

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
                    <Ionicons name="chevron-forward" size={16} color="#CCC" />
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
        <TouchableOpacity onPress={handleDeleteList} style={styles.headerSideBtn}>
          <Ionicons name="trash-outline" size={20} color="#C0392B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping</Text>
        <View style={styles.headerRightRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ReceiptScan')}
            style={styles.headerSideBtn}
          >
            <Ionicons name="receipt-outline" size={22} color="#2D6A4F" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirmPurchase}
            disabled={checkedCount === 0 || confirmPurchase.isPending}
            style={[
              styles.headerConfirmBtn,
              (checkedCount === 0 || confirmPurchase.isPending) && styles.disabled,
            ]}
          >
            {confirmPurchase.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
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
        ListEmptyComponent={
          <View>
            <Text style={styles.emptyTitle}>List is empty</Text>
            <Text style={styles.emptySubtitle}>Tap + to add items.</Text>
          </View>
        }
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.listBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.listBtnText}>+ Add item</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listBtn}
          onPress={() => navigation.navigate('Scan', { defaultDestination: 'list' })}
        >
          <Text style={styles.listBtnText}>Scan</Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  loader: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerSideBtn: { padding: 6 },
  headerTitle: { flex: 1, marginLeft: 8, fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerConfirmBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerConfirmText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  totalLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  totalAmount: { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#444', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 6 },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  listBtn: {
    flex: 1,
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  listBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  startBtn: {
    margin: 20,
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  historyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  historyDate: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyTotal: { fontSize: 14, fontWeight: '700', color: '#2D6A4F' },
});
