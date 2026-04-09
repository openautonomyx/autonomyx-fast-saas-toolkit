/*
 * REST API client for @autonomyx/api.
 *
 * SERVER-ONLY. Imported from Server Components only — it reads the current
 * request's Logto session cookie to get an access token. Client components
 * cannot use this directly; for client-side fetches, expose a Route Handler
 * under src/app/api/* that calls this on the server.
 *
 * Auth strategy (in priority order):
 *   1. If a Logto session is present, forward its access token as Bearer
 *   2. If a platform API key is configured in env, use that (for CI / build)
 *   3. Otherwise, unauthenticated (API will return 401 for protected routes)
 *
 * Response envelope: @autonomyx/api always returns { data, meta, error }.
 */

const API_URL = process.env.API_URL || "http://localhost:4000";
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || "";

/**
 * Try to read the current request's access token from the Logto session.
 * Returns "" if not authenticated or if called outside a request scope
 * (e.g., during build-time static prerendering).
 */
async function tryGetSessionToken(): Promise<string> {
  try {
    // Lazy import keeps module-load cost low and sidesteps any circular-import
    // risks between api.ts and auth.ts.
    const { getAccessToken } = await import("./auth");
    return await getAccessToken();
  } catch {
    // Either not authenticated, or called outside a request scope.
    // Fall through to API key / anonymous.
    return "";
  }
}

export async function api(path: string, opts?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const sessionToken = await tryGetSessionToken();
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  } else if (PLATFORM_API_KEY) {
    headers["Authorization"] = `Bearer ${PLATFORM_API_KEY}`;
    // The API treats platform keys specially — sets req.auth.isPlatformKey
    // which bypasses the per-user tenant visibility filter. See
    // packages/api/src/routes/tenants.ts line 55 for the check.
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts?.headers as Record<string, string> | undefined) },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} on ${path}: ${text}`);
  }

  return res.json();
}
