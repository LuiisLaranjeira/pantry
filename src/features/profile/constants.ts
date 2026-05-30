import type { StockLogAction } from '@/features/stock/api/stockRepo';

export const COUNTRIES = [
  { code: 'pt', name: 'Portugal' },
  { code: 'br', name: 'Brazil' },
  { code: 'es', name: 'Spain' },
  { code: 'fr', name: 'France' },
  { code: 'it', name: 'Italy' },
  { code: 'de', name: 'Germany' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'us', name: 'United States' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'be', name: 'Belgium' },
  { code: 'pl', name: 'Poland' },
  { code: 'at', name: 'Austria' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'ro', name: 'Romania' },
] as const;

export const ACTION_META: Record<StockLogAction, { icon: string; color: string; label: string }> = {
  consume: { icon: 'remove-circle-outline', color: '#E53935', label: 'Consumed' },
  restock: { icon: 'add-circle-outline', color: '#2D6A4F', label: 'Restocked' },
  add: { icon: 'archive-outline', color: '#1565C0', label: 'Added' },
  remove: { icon: 'trash-outline', color: '#888', label: 'Removed' },
};
