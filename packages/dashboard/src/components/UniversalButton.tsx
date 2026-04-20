/**
 * Universal Button - Works with all UI themes
 * Supports: carbon, shadcn, radix, headless, custom
 * 
 * Usage:
 * NEXT_PUBLIC_UI_THEME=carbon npm run dev  // IBM Carbon
 * NEXT_PUBLIC_UI_THEME=shadcn npm run dev  // Shadcn/UI
 * NEXT_PUBLIC_UI_THEME=radix npm run dev  // Radix
 * NEXT_PUBLIC_UI_THEME=headless npm run dev // Headless UI
 */

import { getThemeConfig } from '../lib/ui-theme';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function UniversalButton(
  { className = '', variant = 'primary', size = 'md', ...props }: ButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const theme = getThemeConfig();
  const variantClasses = getVariantClasses(variant, theme.designSystem);
  const sizeClasses = getSizeClasses(size);

  const base = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50';

  return (
    <button
      ref={ref}
      className={`${base} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    />
  );
}

// Theme-specific variant classes
function getVariantClasses(variant: string, designSystem: string): string {
  const carbon: Record<string, string> = {
    primary: 'bg-[#0f62fe] text-white hover:bg-[#0353e9] focus:ring-[#0f62fe]',
    secondary: 'bg-[#393939] text-white hover:bg-[#4c4c4c]',
    outline: 'border border-[#8d8d8d] text-[#161616] hover:bg-[#e8e8e8]',
    ghost: 'text-[#161616] hover:bg-[#e8e8e8]',
    destructive: 'bg-[#da1e28] text-white hover:bg-[#b81921]',
  };

  const shadcn: Record<string, string> = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80',
    outline: 'border border-input bg-transparent hover:bg-accent',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  const radix: Record<string, string> = {
    primary: 'bg-[#0070f3] text-white hover:bg-[#0058c8]',
    secondary: 'bg-[#f4f4f5] text-[#18181b] hover:bg-[#e4e4e5]',
    outline: 'border border-[#e4e4e7] text-[#18181b] hover:bg-[#f4f4f5]',
    ghost: 'text-[#18181b] hover:bg-[#f4f4f5]',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
  };

  const headless: Record<string, string> = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-gray-300 text-gray-900 hover:bg-gray-50',
    ghost: 'text-gray-900 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };

  const custom: Record<string, string> = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-gray-200 text-black hover:bg-gray-300',
    outline: 'border border-gray-400 text-black hover:bg-gray-100',
    ghost: 'text-black hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };

  const maps: Record<string, Record<string, string>> = { carbon, shadcn, radix, headless, custom };
  return maps[designSystem]?.[variant] || maps.carbon[variant];
}

function getSizeClasses(size: string): string {
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-sm rounded',
    md: 'h-10 px-4 text-sm rounded-md',
    lg: 'h-11 px-8 text-base rounded-md',
    icon: 'h-10 w-10 rounded-md',
  };
  return sizes[size] || sizes.md;
}

export default UniversalButton;