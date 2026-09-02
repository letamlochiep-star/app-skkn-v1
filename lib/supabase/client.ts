import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project-id") &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes("your-anon-key");

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// ---- Google OAuth Sign-In ----
export async function signInWithGoogle() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });
  if (error) throw error;
}

// ---- Gemini API Key helpers (localStorage per-user) ----
const GEMINI_KEY_STORAGE = "skkn_gemini_api_key";

export function getStoredGeminiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GEMINI_KEY_STORAGE);
}

export function saveGeminiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
}

export function clearGeminiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GEMINI_KEY_STORAGE);
}

export function hasGeminiKey(): boolean {
  const key = getStoredGeminiKey();
  return !!key && key.startsWith("AIza") && key.length > 30;
}