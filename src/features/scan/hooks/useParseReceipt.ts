import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useMutation } from '@tanstack/react-query';

import { parseReceipt, type ParsedReceipt } from '@/features/scan/api/parseReceipt';
import { AppError } from '@/shared/api/errors';

export function useParseReceipt() {
  return useMutation<ParsedReceipt, Error, string>({
    mutationFn: async (photoUri) => {
      let recognized: { text?: string };
      try {
        recognized = await TextRecognition.recognize(photoUri);
      } catch (err) {
        throw new AppError('unknown', 'Could not read text from photo.', err);
      }
      const text = recognized.text?.trim();
      if (!text) throw new AppError('not_found', 'No text found on receipt.');
      return parseReceipt(text);
    },
  });
}
