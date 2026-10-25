import { resolveSceneObject } from "../scene-controls-store";
import { controlsForSceneObject } from "../scene-controls";
import { useEditorStore } from "../store";
import { ScenePropertyControl } from "./ScenePropertyControl";
import { SceneIcon } from "./scene-icons";

export function AmbientSettings() {
  const doc = useEditorStore((s) => s.doc);
  const selected = useEditorStore((s) => s.selectedSceneId === "ambient");
  if (!doc) return null;
  const ref = resolveSceneObject(doc, "ambient")!;
  if (ref.type !== "ambient") return null;
  return (
    <details
      className="environment-ambient-settings"
      open={selected || undefined}
    >
      <summary>
        <SceneIcon id="ambient" />
        <span className="environment-tile-text">
          <strong>Ambient fill</strong>
          <small>Soft global illumination</small>
        </span>
        <span className="environment-status">
          {ref.ambient.enabled ? "On" : "Off"}
        </span>
      </summary>
      {controlsForSceneObject(ref).map((descriptor) => (
        <ScenePropertyControl
          key={descriptor.key}
          id="ambient"
          objectRef={ref}
          descriptor={descriptor}
        />
      ))}
    </details>
  );
}
