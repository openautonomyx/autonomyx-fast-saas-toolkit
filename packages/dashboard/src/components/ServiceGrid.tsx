/*
 * Carbon DataTable variant that groups services by their 5 groups
 * (essential / core / ops / growth / ai) and shows live health per row.
 */
import { Fragment } from "react";
import { CheckmarkFilled, WarningAltFilled, CircleDash } from "@carbon/icons-react";
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
  const statusMap = new Map(statuses.map((s) => [s.id, s]));
  const groups = ["essential", "core", "ops", "growth", "ai"] as const;

  return (
    <div className="bg-white border border-[#e0e0e0]">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#e0e0e0]">
        <div>
          <h2 className="type-heading-03 text-[#161616]">Service health</h2>
          <p className="mt-1 text-xs text-[#6f6f6f]">
            {services.length} services across 5 groups on {domain}
          </p>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#e0e0e0]">
            <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6] w-16">
              Status
            </th>
            <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6]">
              Service
            </th>
            <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6]">
              Description
            </th>
            <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6]">
              URL
            </th>
            <th className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6] w-24">
              Latency
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const groupServices = services.filter((s) => s.group === group);
            if (groupServices.length === 0) return null;
            const gl = groupLabels[group];
            return (
              <Fragment key={group}>
                <tr className="bg-[#f4f4f4]">
                  <td
                    colSpan={5}
                    className="px-4 h-9 type-label-01 uppercase tracking-wide text-[#525252] border-b border-[#e0e0e0]"
                  >
                    <span
                      className="inline-block w-2 h-2 mr-2 align-middle"
                      style={{ background: gl.color }}
                    />
                    {gl.label}
                  </td>
                </tr>
                {groupServices.map((service) => {
                  const st = statusMap.get(service.id);
                  const status = st?.status ?? "unknown";
                  const url = service.subdomain
                    ? `https://${service.subdomain}.${domain}`
                    : "—";
                  return (
                    <tr
                      key={service.id}
                      className="hover:bg-[#e8e8e8] transition-colors"
                    >
                      <td className="px-4 h-12 border-b border-[#e0e0e0]">
                        <StatusIcon status={status} />
                      </td>
                      <td className="px-4 h-12 text-sm text-[#161616] font-medium border-b border-[#e0e0e0]">
                        {service.name}
                      </td>
                      <td className="px-4 h-12 text-sm text-[#525252] border-b border-[#e0e0e0]">
                        {service.description}
                      </td>
                      <td className="px-4 h-12 text-sm text-[#0f62fe] border-b border-[#e0e0e0]">
                        {service.subdomain ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {url.replace("https://", "")}
                          </a>
                        ) : (
                          <span className="text-[#a8a8a8]">—</span>
                        )}
                      </td>
                      <td className="px-4 h-12 text-xs font-mono text-[#525252] border-b border-[#e0e0e0]">
                        {st?.latencyMs !== undefined ? `${st.latencyMs}ms` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusIcon({ status }: { status: "healthy" | "unhealthy" | "unknown" }) {
  if (status === "healthy") {
    return <CheckmarkFilled size={16} className="text-[#24a148]" />;
  }
  if (status === "unhealthy") {
    return <WarningAltFilled size={16} className="text-[#da1e28]" />;
  }
  return <CircleDash size={16} className="text-[#a8a8a8]" />;
}
