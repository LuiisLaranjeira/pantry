import { env } from '@/config/env';
import { authRepo } from '@/features/auth/api/authRepo';
import { AppError } from '@/shared/api/errors';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number | null;
}

export interface ParsedReceipt {
  store: string | null;
  items: ReceiptItem[];
}

export async function parseReceipt(text: string): Promise<ParsedReceipt> {
  const functionsUrl = env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!functionsUrl) {
    throw new AppError('validation', 'EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL is not configured.');
  }

  const session = await authRepo.getSession();
  if (!session) throw new AppError('auth', 'Not signed in.');

  let response: Response;
  try {
    response = await fetch(`${functionsUrl}/parse-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    throw new AppError('network', 'Could not reach the parse-receipt service.', err);
  }

  if (!response.ok) {
    throw new AppError('unknown', `parse-receipt responded ${response.status}.`);
  }

  const data = (await response.json()) as { store?: string; items?: unknown; error?: string };
  if (data.error) throw new AppError('unknown', data.error);

  const rawItems = Array.isArray(data.items) ? data.items : [];
  if (rawItems.length === 0) {
    throw new AppError('not_found', 'No items found on receipt.');
  }

  const items: ReceiptItem[] = rawItems
    .map((raw) => normalizeItem(raw))
    .filter((item): item is ReceiptItem => item !== null);

  if (items.length === 0) {
    throw new AppError('not_found', 'No items found on receipt.');
  }

  return { store: data.store ?? null, items };
}

function normalizeItem(raw: unknown): ReceiptItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name : '';
  if (!name) return null;
  const quantity = Math.max(1, Math.round(Number(obj.quantity) || 1));
  const priceNum = obj.unit_price == null ? null : Number(obj.unit_price);
  const unit_price = priceNum != null && !Number.isNaN(priceNum) ? priceNum : null;
  return { name, quantity, unit_price };
}
