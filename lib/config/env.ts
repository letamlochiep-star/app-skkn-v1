import { z } from "zod";

/**
 * Client Environment Variables Schema
 * These are prefixed with NEXT_PUBLIC_ and safe for browser bundle.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
});

/**
 * Server Environment Variables Schema
 * Strictly kept on the server. Never exposed to the browser.
 */
export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  GEMINI_API_KEY: z.string().min(1, "Gemini API key is required"),
  AI_PRIMARY_PROVIDER: z.enum(["openai", "gemini"]).default("openai"),
  AI_FALLBACK_PROVIDER: z.enum(["openai", "gemini"]).default("gemini"),
  AI_CLASSIFY_MODEL: z.string().default("gpt-4o-mini"),
  AI_EXTRACT_MODEL: z.string().default("gpt-4o-mini"),
  AI_DRAFT_MODEL: z.string().default("gpt-4o"),
  AI_REVIEW_MODEL: z.string().default("gpt-4o"),
  AI_FINALIZE_MODEL: z.string().default("gpt-4o"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates and retrieves client-safe environment variables.
 */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`[Config Error] Invalid Client Environment Variables: ${errorDetails}`);
  }

  return parsed.data;
}

/**
 * Validates and retrieves server-only environment variables.
 * Guaranteed to throw if invoked in browser or if required keys are missing.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("[Security Alert] Attempted to access Server Environment Variables in browser bundle!");
  }

  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AI_PRIMARY_PROVIDER: process.env.AI_PRIMARY_PROVIDER,
    AI_FALLBACK_PROVIDER: process.env.AI_FALLBACK_PROVIDER,
    AI_CLASSIFY_MODEL: process.env.AI_CLASSIFY_MODEL,
    AI_EXTRACT_MODEL: process.env.AI_EXTRACT_MODEL,
    AI_DRAFT_MODEL: process.env.AI_DRAFT_MODEL,
    AI_REVIEW_MODEL: process.env.AI_REVIEW_MODEL,
    AI_FINALIZE_MODEL: process.env.AI_FINALIZE_MODEL,
  });

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`[Config Error] Missing or Invalid Server Environment Variables: ${errorDetails}`);
  }

  return parsed.data;
}
