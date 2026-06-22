import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Sheet, useTheme } from '@/shared/ui';

interface Props {
  visible: boolean;
  name: string;
  currentThreshold: number;
  onSave: (threshold: number) => void;
  onDelete: () => void;
  onClose: () => void;
  isSaving: boolean;
  onCompare?: () => void;
}

export function StockItemEditSheet({
  visible,
  name,
  currentThreshold,
  onSave,
  onDelete,
  onClose,
  isSaving,
  onCompare,
}: Props) {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [threshold, setThreshold] = useState(currentThreshold);
  const [lastVisible, setLastVisible] = useState(false);

  // React 19 "adjust state during render" pattern for prop-driven resets.
  if (visible && !lastVisible) {
    setLastVisible(true);
    setThreshold(currentThreshold);
  } else if (!visible && lastVisible) {
    setLastVisible(false);
  }

  return (
    <Sheet visible={visible} onRequestClose={onClose} title={t('stock.editItem')}>
      <Text style={[styles.itemName, { color: colors.text.secondary }]} numberOfLines={2}>
        {name}
      </Text>

      <Text
        style={[
          styles.label,
          { color: colors.text.secondary, fontWeight: typography.weight.semibold },
        ]}
      >
        {t('stock.threshold')}
      </Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: colors.primary.soft }]}
          onPress={() => setThreshold((v) => Math.max(1, v - 1))}
        >
          <Text style={[styles.stepBtnText, { color: colors.primary.base }]}>−</Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.stepValue,
            { color: colors.text.primary, fontWeight: typography.weight.bold },
          ]}
        >
          {threshold}
        </Text>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: colors.primary.soft }]}
          onPress={() => setThreshold((v) => v + 1)}
        >
          <Text style={[styles.stepBtnText, { color: colors.primary.base }]}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.hint, { color: colors.text.muted }]}>{t('stock.thresholdHint')}</Text>

      {onCompare && (
        <TouchableOpacity style={styles.compareBtn} onPress={onCompare}>
          <Ionicons name="pricetags-outline" size={18} color={colors.primary.base} />
          <Text style={[styles.compareText, { color: colors.primary.base }]}>
            {t('prices.comparison')}
          </Text>
        </TouchableOpacity>
      )}

      <Button
        label={t('common.save')}
        onPress={() => onSave(threshold)}
        loading={isSaving}
        style={styles.saveBtn}
      />
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} disabled={isSaving}>
        <Text style={[styles.deleteBtnText, { color: colors.danger.base }]}>
          {t('stock.remove')}
        </Text>
      </TouchableOpacity>
    </Sheet>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    itemName: {
      fontSize: 15,
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      marginBottom: 10,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    stepBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnText: { fontSize: 22, fontWeight: '600', lineHeight: 26 },
    stepValue: { fontSize: 22, minWidth: 32, textAlign: 'center' },
    hint: {
      fontSize: 12,
      marginTop: 8,
      marginBottom: 24,
    },
    compareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      marginBottom: 12,
    },
    compareText: { fontSize: 15, fontWeight: '600' },
    saveBtn: { marginBottom: 12 },
    deleteBtn: {
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.danger.soft,
    },
    deleteBtnText: { fontSize: 15, fontWeight: '600' },
  });
}
