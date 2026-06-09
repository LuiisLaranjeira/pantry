import { readAsStringAsync } from 'expo-file-system';
import { useMutation } from '@tanstack/react-query';

import { parseReceipt, type ParsedReceipt } from '@/features/scan/api/parseReceipt';
import { AppError } from '@/shared/api/errors';

export function useParseReceipt() {
  return useMutation<ParsedReceipt, Error, string>({
    mutationFn: async (photoUri) => {
      let imageBase64: string;
      try {
        imageBase64 = await readAsStringAsync(photoUri, { encoding: 'base64' });
      } catch (err) {
        throw new AppError('unknown', 'Could not read photo.', err);
      }
      return parseReceipt(imageBase64);
    },
  });
}
