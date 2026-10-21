import type {
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared segmented tab list, modeled on the Style panel's "Style / Layout
 * Presets" look (`.style-dock-tabs`) via `.ui-segmented`. Wrap `SegmentedTab`
 * items in this so other panels (e.g. Assets) share that visual language.
 */
export function SegmentedTabs({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("ui-segmented", className)}>
      {children}
    </div>
  );
}

export function SegmentedTab({
  id,
  selected,
  controls,
  icon: Icon,
  children,
  onClick,
  onKeyDown,
  disabled,
  buttonRef,
}: {
  id: string;
  selected: boolean;
  controls: string;
  icon?: LucideIcon;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={controls}
      tabIndex={selected ? 0 : -1}
      className="ui-segmented-item"
      disabled={disabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      ref={buttonRef}
    >
      {Icon && <Icon aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
