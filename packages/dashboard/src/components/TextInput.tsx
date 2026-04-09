/*
 * IBM Carbon TextInput — label on top, field below.
 * Carbon specs: https://carbondesignsystem.com/components/text-input/usage/
 */
import { forwardRef } from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  errorText?: string;
}

export const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(
  { label, helperText, errorText, id, className = "", ...rest },
  ref
) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const hasError = Boolean(errorText);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={inputId}
        className="type-label-01 text-[#525252]"
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`h-10 px-4 bg-[#f4f4f4] border-b border-[#8d8d8d] text-sm text-[#161616] placeholder-[#a8a8a8] focus:outline-none focus:border-b-2 focus:border-[#0f62fe] ${
          hasError ? "border-[#da1e28]" : ""
        }`}
        {...rest}
      />
      {errorText ? (
        <span className="text-xs text-[#da1e28]">{errorText}</span>
      ) : helperText ? (
        <span className="text-xs text-[#6f6f6f]">{helperText}</span>
      ) : null}
    </div>
  );
});
