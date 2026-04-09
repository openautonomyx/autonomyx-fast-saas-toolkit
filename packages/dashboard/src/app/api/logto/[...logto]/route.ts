/*
 * Catch-all Route Handler for Logto OIDC flows.
 *
 * Next.js 15 App Router routes each URL segment to this file when the path
 * starts with /api/logto/. The Logto SDK owns four endpoints:
 *
 *   /api/logto/sign-in          — starts the OIDC flow, redirects to Logto
 *   /api/logto/sign-in-callback — Logto redirects back here after login
 *   /api/logto/sign-out         — clears session cookie and redirects to Logto
 *   /api/logto/user             — returns the current session as JSON
 *
 * We detect which action the user is hitting via the [...logto] param and
 * delegate to the matching handler on the logtoClient singleton.
 */

import { NextRequest } from "next/server";
import { logtoClient } from "@/lib/logto";

type Params = Promise<{ logto: string[] }>;

async function handler(request: NextRequest, { params }: { params: Params }) {
  const { logto } = await params;
  const action = logto?.[0];

  switch (action) {
    case "sign-in":
      return logtoClient.handleSignIn()(request);
    case "sign-in-callback":
      // Second arg is where to redirect after successful login
      return logtoClient.handleSignInCallback("/")(request);
    case "sign-out":
      // Redirect to /login after sign-out
      return logtoClient.handleSignOut("/login")(request);
    case "user":
      return logtoClient.handleUser()(request);
    default:
      return new Response(`Unknown Logto action: ${action}`, { status: 404 });
  }
}

export const GET = handler;
export const POST = handler;
