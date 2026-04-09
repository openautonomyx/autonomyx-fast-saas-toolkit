/*
 * Tenant detail page — /tenants/[id]
 *
 * Server Component. Behind auth middleware.
 * Fires 4 parallel API calls (Promise.all) for tenant, members, api keys, usage.
 * Any individual call can fail without blocking the others — each section
 * renders its own error state.
 *
 * Sections (top to bottom):
 *   1. Breadcrumb + tenant name/slug/status header
 *   2. Stat tiles: plan, members, active API keys, total API calls (30d)
 *   3. Members table (read-only in Wave 1; add/remove in Wave 2)
 *   4. API keys table (read-only in Wave 1; create/revoke in Wave 2)
 *   5. Usage summary (totals per event type)
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Enterprise, User, Password, ChartBar } from "@carbon/icons-react";
import { api } from "@/lib/api";
import { StatTile } from "@/components/StatTile";

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

interface Member {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  joined_at: string;
}

interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
}

interface UsageTotal {
  event_type: string;
  total: string; // postgres COUNT returns string
}

interface UsageSummary {
  period: string;
  totals: UsageTotal[];
  daily: Array<{ event_type: string; day: string; count: string }>;
}

async function fetchAll(id: string) {
  const [tenantRes, membersRes, keysRes, usageRes] = await Promise.allSettled([
    api(`/api/v1/tenants/${id}`),
    api(`/api/v1/tenants/${id}/members`),
    api(`/api/v1/tenants/${id}/api-keys`),
    api(`/api/v1/tenants/${id}/usage?period=30d`),
  ]);

  return {
    tenant: tenantRes.status === "fulfilled" ? (tenantRes.value.data as Tenant) : null,
    tenantError: tenantRes.status === "rejected" ? String(tenantRes.reason) : null,
    members:
      membersRes.status === "fulfilled" ? (membersRes.value.data as Member[]) : [],
    membersError:
      membersRes.status === "rejected" ? String(membersRes.reason) : null,
    apiKeys:
      keysRes.status === "fulfilled" ? (keysRes.value.data as ApiKey[]) : [],
    apiKeysError: keysRes.status === "rejected" ? String(keysRes.reason) : null,
    usage:
      usageRes.status === "fulfilled" ? (usageRes.value.data as UsageSummary) : null,
    usageError: usageRes.status === "rejected" ? String(usageRes.reason) : null,
  };
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchAll(id);

  if (!data.tenant) {
    // If the primary tenant fetch failed with a 404, show the not-found page.
    // Any other error still renders the page with an error banner so the user
    // sees what happened.
    if (data.tenantError && data.tenantError.includes("404")) {
      notFound();
    }
    return (
      <>
        <BackLink />
        <div className="mt-6 p-4 bg-[#fff1f1] border border-[#da1e28] text-sm text-[#750e13]">
          <strong>Failed to load tenant:</strong> {data.tenantError ?? "Unknown error"}
        </div>
      </>
    );
  }

  const totalApiCalls = data.usage?.totals.reduce(
    (sum, t) => sum + parseInt(t.total, 10),
    0
  ) ?? 0;

  const activeKeys = data.apiKeys.filter((k) => !k.revoked_at).length;

  return (
    <>
      <BackLink />

      {/* Header */}
      <div className="mt-4 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Enterprise size={20} className="text-[#0f62fe]" />
          <p className="type-label-01 text-[#525252] uppercase tracking-wide">
            Tenant
          </p>
        </div>
        <h1 className="type-heading-05 text-[#161616]">{data.tenant.name}</h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-[#6f6f6f]">
          <span className="font-mono">{data.tenant.slug}</span>
          <span>·</span>
          <span>created {formatDate(data.tenant.created_at)}</span>
          <span>·</span>
          <span className="capitalize">{data.tenant.status}</span>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#e0e0e0] mb-8">
        <StatTile label="Plan" value={data.tenant.plan.toUpperCase()} caption="current subscription" />
        <StatTile
          label="Members"
          value={data.members.length}
          caption={data.membersError ? "error loading" : "total users"}
        />
        <StatTile
          label="Active API Keys"
          value={activeKeys}
          caption={data.apiKeysError ? "error loading" : "issued"}
        />
        <StatTile
          label="API Calls"
          value={totalApiCalls.toLocaleString()}
          caption={data.usageError ? "error loading" : "last 30 days"}
        />
      </div>

      {/* Members section */}
      <Section
        title="Members"
        description={`${data.members.length} user${data.members.length === 1 ? "" : "s"} with access`}
        icon={User}
        error={data.membersError}
      >
        <MembersTable members={data.members} />
      </Section>

      {/* API keys section */}
      <Section
        title="API Keys"
        description={`${activeKeys} active · ${data.apiKeys.length - activeKeys} revoked`}
        icon={Password}
        error={data.apiKeysError}
      >
        <ApiKeysTable keys={data.apiKeys} />
      </Section>

      {/* Usage section */}
      <Section
        title="Usage"
        description={`Last 30 days · ${totalApiCalls.toLocaleString()} total events`}
        icon={ChartBar}
        error={data.usageError}
      >
        <UsageTable usage={data.usage} />
      </Section>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/tenants"
      className="inline-flex items-center gap-2 text-sm text-[#0f62fe] hover:text-[#0043ce]"
    >
      <ArrowLeft size={16} />
      All tenants
    </Link>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  error,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 bg-white border border-[#e0e0e0]">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#e0e0e0]">
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-[#525252]" />
          <div>
            <h2 className="type-heading-03 text-[#161616]">{title}</h2>
            <p className="mt-1 text-xs text-[#6f6f6f]">{description}</p>
          </div>
        </div>
      </div>
      {error ? (
        <div className="p-4 text-sm text-[#750e13] bg-[#fff1f1]">
          Failed to load: {error}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function MembersTable({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <div className="text-center px-4 py-12 text-sm text-[#6f6f6f]">
        No members yet
      </div>
    );
  }
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-[#f4f4f4]">
          <th className="text-left px-4 h-10 text-xs font-semibold text-[#525252]">Name</th>
          <th className="text-left px-4 h-10 text-xs font-semibold text-[#525252]">Email</th>
          <th className="text-left px-4 h-10 text-xs font-semibold text-[#525252] w-24">Role</th>
          <th className="text-left px-4 h-10 text-xs font-semibold text-[#525252] w-32">Joined</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <tr key={m.id} className="hover:bg-[#f4f4f4] transition-colors">
            <td className="px-4 h-12 text-sm text-[#161616] border-t border-[#e0e0e0]">
              {m.name}
            </td>
            <td className="px-4 h-12 text-sm text-[#525252] border-t border-[#e0e0e0]">
              {m.email}
            </td>
            <td className="px-4 h-12 text-sm border-t border-[#e0e0e0]">
              <RoleBadge role={m.role} />
            </td>
            <td className="px-4 h-12 text-xs text-[#6f6f6f] border-t border-[#e0e0e0]">
              {formatDate(m.joined_at)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RoleBadge({ role }: { role: Member["role"] }) {
  const colors: Record<Member["role"], string> = {
    owner: "bg-[#0f62fe] text-white",
    admin: "bg-[#78a9ff] text-[#002d9c]",
    member: "bg-[#e0e0e0] text-[#393939]",
    viewer: "bg-[#f4f4f4] text-[#6f6f6f]",
  };
  return (
    <span className={`inline-flex items-center px-2 h-6 text-xs font-medium ${colors[role]}`}>
      {role}
    </span>
  );
}

function ApiKeysTable({ keys }: { keys: ApiKey[] }) {
  if (keys.length === 0) {
    return (
      <div className="text-center px-4 py-12 text-sm text-[#6f6f6f]">
        No API keys issued
      </div>
    );
  }
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-[#f4f4f4]">
          <th className="text-left px-4 h-10 text-xs font-semibold text-[#525252]">Name</th>
          <th className="text-left px-4 h-10 text-xs font-semibold text-[#525252]">Key prefix</th>
          <th className="text-left px-4 h-10 text-xs font-semibold text-[#525252]">Scopes</th>
          <th className="text-left px-4 h-10 text-xs font-semibold text-[#525252] w-32">Last used</th>
          <th className="text-left px-4 h-10 text-xs font-semibold text-[#525252] w-28">Status</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => {
          const revoked = Boolean(k.revoked_at);
          return (
            <tr key={k.id} className="hover:bg-[#f4f4f4] transition-colors">
              <td className="px-4 h-12 text-sm text-[#161616] border-t border-[#e0e0e0]">
                {k.name}
              </td>
              <td className="px-4 h-12 text-xs font-mono text-[#525252] border-t border-[#e0e0e0]">
                {k.key_prefix}…
              </td>
              <td className="px-4 h-12 text-xs text-[#525252] border-t border-[#e0e0e0]">
                {Array.isArray(k.scopes) ? k.scopes.join(", ") : String(k.scopes)}
              </td>
              <td className="px-4 h-12 text-xs text-[#6f6f6f] border-t border-[#e0e0e0]">
                {k.last_used_at ? formatDate(k.last_used_at) : "Never"}
              </td>
              <td className="px-4 h-12 text-sm border-t border-[#e0e0e0]">
                <span
                  className={`inline-flex items-center px-2 h-6 text-xs font-medium ${
                    revoked
                      ? "bg-[#e0e0e0] text-[#525252]"
                      : "bg-[#defbe6] text-[#0e6027]"
                  }`}
                >
                  {revoked ? "revoked" : "active"}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function UsageTable({ usage }: { usage: UsageSummary | null }) {
  if (!usage || usage.totals.length === 0) {
    return (
      <div className="text-center px-4 py-12 text-sm text-[#6f6f6f]">
        No usage events recorded in this period
      </div>
    );
  }

  const maxCount = Math.max(
    ...usage.totals.map((t) => parseInt(t.total, 10))
  );

  return (
    <div className="p-4">
      {usage.totals.map((t) => {
        const count = parseInt(t.total, 10);
        const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return (
          <div key={t.event_type} className="mb-3 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[#161616] font-medium">
                {t.event_type}
              </span>
              <span className="text-xs font-mono text-[#525252]">
                {count.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-[#f4f4f4]">
              <div
                className="h-full bg-[#0f62fe]"
                style={{ width: `${pct}%` }}
                aria-label={`${t.event_type}: ${count} events`}
              />
            </div>
          </div>
        );
      })}
    </div>
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
