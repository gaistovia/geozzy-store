import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { defaultLocale, locales } from "@/lib/i18n/config";

/**
 * 1. /admin/*  -> requires a signed-in staff member (session refreshed here).
 * 2. Everything else -> language routing:
 *      "/shop"     is Swahili (internally rewritten to /sw/shop)
 *      "/en/shop"  is English
 *      "/sw/shop"  is redirected to "/shop" so there is a single Swahili URL.
 *
 * Authorization is enforced again in the admin layout and by database RLS;
 * this file is only the first gate.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return guardAdmin(request);
  }
  return routeLocale(request);
}

function routeLocale(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();

  // Default language must not appear in the URL.
  if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  url.pathname = pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url);
}

async function guardAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return new NextResponse("The admin area is not configured yet (missing Supabase settings).", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const withSecurityHeaders = (res: NextResponse) => {
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  };

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    // Keep any refreshed session cookies on the redirect response.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return withSecurityHeaders(redirect);
  };

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return isLoginPage ? withSecurityHeaders(response) : redirectTo("/admin/login");
  }

  if (isLoginPage) return withSecurityHeaders(response);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    return redirectTo("/admin/login?error=forbidden");
  }

  return withSecurityHeaders(response);
}

export const config = {
  // Skip Next internals, API routes and any path containing a file extension.
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
