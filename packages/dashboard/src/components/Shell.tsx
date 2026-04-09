/*
 * IBM Carbon UI Shell — header (48px) + side nav (256px) + main content.
 * Hand-built to Carbon spec (https://carbondesignsystem.com/components/UI-shell-header/usage/)
 * No Carbon React runtime dep.
 */
import Link from "next/link";
import {
  Dashboard,
  Enterprise,
  User,
  ChartLineData,
  Flow,
  Ai,
  Settings,
  Logout,
} from "@carbon/icons-react";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", Icon: Dashboard },
  { href: "/tenants", label: "Tenants", Icon: Enterprise },
  { href: "/users", label: "Users", Icon: User },
  { href: "/billing", label: "Billing", Icon: ChartLineData, disabled: true },
  { href: "/workflows", label: "Workflows", Icon: Flow, disabled: true },
  { href: "/ai", label: "AI", Icon: Ai, disabled: true },
  { href: "/settings", label: "Settings", Icon: Settings, disabled: true },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* ── Header: fixed top, 48px tall, near-black ── */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-[#161616] border-b border-[#393939] flex items-center px-4 z-50">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-semibold tracking-tight">
            Autonomyx
          </span>
          <span className="text-[#c6c6c6] text-sm font-normal">
            Fast SaaS Toolkit
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/logout"
            className="h-12 w-12 flex items-center justify-center text-white hover:bg-[#393939] transition-colors"
            aria-label="Sign out"
          >
            <Logout size={20} />
          </Link>
        </div>
      </header>

      {/* ── Side nav: fixed left, 256px wide, white ── */}
      <aside className="fixed top-12 left-0 bottom-0 w-64 bg-white border-r border-[#e0e0e0] overflow-y-auto">
        <nav className="py-2">
          {NAV_ITEMS.map((item) => (
            <SideNavLink key={item.href} item={item} />
          ))}
        </nav>
      </aside>

      {/* ── Main content: offset by header (48px) + sidebar (256px) ── */}
      <main className="flex-1 ml-64 mt-12 p-8 bg-[#f4f4f4] min-h-[calc(100vh-3rem)]">
        {children}
      </main>
    </div>
  );
}

function SideNavLink({ item }: { item: NavItem }) {
  const { href, label, Icon, disabled } = item;
  const base = "flex items-center gap-4 px-4 h-12 text-sm transition-colors";
  if (disabled) {
    return (
      <div className={`${base} text-[#a8a8a8] cursor-not-allowed select-none`}>
        <Icon size={20} />
        <span>{label}</span>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} text-[#262626] hover:bg-[#e8e8e8] hover:text-[#161616]`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
}
