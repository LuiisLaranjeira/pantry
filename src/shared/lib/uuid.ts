import * as Crypto from 'expo-crypto';

export function uuid(): string {
  return Crypto.randomUUID();
}

export function manualBarcode(): string {
  return `manual_${uuid()}`;
}
