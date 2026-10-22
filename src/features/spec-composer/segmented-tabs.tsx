import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SegmentedStyle = CSSProperties & {
  [property: `--${string}`]: string | number | undefined;
};

/**
 * Shared Inspector/Library tabs. Customize via className or style on either
 * component. CSS variables inherit from the list to its items:
 * --segmented-{gap,track-padding,track-radius,track-background},
 * --segmented-{item-height,touch-height,item-radius,item-padding,font-size,icon-size},
 * --segmented-{muted-foreground,selected-foreground,selected-icon},
 * --segmented-{selected-background,selected-border,focus-color}.
 * Defaults use the Inspector's 30px items, 9px dark track and coral selection.
 */
export function SegmentedTabs({
  label,
  className,
  style,
  onKeyDown,
  children,
}: {
  label: string;
  className?: string;
  style?: SegmentedStyle;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("ui-segmented", className)}
      style={style}
      onKeyDown={onKeyDown}
    >
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
  className,
  style,
  dataTour,
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
  className?: string;
  style?: SegmentedStyle;
  dataTour?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={controls}
      tabIndex={selected ? 0 : -1}
      className={cn("ui-segmented-item", className)}
      style={style}
      data-tour={dataTour}
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
