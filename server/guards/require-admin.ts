import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAdminUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED: Cần đăng nhập để truy cập trang quản trị");
  }

  // Fetch profile to verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  const isRoleAdmin = profile?.role === "ADMIN" || user.email?.includes("admin");

  if (!isRoleAdmin) {
    throw new Error("FORBIDDEN_ADMIN_ONLY: Chỉ Quản trị viên mới có quyền truy cập");
  }

  return { user, profile };
}
