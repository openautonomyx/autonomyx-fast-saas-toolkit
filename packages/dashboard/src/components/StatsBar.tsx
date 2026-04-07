interface StatProps {
  label: string;
  value: string | number;
  color?: string;
}

function Stat({ label, value, color }: StatProps) {
  return (
    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 text-center">
      <div
        className="text-3xl font-bold mb-1"
        style={{ fontFamily: "var(--font-heading)", color: color || "var(--color-green)" }}
      >
        {value}
      </div>
      <div className="text-sm text-[--color-text-dim]">{label}</div>
    </div>
  );
}

interface StatsBarProps {
  tenants: number;
  users: number;
  apiCalls: number;
  servicesUp: number;
  servicesTotal: number;
}

export function StatsBar({ tenants, users, apiCalls, servicesUp, servicesTotal }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Stat label="Tenants" value={tenants} color="var(--color-purple)" />
      <Stat label="Users" value={users} color="var(--color-blue)" />
      <Stat label="API Calls (30d)" value={apiCalls.toLocaleString()} color="var(--color-green)" />
      <Stat
        label="Services"
        value={`${servicesUp}/${servicesTotal}`}
        color={servicesUp === servicesTotal ? "var(--color-green)" : "var(--color-amber)"}
      />
    </div>
  );
}
