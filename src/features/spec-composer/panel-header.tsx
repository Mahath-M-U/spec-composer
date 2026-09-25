import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Shared header for the editor's left-panel views (Assets, Layers, Templates,
 * Design kit, Resize): accent icon, optional eyebrow, title and a meta pill.
 */
export function PanelHeader({
  title,
  eyebrow,
  icon: Icon,
  badge,
  meta,
  id,
}: {
  title: ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  meta?: ReactNode;
  id?: string;
}) {
  return (
    <div className="panel-header">
      <div className="panel-header-title">
        {Icon && <Icon className="panel-header-icon" aria-hidden="true" />}
        <div>
          {eyebrow && <p className="panel-header-eyebrow">{eyebrow}</p>}
          <h2 id={id}>
            {title}
            {badge}
          </h2>
        </div>
      </div>
      {meta && <span className="panel-header-meta">{meta}</span>}
    </div>
  );
}
