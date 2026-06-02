import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button, Sheet, TextField, useTheme } from '@/shared/ui';
import type { PartialProduct } from '@/shared/types/domain';

export type Destination = 'stock' | 'list';

interface Props {
  visible: boolean;
  product: PartialProduct | null;
  onConfirm: (
    product: PartialProduct,
    quantity: number,
    destination: Destination,
    unitPrice: number | null,
  ) => void;
  onCancel: () => void;
  fixedDestination?: Destination;
  defaultDestination?: Destination;
  title?: string;
  defaultQuantity?: number;
}

export function ProductConfirmSheet({
  visible,
  product,
  onConfirm,
  onCancel,
  fixedDestination,
  defaultDestination,
  title,
  defaultQuantity,
}: Props) {
  const { colors, typography } = useTheme();
  const defaultDest: Destination = fixedDestination ?? defaultDestination ?? 'stock';
  const [destination, setDestination] = useState<Destination>(defaultDest);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [packageUnit, setPackageUnit] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [openedFor, setOpenedFor] = useState<PartialProduct | null>(null);

  // React 19 "adjust state during render" pattern for prop-driven resets.
  if (visible && product && product !== openedFor) {
    setOpenedFor(product);
    setDestination(defaultDest);
    setName(product.name ?? '');
    setBrand(product.brand ?? '');
    setPackageUnit(product.package_unit ?? '');
    setQuantity(defaultQuantity ?? 1);
    setPrice(product.unit_price != null ? String(product.unit_price) : '');
  } else if (!visible && openedFor !== null) {
    setOpenedFor(null);
  }

  const handleConfirm = () => {
    if (!name.trim() || !product) return;
    const parsed = price.trim() ? parseFloat(price.replace(',', '.')) : null;
    const unitPrice = parsed !== null && !isNaN(parsed) ? parsed : null;
    onConfirm(
      {
        ...product,
        name: name.trim(),
        brand: brand.trim() || null,
        package_unit: packageUnit.trim() || null,
        unit_price: unitPrice,
      },
      quantity,
      destination,
      unitPrice,
    );
  };

  return (
    <Sheet visible={visible} onRequestClose={onCancel} title={title ?? 'Add product'}>
      {!fixedDestination && (
        <View style={[styles.toggle, { backgroundColor: colors.bg.default }]}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              destination === 'stock' && { backgroundColor: colors.bg.surface },
            ]}
            onPress={() => setDestination('stock')}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: destination === 'stock' ? colors.primary.base : colors.text.muted,
                  fontWeight: typography.weight.semibold,
                },
              ]}
            >
              Pantry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              destination === 'list' && { backgroundColor: colors.bg.surface },
            ]}
            onPress={() => setDestination('list')}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: destination === 'list' ? colors.primary.base : colors.text.muted,
                  fontWeight: typography.weight.semibold,
                },
              ]}
            >
              Shopping list
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <TextField
          containerStyle={styles.field}
          label="Product name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Tomato Sauce"
        />
        <TextField
          containerStyle={styles.field}
          label="Brand (optional)"
          value={brand}
          onChangeText={setBrand}
          placeholder="e.g. Heinz"
        />
        <TextField
          containerStyle={styles.field}
          label="Package size (optional)"
          value={packageUnit}
          onChangeText={setPackageUnit}
          placeholder="e.g. 500g, 1L, 6-pack"
        />
        <TextField
          containerStyle={styles.field}
          label="Price per unit (optional)"
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 3.99"
          keyboardType="decimal-pad"
        />

        <Text
          style={[
            styles.qtyLabel,
            { color: colors.text.secondary, fontWeight: typography.weight.semibold },
          ]}
        >
          Quantity
        </Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: colors.primary.soft }]}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={[styles.qtyBtnText, { color: colors.primary.base }]}>−</Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.qtyValue,
              { color: colors.text.primary, fontWeight: typography.weight.bold },
            ]}
          >
            {quantity}
          </Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: colors.primary.soft }]}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <Text style={[styles.qtyBtnText, { color: colors.primary.base }]}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.cancelBtn} />
        <Button
          label={destination === 'stock' ? 'Add to pantry' : 'Add to list'}
          onPress={handleConfirm}
          style={styles.confirmBtn}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', borderRadius: 10, padding: 3, marginBottom: 8 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleText: { fontSize: 14 },
  field: { marginTop: 12 },
  qtyLabel: { fontSize: 13, marginBottom: 6, marginTop: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 4 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 22, fontWeight: '600', lineHeight: 26 },
  qtyValue: { fontSize: 22, minWidth: 32, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1 },
  confirmBtn: { flex: 2 },
});
