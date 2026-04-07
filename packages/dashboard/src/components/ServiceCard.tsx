"use client";

import { type ServiceInfo, groupLabels } from "@/lib/services";

interface Props {
  service: ServiceInfo;
  domain: string;
  status?: "healthy" | "unhealthy" | "unknown";
  latencyMs?: number;
}

export function ServiceCard({ service, domain, status = "unknown", latencyMs }: Props) {
  const group = groupLabels[service.group];
  const url = service.subdomain ? `https://${service.subdomain}.${domain}` : undefined;

  return (
    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 hover:border-[--color-purple] transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{service.icon}</span>
          <div>
            <h3 className="font-semibold text-[--color-text]">{service.name}</h3>
            <p className="text-xs text-[--color-text-dim]">{service.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latencyMs !== undefined && (
            <span className="text-xs text-[--color-text-dim] font-mono">{latencyMs}ms</span>
          )}
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              status === "healthy" ? "bg-[--color-green]" :
              status === "unhealthy" ? "bg-[--color-red]" :
              "bg-[--color-text-dim]"
            }`}
            title={status}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span
          className="text-xs px-2 py-0.5 rounded-full border"
          style={{ color: group.color, borderColor: group.color + "40" }}
        >
          {group.label}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener"
            className="text-xs text-[--color-purple] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Open →
          </a>
        )}
      </div>
    </div>
  );
}
