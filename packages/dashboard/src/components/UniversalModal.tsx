/**
 * Universal Modal - Works with all UI themes
 */

import { getThemeConfig } from '../lib/ui-theme';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function UniversalModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: ModalProps) {
  const theme = getThemeConfig();
  const styles = getModalStyles(theme.designSystem);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative ${sizeClasses[size]} w-full ${styles.container}`}>
        {/* Header */}
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

function getModalStyles(designSystem: string) {
  const styles: Record<string, {
    container: string;
    header: string;
    title: string;
    closeButton: string;
    content: string;
  }> = {
    carbon: {
      container: 'bg-white rounded-none shadow-lg',
      header: 'flex items-center justify-between px-6 py-4 border-b border-[#e0e0e0]',
      title: 'text-lg font-semibold text-[#161616]',
      closeButton: 'text-[#525252] hover:text-[#161616] text-2xl leading-none bg-transparent border-none cursor-pointer',
      content: 'p-6',
    },
    shadcn: {
      container: 'bg-background border border-border rounded-lg shadow-lg',
      header: 'flex items-center justify-between px-6 py-4 border-b border-border',
      title: 'text-lg font-semibold text-foreground',
      closeButton: 'text-muted-foreground hover:text-foreground text-2xl leading-none bg-transparent border-none cursor-pointer',
      content: 'p-6',
    },
    radix: {
      container: 'bg-white rounded-lg shadow-xl',
      header: 'flex items-center justify-between px-6 py-4 border-b border-slate-200',
      title: 'text-lg font-semibold text-slate-900',
      closeButton: 'text-slate-500 hover:text-slate-900 text-2xl leading-none bg-transparent border-none cursor-pointer',
      content: 'p-6',
    },
    headless: {
      container: 'bg-white rounded-xl shadow-2xl',
      header: 'flex items-center justify-between px-6 py-4 border-b border-gray-200',
      title: 'text-lg font-semibold text-gray-900',
      closeButton: 'text-gray-400 hover:text-gray-600 text-2xl leading-none bg-transparent border-none cursor-pointer',
      content: 'p-6',
    },
    custom: {
      container: 'bg-white rounded shadow-lg',
      header: 'flex items-center justify-between px-4 py-3 border-b border-gray-300',
      title: 'text-base font-semibold text-black',
      closeButton: 'text-gray-600 hover:text-black text-xl leading-none bg-transparent border-none cursor-pointer',
      content: 'p-4',
    },
  };

  return styles[designSystem] || styles.carbon;
}

export default UniversalModal;