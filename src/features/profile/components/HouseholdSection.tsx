import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { HouseholdWithCount } from '@/features/household/hooks/useHousehold';
import { useProfileStyles } from '@/features/profile/components/styles';
import { useTheme } from '@/shared/ui';

interface Props {
  household: HouseholdWithCount | null | undefined;
}

export function HouseholdSection({ household }: Props) {
  const { t } = useTranslation();
  const styles = useProfileStyles();
  const { colors } = useTheme();
  const [codeCopied, setCodeCopied] = useState(false);

  const copyCode = async () => {
    if (!household) return;
    await Clipboard.setStringAsync(household.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareCode = async () => {
    if (!household) return;
    await Share.share({
      message: t('profile.shareMessage', { name: household.name, code: household.invite_code }),
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.householdTitle')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons
            name="home-outline"
            size={20}
            color={colors.primary.base}
            style={styles.rowIcon}
          />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{t('profile.householdName')}</Text>
            <Text style={styles.rowValue}>{household?.name ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Ionicons
            name="people-outline"
            size={20}
            color={colors.primary.base}
            style={styles.rowIcon}
          />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{t('profile.householdMembers')}</Text>
            <Text style={styles.rowValue}>{household?.member_count ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Ionicons
            name="key-outline"
            size={20}
            color={colors.primary.base}
            style={styles.rowIcon}
          />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{t('profile.inviteCode')}</Text>
            <Text style={styles.inviteCode}>{household?.invite_code ?? '—'}</Text>
          </View>
          <TouchableOpacity onPress={copyCode} style={styles.iconBtn}>
            <Ionicons
              name={codeCopied ? 'checkmark' : 'copy-outline'}
              size={20}
              color={codeCopied ? colors.primary.base : colors.text.muted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareCode} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
