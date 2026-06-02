import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppState } from '@/app/providers/AppStateProvider';
import { useTheme } from '@/shared/ui/theme';

import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { HouseholdStack } from './HouseholdStack';

export function RootNavigator() {
  const { state } = useAppState();
  const { mode, colors } = useTheme();

  const navTheme = useMemo<NavTheme>(() => {
    const base = mode === 'dark' ? NavDarkTheme : NavDefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary.base,
        background: colors.bg.default,
        card: colors.bg.surface,
        text: colors.text.primary,
        border: colors.border.subtle,
        notification: colors.danger.base,
      },
    };
  }, [mode, colors]);

  if (state === 'loading') {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg.default }]}>
        <ActivityIndicator color={colors.primary.base} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {state === 'auth' && <AuthStack />}
      {state === 'household' && <HouseholdStack />}
      {state === 'app' && <AppStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
