/**
 * UI Theme Configurator
 * Supports multiple design systems:
 * - IBM Carbon Design System
 * - Shadcn/UI
 * - Radix UI Primitives
 * - Headless UI
 * - Custom CSS
 */

export type DesignSystem = 
  | 'carbon'      // IBM Carbon Design System
  | 'shadcn'     // Shadcn/UI (Tailwind)
  | 'radix'      // Radix UI Primitives
  | 'headless'   // Headless UI
  | 'custom';    // Custom CSS

export interface ThemeConfig {
  designSystem: DesignSystem;
  primaryColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  spacing: 'compact' | 'default' | 'comfortable';
}

// Theme presets for each design system
export const THEMES: Record<DesignSystem, ThemeConfig> = {
  carbon: {
    designSystem: 'carbon',
    primaryColor: '#0f62fe', // IBM Blue 60
    fontFamily: 'IBM Plex Sans, -apple-system, sans-serif',
    borderRadius: 'none',
    spacing: 'default',
  },
  shadcn: {
    designSystem: 'shadcn',
    primaryColor: '#18181b', // Zinc 900
    fontFamily: 'Geist, Inter, sans-serif',
    borderRadius: 'md',
    spacing: 'comfortable',
  },
  radix: {
    designSystem: 'radix',
    primaryColor: '#0070f3', // Blue 500
    fontFamily: 'system-ui, sans-serif',
    borderRadius: 'md',
    spacing: 'default',
  },
  headless: {
    designSystem: 'headless',
    primaryColor: '#3b82f6', // Blue 500
    fontFamily: 'Inter, sans-serif',
    borderRadius: 'lg',
    spacing: 'comfortable',
  },
  custom: {
    designSystem: 'custom',
    primaryColor: '#000000',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: 'sm',
    spacing: 'default',
  },
};

// Get theme via environment variable or config
export function getThemeConfig(): ThemeConfig {
  const themeName = process.env.NEXT_PUBLIC_UI_THEME || 'carbon';
  return THEMES[themeName as DesignSystem] || THEMES.carbon;
}

// Theme CSS variables generator
export function generateThemeVariables(config: ThemeConfig): Record<string, string> {
  const vars: Record<string, string> = {
    '--primary': config.primaryColor,
    '--font-family': config.fontFamily,
    '--radius': getRadiusValue(config.borderRadius),
    '--spacing': getSpacingValue(config.spacing),
  };

  // Generate derived colors
  const primary = config.primaryColor;
  vars['--primary-hover'] = adjustColor(primary, -10);
  vars['--primary-light'] = adjustColor(primary, 40);
  vars['--primary-foreground'] = '#ffffff';

  // Generate semantic colors
  vars['--background'] = '#ffffff';
  vars['--foreground'] = '#171717';
  vars['--muted'] = '#f5f5f5';
  vars['--muted-foreground'] = '#737373';
  vars['--border'] = '#e5e5e5';
  vars['--input'] = '#e5e5e5';
  vars['--ring'] = primary;
  vars['--destructive'] = '#dc2626';
  vars['--success'] = '#16a34a';
  vars['--warning'] = '#d97706';

  return vars;
}

function getRadiusValue(radius: string): string {
  const values: Record<string, string> = {
    none: '0',
    sm: '2px',
    md: '6px',
    lg: '8px',
    full: '9999px',
  };
  return values[radius] || '0';
}

function getSpacingValue(spacing: string): string {
  const values: Record<string, string> = {
    compact: '0.5rem',
    default: '1rem',
    comfortable: '1.5rem',
  };
  return values[spacing] || '1rem';
}

// Lighten/darken color helper
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default THEMES;