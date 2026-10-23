import { useId, useRef, useState } from "react";
import { Shapes, Sun as SunIcon, Image as ImageIcon } from "lucide-react";
import { PanelHeader } from "../panel-header";
import { SegmentedTab, SegmentedTabs } from "../segmented-tabs";
import { SceneLightingControls } from "../scene-lighting-controls";
import { AddTab } from "./AddTab";
import { SceneList } from "./SceneList";
import "./environment-panel.css";

const VIEWS = [
  { id: "add", label: "Add", icon: Shapes },
  { id: "scene", label: "Scene", icon: ImageIcon },
] as const;

export function EnvironmentPanel() {
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("add");
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className="environment-panel compose-panel">
      <PanelHeader icon={SunIcon} eyebrow="Scene" title="Environment" />
      <SegmentedTabs className="asset-workflow-tabs" label="Environment views">
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
        {view === "add" && <AddTab onLocateScene={() => setView("scene")} />}
      </div>
      <div
        role="tabpanel"
        id={`${id}-scene-panel`}
        aria-labelledby={`${id}-scene-tab`}
        hidden={view !== "scene"}
        tabIndex={0}
      >
        {view === "scene" && (
          <>
            <SceneList />
            <div className="environment-prompt-section">
              <h3>Prompt &amp; Environment</h3>
              <SceneLightingControls />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
