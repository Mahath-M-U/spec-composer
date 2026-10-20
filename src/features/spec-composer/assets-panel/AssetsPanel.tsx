import { useId, useRef, useState } from "react";
import { ElementLibrary } from "../contextual-editor/ElementLibrary";
import { Box, Shapes, SlidersHorizontal, Sun } from "lucide-react";
import { SceneLightingControls } from "../scene-lighting-controls";
import { useEditorStore } from "../store";
import { shapeRoleLabel } from "../shape-workflow";
import { isTextKind } from "../types";

const VIEWS = [
  { id: "add", label: "Add", icon: Shapes },
  { id: "environment", label: "Environment", icon: Sun },
] as const;
export function AssetsPanel() {
  const s = useEditorStore();
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("add");
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected =
    s.doc?.elements.filter((element) => s.selectedIds.includes(element.id)) ??
    [];
  const element = selected.length === 1 ? selected[0] : undefined;
  return (
    <div className="assets-panel compose-panel">
      <div
        className="asset-workflow-tabs"
        role="tablist"
        aria-label="Composition settings"
      >
        {VIEWS.map(({ id: key, label, icon: Icon }, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-${key}-tab`}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            aria-selected={view === key}
            aria-controls={`${id}-${key}-panel`}
            tabIndex={view === key ? 0 : -1}
            onClick={() => setView(key)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % VIEWS.length
                  : event.key === "ArrowLeft"
                    ? (index + VIEWS.length - 1) % VIEWS.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? VIEWS.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              const nextView = VIEWS[next];
              if (!nextView) return;
              setView(nextView.id);
              tabRefs.current[next]?.focus();
            }}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-add-panel`}
        aria-labelledby={`${id}-add-tab`}
        hidden={view !== "add"}
        tabIndex={0}
      >
        <ElementLibrary />
      </div>
      <div
        role="tabpanel"
        id={`${id}-environment-panel`}
        aria-labelledby={`${id}-environment-tab`}
        hidden={view !== "environment"}
        tabIndex={0}
        className="asset-settings-view"
      >
        {view === "environment" && (
          <SceneLightingControls presentation="inline" />
        )}
      </div>
      <section className="compose-selection" aria-label="Selected element">
        <div className="asset-section-heading">
          <h3>Selected element</h3>
          {element && (
            <span className="asset-role-badge">
              {element.semanticRole
                ? shapeRoleLabel(element.semanticRole)
                : isTextKind(element.kind)
                  ? "Text"
                  : element.kind === "shape"
                    ? "Shape"
                    : element.kind === "divider"
                      ? "Divider"
                      : "Image"}
            </span>
          )}
        </div>
        {selected.length ? (
          <button
            type="button"
            className="compose-selection-edit"
            aria-label={
              element
                ? `Edit ${element.name}`
                : `Edit ${selected.length} selected elements`
            }
            onClick={() => {
              s.setPanel("style");
              s.setStyleTab("style");
            }}
          >
            <Box aria-hidden="true" />
            <span>
              {element?.name ?? `${selected.length} elements selected`}
            </span>
            <SlidersHorizontal aria-hidden="true" />
          </button>
        ) : (
          <p className="workflow-hint">
            Select an element on the canvas to edit it.
          </p>
        )}
        {!!selected.length && (
          <p className="workflow-hint">
            Edit its role, appearance, placement and description.
          </p>
        )}
      </section>
    </div>
  );
}
