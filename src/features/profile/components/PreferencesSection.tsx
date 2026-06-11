import { Ionicons } from '@expo/vector-icons';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { COUNTRIES, LANGUAGES } from '@/features/profile/constants';
import { useProfileStyles } from '@/features/profile/components/styles';
import { useTheme } from '@/shared/ui';

interface Props {
  country: string | null | undefined;
  groupedView: boolean;
  language: string;
  onCountryPress: () => void;
  onLanguagePress: () => void;
  onGroupedViewChange: (value: boolean) => void;
}

export function PreferencesSection({
  country,
  groupedView,
  language,
  onCountryPress,
  onLanguagePress,
  onGroupedViewChange,
}: Props) {
  const styles = useProfileStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('preferences.title')}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={onCountryPress}>
          <Ionicons
            name="globe-outline"
            size={20}
            color={colors.primary.base}
            style={styles.rowIcon}
          />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{t('preferences.country')}</Text>
            <Text style={styles.rowValue}>
              {country
                ? (COUNTRIES.find((c) => c.code === country)?.name ?? country)
                : t('common.notSet')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={onLanguagePress}>
          <Ionicons
            name="language-outline"
            size={20}
            color={colors.primary.base}
            style={styles.rowIcon}
          />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{t('preferences.language')}</Text>
            <Text style={styles.rowValue}>
              {LANGUAGES.find((l) => l.code === language)?.name ?? language}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.border.strong} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Ionicons
            name="layers-outline"
            size={20}
            color={colors.primary.base}
            style={styles.rowIcon}
          />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{t('preferences.groupedView')}</Text>
            <Text style={styles.rowSubLabel}>{t('preferences.groupedViewSub')}</Text>
          </View>
          <Switch
            value={groupedView}
            onValueChange={onGroupedViewChange}
            trackColor={{ false: colors.border.default, true: colors.primary.muted }}
            thumbColor={groupedView ? colors.primary.base : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
}
