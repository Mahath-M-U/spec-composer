import { useId, useRef, useState } from "react";
import { ElementLibrary } from "../contextual-editor/ElementLibrary";
import { Image as ImageIcon, Shapes, Sun } from "lucide-react";
import { SceneLightingControls } from "../scene-lighting-controls";
import { PanelHeader } from "../panel-header";
import { SegmentedTab, SegmentedTabs } from "../segmented-tabs";

const VIEWS = [
  { id: "add", label: "Add", icon: Shapes },
  { id: "environment", label: "Environment", icon: Sun },
] as const;
export function AssetsPanel() {
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("add");
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className="assets-panel compose-panel">
      <PanelHeader icon={ImageIcon} eyebrow="Library" title="Assets" />
      <SegmentedTabs className="asset-workflow-tabs" label="Composition settings">
        {VIEWS.map(({ id: key, label, icon: Icon }, index) => (
          <SegmentedTab
            key={key}
            id={`${id}-${key}-tab`}
            selected={view === key}
            controls={`${id}-${key}-panel`}
            icon={Icon}
            buttonRef={(node) => {
              tabRefs.current[index] = node;
            }}
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
            {label}
          </SegmentedTab>
        ))}
      </SegmentedTabs>
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
    </div>
  );
}
