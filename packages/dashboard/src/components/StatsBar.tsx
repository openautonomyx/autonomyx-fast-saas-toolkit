import { StatTile } from "./StatTile";

interface Props {
  tenants: number;
  users: number;
  apiCalls: number;
  servicesUp: number;
  servicesTotal: number;
}

export function StatsBar({ tenants, users, apiCalls, servicesUp, servicesTotal }: Props) {
  const allHealthy = servicesUp === servicesTotal;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#e0e0e0] mb-8">
      <StatTile label="Tenants" value={tenants} caption="active" />
      <StatTile label="Users" value={users} caption="total" />
      <StatTile
        label="API Calls"
        value={apiCalls.toLocaleString()}
        caption="last 30 days"
      />
      <StatTile
        label="Services"
        value={`${servicesUp} / ${servicesTotal}`}
        trend={allHealthy ? "up" : "flat"}
        trendValue={allHealthy ? "all healthy" : `${servicesTotal - servicesUp} down`}
      />
    </div>
  );
}
