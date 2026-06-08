import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/ui';

interface Props {
  title: string;
}

export function CategorySectionHeader({ title }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg.default }]}>
      <Text style={[styles.title, { color: colors.text.muted }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});
