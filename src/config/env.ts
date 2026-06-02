import { z } from 'zod';

const EnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL: z.string().url().optional(),
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const parsed = EnvSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL: process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(
    `Invalid environment configuration. Check your .env file and EAS build profile.\n${issues}`,
  );
}

export const env = parsed.data;
