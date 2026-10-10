import { createContext, useContext, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { PanelLeftClose } from "lucide-react";
import { Hint } from "@/components/ui/tooltip";

const PanelCollapseContext = createContext<(() => void) | null>(null);

/**
 * Supplies the collapse handler `PanelHeader` renders as a button at the top
 * right of the left-panel views (Assets, Style, Layers, Templates, Design
 * kit, Resize). Wrap the flyout's content once so every header inside it can
 * read the handler without threading it through each panel's props.
 */
export function PanelCollapseProvider({
  onCollapse,
  children,
}: {
  onCollapse: () => void;
  children: ReactNode;
}) {
  return (
    <PanelCollapseContext.Provider value={onCollapse}>
      {children}
    </PanelCollapseContext.Provider>
  );
}

/**
 * Shared header for the editor's left-panel views (Assets, Style, Layers,
 * Templates, Design kit, Resize): accent icon, optional eyebrow, title and a
 * meta pill.
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
  const onCollapse = useContext(PanelCollapseContext);
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
      {(meta || onCollapse) && (
        <div className="panel-header-actions">
          {meta && <span className="panel-header-meta">{meta}</span>}
          {onCollapse && (
            <Hint label="Hide panel">
              <button
                type="button"
                className="right-panel-toggle"
                aria-label="Hide panel"
                aria-expanded={true}
                aria-controls="editor-left-panel"
                onClick={onCollapse}
              >
                <PanelLeftClose aria-hidden="true" />
              </button>
            </Hint>
          )}
        </div>
      )}
    </div>
  );
}
