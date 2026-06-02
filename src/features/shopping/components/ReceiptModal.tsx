import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useShoppingItems } from '@/features/shopping/hooks/useShoppingItems';
import { formatCurrency } from '@/shared/lib/format';

interface List {
  id: string;
  completed_at: string | null;
  total_spent: number | null;
}

interface Props {
  list: List | null;
  onClose: () => void;
}

export function ReceiptModal({ list, onClose }: Props) {
  const items = useShoppingItems(list?.id ?? null);

  return (
    <Modal
      visible={list !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Receipt</Text>
            {list?.completed_at && (
              <Text style={styles.date}>
                {new Date(list.completed_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#444" />
          </TouchableOpacity>
        </View>

        {items.isPending ? (
          <ActivityIndicator style={styles.loader} color="#2D6A4F" size="large" />
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            {(items.data ?? []).map((item, index) => (
              <View key={item.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {(item.product?.brand || item.product?.package_unit) && (
                      <Text style={styles.meta}>
                        {[item.product.brand, item.product.package_unit]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    )}
                    <Text style={styles.meta}>
                      qty {item.quantity}
                      {item.unit_price != null ? ` × ${formatCurrency(item.unit_price)}` : ''}
                    </Text>
                  </View>
                  {item.unit_price != null && (
                    <Text style={styles.itemTotal}>
                      {formatCurrency(item.unit_price * item.quantity)}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            {list?.total_spent != null && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{formatCurrency(list.total_spent)}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 28,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  closeBtn: { padding: 6 },
  loader: { flex: 1 },
  body: { padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  info: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#2D6A4F',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  totalAmount: { fontSize: 20, fontWeight: '800', color: '#2D6A4F' },
});
