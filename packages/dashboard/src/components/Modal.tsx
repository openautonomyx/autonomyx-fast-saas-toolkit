/*
 * IBM Carbon-style Modal.
 * Carbon specs: https://carbondesignsystem.com/components/modal/usage/
 *
 * Controlled: parent owns `open` state.
 */
"use client";

import { useEffect } from "react";
import { Close } from "@carbon/icons-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void };
  danger?: boolean;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  primaryAction,
  secondaryAction,
  danger = false,
  children,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(22,22,22,0.5)] z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="type-heading-03 text-[#161616]">{title}</h2>
            {description && (
              <p className="mt-2 text-sm text-[#525252]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#161616] hover:bg-[#e8e8e8] p-1 transition-colors"
          >
            <Close size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {(primaryAction || secondaryAction) && (
          <div className="flex border-t border-[#e0e0e0]">
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="flex-1 h-16 px-5 text-sm text-[#161616] bg-[#e0e0e0] hover:bg-[#c6c6c6] transition-colors"
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className={`flex-1 h-16 px-5 text-sm text-white transition-colors disabled:bg-[#c6c6c6] disabled:cursor-not-allowed ${
                  danger
                    ? "bg-[#da1e28] hover:bg-[#b81921]"
                    : "bg-[#0f62fe] hover:bg-[#0050e6]"
                }`}
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
