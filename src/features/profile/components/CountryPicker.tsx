import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useProfileStyles } from '@/features/profile/components/styles';
import { COUNTRIES } from '@/features/profile/constants';
import { IconButton, useTheme } from '@/shared/ui';

interface Props {
  visible: boolean;
  selectedCode: string | null;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export function CountryPicker({ visible, selectedCode, onSelect, onClose }: Props) {
  const profileStyles = useProfileStyles();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
          <IconButton
            icon="close"
            size={22}
            color={colors.text.subtle}
            accessibilityLabel="Close country picker"
            onPress={onClose}
            style={profileStyles.iconBtn}
          />
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
                {selected && <Ionicons name="checkmark" size={18} color={colors.primary.base} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.default },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 28,
      backgroundColor: colors.bg.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    title: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.bg.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    rowSelected: { backgroundColor: colors.primary.soft },
    name: { fontSize: 15, color: colors.text.primary },
    nameSelected: { fontWeight: '600', color: colors.primary.base },
  });
}
