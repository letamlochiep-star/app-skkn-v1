import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const isNewUser = requestUrl.searchParams.get("new") === "true";

  if (code) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Redirect về setup-api-key sau OAuth (vì user cần nhập Gemini key)
      // next param sẽ là /dashboard nếu user đã có key (middleware hoặc page sẽ check)
      const redirectTo = next === "/dashboard" ? "/setup-api-key" : next;
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
}