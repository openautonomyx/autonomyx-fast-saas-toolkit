/*
 * IBM Carbon-style stat tile.
 * A large number with a small label above. Used in StatsBar.
 * Carbon "Tile" component: https://carbondesignsystem.com/components/tile/usage/
 */

interface Props {
  label: string;
  value: string | number;
  caption?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
}

export function StatTile({ label, value, caption, trend, trendValue }: Props) {
  return (
    <div className="bg-white border border-[#e0e0e0] p-6">
      <div className="type-label-01 text-[#6f6f6f] uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-3 type-heading-05 text-[#161616]">
        {value}
      </div>
      {(caption || trendValue) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trendValue && (
            <span
              className={
                trend === "up"
                  ? "text-[#24a148]"
                  : trend === "down"
                    ? "text-[#da1e28]"
                    : "text-[#6f6f6f]"
              }
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
          {caption && <span className="text-[#6f6f6f]">{caption}</span>}
        </div>
      )}
    </div>
  );
}
