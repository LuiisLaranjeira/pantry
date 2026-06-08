import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SectionList, StyleSheet, View } from 'react-native';

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
import type { PartialProduct, ShoppingListItem } from '@/shared/types/domain';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Shopping'>,
  NativeStackScreenProps<AppStackParamList>
>;

type Section = { title: string; data: ShoppingListItem[] };

function groupSections(items: ShoppingListItem[]): Section[] {
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
    sections.push({ title: 'In cart', data: checked });
  }

  return sections;
}

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
  const sections = useMemo(() => groupSections(itemList), [itemList]);

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
      { itemId: editingItem.id, patch: { name: product.name, quantity, unit_price: unitPrice } },
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
              { listId: activeList.data!.id, checkedItems, total: runningTotal },
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
      <ShoppingNoList
        history={history.data ?? []}
        onStartList={handleStartList}
        isStarting={startList.isPending}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.default }]}>
      <ShoppingHeader
        checkedCount={checkedCount}
        isPending={confirmPurchase.isPending}
        onDeleteList={handleDeleteList}
        onScanReceipt={() => navigation.navigate('ReceiptScan')}
        onConfirmPurchase={handleConfirmPurchase}
      />

      {checkedCount > 0 && <TotalBar checkedCount={checkedCount} runningTotal={runningTotal} />}

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

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    loader: { flex: 1 },
    container: { flex: 1 },
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
