/*
 * Users list page — /users
 *
 * Server Component. Lists all users across all tenants.
 * In a production multi-tenant SaaS, this view is typically restricted to
 * platform admins (req.auth.isPlatformKey === true on the API). Non-platform
 * users hitting this page will get an API error. We render gracefully either way.
 */

import { User } from "@carbon/icons-react";
import { api } from "@/lib/api";

interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  external_id?: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

async function getUsers(): Promise<{ users: UserRow[]; total: number; error?: string }> {
  try {
    const res = await api("/api/v1/users?limit=200");
    return {
      users: (res.data ?? []) as UserRow[],
      total: res.meta?.total ?? res.data?.length ?? 0,
    };
  } catch (err) {
    return {
      users: [],
      total: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function UsersPage() {
  const { users, total, error } = await getUsers();

  return (
    <>
      <div className="mb-8">
        <p className="type-label-01 text-[#525252] uppercase tracking-wide">
          Directory
        </p>
        <h1 className="mt-2 type-heading-05 text-[#161616]">Users</h1>
        <p className="mt-1 text-sm text-[#6f6f6f]">
          {total === 0
            ? "No users registered yet"
            : `${total} user${total === 1 ? "" : "s"} across all tenants`}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#fff1f1] border border-[#da1e28] text-sm text-[#750e13]">
          <strong className="font-semibold">Failed to load users:</strong> {error}
          <p className="mt-2 text-xs text-[#6f6f6f]">
            This view requires platform-level API access. If you&apos;re signed in as
            a tenant user, you won&apos;t see this list — that&apos;s by design.
          </p>
        </div>
      )}

      <div className="bg-white border border-[#e0e0e0]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#e0e0e0]">
          <div className="flex items-center gap-3">
            <User size={20} className="text-[#525252]" />
            <div>
              <h2 className="type-heading-03 text-[#161616]">All users</h2>
              <p className="mt-1 text-xs text-[#6f6f6f]">
                Identity records linked to Logto accounts
              </p>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#e0e0e0]">
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6]">
                Name
              </th>
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6]">
                Email
              </th>
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6] w-24">
                Verified
              </th>
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6]">
                External ID
              </th>
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6] w-32">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center px-4 py-16 text-sm text-[#6f6f6f]"
                >
                  {error ? "Unable to load users" : "No users to display"}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-[#e8e8e8] transition-colors">
                  <td className="px-4 h-12 text-sm text-[#161616] font-medium border-b border-[#e0e0e0]">
                    {user.name}
                  </td>
                  <td className="px-4 h-12 text-sm text-[#525252] border-b border-[#e0e0e0]">
                    {user.email}
                  </td>
                  <td className="px-4 h-12 text-sm border-b border-[#e0e0e0]">
                    {user.email_verified ? (
                      <span className="inline-flex items-center px-2 h-6 text-xs font-medium bg-[#defbe6] text-[#0e6027]">
                        yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 h-6 text-xs font-medium bg-[#fff1f1] text-[#750e13]">
                        no
                      </span>
                    )}
                  </td>
                  <td className="px-4 h-12 text-xs font-mono text-[#6f6f6f] border-b border-[#e0e0e0]">
                    {user.external_id ?? <span className="text-[#a8a8a8]">—</span>}
                  </td>
                  <td className="px-4 h-12 text-xs text-[#6f6f6f] border-b border-[#e0e0e0]">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}
