import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './colors';
import { elevation, type Elevation } from './elevation';
import { radius, type Radius } from './radius';
import { spacing, type Spacing } from './spacing';
import { typography, type Typography } from './typography';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: Palette;
  spacing: Spacing;
  typography: Typography;
  radius: Radius;
  elevation: Elevation;
}

const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps extends PropsWithChildren {
  /** Override the system scheme. If omitted, follows the device. */
  override?: ThemeMode;
}

export function ThemeProvider({ children, override }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const mode: ThemeMode = override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const theme = useMemo<Theme>(
    () => ({
      mode,
      colors: mode === 'dark' ? darkPalette : lightPalette,
      spacing,
      typography,
      radius,
      elevation,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return value;
}
