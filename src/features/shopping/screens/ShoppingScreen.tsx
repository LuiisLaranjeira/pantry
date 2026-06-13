import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/app/providers/AppStateProvider';
import type { AppStackParamList, MainTabsParamList } from '@/app/navigation/types';
import { CategorySectionHeader } from '@/features/shopping/components/CategorySectionHeader';
import { ShoppingHeader } from '@/features/shopping/components/ShoppingHeader';
import { ShoppingListItemRow } from '@/features/shopping/components/ShoppingListItemRow';
import { ShoppingNoList } from '@/features/shopping/components/ShoppingNoList';
import { TotalBar } from '@/features/shopping/components/TotalBar';
import { useActiveList } from '@/features/shopping/hooks/useActiveList';
import { useAddItemFromManual } from '@/features/shopping/hooks/useAddItemFromManual';
import { useConfirmPurchase } from '@/features/shopping/hooks/useConfirmPurchase';
import { useDeleteActiveList } from '@/features/shopping/hooks/useDeleteActiveList';
import { useDeleteShoppingItem } from '@/features/shopping/hooks/useDeleteShoppingItem';
import { useShoppingHistory } from '@/features/shopping/hooks/useShoppingHistory';
import { useShoppingItems } from '@/features/shopping/hooks/useShoppingItems';
import { useShoppingListSync } from '@/features/shopping/hooks/useShoppingListSync';
import { useStartList } from '@/features/shopping/hooks/useStartList';
import { useToggleItemChecked } from '@/features/shopping/hooks/useToggleItemChecked';
import { useUpdateShoppingItem } from '@/features/shopping/hooks/useUpdateShoppingItem';
import { isAppError } from '@/shared/api/errors';
import { ProductConfirmSheet, type Destination } from '@/shared/components/ProductConfirmSheet';
import { formatCurrency } from '@/shared/lib/format';
import { Button, EmptyState, useTheme } from '@/shared/ui';
import { EMPTY_PRODUCT } from '@/shared/types/domain';
import type { PartialProduct, ShoppingListItem } from '@/shared/types/domain';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Shopping'>,
  NativeStackScreenProps<AppStackParamList>
>;

type Section = { title: string; data: ShoppingListItem[] };

function groupSections(items: ShoppingListItem[], inCartLabel: string): Section[] {
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const byCategory = new Map<string, ShoppingListItem[]>();
  for (const item of unchecked) {
    const key = item.product?.category ?? 'Other';
    const bucket = byCategory.get(key) ?? [];
    bucket.push(item);
    byCategory.set(key, bucket);
  }

  const sections: Section[] = [...byCategory.keys()]
    .sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    })
    .map((title) => ({ title, data: byCategory.get(title)! }));

  if (checked.length > 0) {
    sections.push({ title: inCartLabel, data: checked });
  }

  return sections;
}

export function ShoppingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { householdId } = useAppState();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);

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

  useShoppingListSync(activeList.data?.id, householdId);

  const { isStale: isActiveListStale, refetch: refetchActiveList } = activeList;
  const { isStale: isHistoryStale, refetch: refetchHistory } = history;
  const { isStale: isItemsStale, refetch: refetchItems } = items;
  useFocusEffect(
    useCallback(() => {
      if (isActiveListStale) refetchActiveList();
      if (isHistoryStale) refetchHistory();
      if (isItemsStale) refetchItems();
    }, [
      isActiveListStale,
      refetchActiveList,
      isHistoryStale,
      refetchHistory,
      isItemsStale,
      refetchItems,
    ]),
  );

  const itemList = useMemo(() => items.data ?? [], [items.data]);
  const checkedItems = useMemo(() => itemList.filter((i) => i.checked), [itemList]);
  const checkedCount = checkedItems.length;
  const uncheckedCount = itemList.length - checkedCount;
  const runningTotal = useMemo(
    () =>
      checkedItems
        .filter((i) => i.unit_price != null)
        .reduce((sum, i) => sum + (i.unit_price ?? 0) * i.quantity, 0),
    [checkedItems],
  );
  const sections = useMemo(() => groupSections(itemList, t('shopping.inCart')), [itemList, t]);

  useEffect(() => {
    if (!activeList.data) {
      navigation.setOptions({ tabBarBadge: undefined });
      return;
    }
    navigation.setOptions({ tabBarBadge: uncheckedCount > 0 ? uncheckedCount : undefined });
  }, [uncheckedCount, activeList.data, navigation]);

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

  const handleDelete = (item: ShoppingListItem) => {
    Alert.alert(
      t('shopping.removeItemTitle'),
      t('shopping.removeItemMessage', { name: item.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('shopping.remove'),
          style: 'destructive',
          onPress: () => deleteItem.mutate(item.id),
        },
      ],
    );
  };

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
          const msg = isAppError(err) ? err.message : t('shopping.couldNotAdd');
          Alert.alert(t('common.couldNotAdd'), msg);
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
      { itemId: editingItem.id, patch: { name: product.name, quantity, unit_price: unitPrice } },
      {
        onSuccess: () => setEditingItem(null),
        onError: (err) => {
          const msg = isAppError(err) ? err.message : t('shopping.couldNotSaveChanges');
          Alert.alert(t('shopping.couldNotSave'), msg);
        },
      },
    );
  };

  const handleConfirmPurchase = () => {
    if (!activeList.data || checkedCount === 0) {
      Alert.alert(t('shopping.noItemsChecked'), t('shopping.noItemsCheckedMessage'));
      return;
    }
    const itemsLabel = t('shopping.confirmItems', { count: checkedCount });
    Alert.alert(
      t('shopping.confirmPurchaseTitle'),
      `${itemsLabel}${runningTotal > 0 ? ` · ${formatCurrency(runningTotal)}` : ''}\n\n${t('shopping.addToPantryQuestion')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('shopping.confirm'),
          onPress: () =>
            confirmPurchase.mutate(
              { listId: activeList.data!.id, checkedItems, total: runningTotal },
              {
                onError: () =>
                  Alert.alert(t('shopping.couldNotConfirm'), t('shopping.couldNotConfirmMessage')),
              },
            ),
        },
      ],
    );
  };

  const handleDeleteList = () => {
    if (!activeList.data) return;
    Alert.alert(t('shopping.deleteListTitle'), t('shopping.deleteListMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('shopping.delete'),
        style: 'destructive',
        onPress: () => deleteList.mutate(activeList.data!.id),
      },
    ]);
  };

  const handleStartList = () => {
    startList.mutate(undefined, {
      onError: (err) => {
        const msg = isAppError(err) ? err.message : t('shopping.couldNotStart');
        Alert.alert(t('common.error'), msg);
      },
    });
  };

  const handleRefresh = () => {
    activeList.refetch();
    items.refetch();
    history.refetch();
  };

  if (activeList.isPending || history.isPending) {
    return <ActivityIndicator style={styles.loader} color={colors.primary.base} size="large" />;
  }

  if (!activeList.data) {
    return (
      <ShoppingNoList
        history={history.data ?? []}
        onStartList={handleStartList}
        isStarting={startList.isPending}
      />
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.bg.default }]}
    >
      <ShoppingHeader
        checkedCount={checkedCount}
        isPending={confirmPurchase.isPending}
        onDeleteList={handleDeleteList}
        onScanReceipt={() => navigation.navigate('ReceiptScan')}
        onConfirmPurchase={handleConfirmPurchase}
      />

      {checkedCount > 0 && <TotalBar checkedCount={checkedCount} runningTotal={runningTotal} />}

      {items.isError ? (
        <ScrollView
          style={styles.errorScrollContainer}
          contentContainerStyle={styles.errorContainer}
          refreshControl={
            <RefreshControl
              refreshing={items.isRefetching}
              onRefresh={() => items.refetch()}
              tintColor={colors.primary.base}
            />
          }
        >
          <EmptyState
            icon="cloud-offline-outline"
            title={t('shopping.loadError')}
            subtitle={t('shopping.loadErrorSub')}
          />
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(i) => i.id}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : undefined}
          renderSectionHeader={({ section }) => <CategorySectionHeader title={section.title} />}
          renderItem={({ item }) => (
            <ShoppingListItemRow
              item={item}
              onToggleCheck={() => handleToggle(item)}
              onEdit={() => setEditingItem(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState title={t('shopping.empty')} subtitle={t('shopping.emptySub')} />
          }
          refreshControl={
            <RefreshControl
              refreshing={activeList.isRefetching || items.isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.primary.base}
            />
          }
        />
      )}

      <View style={styles.bottomBar}>
        <Button
          label={t('shopping.addItem')}
          onPress={() => setShowAdd(true)}
          fullWidth
          style={styles.bottomBtn}
        />
        <Button
          label={t('common.scan')}
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
        title={t('shopping.editItem')}
        confirmLabel={t('common.save')}
        defaultQuantity={editingItem?.quantity ?? 1}
        onConfirm={handleSaveEdit}
        onCancel={() => setEditingItem(null)}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    loader: { flex: 1 },
    container: { flex: 1 },
    errorScrollContainer: { flex: 1 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  });
}
