import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { STORAGE_KEYS } from '@/shared/lib/storageKeys';

export function useLanguage() {
  const { i18n } = useTranslation();

  const setLanguage = useCallback(
    async (code: string) => {
      await Promise.all([
        i18n.changeLanguage(code),
        AsyncStorage.setItem(STORAGE_KEYS.language, code),
      ]);
    },
    [i18n],
  );

  return { language: i18n.language, setLanguage };
}
