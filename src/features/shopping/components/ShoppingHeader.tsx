import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconButton, useTheme } from '@/shared/ui';

interface Props {
  listName: string | null;
  checkedCount: number;
  isPending: boolean;
  onDeleteList: () => void;
  onRenameList: () => void;
  onScanReceipt: () => void;
  onConfirmPurchase: () => void;
}

export function ShoppingHeader({
  listName,
  checkedCount,
  isPending,
  onDeleteList,
  onRenameList,
  onScanReceipt,
  onConfirmPurchase,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.header}>
      <IconButton
        icon="trash-outline"
        size={20}
        color={colors.danger.text}
        accessibilityLabel={t('shopping.deleteListLabel')}
        onPress={onDeleteList}
      />
      <TouchableOpacity style={styles.titleArea} onPress={onRenameList} activeOpacity={0.7}>
        <Text style={styles.title} numberOfLines={1}>
          {listName ?? t('shopping.listName')}
        </Text>
        <Ionicons name="pencil-outline" size={13} color={colors.text.muted} style={styles.pencil} />
      </TouchableOpacity>
      <View style={styles.rightRow}>
        <IconButton
          icon="receipt-outline"
          size={22}
          color={colors.primary.base}
          accessibilityLabel={t('shopping.scanReceiptLabel')}
          onPress={onScanReceipt}
        />
        <TouchableOpacity
          onPress={onConfirmPurchase}
          disabled={checkedCount === 0 || isPending}
          accessibilityLabel={t('shopping.confirmPurchaseLabel')}
          style={[styles.confirmBtn, (checkedCount === 0 || isPending) && styles.disabled]}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Text style={styles.confirmText}>✓</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    titleArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
      gap: 4,
    },
    title: {
      flexShrink: 1,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    pencil: { marginTop: 1 },
    rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    confirmBtn: {
      backgroundColor: colors.primary.base,
      borderRadius: 10,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmText: { color: colors.text.inverse, fontSize: 18, fontWeight: '700' },
    disabled: { opacity: 0.45 },
  });
}
