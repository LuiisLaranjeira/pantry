import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppState } from '@/app/providers/AppStateProvider';
import type { AppStackParamList, MainTabsParamList } from '@/app/navigation/types';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { useAddItemFromManual } from '@/features/shopping/hooks/useAddItemFromManual';
import {
  useAddLowStockToList,
  type LowStockCandidate,
} from '@/features/shopping/hooks/useAddLowStockToList';
import { StockListItem } from '@/features/stock/components/StockListItem';
import { deriveGroupedItems, pickHighestQtyMember } from '@/features/stock/domain/grouping';
import { useAddStockFromManual } from '@/features/stock/hooks/useAddStockFromManual';
import { useAdjustStockQuantity } from '@/features/stock/hooks/useAdjustStockQuantity';
import { useDeleteStockGroup } from '@/features/stock/hooks/useDeleteStockGroup';
import { useDeleteStockItem } from '@/features/stock/hooks/useDeleteStockItem';
import { useStockList } from '@/features/stock/hooks/useStockList';
import { ProductConfirmSheet, type Destination } from '@/shared/components/ProductConfirmSheet';
import { isAppError } from '@/shared/api/errors';
import type { GroupedStockItem, PartialProduct, StockItem } from '@/shared/types/domain';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Pantry'>,
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

export function StockScreen({ navigation, route }: Props) {
  const { householdId } = useAppState();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const stockList = useStockList(householdId);
  const household = useHousehold(householdId);

  const adjustQty = useAdjustStockQuantity(householdId);
  const deleteItem = useDeleteStockItem(householdId);
  const deleteGroup = useDeleteStockGroup(householdId);
  const addStockManual = useAddStockFromManual(householdId);
  const addListManual = useAddItemFromManual(householdId);
  const addLowToList = useAddLowStockToList(householdId);

  const items = useMemo(() => stockList.data ?? [], [stockList.data]);
  const groupedView = household.data?.grouped_view ?? false;
  const loading = stockList.isPending || household.isPending;

  const groupedItems = useMemo(() => deriveGroupedItems(items), [items]);
  const lowStockItems = useMemo(
    () => items.filter((i) => i.quantity <= i.low_stock_threshold),
    [items],
  );
  const lowGroups = useMemo(
    () => groupedItems.filter((g) => g.quantity <= g.low_stock_threshold),
    [groupedItems],
  );
  const activeLowCount = groupedView ? lowGroups.length : lowStockItems.length;

  useFocusEffect(
    useCallback(() => {
      setBannerDismissed(false);
      stockList.refetch();
    }, [stockList]),
  );

  useEffect(() => {
    const q = route.params?.searchQuery;
    if (q !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- consume nav param then clear it; both are external state, not a render-derivable value
      setSearch(q);
      navigation.setParams({ searchQuery: undefined });
    }
  }, [route.params?.searchQuery, navigation]);

  const onAdjustItem = (item: StockItem, delta: number) => adjustQty.mutate({ item, delta });

  const onAdjustGroup = (group: GroupedStockItem, delta: number) => {
    const ref = pickHighestQtyMember(group.members);
    adjustQty.mutate({ item: ref, delta });
  };

  const onDeleteItem = (item: StockItem) => {
    Alert.alert('Remove from pantry', `Remove "${item.product.name}" from your pantry?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => setDeletingId(null) },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setDeletingId(null);
          deleteItem.mutate(item.id);
        },
      },
    ]);
  };

  const onDeleteGroup = (group: GroupedStockItem) => {
    Alert.alert('Remove from pantry', `Remove all "${group.name}" from your pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteGroup.mutate(group.members.map((m) => m.id)),
      },
    ]);
  };

  const onAddLowStockToList = () => {
    const candidates: LowStockCandidate[] = groupedView
      ? lowGroups.map((g) => {
          const ref = pickHighestQtyMember(g.members);
          return {
            product_id: ref.product.id,
            name: g.name,
            unit_price: ref.product.unit_price ?? null,
          };
        })
      : lowStockItems.map((i) => ({
          product_id: i.product.id,
          name: i.product.name,
          unit_price: i.product.unit_price ?? null,
        }));

    addLowToList.mutate(
      { candidates, dedupBy: groupedView ? 'name' : 'product_id' },
      {
        onSuccess: () => {
          setBannerDismissed(true);
          navigation.jumpTo('Shopping');
        },
        onError: () =>
          Alert.alert('Could not add', 'Failed to add low stock items to the shopping list.'),
      },
    );
  };

  const onManualConfirm = (
    product: PartialProduct,
    quantity: number,
    destination: Destination,
    unitPrice: number | null,
  ) => {
    if (destination === 'list') {
      addListManual.mutate(
        { product, quantity, unitPrice },
        {
          onSuccess: () => {
            setShowManual(false);
            navigation.jumpTo('Shopping');
          },
          onError: (err) => {
            const msg = isAppError(err) ? err.message : 'Could not add to shopping list.';
            Alert.alert('Could not add', msg);
          },
        },
      );
      return;
    }
    addStockManual.mutate(
      { product, quantity, unitPrice },
      {
        onSuccess: () => setShowManual(false),
        onError: (err) => {
          const msg = isAppError(err) ? err.message : 'Could not add to pantry.';
          Alert.alert('Could not add', msg);
        },
      },
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} color="#2D6A4F" size="large" />;
  }

  const query = search.trim().toLowerCase();
  const filtered = query
    ? items.filter(
        (i) =>
          i.product.name.toLowerCase().includes(query) ||
          (i.product.brand ?? '').toLowerCase().includes(query),
      )
    : items;
  const filteredGrouped = query
    ? groupedItems.filter(
        (g) =>
          g.name.toLowerCase().includes(query) || (g.category ?? '').toLowerCase().includes(query),
      )
    : groupedItems;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search pantry…"
          placeholderTextColor="#999"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.barcodeBtn}
          onPress={() => navigation.navigate('Scan', { returnSearch: true })}
        >
          <Ionicons name="barcode-outline" size={26} color="#2D6A4F" />
        </TouchableOpacity>
      </View>
      {activeLowCount > 0 && !bannerDismissed && (
        <TouchableOpacity
          style={styles.banner}
          onPress={onAddLowStockToList}
          disabled={addLowToList.isPending}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.bannerText}>
            {activeLowCount} item{activeLowCount > 1 ? 's' : ''} low — add to shopping list
          </Text>
          {addLowToList.isPending ? (
            <ActivityIndicator size="small" color="#fff" style={styles.bannerTrailing} />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(255,255,255,0.7)"
              style={styles.bannerTrailing}
            />
          )}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setBannerDismissed(true);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.bannerClose}
          >
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {groupedView ? (
        <FlatList
          data={filteredGrouped}
          keyExtractor={(g) => g.key}
          contentContainerStyle={filteredGrouped.length === 0 ? styles.emptyContainer : undefined}
          renderItem={({ item: group }) => (
            <TouchableOpacity
              style={styles.groupCard}
              onLongPress={() => onDeleteGroup(group)}
              activeOpacity={0.8}
            >
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                {(group.package_unit || group.category) && (
                  <Text style={styles.groupMeta}>
                    {[group.package_unit, group.category].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              {group.quantity <= group.low_stock_threshold && (
                <View style={styles.lowBadge}>
                  <Text style={styles.lowBadgeText}>Low</Text>
                </View>
              )}
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => onAdjustGroup(group, -1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{group.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => onAdjustGroup(group, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View>
              <Text style={styles.emptyTitle}>{query ? 'No results' : 'Pantry is empty'}</Text>
              <Text style={styles.emptySubtitle}>
                {query ? `Nothing matches "${search}".` : 'Scan a barcode or add manually.'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
          renderItem={({ item }) => (
            <StockListItem
              item={item}
              onIncrease={() => onAdjustItem(item, 1)}
              onDecrease={() => onAdjustItem(item, -1)}
              onLongPress={() => setDeletingId(item.id)}
              onCancelDelete={() => setDeletingId(null)}
              onDelete={() => onDeleteItem(item)}
              isDeleting={deletingId === item.id}
            />
          )}
          ListEmptyComponent={
            <View>
              <Text style={styles.emptyTitle}>{query ? 'No results' : 'Pantry is empty'}</Text>
              <Text style={styles.emptySubtitle}>
                {query ? `Nothing matches "${search}".` : 'Scan a barcode or add manually.'}
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.fabRow}>
        <TouchableOpacity style={styles.fabSecondary} onPress={() => setShowManual(true)}>
          <Text style={styles.fabSecondaryText}>+ Manual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Scan')}>
          <Text style={styles.fabText}>Scan</Text>
        </TouchableOpacity>
      </View>

      <ProductConfirmSheet
        visible={showManual}
        product={EMPTY_PRODUCT}
        onConfirm={onManualConfirm}
        onCancel={() => setShowManual(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  searchBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    color: '#111',
  },
  barcodeBtn: { padding: 4 },
  loader: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#444', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 6 },
  fabRow: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: '#2D6A4F',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  fabSecondary: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fabSecondaryText: { color: '#2D6A4F', fontSize: 15, fontWeight: '700' },
  banner: {
    backgroundColor: '#2D6A4F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bannerText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  bannerTrailing: { marginLeft: 'auto' },
  bannerClose: { padding: 2, marginLeft: 8 },
  groupCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  groupMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  lowBadge: {
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  lowBadgeText: { fontSize: 11, fontWeight: '700', color: '#856404' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 20, color: '#2D6A4F', fontWeight: '600', lineHeight: 24 },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    minWidth: 24,
    textAlign: 'center',
  },
});
