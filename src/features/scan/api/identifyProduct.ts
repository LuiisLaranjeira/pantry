import { env } from '@/config/env';
import { authRepo } from '@/features/auth/api/authRepo';
import { AppError } from '@/shared/api/errors';
import type { PartialProduct } from '@/shared/types/domain';

interface IdentifyResult {
  name: string;
  brand: string | null;
  category: string | null;
  package_unit: string | null;
}

export async function identifyProduct(input: {
  base64: string;
  barcode: string | null;
}): Promise<Omit<PartialProduct, 'country'>> {
  const functionsUrl = env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!functionsUrl) {
    throw new AppError('validation', 'EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL is not configured.');
  }

  const session = await authRepo.getSession();
  if (!session) throw new AppError('auth', 'Not signed in.');

  let response: Response;
  try {
    response = await fetch(`${functionsUrl}/identify-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ image: input.base64, barcode: input.barcode }),
    });
  } catch (err) {
    throw new AppError('network', 'Could not reach the identify-product service.', err);
  }

  if (!response.ok) {
    throw new AppError('unknown', `identify-product responded ${response.status}.`);
  }

  const data = (await response.json()) as Partial<IdentifyResult> & { error?: string };
  if (data.error) throw new AppError('unknown', data.error);
  if (!data.name) throw new AppError('not_found', 'Could not identify product.');

  return {
    barcode: input.barcode ?? '',
    name: data.name,
    brand: data.brand ?? null,
    category: data.category ?? null,
    package_unit: data.package_unit ?? null,
    unit_price: null,
  };
}
