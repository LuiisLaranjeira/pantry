import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppState } from '@/app/providers/AppStateProvider';

import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { HouseholdStack } from './HouseholdStack';

export function RootNavigator() {
  const { state } = useAppState();

  if (state === 'loading') {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#2D6A4F" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {state === 'auth' && <AuthStack />}
      {state === 'household' && <HouseholdStack />}
      {state === 'app' && <AppStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
