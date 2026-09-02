import { cookies } from "next/headers";
import { createServerSupabaseClient, isServerSupabaseConfigured } from "@/lib/supabase/server";

export interface AppUserSession {
  id: string;
  email: string;
  fullName: string;
  role: string;
  educationLevel?: string;
  subjectGroup?: string;
  schoolName?: string;
}

export const SESSION_COOKIE_NAME = "skkn_session";

/**
 * Lấy thông tin user hiện tại từ Local Cookie Session hoặc Supabase Auth.
 * Hoạt động 100% độc lập, không bắt buộc Supabase phải cấu hình OAuth.
 */
export async function getCurrentUser(): Promise<AppUserSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // 1. Kiểm tra Local Session Cookie trước (Ưu tiên độc lập)
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie)) as AppUserSession;
      if (parsed && parsed.id && parsed.email) {
        return parsed;
      }
    } catch {
      // Cookie không hợp lệ thì bỏ qua
    }
  }

  // 2. Nếu có Supabase, kiểm tra Supabase Auth
  if (isServerSupabaseConfigured) {
    try {
      const supabase = createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const metadata = user.user_metadata || {};
        return {
          id: user.id,
          email: user.email || "user@skkn.edu.vn",
          fullName: metadata.full_name || metadata.name || "Thầy/Cô Giáo",
          role: metadata.role || "user",
          educationLevel: metadata.education_level || "SECONDARY",
          subjectGroup: metadata.subject_group || "MATH",
          schoolName: metadata.school_name || "",
        };
      }
    } catch {
      // Supabase lỗi không chặn app
    }
  }

  return null;
}