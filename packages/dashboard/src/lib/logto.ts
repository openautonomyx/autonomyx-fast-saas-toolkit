/*
 * Logto OIDC client singleton for the dashboard.
 *
 * Uses @logto/next/edge (App Router entry point) — all handlers are
 * (request: Request) => Promise<Response>, which is what Route Handlers expect.
 *
 * Configuration is read from environment variables at module load.
 * In Docker Compose these come from .env; in dev they come from .env.local.
 * The dashboard-init bootstrap container (Wave 1 monorepo chunk) populates
 * LOGTO_APP_ID and LOGTO_APP_SECRET on first boot by calling Logto's
 * Management API to register an OIDC app, so for local dev you either set
 * them by hand or run the bootstrap script.
 *
 * IMPORT NOTE: @logto/next/edge only exports the default LogtoClient class.
 * It does NOT re-export LogtoNextConfig (type) or UserScope (enum) the way
 * the non-edge entry point does. LogtoNextConfig is a pure type so we can
 * import it from @logto/next (type-only, erased at compile time, doesn't
 * pull any runtime code into the edge bundle). UserScope values are simple
 * strings, so we hard-code them below to avoid a transitive dep on @logto/js.
 */

import LogtoClient from "@logto/next/edge";
import type { LogtoNextConfig } from "@logto/next";

// These match the string values of UserScope from @logto/js@4.x.
// See node_modules/@logto/js/lib/consts/openid.d.ts for the canonical enum.
const USER_SCOPE_EMAIL = "email";
const USER_SCOPE_PROFILE = "profile";
const USER_SCOPE_ORGANIZATIONS = "urn:logto:scope:organizations";
const USER_SCOPE_ORGANIZATION_ROLES = "urn:logto:scope:organization_roles";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Set it in .env.local for dev or via Coolify/docker-compose in production.`
    );
  }
  return value;
}

export const logtoConfig: LogtoNextConfig = {
  // The Logto server's public URL (e.g. https://auth.agnxxt.com)
  endpoint: requiredEnv("LOGTO_ENDPOINT"),

  // OIDC client credentials registered with the Logto instance
  appId: requiredEnv("LOGTO_APP_ID"),
  appSecret: requiredEnv("LOGTO_APP_SECRET"),

  // This dashboard's own public URL — Logto redirects back here after login
  baseUrl: requiredEnv("LOGTO_BASE_URL"),

  // 32+ byte secret used to encrypt the session cookie (never leaves the server)
  cookieSecret: requiredEnv("LOGTO_COOKIE_SECRET"),

  // true in production (HTTPS), false in dev (HTTP on localhost)
  cookieSecure: process.env.NODE_ENV === "production",

  // The @autonomyx/api resource — access tokens for this audience grant API access
  resources: [requiredEnv("LOGTO_API_RESOURCE")],

  // What we want to know about the signed-in user
  scopes: [
    USER_SCOPE_EMAIL,
    USER_SCOPE_PROFILE,
    USER_SCOPE_ORGANIZATIONS,
    USER_SCOPE_ORGANIZATION_ROLES,
  ],
};

export const logtoClient = new LogtoClient(logtoConfig);
