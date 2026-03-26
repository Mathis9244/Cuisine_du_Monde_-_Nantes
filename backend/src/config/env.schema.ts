import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),

  // Existing admin JWT (kept for backwards compatibility)
  JWT_SECRET: z.string().min(16).optional(),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ENABLE_STARTUP_IMPORT: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),

  SUPABASE_IMPORT_TABLE: z.string().optional(),
  SUPABASE_IMPORT_MARKER_TABLE: z.string().optional(),
}).passthrough();

export type Env = z.infer<typeof envSchema>;

export function getValidatedEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.') || 'env'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

