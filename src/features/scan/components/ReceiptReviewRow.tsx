import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export interface ReceiptReviewItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: string;
  selected: boolean;
}

interface Props {
  item: ReceiptReviewItem;
  onPatch: (patch: Partial<ReceiptReviewItem>) => void;
}

export function ReceiptReviewRow({ item, onPatch }: Props) {
  return (
    <View style={[styles.card, !item.selected && styles.cardDimmed]}>
      <TouchableOpacity
        style={[styles.checkbox, item.selected && styles.checkboxSelected]}
        onPress={() => onPatch({ selected: !item.selected })}
      >
        {item.selected && <Ionicons name="checkmark" size={14} color="#fff" />}
      </TouchableOpacity>

      <View style={styles.body}>
        <TextInput
          style={styles.nameInput}
          value={item.name}
          onChangeText={(name) => onPatch({ name })}
          placeholder="Product name"
          placeholderTextColor="#BBB"
        />
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onPatch({ quantity: Math.max(1, item.quantity - 1) })}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onPatch({ quantity: item.quantity + 1 })}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>

          <View style={styles.priceBox}>
            <Text style={styles.priceCurrency}>€</Text>
            <TextInput
              style={styles.priceInput}
              value={item.unit_price}
              onChangeText={(unit_price) => onPatch({ unit_price })}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor="#BBB"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  cardDimmed: { opacity: 0.38 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2D6A4F',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#2D6A4F' },
  body: { flex: 1 },
  nameInput: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, color: '#2D6A4F', fontWeight: '600', lineHeight: 20 },
  qtyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    minWidth: 20,
    textAlign: 'center',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 76,
  },
  priceCurrency: { fontSize: 13, color: '#888', marginRight: 2 },
  priceInput: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', minWidth: 48 },
});
