import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/shared/ui';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onBarcodePress: () => void;
}

export function StockSearchBar({ value, onChangeText, onBarcodePress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search pantry…"
        placeholderTextColor={colors.text.placeholder}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      <TouchableOpacity style={styles.barcodeBtn} onPress={onBarcodePress}>
        <Ionicons name="barcode-outline" size={26} color={colors.primary.base} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.bg.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    input: {
      flex: 1,
      backgroundColor: colors.bg.default,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 9,
      fontSize: 15,
      color: colors.text.primary,
    },
    barcodeBtn: { padding: 4 },
  });
}
