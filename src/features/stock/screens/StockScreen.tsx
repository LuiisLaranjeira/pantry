import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/app/providers/AppStateProvider';
import type { AppStackParamList, MainTabsParamList } from '@/app/navigation/types';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { PriceCompareSheet } from '@/features/prices/components/PriceCompareSheet';
import { useAddItemFromManual } from '@/features/shopping/hooks/useAddItemFromManual';
import {
  useAddLowStockToList,
  type LowStockCandidate,
} from '@/features/shopping/hooks/useAddLowStockToList';
import { GroupedStockCard } from '@/features/stock/components/GroupedStockCard';
import { LowStockBanner } from '@/features/stock/components/LowStockBanner';
import { StockItemEditSheet } from '@/features/stock/components/StockItemEditSheet';
import { StockListItem } from '@/features/stock/components/StockListItem';
import { StockSearchBar } from '@/features/stock/components/StockSearchBar';
import { deriveGroupedItems, pickHighestQtyMember } from '@/features/stock/domain/grouping';
import { useAddStockFromManual } from '@/features/stock/hooks/useAddStockFromManual';
import { useAdjustStockQuantity } from '@/features/stock/hooks/useAdjustStockQuantity';
import { useDeleteStockGroup } from '@/features/stock/hooks/useDeleteStockGroup';
import { useDeleteStockItem } from '@/features/stock/hooks/useDeleteStockItem';
import { useStockList } from '@/features/stock/hooks/useStockList';
import { useUpdateStockThreshold } from '@/features/stock/hooks/useUpdateStockThreshold';
import { isAppError } from '@/shared/api/errors';
import { ProductConfirmSheet, type Destination } from '@/shared/components/ProductConfirmSheet';
import { categoryLabel } from '@/shared/constants/categories';
import { Button, EmptyState, useTheme } from '@/shared/ui';
import { EMPTY_PRODUCT } from '@/shared/types/domain';
import type { GroupedStockItem, PartialProduct, StockItem } from '@/shared/types/domain';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Pantry'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function StockScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { householdId } = useAppState();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [editingGroup, setEditingGroup] = useState<GroupedStockItem | null>(null);
  const [comparingProductId, setComparingProductId] = useState<string | null>(null);
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
  const updateThreshold = useUpdateStockThreshold(householdId);

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

  useEffect(() => {
    navigation.setOptions({ tabBarBadge: activeLowCount > 0 ? activeLowCount : undefined });
  }, [activeLowCount, navigation]);

  const { isStale: isStockStale, refetch: refetchStock } = stockList;
  const { isStale: isHouseholdStale, refetch: refetchHousehold } = household;
  useFocusEffect(
    useCallback(() => {
      setBannerDismissed(false);
      if (isStockStale) refetchStock();
      if (isHouseholdStale) refetchHousehold();
    }, [isStockStale, refetchStock, isHouseholdStale, refetchHousehold]),
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
    Alert.alert(t('stock.removeTitle'), t('stock.removeItemMessage', { name: item.product.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('stock.remove'),
        style: 'destructive',
        onPress: () => {
          setEditingItem(null);
          deleteItem.mutate(item.id);
        },
      },
    ]);
  };

  const onDeleteGroup = (group: GroupedStockItem) => {
    Alert.alert(t('stock.removeTitle'), t('stock.removeGroupMessage', { name: group.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('stock.remove'),
        style: 'destructive',
        onPress: () => {
          setEditingGroup(null);
          deleteGroup.mutate(group.members.map((m) => m.id));
        },
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
        onError: () => Alert.alert(t('common.couldNotAdd'), t('stock.couldNotAddLowStock')),
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
            const msg = isAppError(err) ? err.message : t('stock.couldNotAddToList');
            Alert.alert(t('common.couldNotAdd'), msg);
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
          const msg = isAppError(err) ? err.message : t('stock.couldNotAddToPantry');
          Alert.alert(t('common.couldNotAdd'), msg);
        },
      },
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} color={colors.primary.base} size="large" />;
  }

  if (stockList.isError) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.bg.default }]}
      >
        <View style={styles.errorContainer}>
          <EmptyState
            icon="cloud-offline-outline"
            title={t('stock.loadError')}
            subtitle={t('stock.loadErrorSub')}
          />
          <Button
            label={t('common.retry')}
            onPress={() => stockList.refetch()}
            style={styles.retryBtn}
          />
        </View>
      </SafeAreaView>
    );
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
          g.name.toLowerCase().includes(query) ||
          (g.category ? categoryLabel(g.category, t).toLowerCase().includes(query) : false),
      )
    : groupedItems;

  const listHint = (
    <Text style={[styles.listHint, { color: colors.text.muted }]}>{t('stock.holdToRemove')}</Text>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.bg.default }]}
    >
      <StockSearchBar
        value={search}
        onChangeText={setSearch}
        onBarcodePress={() => navigation.navigate('Scan', { returnSearch: true })}
      />
      {activeLowCount > 0 && !bannerDismissed && (
        <LowStockBanner
          count={activeLowCount}
          isPending={addLowToList.isPending}
          onPress={onAddLowStockToList}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {groupedView ? (
        <FlatList
          data={filteredGrouped}
          keyExtractor={(g) => g.key}
          refreshControl={
            <RefreshControl
              refreshing={stockList.isRefetching}
              onRefresh={() => stockList.refetch()}
              tintColor={colors.primary.base}
            />
          }
          contentContainerStyle={
            filteredGrouped.length === 0 ? styles.emptyContainer : styles.listContent
          }
          renderItem={({ item: group }) => (
            <GroupedStockCard
              group={group}
              onAdjust={(delta) => onAdjustGroup(group, delta)}
              onLongPress={() => setEditingGroup(group)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={query ? t('stock.noResults') : t('stock.empty')}
              subtitle={
                query ? t('stock.nothingMatches', { query: search }) : t('stock.emptySubtitle')
              }
            />
          }
          ListFooterComponent={filteredGrouped.length > 0 ? listHint : null}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={stockList.isRefetching}
              onRefresh={() => stockList.refetch()}
              tintColor={colors.primary.base}
            />
          }
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          renderItem={({ item }) => (
            <StockListItem
              item={item}
              onIncrease={() => onAdjustItem(item, 1)}
              onDecrease={() => onAdjustItem(item, -1)}
              onLongPress={() => setEditingItem(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={query ? t('stock.noResults') : t('stock.empty')}
              subtitle={
                query ? t('stock.nothingMatches', { query: search }) : t('stock.emptySubtitle')
              }
            />
          }
          ListFooterComponent={filtered.length > 0 ? listHint : null}
        />
      )}

      <View style={styles.fabRow}>
        <Button
          label={t('stock.addManual')}
          variant="secondary"
          onPress={() => setShowManual(true)}
        />
        <Button label={t('common.scan')} onPress={() => navigation.navigate('Scan')} />
      </View>

      <ProductConfirmSheet
        visible={showManual}
        product={EMPTY_PRODUCT}
        onConfirm={onManualConfirm}
        onCancel={() => setShowManual(false)}
      />

      <StockItemEditSheet
        visible={editingItem !== null}
        name={editingItem?.product.name ?? ''}
        currentThreshold={editingItem?.low_stock_threshold ?? 1}
        isSaving={updateThreshold.isPending}
        onSave={(threshold) =>
          updateThreshold.mutate(
            { ids: [editingItem!.id], threshold },
            { onSuccess: () => setEditingItem(null) },
          )
        }
        onDelete={() => onDeleteItem(editingItem!)}
        onCompare={() => {
          const id = editingItem?.product.id ?? null;
          setEditingItem(null);
          setComparingProductId(id);
        }}
        onClose={() => setEditingItem(null)}
      />

      <StockItemEditSheet
        visible={editingGroup !== null}
        name={editingGroup?.name ?? ''}
        currentThreshold={editingGroup?.low_stock_threshold ?? 1}
        isSaving={updateThreshold.isPending}
        onSave={(threshold) =>
          updateThreshold.mutate(
            { ids: editingGroup!.members.map((m) => m.id), threshold },
            { onSuccess: () => setEditingGroup(null) },
          )
        }
        onDelete={() => onDeleteGroup(editingGroup!)}
        onCompare={() => {
          const id = editingGroup ? pickHighestQtyMember(editingGroup.members).product.id : null;
          setEditingGroup(null);
          setComparingProductId(id);
        }}
        onClose={() => setEditingGroup(null)}
      />

      <PriceCompareSheet
        productId={comparingProductId}
        visible={comparingProductId !== null}
        onClose={() => setComparingProductId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryBtn: { marginTop: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 96 },
  listHint: { textAlign: 'center', fontSize: 12, paddingVertical: 12 },
  fabRow: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
});
