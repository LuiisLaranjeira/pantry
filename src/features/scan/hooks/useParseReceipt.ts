import { readAsStringAsync } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useMutation } from '@tanstack/react-query';

import { parseReceipt, type ParsedReceipt } from '@/features/scan/api/parseReceipt';
import { AppError } from '@/shared/api/errors';

// Receipt photos rarely need more than 1600px width for accurate OCR,
// and the edge function caps base64 input at ~3.75 MB. Resizing before
// encoding keeps uploads fast and within the limit on any device.
const MAX_WIDTH = 1600;

export function useParseReceipt() {
  return useMutation<ParsedReceipt, Error, string>({
    mutationFn: async (photoUri) => {
      let imageBase64: string;
      try {
        const resized = await manipulateAsync(photoUri, [{ resize: { width: MAX_WIDTH } }], {
          compress: 0.82,
          format: SaveFormat.JPEG,
        });
        imageBase64 = await readAsStringAsync(resized.uri, { encoding: 'base64' });
      } catch (err) {
        throw new AppError('unknown', 'Could not read photo.', err);
      }
      return parseReceipt(imageBase64);
    },
  });
}
