import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '@/app/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Text style={styles.body}>
        Not migrated yet. Tracked as the next screen in the pantry2 → pantry-prod migration.
      </Text>
      <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Back to sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FA',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#2D6A4F', marginBottom: 12 },
  body: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 32 },
  link: { alignItems: 'center' },
  linkText: { color: '#2D6A4F', fontSize: 14 },
});
