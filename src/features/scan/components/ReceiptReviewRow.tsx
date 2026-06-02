import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/shared/ui';

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
  const { colors, elevation } = useTheme();
  const styles = useMemo(() => makeStyles(colors, elevation), [colors, elevation]);
  return (
    <View style={[styles.card, !item.selected && styles.cardDimmed]}>
      <TouchableOpacity
        style={[styles.checkbox, item.selected && styles.checkboxSelected]}
        onPress={() => onPatch({ selected: !item.selected })}
      >
        {item.selected && <Ionicons name="checkmark" size={14} color={colors.text.inverse} />}
      </TouchableOpacity>

      <View style={styles.body}>
        <TextInput
          style={styles.nameInput}
          value={item.name}
          onChangeText={(name) => onPatch({ name })}
          placeholder="Product name"
          placeholderTextColor={colors.text.placeholder}
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
              placeholderTextColor={colors.text.placeholder}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  elevation: ReturnType<typeof useTheme>['elevation'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      ...elevation.card,
    },
    cardDimmed: { opacity: 0.38 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.primary.base,
      marginRight: 12,
      marginTop: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: { backgroundColor: colors.primary.base },
    body: { flex: 1 },
    nameInput: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text.primary,
      paddingVertical: 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
      marginBottom: 8,
    },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    qtyBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyBtnText: { fontSize: 16, color: colors.primary.base, fontWeight: '600', lineHeight: 20 },
    qtyValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      minWidth: 20,
      textAlign: 'center',
    },
    priceBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
      backgroundColor: colors.bg.default,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.border.default,
      minWidth: 76,
    },
    priceCurrency: { fontSize: 13, color: colors.text.muted, marginRight: 2 },
    priceInput: { fontSize: 14, fontWeight: '600', color: colors.text.primary, minWidth: 48 },
  });
}
