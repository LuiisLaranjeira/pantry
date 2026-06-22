import type { Adapter } from '../types.js';
import { continente } from './continente.js';
import { pingoDoce } from './pingo-doce.js';

/**
 * Registry mapping a store's `slug` (from the `stores` table) to its adapter.
 * Stores without an entry here are skipped by the orchestrator.
 */
export const adapters: Record<string, Adapter> = {
  continente,
  'pingo-doce': pingoDoce,
};
