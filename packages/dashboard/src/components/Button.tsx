/*
 * IBM Carbon Button — 4 kinds × 3 sizes.
 * Carbon specs: https://carbondesignsystem.com/components/button/usage/
 *
 * Usage:
 *   <Button>Primary</Button>
 *   <Button kind="secondary">Secondary</Button>
 *   <Button kind="ghost">Cancel</Button>
 *   <Button kind="danger">Delete</Button>
 *   <Button size="sm">Small</Button>
 *   <Button size="lg">Large</Button>
 */
import { forwardRef } from "react";

type Kind = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: Kind;
  size?: Size;
}

const KIND_STYLES: Record<Kind, string> = {
  primary:
    "bg-[#0f62fe] text-white hover:bg-[#0050e6] active:bg-[#002d9c] disabled:bg-[#c6c6c6] disabled:text-[#8d8d8d]",
  secondary:
    "bg-[#393939] text-white hover:bg-[#474747] active:bg-[#6f6f6f] disabled:bg-[#c6c6c6] disabled:text-[#8d8d8d]",
  tertiary:
    "bg-transparent border border-[#0f62fe] text-[#0f62fe] hover:bg-[#0f62fe] hover:text-white active:bg-[#002d9c] disabled:border-[#c6c6c6] disabled:text-[#8d8d8d]",
  ghost:
    "bg-transparent text-[#0f62fe] hover:bg-[#e8e8e8] active:bg-[#c6c6c6] disabled:text-[#8d8d8d]",
  danger:
    "bg-[#da1e28] text-white hover:bg-[#b81921] active:bg-[#750e13] disabled:bg-[#c6c6c6] disabled:text-[#8d8d8d]",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { kind = "primary", size = "md", className = "", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f62fe] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed ${KIND_STYLES[kind]} ${SIZE_STYLES[size]} ${className}`}
      {...rest}
    />
  );
});
