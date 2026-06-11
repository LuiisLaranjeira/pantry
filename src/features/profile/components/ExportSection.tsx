import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfileStyles } from '@/features/profile/components/styles';
import { useTheme } from '@/shared/ui';

interface Props {
  isExportingStock: boolean;
  isExportingHistory: boolean;
  onExportStock: () => void;
  onExportHistory: () => void;
}

export function ExportSection({
  isExportingStock,
  isExportingHistory,
  onExportStock,
  onExportHistory,
}: Props) {
  const { t } = useTranslation();
  const styles = useProfileStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.exportTitle')}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={onExportStock} disabled={isExportingStock}>
          <Ionicons
            name="archive-outline"
            size={20}
            color={colors.primary.base}
            style={styles.rowIcon}
          />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{t('profile.exportStock')}</Text>
            <Text style={styles.rowSubLabel}>{t('profile.exportStockSub')}</Text>
          </View>
          {isExportingStock ? (
            <ActivityIndicator size="small" color={colors.text.muted} />
          ) : (
            <Ionicons name="download-outline" size={20} color={colors.text.muted} />
          )}
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.row}
          onPress={onExportHistory}
          disabled={isExportingHistory}
        >
          <Ionicons
            name="receipt-outline"
            size={20}
            color={colors.primary.base}
            style={styles.rowIcon}
          />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{t('profile.exportHistory')}</Text>
            <Text style={styles.rowSubLabel}>{t('profile.exportHistorySub')}</Text>
          </View>
          {isExportingHistory ? (
            <ActivityIndicator size="small" color={colors.text.muted} />
          ) : (
            <Ionicons name="download-outline" size={20} color={colors.text.muted} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
