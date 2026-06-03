import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, HttpError, jsonResponse, toErrorResponse } from '../_shared/http.ts';
import { enforceRateLimit } from '../_shared/rate_limit.ts';
import { detectImageMime, validateBase64Image, validateText } from '../_shared/validation.ts';

const RATE_LIMIT = { windowMs: 60_000, max: 20 };

const PARSE_PROMPT = (input: string) => `
STEP 1 — DETECT LANGUAGE AND FORMAT:
- Language/locale (Portuguese, English, Spanish, French, German, Italian, etc.)
- Price format: comma decimal (1,29) or dot decimal (1.29)
- Savings/discount keywords present. Known patterns by language:
  PT: POUPANCA, POUPANÇA, POUPA, DESCONTO, DESCONTO DIRETO, ACUMULA, ACUMULA EM CARTAO, ECONOMIZOU, CARTAO CLIENTE, OFERTA
  EN: SAVINGS, YOU SAVED, DISCOUNT, MEMBER PRICE, OFFER, COUPON
  ES: AHORRO, DESCUENTO  |  FR: ÉCONOMIE, REMISE  |  DE: RABATT, ERSPARNIS

STEP 2 — DETECT LINE STRUCTURE:
Identify which layout this receipt uses:
  A) "(VAT) NAME    PRICE" — name and price on the same line, price right-aligned
  B) NAME on one line, PRICE on the next indented line
  C) "QTY × NAME    TOTAL" — quantity prefix then total on same line
  D) NAME with total right-aligned, then "N X unit_price" on the next line
Also note: do savings lines appear directly below the product they relate to?

STEP 3 — IDENTIFY LINES TO EXCLUDE:
Do NOT include as items:
- VAT/IVA category prefix codes: "(A)", "(B)", "(C)" — strip from name, not part of it
- Section headers: lines ending with ":" (e.g. "Mercearia Salgada:", "Limpeza do Lar:") — skip entirely
- Savings/discount lines: POUPANCA, POUPANÇA, POUPA, DESCONTO, DESCONTO DIRETO, ACUMULA, ACUMULA EM CARTAO, ECONOMIZOU, CARTAO CLIENTE, SAVINGS, YOU SAVED, DISCOUNT, AHORRO, DESCUENTO, ÉCONOMIE, RABATT — these words are NEVER product names. Any line starting with one of these words must be completely ignored.
- Quantity breakdown lines: a line that is ONLY "N X price" or "N × price" is not a product — it provides qty/unit for the product above (see Step 4)
- Negative prices
- Subtotals, totals, grand totals (SUBTOTAL, TOTAL A PAGAR, etc.)
- Tax / VAT / IVA breakdown lines
- Payment lines (cash, card, MB WAY, multibanco, change, PIN, visa, mastercard, cartao credito)
- Loyalty points, stamps, vouchers
- Store address, cashier, NIF, receipt number, date, time, ATCUD
- Bag charges, delivery fees

STEP 4 — EXTRACT ITEMS:
For each non-excluded product line:
1. Strip the leading VAT code "(A)", "(B)", or "(C)".
2. Determine quantity and unit_price:
   a. BREAKDOWN LINE: If the line immediately after the product is a standalone "N X price" or "N × price" (e.g. "4 X 0,89", "2 × 1,15"):
      → quantity = N, unit_price = the per-unit price from that line
      → The total on the product line is confirmation only — do NOT use it as unit_price
      Examples:
        "(A) ATUM AO NATURAL CNT EQ 85GR  3,56" + next "4 X 0,89" → qty: 4, unit_price: 0.89
        "(A) ERVILHAS CONTINENTE 1KG  2,98" + next "2 X 1,49" → qty: 2, unit_price: 1.49
        "(C) TAB CHOCOLATE BRANCO  2,30" + next "2 X 1,15" → qty: 2, unit_price: 1.15
   b. Otherwise: quantity = 1, unit_price = the price on the product's own line
3. Expand abbreviated names into clear readable English. Include package size when visible.
   Examples:
   "COGUMELOS LAMINADOS CNT 185GR" → "Sliced Mushrooms 185g"
   "ATUM AO NATURAL CNT EQ 85GR" → "Tuna in Water 85g"
   "AZ VE SELECIONADO GALLO 500ML" → "Gallo Selected Olive Oil 500ml"
   "ALETRIA MILANEZA 500G" → "Milaneza Angel Hair Pasta 500g"
   "MASSA MACAR RISC MILANEZA 500G" → "Milaneza Rigatoni Pasta 500g"
   "OLEO ALIMENTAR FULA SUPER 5 1LT" → "Fula Sunflower Oil 1L"
   "ERVILHAS CONTINENTE 1KG" → "Continente Peas 1kg"
   "CEREAIS ESTRELITAS MEL 750G" → "Estrelitas Honey Cereal 750g"
4. unit_price: decimal number, no currency symbol.
   - Convert comma decimals: "1,29" → 1.29
   - Weight-based "0,453 kg × 5,49/kg = 2,49": quantity 1, unit_price 2.49
   - Missing or unreadable: null

${input}

Return ONLY valid JSON, no markdown, no code fences:
{
  "language": "detected language",
  "price_format": "comma or dot",
  "layout": "A, B, C, or D",
  "store": "store name or null",
  "items": [
    { "name": "product name", "quantity": 1, "unit_price": 1.99 }
  ]
}`;

const SAVINGS_PREFIXES = [
  'POUPANCA',
  'POUPANÇA',
  'POUPA',
  'DESCONTO DIRETO',
  'DESCONTO',
  'ACUMULA EM CARTAO',
  'ACUMULA',
  'ECONOMIZOU',
  'CARTAO CLIENTE',
  'SAVINGS',
  'YOU SAVED',
  'DISCOUNT',
  'AHORRO',
  'DESCUENTO',
  'ÉCONOMIE',
  'RABATT',
];

function stripSavingsPrefix(name: string): string {
  const upper = name.toUpperCase().trimStart();
  for (const prefix of SAVINGS_PREFIXES) {
    if (upper.startsWith(prefix)) {
      return name.slice(name.toUpperCase().indexOf(prefix) + prefix.length).trimStart();
    }
  }
  return name;
}

async function logScan(params: {
  userId: string;
  mode: 'text' | 'image';
  success: boolean;
  store?: string | null;
  items?: unknown[];
  ocrText?: string | null;
  errorMessage?: string | null;
}) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return;
  await fetch(`${supabaseUrl}/rest/v1/receipt_scan_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: params.userId,
      mode: params.mode,
      success: params.success,
      store: params.store ?? null,
      items_count: params.items?.length ?? 0,
      items: params.items ?? null,
      ocr_text: params.ocrText ?? null,
      error_message: params.errorMessage ?? null,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let userId: string | null = null;
  let useTextMode = false;
  let receiptText: string | null = null;

  try {
    const user = await requireUser(req);
    userId = user.id;
    await enforceRateLimit(user.id, 'parse-receipt', RATE_LIMIT);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new HttpError(400, 'Invalid JSON body');
    }

    const { image, text } = body as { image?: unknown; text?: unknown };
    if (!image && !text) {
      throw new HttpError(400, 'No image or text provided');
    }

    useTextMode = typeof text === 'string' && text.trim().length > 0;
    const validatedImage = useTextMode ? null : validateBase64Image(image);
    const validatedText = useTextMode ? validateText(text) : null;
    if (useTextMode) receiptText = validatedText;

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      throw new HttpError(500, 'GROQ_API_KEY not configured');
    }

    // Text mode: on-device OCR (dev build) → fast text model, no image transfer.
    // Image mode: Expo Go fallback → vision model.
    const messages = useTextMode
      ? [
          {
            role: 'system' as const,
            content:
              'You are an expert receipt parser. You receive raw OCR text from a grocery receipt and extract purchased items into structured JSON.',
          },
          {
            role: 'user' as const,
            content: PARSE_PROMPT(`OCR TEXT:\n${validatedText}`),
          },
        ]
      : [
          {
            role: 'user' as const,
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${detectImageMime(validatedImage!)};base64,${validatedImage}`,
                },
              },
              {
                type: 'text',
                text: PARSE_PROMPT('Analyze the receipt image above.'),
              },
            ],
          },
        ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: useTextMode
          ? 'llama-3.3-70b-versatile'
          : 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Groq API error:', response.status, errBody);
      await logScan({
        userId: user.id,
        mode: useTextMode ? 'text' : 'image',
        success: false,
        ocrText: receiptText,
        errorMessage: `Groq API error: ${response.status}`,
      });
      throw new HttpError(502, `Groq API error: ${response.status}`);
    }

    const ai = await response.json();
    const content = ai.choices?.[0]?.message?.content ?? '';

    let parsed: { store?: string | null; items?: unknown[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error('Failed to parse Groq response:', content);
      await logScan({
        userId: user.id,
        mode: useTextMode ? 'text' : 'image',
        success: false,
        ocrText: receiptText,
        errorMessage: 'Could not parse AI response',
      });
      throw new HttpError(502, 'Could not parse AI response');
    }

    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    const items = rawItems
      // deno-lint-ignore no-explicit-any
      .map((item: any) => ({ ...item, name: stripSavingsPrefix(String(item.name ?? '')) }))
      // deno-lint-ignore no-explicit-any
      .filter((item: any) => item.name.trim().length > 0);

    await logScan({
      userId: user.id,
      mode: useTextMode ? 'text' : 'image',
      success: true,
      store: parsed.store ?? null,
      items,
      ocrText: receiptText,
    });

    return jsonResponse({ store: parsed.store ?? null, items });
  } catch (err) {
    if (userId && !(err instanceof HttpError && err.status === 429)) {
      // Best-effort: record failed attempts (skip rate-limit 429 to avoid
      // self-reinforcing noise).
      await logScan({
        userId,
        mode: useTextMode ? 'text' : 'image',
        success: false,
        ocrText: receiptText,
        errorMessage: err instanceof Error ? err.message : String(err),
      }).catch(() => {
        // ignore — already in an error path
      });
    }
    return toErrorResponse(err);
  }
});
