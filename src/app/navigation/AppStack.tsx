import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ReceiptScanScreen } from '@/features/scan/screens/ReceiptScanScreen';
import { ScanScreen } from '@/features/scan/screens/ScanScreen';

import { MainTabs } from './MainTabs';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{ headerShown: true, title: 'Scan product' }}
      />
      <Stack.Screen
        name="ReceiptScan"
        component={ReceiptScanScreen}
        options={{ headerShown: true, title: 'Scan receipt' }}
      />
    </Stack.Navigator>
  );
}
