import { HttpError } from './http.ts';

export const MAX_BASE64_LENGTH = 5 * 1024 * 1024; // ~3.75 MB binary after decode
export const MAX_TEXT_LENGTH = 50 * 1024; // 50 KB OCR text

export function validateBase64Image(image: unknown): string {
  if (typeof image !== 'string' || image.length === 0) {
    throw new HttpError(400, 'image must be a non-empty base64 string');
  }
  if (image.length > MAX_BASE64_LENGTH) {
    throw new HttpError(413, `image exceeds maximum size of ${MAX_BASE64_LENGTH} bytes (base64)`);
  }
  // Cheap front-end sanity check: decode the first chunk to make sure it's
  // actually base64. A full atob would be expensive; the magic-byte check
  // we already do downstream covers the rest.
  try {
    atob(image.slice(0, 32));
  } catch {
    throw new HttpError(400, 'image is not valid base64');
  }
  return image;
}

export function validateText(text: unknown): string {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new HttpError(400, 'text must be a non-empty string');
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new HttpError(413, `text exceeds maximum size of ${MAX_TEXT_LENGTH} bytes`);
  }
  return text;
}

export function detectImageMime(base64: string): string {
  try {
    const header = atob(base64.slice(0, 16));
    return header.startsWith('\x89PNG') ? 'image/png' : 'image/jpeg';
  } catch {
    return 'image/jpeg';
  }
}
