import type { ReactNode } from "react";
import { Hint } from "@/components/ui/tooltip";

export function Tool({
  icon,
  label,
  shortcut,
  side,
  ...props
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  side?: "top" | "right" | "bottom" | "left";
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  // Disabled buttons swallow pointer events, so the span is the trigger.
  return (
    <Hint label={label} shortcut={shortcut} {...(side ? { side } : {})}>
      <span className="inline-flex">
        <button
          aria-label={label}
          aria-keyshortcuts={shortcut}
          disabled={props.disabled}
          onClick={props.onClick}
          className={`tool-button ${props.active ? "active" : ""}`}
        >
          {icon}
        </button>
      </span>
    </Hint>
  );
}

export function Sep() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-editor-border" />;
}
