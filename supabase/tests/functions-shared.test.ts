/**
 * Unit tests for the edge-function shared utilities.
 * These tests run in Node (no live Supabase required) via:
 *   npm run test:functions
 */

import {
  validateBase64Image,
  validateText,
  detectImageMime,
  MAX_BASE64_LENGTH,
  MAX_TEXT_LENGTH,
} from '../functions/_shared/validation';
import { HttpError, jsonResponse, toErrorResponse } from '../functions/_shared/http';

// ─── HttpError ───────────────────────────────────────────────────────────────

describe('HttpError', () => {
  it('stores the status and message', () => {
    const err = new HttpError(404, 'Not found');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('HttpError');
  });

  it('is an instanceof Error', () => {
    expect(new HttpError(400, 'Bad')).toBeInstanceOf(Error);
  });
});

// ─── jsonResponse ────────────────────────────────────────────────────────────

describe('jsonResponse', () => {
  it('sets Content-Type to application/json', async () => {
    const r = jsonResponse({ ok: true });
    expect(r.headers.get('Content-Type')).toBe('application/json');
  });

  it('sets the CORS Allow-Origin header', () => {
    const r = jsonResponse({});
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('serialises the body as JSON', async () => {
    const r = jsonResponse({ value: 42 });
    expect(await r.json()).toEqual({ value: 42 });
  });

  it('defaults to HTTP 200', () => {
    expect(jsonResponse({}).status).toBe(200);
  });

  it('accepts a custom status', () => {
    expect(jsonResponse({}, { status: 201 }).status).toBe(201);
  });
});

// ─── toErrorResponse ─────────────────────────────────────────────────────────

describe('toErrorResponse', () => {
  it('returns the HttpError status and message for HttpError instances', async () => {
    const r = toErrorResponse(new HttpError(422, 'Unprocessable'));
    expect(r.status).toBe(422);
    expect(await r.json()).toEqual({ error: 'Unprocessable' });
  });

  it('returns 500 for non-HttpError errors', async () => {
    const r = toErrorResponse(new Error('unexpected'));
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: 'Internal error' });
  });

  it('returns 500 for non-Error values (string, number)', async () => {
    expect(toErrorResponse('oops').status).toBe(500);
    expect(toErrorResponse(42).status).toBe(500);
  });
});

// ─── validateBase64Image ─────────────────────────────────────────────────────

// A 1×1 white JPEG in base64 (reliably valid for atob checks).
const VALID_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwg' +
  'JC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC' +
  'AABAAEDASIAABEBAXEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/' +
  'xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJgAB/9k=';

describe('validateBase64Image', () => {
  it('accepts a valid base64 string', () => {
    expect(() => validateBase64Image(VALID_JPEG_B64)).not.toThrow();
    expect(validateBase64Image(VALID_JPEG_B64)).toBe(VALID_JPEG_B64);
  });

  it('throws 400 for a non-string value', () => {
    expect(() => validateBase64Image(123)).toThrow(HttpError);
    try {
      validateBase64Image(null);
    } catch (e) {
      expect((e as HttpError).status).toBe(400);
    }
  });

  it('throws 400 for an empty string', () => {
    expect(() => validateBase64Image('')).toThrow(HttpError);
  });

  it('throws 400 for a string that is not valid base64', () => {
    expect(() => validateBase64Image('!!!not-base64!!!')).toThrow(HttpError);
  });

  it('throws 413 when the base64 string exceeds the maximum allowed size', () => {
    const oversized = 'A'.repeat(MAX_BASE64_LENGTH + 1);
    try {
      validateBase64Image(oversized);
    } catch (e) {
      expect((e as HttpError).status).toBe(413);
    }
  });
});

// ─── validateText ────────────────────────────────────────────────────────────

describe('validateText', () => {
  it('accepts a non-empty text string', () => {
    expect(() => validateText('hello world')).not.toThrow();
    expect(validateText('hello world')).toBe('hello world');
  });

  it('throws 400 for a non-string value', () => {
    expect(() => validateText(42)).toThrow(HttpError);
  });

  it('throws 400 for an empty string', () => {
    expect(() => validateText('')).toThrow(HttpError);
  });

  it('throws 400 for a whitespace-only string', () => {
    expect(() => validateText('   ')).toThrow(HttpError);
  });

  it('throws 413 when the text exceeds the maximum allowed size', () => {
    const oversized = 'a'.repeat(MAX_TEXT_LENGTH + 1);
    try {
      validateText(oversized);
    } catch (e) {
      expect((e as HttpError).status).toBe(413);
    }
  });
});

// ─── detectImageMime ─────────────────────────────────────────────────────────

describe('detectImageMime', () => {
  // PNG magic bytes: \x89PNG (base64 of first 4 bytes = iVBORw0KGgo=)
  const PNG_B64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  it('detects PNG from magic bytes', () => {
    expect(detectImageMime(PNG_B64)).toBe('image/png');
  });

  it('returns image/jpeg for a JPEG base64 string', () => {
    expect(detectImageMime(VALID_JPEG_B64)).toBe('image/jpeg');
  });

  it('falls back to image/jpeg for an unrecognised header', () => {
    // Random valid base64 that is not PNG
    expect(detectImageMime('AAAA')).toBe('image/jpeg');
  });
});
