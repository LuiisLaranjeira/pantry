import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { useEffect, type PropsWithChildren } from 'react';

import i18n from '@/shared/lib/i18n';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

const SUPPORTED = new Set(['en', 'pt', 'es', 'fr', 'de', 'zh']);

export function LanguageProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.language)
      .then((stored) => {
        const deviceLng = getLocales()[0]?.languageCode ?? 'en';
        const raw = stored ?? deviceLng;
        const lng = SUPPORTED.has(raw) ? raw : 'en';
        if (i18n.language !== lng) {
          i18n.changeLanguage(lng).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
