import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { StockItem } from '@/shared/types/domain';

interface Props {
  item: StockItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onLongPress: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function StockListItem({
  item,
  onIncrease,
  onDecrease,
  onLongPress,
  onCancelDelete,
  onDelete,
  isDeleting,
}: Props) {
  const isLow = item.quantity <= item.low_stock_threshold;
  const stockStatus = item.quantity === 0 ? 'out' : isLow ? 'low' : 'ok';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={onLongPress}
      onPress={isDeleting ? onCancelDelete : undefined}
      style={[
        styles.card,
        isLow && !isDeleting && styles.cardLow,
        isDeleting && styles.cardDeleting,
      ]}
    >
      <View style={styles.info}>
        <Text style={[styles.name, isDeleting && styles.textDeleting]} numberOfLines={1}>
          {item.product.name}
        </Text>
        {item.product.brand && (
          <Text style={[styles.meta, isDeleting && styles.textDeleting]}>{item.product.brand}</Text>
        )}
        {item.product.package_unit && (
          <Text style={[styles.meta, isDeleting && styles.textDeleting]}>
            {item.product.package_unit}
          </Text>
        )}
        {!isDeleting && stockStatus === 'low' && <Text style={styles.lowBadge}>Low stock</Text>}
        {!isDeleting && stockStatus === 'out' && <Text style={styles.outBadge}>Out of stock</Text>}
      </View>

      {isDeleting ? (
        <TouchableOpacity style={styles.trashBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={onDecrease}>
            <Text style={styles.btnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{item.quantity}</Text>
          <TouchableOpacity style={styles.btn} onPress={onIncrease}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  cardLow: { borderLeftWidth: 3, borderLeftColor: '#F4A261' },
  cardDeleting: { backgroundColor: '#FDECEA', borderLeftWidth: 3, borderLeftColor: '#E53935' },
  textDeleting: { color: '#E53935' },
  trashBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  lowBadge: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#C05D00',
    backgroundColor: '#FFF0E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outBadge: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#C0392B',
    backgroundColor: '#FDECEA',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 18, color: '#2D6A4F', fontWeight: '600', lineHeight: 22 },
  qty: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', minWidth: 24, textAlign: 'center' },
});
