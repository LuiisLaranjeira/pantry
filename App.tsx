import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { AppStateProvider } from '@/app/providers/AppStateProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { HouseholdProvider } from '@/app/providers/HouseholdProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { OTAUpdates } from '@/app/providers/OTAUpdates';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { initSentry } from '@/shared/observability/sentry';
import { ThemeProvider } from '@/shared/ui/theme';
import '@/config/env';
import '@/shared/lib/i18n';

initSentry();

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <OTAUpdates />
          <LanguageProvider>
            <QueryProvider>
              <AuthProvider>
                <HouseholdProvider>
                  <AppStateProvider>
                    <RootNavigator />
                    <StatusBar style="auto" />
                  </AppStateProvider>
                </HouseholdProvider>
              </AuthProvider>
            </QueryProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
