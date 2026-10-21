import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared sub-section heading for left-panel views, modeled on the Layers
 * panel heading (weight + color) via `.ui-section-heading`. Use this instead
 * of ad hoc heading markup so Assets and other panels stay visually
 * consistent.
 */
export function SectionHeading({
  title,
  eyebrow,
  icon: Icon,
  meta,
  as: HeadingTag = "h3",
  id,
  className,
}: {
  title: ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  meta?: ReactNode;
  as?: "h3" | "h4";
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("ui-section-heading", className)}>
      {Icon && <Icon className="ui-section-heading-icon" aria-hidden="true" />}
      <div>
        {eyebrow && <p className="ui-section-heading-eyebrow">{eyebrow}</p>}
        <HeadingTag id={id} className="ui-section-heading-title">
          {title}
        </HeadingTag>
      </div>
      {meta && <span className="ui-section-heading-meta">{meta}</span>}
    </div>
  );
}
