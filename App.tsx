import { StatusBar } from 'expo-status-bar';

import { RootNavigator } from '@/app/navigation/RootNavigator';
import { AppStateProvider } from '@/app/providers/AppStateProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { ThemeProvider } from '@/shared/ui/theme';
import '@/config/env';

export default function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AppStateProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </AppStateProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
