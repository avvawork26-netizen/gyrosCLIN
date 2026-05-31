import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Refreshes the admin session cookie and enforces the 8-hour inactivity
// timeout. The "last activity" stamp rides in a cookie and is bumped on
// every admin request; if it is older than 8 hours we sign the admin out.
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminArea =
    path.startsWith("/admin") && path !== "/admin/login";

  if (isAdminArea) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // Inactivity timeout.
    const last = Number(request.cookies.get("admin_last_activity")?.value || 0);
    const now = Date.now();
    if (last && now - last > EIGHT_HOURS_MS) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("timeout", "1");
      const r = NextResponse.redirect(url);
      r.cookies.delete("admin_last_activity");
      return r;
    }
    response.cookies.set("admin_last_activity", String(now), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
