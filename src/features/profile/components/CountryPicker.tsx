import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { profileStyles } from '@/features/profile/components/styles';
import { COUNTRIES } from '@/features/profile/constants';

interface Props {
  visible: boolean;
  selectedCode: string | null;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export function CountryPicker({ visible, selectedCode, onSelect, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Country</Text>
          <TouchableOpacity onPress={onClose} style={profileStyles.iconBtn}>
            <Ionicons name="close" size={22} color="#444" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={COUNTRIES}
          keyExtractor={(c) => c.code}
          renderItem={({ item: c }) => {
            const selected = selectedCode === c.code;
            return (
              <TouchableOpacity
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => onSelect(c.code)}
              >
                <Text style={[styles.name, selected && styles.nameSelected]}>{c.name}</Text>
                {selected && <Ionicons name="checkmark" size={18} color="#2D6A4F" />}
              </TouchableOpacity>
            );
          }}
        />
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
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowSelected: { backgroundColor: '#F0FAF4' },
  name: { fontSize: 15, color: '#1A1A1A' },
  nameSelected: { fontWeight: '600', color: '#2D6A4F' },
});
