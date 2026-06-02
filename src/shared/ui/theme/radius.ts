export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  pill: 999,
} as const;

export type Radius = typeof radius;
