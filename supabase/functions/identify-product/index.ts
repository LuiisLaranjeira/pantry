import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, HttpError, jsonResponse, toErrorResponse } from '../_shared/http.ts';
import { enforceRateLimit } from '../_shared/rate_limit.ts';
import { detectImageMime, validateBase64Image } from '../_shared/validation.ts';

const RATE_LIMIT = { windowMs: 60_000, max: 20 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const user = await requireUser(req);
    await enforceRateLimit(user.id, 'identify-product', RATE_LIMIT);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new HttpError(400, 'Invalid JSON body');
    }

    const { image, barcode } = body as { image?: unknown; barcode?: unknown };
    const validatedImage = validateBase64Image(image);
    const mimeType = detectImageMime(validatedImage);

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      throw new HttpError(500, 'GROQ_API_KEY not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${validatedImage}` },
              },
              {
                type: 'text',
                text: 'Identify this grocery product from the label photo. The "name" field must always be filled — use the product type if no full name is visible (e.g. "Semi-skimmed Milk", "Tomato Sauce"). Return JSON only with these exact fields: { "name": string, "brand": string | null, "category": string | null, "package_unit": string | null }. Example: { "name": "Tomato Ketchup", "brand": "Heinz", "category": "condiments", "package_unit": "500g" }. Do not include markdown or any text outside the JSON object.',
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Groq API error:', response.status, errBody);
      throw new HttpError(502, `Groq API error: ${response.status}`);
    }

    const ai = await response.json();
    const text = ai.choices?.[0]?.message?.content ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in Groq response:', text);
      throw new HttpError(502, 'Could not parse AI response');
    }

    const product = JSON.parse(jsonMatch[0]);
    return jsonResponse({ ...product, barcode: typeof barcode === 'string' ? barcode : null });
  } catch (err) {
    return toErrorResponse(err);
  }
});
