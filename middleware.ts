import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // 1. Kiểm tra session cookie nội bộ (Zero-Supabase mode)
  const localSession = request.cookies.get("skkn_session")?.value;
  let hasValidSession = Boolean(localSession && localSession.length > 10);

  // 2. Nếu chưa có local session, thử kiểm tra Supabase (nếu có cấu hình)
  if (!hasValidSession) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({ name, value, ...options });
              response = NextResponse.next({
                request: { headers: request.headers },
              });
              response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({ name, value: "", ...options });
              response = NextResponse.next({
                request: { headers: request.headers },
              });
              response.cookies.set({ name, value: "", ...options });
            },
          },
        });

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          hasValidSession = true;
        }
      } catch {
        // Supabase error does not block local session
      }
    }
  }

  // Bảo vệ các route cần đăng nhập (/dashboard, /projects, /account)
  const protectedRoutes = ["/dashboard", "/projects", "/account", "/setup-api-key"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !hasValidSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Nếu đã đăng nhập thì tự chuyển sang /dashboard khi vào /login hoặc /register
  if (["/login", "/register"].includes(pathname) && hasValidSession) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/account/:path*", "/setup-api-key", "/login", "/register"],
};