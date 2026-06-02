import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

import { lookupBarcode } from '@/features/scan/api/openFoodFacts';
import { productRepo } from '@/shared/api/productRepo';
import { STORAGE_KEYS } from '@/shared/lib/storageKeys';
import type { PartialProduct, Product } from '@/shared/types/domain';

export interface BarcodeResolution {
  local: Product | null;
  remote: PartialProduct | null;
  country: string | null;
}

export function useResolveBarcode() {
  return useMutation<BarcodeResolution, Error, string>({
    mutationFn: async (barcode) => {
      const country = await AsyncStorage.getItem(STORAGE_KEYS.householdCountry);
      const [local, remote] = await Promise.all([
        productRepo.byBarcode(barcode),
        lookupBarcode(barcode, country),
      ]);
      return { local, remote, country };
    },
  });
}
