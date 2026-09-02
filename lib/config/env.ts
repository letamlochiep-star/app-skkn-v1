import { z } from "zod";

// Validator nhận cả format Supabase mới (sb_) lẫn JWT cũ (eyJ)
const supabaseKeySchema = z.string().refine(
  (val) =>
    (val.startsWith("eyJ") && val.length > 50) ||
    (val.startsWith("sb_publishable_") && val.length > 20) ||
    (val.startsWith("sb_secret_") && val.length > 20),
  { message: "Supabase key phải bắt đầu bằng eyJ..., sb_publishable_... hoặc sb_secret_..." }
);

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKeySchema,
});

export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: supabaseKeySchema,
  OPENAI_API_KEY: z.string().default(""),
  GEMINI_API_KEY: z.string().default(""),
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

export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`[Config Error] Invalid Client Environment Variables: ${errorDetails}`);
  }
  return parsed.data;
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("[Security Alert] Attempted to access Server Environment Variables in browser!");
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
    const errorDetails = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`[Config Error] Missing or Invalid Server Environment Variables: ${errorDetails}`);
  }
  return parsed.data;
}