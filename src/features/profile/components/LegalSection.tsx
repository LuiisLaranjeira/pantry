import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { useProfileStyles } from '@/features/profile/components/styles';
import { useTheme } from '@/shared/ui';

interface Props {
  privacyUrl: string | null | undefined;
  termsUrl: string | null | undefined;
  onOpenUrl: (url: string) => void;
}

export function LegalSection({ privacyUrl, termsUrl, onOpenUrl }: Props) {
  const styles = useProfileStyles();
  const { colors } = useTheme();

  if (!privacyUrl && !termsUrl) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal</Text>
      <View style={styles.card}>
        {privacyUrl && (
          <TouchableOpacity style={styles.row} onPress={() => onOpenUrl(privacyUrl)}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Privacy policy</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        )}
        {privacyUrl && termsUrl && <View style={styles.divider} />}
        {termsUrl && (
          <TouchableOpacity style={styles.row} onPress={() => onOpenUrl(termsUrl)}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.primary.base}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Terms of service</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
