import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Label({
  text,
  children,
  className,
}: {
  text: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("field-label", className)}>
      <span>{text}</span>
      {children}
    </label>
  );
}
