import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '@/features/profile/constants';
import { useProfileStyles } from '@/features/profile/components/styles';
import { IconButton, useTheme } from '@/shared/ui';

interface Props {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export function LanguagePicker({ visible, selectedCode, onSelect, onClose }: Props) {
  const profileStyles = useProfileStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
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
          <Text style={styles.title}>{t('languagePicker.title')}</Text>
          <IconButton
            icon="close"
            size={22}
            color={colors.text.subtle}
            accessibilityLabel={t('languagePicker.closeLabel')}
            onPress={onClose}
            style={profileStyles.iconBtn}
          />
        </View>
        <FlatList
          data={LANGUAGES}
          keyExtractor={(l) => l.code}
          renderItem={({ item: l }) => {
            const selected = selectedCode === l.code;
            return (
              <TouchableOpacity
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => onSelect(l.code)}
              >
                <Text style={[styles.name, selected && styles.nameSelected]}>{l.name}</Text>
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
