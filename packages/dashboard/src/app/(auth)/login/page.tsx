/*
 * Login landing page (public — not behind middleware redirect).
 *
 * Shows a minimal Carbon-styled splash with a single "Sign in" button that
 * kicks off the Logto OIDC flow via /api/logto/sign-in.
 *
 * Notes:
 *  - The auth route group (auth) means this page DOES wrap in the root
 *    layout (Shell with left nav), which looks odd on a login page. We
 *    override that by using a custom group layout that skips the Shell.
 *  - "returnTo" query param from middleware is preserved through to Logto
 *    via cookie so the user lands where they originally tried to go.
 */

import Link from "next/link";
import { Login as LoginIcon } from "@carbon/icons-react";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center p-8">
      <div className="bg-white border border-[#e0e0e0] w-full max-w-md p-10">
        <div className="mb-8">
          <p className="type-label-01 text-[#525252] uppercase tracking-wide">
            Autonomyx
          </p>
          <h1 className="mt-2 type-heading-04 text-[#161616]">Sign in</h1>
          <p className="mt-2 text-sm text-[#6f6f6f]">
            Authenticate with your organization account to access the command center.
          </p>
        </div>

        <Link
          href="/api/logto/sign-in"
          className="inline-flex items-center justify-center gap-2 w-full h-12 px-5 bg-[#0f62fe] text-white text-sm font-normal hover:bg-[#0050e6] active:bg-[#002d9c] transition-colors"
        >
          <LoginIcon size={20} />
          Sign in with Logto
        </Link>

        <div className="mt-6 pt-6 border-t border-[#e0e0e0]">
          <p className="text-xs text-[#6f6f6f]">
            New here? Your administrator must first create an account for you in Logto.
            Contact your organization owner for an invite.
          </p>
        </div>
      </div>
    </div>
  );
}
