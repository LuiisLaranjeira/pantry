import { StatusBar } from 'expo-status-bar';

import { RootNavigator } from '@/app/navigation/RootNavigator';
import { AppStateProvider } from '@/app/providers/AppStateProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';
import '@/config/env';

export default function App() {
  return (
    <QueryProvider>
      <AppStateProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AppStateProvider>
    </QueryProvider>
  );
}
