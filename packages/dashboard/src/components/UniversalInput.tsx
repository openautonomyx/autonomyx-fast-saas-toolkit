/**
 * Universal Input - Works with all UI themes
 */

import { getThemeConfig } from '../lib/ui-theme';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const UniversalInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const theme = getThemeConfig();
    const styles = getInputStyles(theme.designSystem);

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={id} 
            className={styles.label}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`${styles.input} ${error ? styles.error : ''} ${className}`}
          {...props}
        />
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    );
  }
);

UniversalInput.displayName = 'UniversalInput';

function getInputStyles(designSystem: string) {
  const styles: Record<string, {
    label: string;
    input: string;
    error: string;
    errorText: string;
  }> = {
    carbon: {
      label: "block text-sm font-normal text-[#525252] mb-2",
      input: "flex h-10 w-full rounded bg-white border border-[#8d8d8d] px-3 py-2 text-sm text-[#161616] placeholder:text-[#a8a8a8] focus:outline-none focus:ring-2 focus:ring-[#0f62fe] focus:border-[#0f62fe] disabled:cursor-not-allowed disabled:opacity-50",
      error: "border-[#da1e28] focus:ring-[#da1e28] focus:border-[#da1e28]",
      errorText: "text-xs text-[#da1e28] mt-1",
    },
    shadcn: {
      label: "block text-sm font-medium text-foreground mb-2",
      input: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      error: "border-destructive focus:ring-destructive",
      errorText: "text-xs text-destructive mt-1",
    },
    radix: {
      label: "block text-sm font-medium text-slate-700 mb-2",
      input: "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
      error: "border-red-500 focus:ring-red-500 focus:border-red-500",
      errorText: "text-xs text-red-500 mt-1",
    },
    headless: {
      label: "block text-sm font-medium text-gray-700 mb-2",
      input: "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
      error: "border-red-500 ring-red-500",
      errorText: "text-xs text-red-500 mt-1",
    },
    custom: {
      label: "block text-sm font-medium text-gray-800 mb-2",
      input: "flex h-10 w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
      error: "border-red-600 ring-red-600",
      errorText: "text-xs text-red-600 mt-1",
    },
  };

  return styles[designSystem] || styles.carbon;
}

export default UniversalInput;