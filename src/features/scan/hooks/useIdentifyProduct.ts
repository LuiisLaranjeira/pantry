import { useMutation } from '@tanstack/react-query';

import { identifyProduct } from '@/features/scan/api/identifyProduct';
import type { PartialProduct } from '@/shared/types/domain';

interface Input {
  base64: string;
  barcode: string | null;
}

export function useIdentifyProduct() {
  return useMutation<Omit<PartialProduct, 'country'>, Error, Input>({
    mutationFn: identifyProduct,
  });
}
