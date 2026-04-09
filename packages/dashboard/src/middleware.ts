/*
 * Next.js middleware — runs on every request before Server Components render.
 *
 * Protects authenticated routes: if the visitor doesn't have a valid Logto
 * session cookie, we redirect to /login.
 *
 * Runs on the Edge runtime, so it can't import server-only packages.
 * It can use @logto/next/edge (which is explicitly edge-safe).
 *
 * Cheap check: just verify the session cookie exists. Full session decryption
 * happens in Server Components via lib/auth.getSession(). This means a
 * tampered-but-present cookie will reach the Server Component and fail
 * decryption there — still secure, just the redirect happens a bit later.
 * The tradeoff is fast middleware (no crypto on every request).
 */

import { NextRequest, NextResponse } from "next/server";

// Routes that do NOT require auth
const PUBLIC_PATHS = [
  "/login",
  "/api/logto",   // all Logto OIDC callback routes
  "/_next",       // Next.js static assets
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Cheap session-cookie presence check. Logto's default cookie name is
  // "logtoCookies" (set in cookieSecure mode) — verify that's what the
  // running SDK uses if you change cookie settings.
  const hasSession = request.cookies.has("logtoCookies");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    // Remember where the user was going so we can redirect them back after login
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Only run middleware on actual page routes — skip Next.js internals entirely
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - api/logto (handled above in isPublic, but double-excluded here for perf)
     *   - _next/static (build assets)
     *   - _next/image (image optimizer)
     *   - favicon.ico
     *   - Public files with extensions (svg, png, jpg, etc.)
     */
    "/((?!api/logto|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$).*)",
  ],
};
