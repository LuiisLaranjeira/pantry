import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Sheet, useTheme } from '@/shared/ui';

interface Props {
  visible: boolean;
  currentName: string | null;
  onSave: (name: string) => void;
  onClose: () => void;
  isSaving: boolean;
}

export function ListNameSheet({ visible, currentName, onSave, onClose, isSaving }: Props) {
  const { t } = useTranslation();
  const { colors, radius } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius), [colors, radius]);
  const [name, setName] = useState('');
  const [lastVisible, setLastVisible] = useState(false);

  if (visible && !lastVisible) {
    setLastVisible(true);
    setName(currentName ?? '');
  } else if (!visible && lastVisible) {
    setLastVisible(false);
  }

  const trimmed = name.trim();

  return (
    <Sheet visible={visible} onRequestClose={onClose} title={t('shopping.renameList')}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { color: colors.text.primary, borderColor: colors.border.subtle }]}
          value={name}
          onChangeText={setName}
          placeholder={t('shopping.listNamePlaceholder')}
          placeholderTextColor={colors.text.muted}
          returnKeyType="done"
          autoFocus
          onSubmitEditing={() => trimmed && onSave(trimmed)}
        />
      </View>
      <Button
        label={t('common.save')}
        onPress={() => onSave(trimmed)}
        loading={isSaving}
        disabled={!trimmed}
        style={styles.saveBtn}
      />
    </Sheet>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  radius: ReturnType<typeof useTheme>['radius'],
) {
  return StyleSheet.create({
    inputRow: { marginBottom: 20 },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 16,
      backgroundColor: colors.bg.default,
    },
    saveBtn: {},
  });
}
