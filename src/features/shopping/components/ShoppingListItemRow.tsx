import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { formatCurrency } from '@/shared/lib/format';
import type { ShoppingListItem } from '@/shared/types/domain';

interface Props {
  item: ShoppingListItem;
  onToggleCheck: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ShoppingListItemRow({ item, onToggleCheck, onEdit, onDelete }: Props) {
  return (
    <TouchableOpacity
      style={[styles.itemCard, item.checked && styles.itemChecked]}
      onLongPress={onEdit}
      activeOpacity={1}
    >
      <TouchableOpacity style={styles.checkbox} onPress={onToggleCheck}>
        <Text style={styles.checkboxText}>{item.checked ? '✓' : ''}</Text>
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
        {(item.product?.brand || item.product?.package_unit) && (
          <Text style={styles.itemMeta}>
            {[item.product.brand, item.product.package_unit].filter(Boolean).join(' · ')}
          </Text>
        )}
        <Text style={styles.itemMeta}>
          qty {item.quantity}
          {item.unit_price != null ? ` · ${formatCurrency(item.unit_price)} each` : ''}
        </Text>
      </View>
      {item.unit_price != null && (
        <Text style={styles.itemTotal}>{formatCurrency(item.unit_price * item.quantity)}</Text>
      )}
      <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
        <Ionicons name="pencil-outline" size={16} color="#AAA" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Ionicons name="close-outline" size={18} color="#CCC" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  itemChecked: { opacity: 0.55 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxText: { color: '#2D6A4F', fontSize: 16, fontWeight: '700' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  itemNameChecked: { textDecorationLine: 'line-through' },
  itemMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginRight: 8 },
  editBtn: { padding: 4 },
  deleteBtn: { padding: 4, marginLeft: 4 },
});
