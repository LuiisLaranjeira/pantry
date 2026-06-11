import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/ui';

interface Props {
  count: number;
  isPending: boolean;
  onPress: () => void;
  onDismiss: () => void;
}

export function LowStockBanner({ count, isPending, onPress, onDismiss }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={onPress}
      disabled={isPending}
      activeOpacity={0.8}
    >
      <Ionicons name="cart-outline" size={18} color={colors.text.inverse} />
      <Text style={styles.text}>{t('stock.lowBanner', { count })}</Text>
      {isPending ? (
        <ActivityIndicator size="small" color={colors.text.inverse} style={styles.trailing} />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color="rgba(255,255,255,0.7)"
          style={styles.trailing}
        />
      )}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.close}
      >
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    banner: {
      backgroundColor: colors.primary.base,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    text: { color: colors.text.inverse, fontSize: 14, fontWeight: '600', flex: 1 },
    trailing: { marginLeft: 'auto' },
    close: { padding: 2, marginLeft: 8 },
  });
}
