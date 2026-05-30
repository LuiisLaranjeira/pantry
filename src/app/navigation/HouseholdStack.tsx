import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HouseholdScreen } from '@/features/household/screens/HouseholdScreen';

import type { HouseholdStackParamList } from './types';

const Stack = createNativeStackNavigator<HouseholdStackParamList>();

export function HouseholdStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Household" component={HouseholdScreen} />
    </Stack.Navigator>
  );
}
