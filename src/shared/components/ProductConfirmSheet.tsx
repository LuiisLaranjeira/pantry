import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const defaultDest: Destination = fixedDestination ?? defaultDestination ?? 'stock';
  const [destination, setDestination] = useState<Destination>(defaultDest);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [packageUnit, setPackageUnit] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [openedFor, setOpenedFor] = useState<PartialProduct | null>(null);

  // Reset form fields when the sheet opens or the product reference changes.
  // Adjusting state during render is the React-recommended pattern over an
  // effect for prop-driven resets (https://react.dev/learn/you-might-not-need-an-effect).
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
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.heading}>{title ?? 'Add product'}</Text>

          {!fixedDestination && (
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, destination === 'stock' && styles.toggleBtnActive]}
                onPress={() => setDestination('stock')}
              >
                <Text
                  style={[styles.toggleText, destination === 'stock' && styles.toggleTextActive]}
                >
                  Pantry
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, destination === 'list' && styles.toggleBtnActive]}
                onPress={() => setDestination('list')}
              >
                <Text
                  style={[styles.toggleText, destination === 'list' && styles.toggleTextActive]}
                >
                  Shopping list
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Product name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Tomato Sauce"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Brand (optional)</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Heinz"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Package size (optional)</Text>
            <TextInput
              style={styles.input}
              value={packageUnit}
              onChangeText={setPackageUnit}
              placeholder="e.g. 500g, 1L, 6-pack"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Price per unit (optional)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 3.99"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>
                {destination === 'stock' ? 'Add to pantry' : 'Add to list'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  heading: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#888' },
  toggleTextActive: { color: '#2D6A4F' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 4 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 22, color: '#2D6A4F', fontWeight: '600', lineHeight: 26 },
  qtyValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    minWidth: 32,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  cancelText: { color: '#666', fontSize: 15, fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
