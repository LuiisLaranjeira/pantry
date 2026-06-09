import type { ExpoConfig } from 'expo/config';

type Variant = 'development' | 'preview' | 'production';

const EAS_PROJECT_ID = 'e499f549-e0a5-4ef6-9cbd-365c5251a97d';
const BASE_BUNDLE = 'com.luiislaranjeira.pantry';
const BASE_NAME = 'Pantry';

const variant: Variant =
  (process.env.EXPO_PUBLIC_APP_VARIANT as Variant | undefined) ?? 'development';

function bundleIdentifier(): string {
  return variant === 'production' ? BASE_BUNDLE : `${BASE_BUNDLE}.${variant}`;
}

function appName(): string {
  if (variant === 'production') return BASE_NAME;
  if (variant === 'preview') return `${BASE_NAME} (Preview)`;
  return `${BASE_NAME} (Dev)`;
}

const config: ExpoConfig = {
  name: appName(),
  slug: 'pantry',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleIdentifier(),
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
    package: bundleIdentifier(),
  },
  plugins: [
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow Pantry to access your camera to scan barcodes and identify products.',
      },
    ],
    ['expo-notifications', { iosDisplayInForeground: true }],
    '@sentry/react-native',
  ],
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
    appVariant: variant,
  },
};

export default config;
