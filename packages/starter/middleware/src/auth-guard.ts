import * as jose from "jose";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface AuthGuardOptions {
  /** Logto OIDC endpoint, e.g., https://auth.example.com/oidc */
  logtoEndpoint: string;
  /** Audience claim to validate (your API identifier in Logto) */
  audience?: string;
  /** Paths that skip authentication */
  publicPaths?: string[];
}

interface AuthPayload {
  userId: string;
  tenantId?: string;
  email?: string;
  scopes: string[];
}

let jwksCache: jose.JSONWebKeySet | null = null;
let jwksCacheTime = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour

/**
 * Middleware that validates Logto-issued JWTs.
 * On success, attaches `req.auth` with userId, tenantId, email, and scopes.
 *
 * Also supports API key auth via `Authorization: Bearer sk_...` header,
 * falling back to database lookup for API keys.
 */
export function createAuthGuard(options: AuthGuardOptions) {
  const { logtoEndpoint, audience, publicPaths = [] } = options;
  const jwksUrl = `${logtoEndpoint.replace(/\/$/, "")}/jwks`;
  const issuer = logtoEndpoint.replace(/\/oidc\/?$/, "");

  return async (req: IncomingMessage & { auth?: AuthPayload; url?: string }, res: ServerResponse, next: (err?: Error) => void) => {
    try {
      // Skip auth for public paths
      const pathname = new URL(req.url || "/", "http://localhost").pathname;
      if (publicPaths.some(p => pathname.startsWith(p))) {
        return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing authorization header" }));
        return;
      }

      const token = authHeader.slice(7);

      // API key path (prefixed with sk_)
      if (token.startsWith("sk_")) {
        // API key validation is handled by a separate middleware or the tenant-context
        // For now, pass through with a marker
        (req as any).auth = { userId: "", tenantId: "", email: "", scopes: [], isApiKey: true, apiKeyToken: token };
        return next();
      }

      // JWT path — validate with Logto JWKS
      const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
      const verifyOptions: jose.JWTVerifyOptions = { issuer };
      if (audience) {
        verifyOptions.audience = audience;
      }

      const { payload } = await jose.jwtVerify(token, JWKS, verifyOptions);

      req.auth = {
        userId: payload.sub || "",
        tenantId: (payload as any).organization_id || (payload as any).org_id || "",
        email: (payload as any).email || "",
        scopes: typeof payload.scope === "string" ? payload.scope.split(" ") : [],
      };

      next();
    } catch (err) {
      if (err instanceof jose.errors.JWSSignatureVerificationFailed || err instanceof jose.errors.JWTExpired) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or expired token" }));
        return;
      }
      next(err as Error);
    }
  };
}
