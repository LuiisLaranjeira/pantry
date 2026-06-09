const variant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development';

export function appScheme(): string {
  return variant === 'production' ? 'pantry' : `pantry.${variant}`;
}
