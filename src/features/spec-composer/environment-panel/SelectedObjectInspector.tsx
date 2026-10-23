import { Crosshair } from "lucide-react";
import { CommitInput } from "../committed-input";
import {
  controlsForSceneObject,
  type SceneControlDescriptor,
  type SceneObjectRef,
} from "../scene-controls";
import {
  resolveSceneObject,
  sceneObjectAnchor,
  sceneObjectIconId,
} from "../scene-controls-store";
import { sceneObjectList, SCENE_ASSETS } from "../scene-objects";
import { useEditorStore } from "../store";
import { ScenePropertyControl } from "./ScenePropertyControl";
import { SceneObjectActions } from "./SceneRow";
import { SceneIcon } from "./scene-icons";

/** Sidebar-specific controls leave the toolbar's existing layout unchanged. */
function inspectorControls(ref: SceneObjectRef): SceneControlDescriptor[] {
  const controls = controlsForSceneObject(ref).filter(
    (control) => control.type !== "button" && control.key !== "kind",
  );
  if (
    ref.type === "light" &&
    !controls.some((control) => ["diffusion", "spread"].includes(control.key))
  )
    controls.push({
      type: "slider",
      key: "diffusion",
      label: "Softness",
      min: 0,
      max: 100,
      step: 1,
    });
  const order = [
    "intensity",
    "coneAngle",
    "spread",
    "diffusion",
    "color",
    "shadows",
    "temperature",
    "rotation",
  ];
  return controls
    .sort(
      (a, b) =>
        (order.indexOf(a.key) < 0 ? 100 : order.indexOf(a.key)) -
        (order.indexOf(b.key) < 0 ? 100 : order.indexOf(b.key)),
    )
    .map((control) =>
      control.key === "spread"
        ? { ...control, label: "Softness / spread" }
        : control,
    );
}

export function SelectedObjectInspector() {
  const doc = useEditorStore((s) => s.doc);
  const id = useEditorStore((s) => s.selectedSceneId);
  const preview = useEditorStore((s) => s.scenePreview);
  if (!doc || !id || id === "ambient") return null;
  const ref = resolveSceneObject(doc, id, preview);
  const row = sceneObjectList(doc).find((object) => object.id === id);
  if (!ref || !row) return null;
  const iconId = sceneObjectIconId(ref);
  const description =
    SCENE_ASSETS.find((asset) => asset.id === iconId)?.hint ?? "Scene object";
  const anchor = sceneObjectAnchor(ref);
  const updatePosition = (axis: "x" | "y", value: string) => {
    if (!anchor) return;
    const next = { ...anchor, [axis]: Number(value) };
    const s = useEditorStore.getState();
    if (ref.type === "camera") s.updateSceneCamera({ position: next });
    else if (ref.type === "light") s.updateSceneLight(id, { canvas: next });
  };
  return (
    <section
      className="environment-inspector"
      aria-label={`${row.label} properties`}
    >
      <header className="environment-inspector-heading">
        <SceneIcon id={iconId} />
        <span className="environment-tile-text">
          <strong>{row.label}</strong>
          <small>{description}</small>
        </span>
        <SceneObjectActions row={row} />
      </header>
      {inspectorControls(ref).map((descriptor) => (
        <ScenePropertyControl
          key={`${id}-${descriptor.key}`}
          id={id}
          objectRef={ref}
          descriptor={descriptor}
        />
      ))}
      {anchor && (
        <div className="environment-transform-controls">
          <span>Position</span>
          <div className="environment-coordinate-grid">
            {(["x", "y"] as const).map((axis) => (
              <CommitInput
                key={axis}
                label={axis.toUpperCase()}
                numeric
                min={-1.5}
                max={1.5}
                step={0.01}
                required
                value={String(Number(anchor[axis].toFixed(2)))}
                onCommit={(value) => updatePosition(axis, value)}
              />
            ))}
          </div>
        </div>
      )}
      {ref.type === "light" && (
        <ScenePropertyControl
          id={id}
          objectRef={ref}
          descriptor={{
            type: "select",
            key: "depth",
            label: "Depth",
            options: ["front", "side", "back"].map((value) => ({
              value,
              label: value[0]!.toUpperCase() + value.slice(1),
            })),
          }}
        />
      )}
      {ref.type === "camera" && (
        <>
          <div className="environment-transform-controls">
            <span>Target</span>
            <div className="environment-coordinate-grid">
              {(["x", "y"] as const).map((axis) => (
                <CommitInput
                  key={axis}
                  label={`Target ${axis.toUpperCase()}`}
                  numeric
                  min={-1.5}
                  max={1.5}
                  step={0.01}
                  required
                  value={String(ref.camera.target[axis])}
                  onCommit={(value) =>
                    useEditorStore
                      .getState()
                      .updateSceneCamera({
                        target: { ...ref.camera.target, [axis]: Number(value) },
                      })
                  }
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            className="environment-set-view"
            onClick={() => useEditorStore.getState().setCameraFromView()}
          >
            <Crosshair size={14} aria-hidden="true" /> Set from View
          </button>
        </>
      )}
    </section>
  );
}
