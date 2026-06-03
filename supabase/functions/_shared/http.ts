// HTTP utilities shared by edge functions.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

export function toErrorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return jsonResponse({ error: err.message }, { status: err.status });
  }
  console.error('unhandled error', err);
  return jsonResponse({ error: 'Internal error' }, { status: 500 });
}
