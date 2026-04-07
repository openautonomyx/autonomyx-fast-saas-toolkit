import { StatsBar } from "@/components/StatsBar";
import { ServiceGrid } from "@/components/ServiceGrid";
import { services } from "@/lib/services";
import { api } from "@/lib/api";

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || process.env.DOMAIN || "localhost";

interface HealthService {
  status: string;
  latencyMs: number;
}

async function getStats() {
  try {
    const data = await api("/api/v1/admin/stats");
    const tenants = data.data?.tenants?.reduce((sum: number, t: any) => sum + parseInt(t.count), 0) || 0;
    const users = data.data?.users?.total || 0;
    const apiCalls = data.data?.usage_last_30d?.reduce((sum: number, e: any) => sum + parseInt(e.count), 0) || 0;
    return { tenants, users, apiCalls };
  } catch {
    return { tenants: 0, users: 0, apiCalls: 0 };
  }
}

async function getHealthStatuses() {
  const statuses: Array<{ id: string; status: "healthy" | "unhealthy" | "unknown"; latencyMs?: number }> = [];

  // Check main API health
  try {
    const data = await api("/health");
    const svc = data.data?.services || {};
    for (const [name, info] of Object.entries(svc) as [string, HealthService][]) {
      statuses.push({
        id: name,
        status: info.status === "healthy" ? "healthy" : "unhealthy",
        latencyMs: info.latencyMs,
      });
    }
    statuses.push({ id: "saas-api", status: "healthy", latencyMs: 0 });
  } catch {
    statuses.push({ id: "saas-api", status: "unhealthy" });
  }

  // Check AI health
  try {
    const data = await api("/api/v1/ai/health");
    const svc = data.data?.services || {};
    for (const [name, info] of Object.entries(svc) as [string, HealthService][]) {
      const id = name === "claude-agent" ? "claude-agent" : name;
      statuses.push({
        id,
        status: info.status === "healthy" ? "healthy" : "unhealthy",
        latencyMs: info.latencyMs,
      });
    }
  } catch {
    // AI services not running — mark as unknown
  }

  return statuses;
}

export default async function Dashboard() {
  const [stats, statuses] = await Promise.all([getStats(), getHealthStatuses()]);

  const servicesUp = statuses.filter(s => s.status === "healthy").length;

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Command Center
        </h1>
        <p className="text-[--color-text-dim]">
          {DOMAIN === "localhost" ? "Local development" : DOMAIN} — {services.length} modules across 5 layers
        </p>
      </div>

      <StatsBar
        tenants={stats.tenants}
        users={stats.users}
        apiCalls={stats.apiCalls}
        servicesUp={servicesUp}
        servicesTotal={services.length}
      />

      <ServiceGrid
        services={services}
        statuses={statuses}
        domain={DOMAIN}
      />
    </div>
  );
}
