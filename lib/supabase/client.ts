import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  supabaseUrl.startsWith("https://") &&
  supabaseUrl.includes(".supabase.co") &&
  (
    (supabaseAnonKey.startsWith("eyJ") && supabaseAnonKey.length > 50) ||
    (supabaseAnonKey.startsWith("sb_publishable_") && supabaseAnonKey.length > 20)
  );

export function createClient() {
  if (!isSupabaseConfigured) throw new Error("SUPABASE_NOT_CONFIGURED");
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// ---- Google OAuth ----
export async function signInWithGoogle() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });
  if (error) throw error;
}

// ============================================================
// GEMINI API KEY MANAGER — hỗ trợ nhiều key, xoay vòng tự động
// ============================================================
const KEYS_STORAGE = "skkn_gemini_keys";   // JSON array
const IDX_STORAGE  = "skkn_gemini_idx";    // số nguyên - chỉ mục hiện tại

function isValidGeminiKey(k: string): boolean {
  return k.trim().startsWith("AIza") && k.trim().length >= 35;
}

/** Trả về mảng tất cả keys đã lưu */
export function getStoredGeminiKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS_STORAGE);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(isValidGeminiKey) : [];
  } catch { return []; }
}

/** Lưu danh sách key (lọc và loại trùng) */
export function saveGeminiKeys(keys: string[]): void {
  if (typeof window === "undefined") return;
  const valid = Array.from(new Set(keys.map((k) => k.trim()).filter(isValidGeminiKey)));
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(valid));
  localStorage.setItem(IDX_STORAGE, "0");
}

/** Lấy key kế tiếp theo vòng tròn (round-robin) */
export function getNextGeminiKey(): string | null {
  const keys = getStoredGeminiKeys();
  if (keys.length === 0) return null;
  const idx = parseInt(localStorage.getItem(IDX_STORAGE) ?? "0") % keys.length;
  const key = keys[idx];
  localStorage.setItem(IDX_STORAGE, String((idx + 1) % keys.length));
  return key;
}

/** Xoá toàn bộ keys */
export function clearGeminiKeys(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS_STORAGE);
  localStorage.removeItem(IDX_STORAGE);
}

/** Kiểm tra đã có ít nhất 1 key hợp lệ */
export function hasGeminiKey(): boolean {
  return getStoredGeminiKeys().length > 0;
}

// Alias tương thích ngược
export const getStoredGeminiKey = () => getStoredGeminiKeys()[0] ?? null;
export const saveGeminiKey = (k: string) => saveGeminiKeys([k]);
export const clearGeminiKey = clearGeminiKeys;