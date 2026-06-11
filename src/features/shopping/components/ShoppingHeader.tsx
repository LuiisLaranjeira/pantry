import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconButton, useTheme } from '@/shared/ui';

interface Props {
  checkedCount: number;
  isPending: boolean;
  onDeleteList: () => void;
  onScanReceipt: () => void;
  onConfirmPurchase: () => void;
}

export function ShoppingHeader({
  checkedCount,
  isPending,
  onDeleteList,
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
      <Text style={styles.title}>{t('shopping.title')}</Text>
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
    title: {
      flex: 1,
      marginLeft: 8,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
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
