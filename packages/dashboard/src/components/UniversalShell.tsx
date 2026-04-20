/**
 * Universal Shell - Works with all UI themes
 * Supports: carbon, shadcn, radix, headless, custom
 * 
 * Usage:
 * NEXT_PUBLIC_UI_THEME=carbon npm run dev  // IBM Carbon (default)
 * NEXT_PUBLIC_UI_THEME=shadcn npm run dev  // Shadcn/UI
 * NEXT_PUBLIC_UI_THEME=radix npm run dev   // Radix Primitives
 * NEXT_PUBLIC_UI_THEME=headless npm run dev // Headless UI
 * NEXT_PUBLIC_UI_THEME=custom npm run dev   // Custom CSS
 */

import Link from "next/link";
import { getThemeConfig } from '../lib/ui-theme';

// Icon imports - Carbon (default)
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
  Icon?: React.ComponentType<{ size?: number }>;
  disabled?: boolean;
}

interface ShellProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  theme?: string;
}

const defaultNavItems: NavItem[] = [
  { href: "/", label: "Overview", Icon: Dashboard },
  { href: "/tenants", label: "Tenants", Icon: Enterprise },
  { href: "/users", label: "Users", Icon: User },
  { href: "/billing", label: "Billing", Icon: ChartLineData, disabled: true },
  { href: "/workflows", label: "Workflows", Icon: Flow, disabled: true },
  { href: "/ai", label: "AI", Icon: Ai, disabled: true },
  { href: "/settings", label: "Settings", Icon: Settings, disabled: true },
];

// Theme-specific styles
const themeStyles: Record<string, {
  header: string;
  headerText: string;
  headerSubtext: string;
  sidebar: string;
  sidebarLink: string;
  sidebarLinkHover: string;
  sidebarDisabled: string;
  main: string;
  brand: string;
}> = {
  carbon: {
    header: "bg-[#161616] border-b border-[#393939]",
    headerText: "text-white",
    headerSubtext: "text-[#c6c6c6]",
    sidebar: "bg-white border-r border-[#e0e0e0]",
    sidebarLink: "text-[#262626]",
    sidebarLinkHover: "hover:bg-[#e8e8e8] hover:text-[#161616]",
    sidebarDisabled: "text-[#a8a8a8] cursor-not-allowed",
    main: "bg-[#f4f4f4]",
    brand: "Autonomyx",
  },
  shadcn: {
    header: "bg-background border-b border-border",
    headerText: "text-foreground",
    headerSubtext: "text-muted-foreground",
    sidebar: "bg-card border-r border-border",
    sidebarLink: "text-foreground",
    sidebarLinkHover: "hover:bg-accent hover:text-accent-foreground",
    sidebarDisabled: "text-muted-foreground cursor-not-allowed",
    main: "bg-background",
    brand: "Acme SaaS",
  },
  radix: {
    header: "bg-slate-900 border-b border-slate-700",
    headerText: "text-white",
    headerSubtext: "text-slate-400",
    sidebar: "bg-white border-r border-slate-200",
    sidebarLink: "text-slate-900",
    sidebarLinkHover: "hover:bg-slate-100",
    sidebarDisabled: "text-slate-400 cursor-not-allowed",
    main: "bg-slate-50",
    brand: "Radix SaaS",
  },
  headless: {
    header: "bg-gray-900 border-b border-gray-800",
    headerText: "text-white",
    headerSubtext: "text-gray-400",
    sidebar: "bg-white border-r border-gray-200",
    sidebarLink: "text-gray-900",
    sidebarLinkHover: "hover:bg-gray-100",
    sidebarDisabled: "text-gray-400 cursor-not-allowed",
    main: "bg-gray-50",
    brand: "Headless SaaS",
  },
  custom: {
    header: "bg-neutral-900 border-b border-neutral-700",
    headerText: "text-white",
    headerSubtext: "text-neutral-400",
    sidebar: "bg-neutral-50 border-r border-neutral-200",
    sidebarLink: "text-neutral-900",
    sidebarLinkHover: "hover:bg-neutral-100",
    sidebarDisabled: "text-neutral-400 cursor-not-allowed",
    main: "bg-neutral-100",
    brand: "My SaaS",
  },
};

export function UniversalShell({ 
  children, 
  navItems = defaultNavItems,
  theme: themeOverride 
}: ShellProps) {
  const themeConfig = getThemeConfig();
  const theme = themeOverride || themeConfig.designSystem;
  const styles = themeStyles[theme] || themeStyles.carbon;
  
  const getIcon = (name: string) => {
    const icons: Record<string, React.ComponentType<{ size?: number }>> = {
      Dashboard, Enterprise, User, ChartLineData, Flow, Ai, Settings, Logout,
    };
    return icons[name] || Dashboard;
  };

  return (
    <div className="flex min-h-screen">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-12 flex items-center px-4 z-50 ${styles.header}`}>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold tracking-tight ${styles.headerText}`}>
            {styles.brand}
          </span>
          <span className={`text-sm font-normal ${styles.headerSubtext}`}>
            Fast SaaS Toolkit
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/logout"
            className={`h-12 w-12 flex items-center justify-center transition-colors ${styles.headerText} ${theme === 'carbon' ? 'hover:bg-[#393939]' : 'hover:bg-white/10'}`}
            aria-label="Sign out"
          >
            <Logout size={20} />
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-12 left-0 bottom-0 w-64 overflow-y-auto ${styles.sidebar}`}>
        <nav className="py-2">
          {navItems.map((item) => {
            const Icon = item.Icon || getIcon(item.label);
            const base = "flex items-center gap-4 px-4 h-12 text-sm transition-colors";
            
            return (
              <div key={item.href} className="px-4">
                {item.disabled ? (
                  <div className={`${base} ${styles.sidebarDisabled}`}>
                    {Icon && <Icon size={20} />}
                    <span>{item.label}</span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`${base} ${styles.sidebarLink} ${styles.sidebarLinkHover}`}
                  >
                    {Icon && <Icon size={20} />}
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ml-64 mt-12 p-8 min-h-[calc(100vh-3rem)] ${styles.main}`}>
        {children}
      </main>
    </div>
  );
}

export default UniversalShell;