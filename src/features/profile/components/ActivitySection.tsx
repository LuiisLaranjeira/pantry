import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ACTION_META } from '@/features/profile/constants';
import { useProfileStyles } from '@/features/profile/components/styles';
import type { StockLogRecord } from '@/features/stock/api/stockRepo';
import { timeAgo } from '@/shared/lib/time';

const ACTION_LABEL_KEYS: Record<string, string> = {
  consume: 'profile.actionConsumed',
  restock: 'profile.actionRestocked',
  add: 'profile.actionAdded',
  remove: 'profile.actionRemoved',
};

interface Props {
  log: StockLogRecord[];
}

export function ActivitySection({ log }: Props) {
  const { t } = useTranslation();
  const styles = useProfileStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.activityTitle')}</Text>
      <View style={styles.card}>
        {log.length === 0 ? (
          <View style={styles.row}>
            <Text style={styles.rowSubLabel}>{t('profile.activityEmpty')}</Text>
          </View>
        ) : (
          log.map((entry, i) => {
            const meta = ACTION_META[entry.action];
            const actionLabel = t(ACTION_LABEL_KEYS[entry.action] ?? 'profile.actionAdded');
            return (
              <View key={entry.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <Ionicons
                    name={meta.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={meta.color}
                    style={styles.rowIcon}
                  />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowLabel} numberOfLines={1}>
                      {entry.product_name}
                    </Text>
                    <Text style={styles.rowSubLabel}>
                      {actionLabel} · {timeAgo(entry.created_at)}
                    </Text>
                  </View>
                  <Text style={[styles.logQty, { color: meta.color }]}>
                    {entry.action === 'consume' ? '−' : '+'}
                    {entry.quantity}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
