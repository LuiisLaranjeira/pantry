import { StatusBar } from 'expo-status-bar';

import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { AppStateProvider } from '@/app/providers/AppStateProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { initSentry } from '@/shared/observability/sentry';
import { ThemeProvider } from '@/shared/ui/theme';
import '@/config/env';

initSentry();

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <QueryProvider>
          <AppStateProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </AppStateProvider>
        </QueryProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
