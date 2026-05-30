import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { profileStyles } from '@/features/profile/components/styles';
import type { MonthData } from '@/features/profile/types';
import { formatCurrency } from '@/shared/lib/format';

interface Props {
  monthlyData: MonthData[];
}

export function SpendingSection({ monthlyData }: Props) {
  const { width } = useWindowDimensions();
  const barMaxWidth = width - 40 - 16 * 2 - 72 - 56;
  if (monthlyData.length < 12) return null;

  const hasData = monthlyData.some((m) => m.trips > 0);
  const thisMonth = monthlyData[11];
  const lastMonth = monthlyData[10];
  const active = monthlyData.filter((m) => m.trips > 0);
  const avg = active.length > 0 ? active.reduce((s, m) => s + m.total, 0) / active.length : 0;
  const maxTotal = Math.max(...monthlyData.map((m) => m.total), 1);

  const trend =
    thisMonth.total > 0 && lastMonth.total > 0
      ? ((thisMonth.total - lastMonth.total) / lastMonth.total) * 100
      : null;

  return (
    <View style={profileStyles.section}>
      <Text style={profileStyles.sectionTitle}>Monthly Spending</Text>

      <View style={profileStyles.card}>
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>This month</Text>
            <Text style={styles.statValue}>
              {thisMonth.total > 0 ? formatCurrency(thisMonth.total) : '—'}
            </Text>
            {trend !== null && (
              <Text style={[styles.statTrend, trend > 0 ? styles.trendUp : styles.trendDown]}>
                {trend > 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(0)}%
              </Text>
            )}
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Last month</Text>
            <Text style={styles.statValue}>
              {lastMonth.total > 0 ? formatCurrency(lastMonth.total) : '—'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Avg / month</Text>
            <Text style={styles.statValue}>{avg > 0 ? formatCurrency(avg) : '—'}</Text>
          </View>
        </View>

        {hasData ? (
          <>
            <View style={profileStyles.divider} />
            <View style={styles.chartContainer}>
              {monthlyData.map((m, i) => {
                const isCurrentMonth = i === 11;
                const barWidth = m.total > 0 ? Math.max(4, (m.total / maxTotal) * barMaxWidth) : 2;
                return (
                  <View key={m.key} style={styles.chartRow}>
                    <Text style={[styles.chartLabel, isCurrentMonth && styles.chartLabelBold]}>
                      {m.shortLabel}
                    </Text>
                    <View style={styles.chartBarTrack}>
                      <View
                        style={[
                          styles.chartBar,
                          { width: barWidth },
                          isCurrentMonth && styles.chartBarCurrent,
                          m.total === 0 && styles.chartBarEmpty,
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartAmount, isCurrentMonth && styles.chartLabelBold]}>
                      {m.total > 0 ? formatCurrency(m.total) : ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            {active.length > 0 && (
              <>
                <View style={profileStyles.divider} />
                <View style={profileStyles.row}>
                  <Ionicons
                    name="cart-outline"
                    size={20}
                    color="#2D6A4F"
                    style={profileStyles.rowIcon}
                  />
                  <View style={profileStyles.rowBody}>
                    <Text style={profileStyles.rowLabel}>Total trips tracked</Text>
                  </View>
                  <Text style={profileStyles.rowValue}>
                    {active.reduce((s, m) => s + m.trips, 0)}
                  </Text>
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.spendingEmpty}>
            <Text style={styles.spendingEmptyText}>
              Complete a shopping list with prices to see your spending history.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 12 },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#F0F0F0' },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  statTrend: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  trendUp: { color: '#E53935' },
  trendDown: { color: '#2D6A4F' },
  chartContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chartRow: { flexDirection: 'row', alignItems: 'center', height: 22 },
  chartLabel: { width: 32, fontSize: 11, color: '#888', fontWeight: '400' },
  chartLabelBold: { fontWeight: '700', color: '#1A1A1A' },
  chartBarTrack: { flex: 1, marginHorizontal: 8 },
  chartBar: { height: 10, borderRadius: 5, backgroundColor: '#A8D5BF' },
  chartBarCurrent: { backgroundColor: '#2D6A4F' },
  chartBarEmpty: { backgroundColor: '#F0F0F0', width: 2 },
  chartAmount: { width: 56, fontSize: 11, color: '#888', textAlign: 'right' },
  spendingEmpty: { padding: 20 },
  spendingEmptyText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18 },
});
