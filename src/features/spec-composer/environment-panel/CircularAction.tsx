import type { ComponentProps } from "react";

/** Shared compact action, including forwarded Radix trigger props/ref. */
export function CircularAction({
  label,
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      className={`environment-circle-action ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
