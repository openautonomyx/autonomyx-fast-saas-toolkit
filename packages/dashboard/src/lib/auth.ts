/*
 * Auth helpers for Server Components.
 *
 * Server Components can't import NextRequest directly, so we synthesize
 * a request-like object from next/headers cookies() and pass it to
 * logtoClient.getLogtoContext(). This gives us the full session:
 *   - isAuthenticated: boolean
 *   - claims: id token claims (sub, email, name, ...)
 *   - accessToken: the API resource token (for calling @autonomyx/api)
 *   - userInfo: profile info from /userinfo endpoint
 *
 * Also provides getAccessToken() — a thin wrapper that returns just the
 * API resource token, for use in src/lib/api.ts when making authenticated
 * calls to the REST API.
 */

import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { logtoClient, logtoConfig } from "./logto";
import type { LogtoContext } from "@logto/next/edge";

/**
 * Build a NextRequest shim from next/headers. Logto's edge client only
 * needs the cookie header to decrypt the session, so we forward cookies
 * + the current URL (for redirect metadata).
 */
async function synthesizeRequest(): Promise<NextRequest> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3200";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}`;

  const req = new NextRequest(url, {
    headers: {
      cookie: cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; "),
    },
  });
  return req;
}

/**
 * Return the current user's Logto session context.
 * In Server Components, use this to check auth state and render accordingly.
 */
export async function getSession(): Promise<LogtoContext> {
  const req = await synthesizeRequest();
  return logtoClient.getLogtoContext(req, {
    getAccessToken: true,
    resource: logtoConfig.resources?.[0],
  });
}

/**
 * Return just the API access token. Throws if the user is not signed in.
 * Used by src/lib/api.ts to authenticate calls to @autonomyx/api.
 */
export async function getAccessToken(): Promise<string> {
  const ctx = await getSession();
  if (!ctx.isAuthenticated || !ctx.accessToken) {
    throw new Error("Not authenticated");
  }
  return ctx.accessToken;
}

/**
 * Convenience: is the current request authenticated?
 */
export async function isAuthenticated(): Promise<boolean> {
  const ctx = await getSession();
  return ctx.isAuthenticated ?? false;
}
