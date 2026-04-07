"use client";

import { ServiceCard } from "./ServiceCard";
import { type ServiceInfo, groupLabels } from "@/lib/services";

interface ServiceStatus {
  id: string;
  status: "healthy" | "unhealthy" | "unknown";
  latencyMs?: number;
}

interface Props {
  services: ServiceInfo[];
  statuses: ServiceStatus[];
  domain: string;
}

export function ServiceGrid({ services, statuses, domain }: Props) {
  const statusMap = new Map(statuses.map(s => [s.id, s]));
  const groups = ["essential", "core", "ops", "growth", "ai"] as const;

  return (
    <div className="space-y-8">
      {groups.map(group => {
        const groupServices = services.filter(s => s.group === group);
        if (groupServices.length === 0) return null;
        const gl = groupLabels[group];

        return (
          <div key={group}>
            <h2
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: gl.color }} />
              {gl.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupServices.map(service => {
                const st = statusMap.get(service.id);
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    domain={domain}
                    status={st?.status}
                    latencyMs={st?.latencyMs}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
