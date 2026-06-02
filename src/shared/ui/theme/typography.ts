import type { TextStyle } from 'react-native';

export const typography = {
  size: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 22,
    display: 28,
    hero: 36,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  } satisfies Record<string, TextStyle['fontWeight']>,
} as const;

export type Typography = typeof typography;
