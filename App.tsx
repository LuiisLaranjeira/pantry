import { StatusBar } from 'expo-status-bar';

import { RootNavigator } from '@/app/navigation/RootNavigator';
import { QueryProvider } from '@/app/providers/QueryProvider';
import '@/config/env';

export default function App() {
  return (
    <QueryProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </QueryProvider>
  );
}
