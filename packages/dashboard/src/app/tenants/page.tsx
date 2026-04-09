/*
 * Tenants list page — /tenants
 *
 * Server Component. Behind the middleware auth gate, so req.auth is guaranteed.
 * Fetches the list from /api/v1/tenants with the current user's session token
 * and renders it via the Carbon DataTable.
 *
 * Design choice: read path is fully server-rendered (no client JS for the table).
 * The "Create tenant" action is a client island that opens a modal — deferred
 * to Wave 2 to keep this chunk's scope tight. For now, there's a disabled
 * "New tenant" button in the toolbar with a tooltip explaining it's coming.
 */

import Link from "next/link";
import { Add, Enterprise } from "@carbon/icons-react";
import { api } from "@/lib/api";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "suspended" | "cancelled" | "trial";
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface TenantListResponse {
  data: Tenant[];
  meta?: { page: number; limit: number; total: number };
}

async function getTenants(): Promise<{ tenants: Tenant[]; total: number; error?: string }> {
  try {
    const res: TenantListResponse = await api("/api/v1/tenants?limit=100");
    return {
      tenants: res.data ?? [],
      total: res.meta?.total ?? res.data?.length ?? 0,
    };
  } catch (err) {
    return {
      tenants: [],
      total: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function TenantsPage() {
  const { tenants, total, error } = await getTenants();

  return (
    <>
      <div className="mb-8">
        <p className="type-label-01 text-[#525252] uppercase tracking-wide">
          Organization
        </p>
        <h1 className="mt-2 type-heading-05 text-[#161616]">Tenants</h1>
        <p className="mt-1 text-sm text-[#6f6f6f]">
          {total === 0
            ? "No tenants yet"
            : `${total} tenant${total === 1 ? "" : "s"} across all plans`}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#fff1f1] border border-[#da1e28] text-sm text-[#750e13]">
          <strong className="font-semibold">Failed to load tenants:</strong> {error}
        </div>
      )}

      <div className="bg-white border border-[#e0e0e0]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#e0e0e0]">
          <div>
            <h2 className="type-heading-03 text-[#161616]">All tenants</h2>
            <p className="mt-1 text-xs text-[#6f6f6f]">
              Click a row to view details, members, API keys, and usage
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              title="Create tenant flow coming in Wave 2"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-[#c6c6c6] text-[#8d8d8d] text-sm cursor-not-allowed"
            >
              <Add size={20} />
              New tenant
            </button>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#e0e0e0]">
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6] w-8"></th>
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6]">
                Name
              </th>
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6]">
                Slug
              </th>
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6] w-28">
                Plan
              </th>
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6] w-28">
                Status
              </th>
              <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6] w-32">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center px-4 py-16 text-sm text-[#6f6f6f]"
                >
                  {error ? "Unable to load tenants" : "No tenants to display"}
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="hover:bg-[#e8e8e8] transition-colors"
                >
                  <td className="p-0 border-b border-[#e0e0e0]">
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="flex items-center justify-center h-12 w-full text-[#0f62fe]"
                      aria-label={`View ${tenant.name}`}
                    >
                      <Enterprise size={16} />
                    </Link>
                  </td>
                  <td className="p-0 border-b border-[#e0e0e0]">
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="flex items-center px-4 h-12 text-sm text-[#161616] font-medium hover:text-[#0043ce]"
                    >
                      {tenant.name}
                    </Link>
                  </td>
                  <td className="px-4 h-12 text-sm font-mono text-[#525252] border-b border-[#e0e0e0]">
                    {tenant.slug}
                  </td>
                  <td className="px-4 h-12 text-sm border-b border-[#e0e0e0]">
                    <PlanTag plan={tenant.plan} />
                  </td>
                  <td className="px-4 h-12 text-sm border-b border-[#e0e0e0]">
                    <StatusTag status={tenant.status} />
                  </td>
                  <td className="px-4 h-12 text-xs text-[#6f6f6f] border-b border-[#e0e0e0]">
                    {formatDate(tenant.created_at)}
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

function PlanTag({ plan }: { plan: Tenant["plan"] }) {
  const colors: Record<Tenant["plan"], string> = {
    free: "bg-[#e0e0e0] text-[#393939]",
    starter: "bg-[#d0e2ff] text-[#002d9c]",
    pro: "bg-[#78a9ff] text-[#002d9c]",
    enterprise: "bg-[#0f62fe] text-white",
  };
  return (
    <span className={`inline-flex items-center px-2 h-6 text-xs font-medium ${colors[plan]}`}>
      {plan}
    </span>
  );
}

function StatusTag({ status }: { status: Tenant["status"] }) {
  const colors: Record<Tenant["status"], string> = {
    active: "bg-[#defbe6] text-[#0e6027]",
    trial: "bg-[#d0e2ff] text-[#002d9c]",
    suspended: "bg-[#fff1f1] text-[#750e13]",
    cancelled: "bg-[#e0e0e0] text-[#525252]",
  };
  return (
    <span className={`inline-flex items-center px-2 h-6 text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
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
