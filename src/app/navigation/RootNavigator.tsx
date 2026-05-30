import { NavigationContainer } from '@react-navigation/native';

import { AuthStack } from './AuthStack';

export function RootNavigator() {
  return (
    <NavigationContainer>
      <AuthStack />
    </NavigationContainer>
  );
}
