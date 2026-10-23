/** Bridges the pure scene-controls.ts descriptors to the store: resolving
 * the selected scene object's live data and dispatching a descriptor's edit
 * through the right `update*`/`duplicateSceneLight`/`removeSceneObject`
 * action. Both SceneObjectToolbar and the inspector's scene section go
 * through here so every edit is undoable the same way. */
import { kindFromLegacy, SCENE_ASSETS } from "./scene-objects";
import { canvasToScene, sceneToCanvas } from "./scene-space";
import { useEditorStore, type SceneTransformPreview } from "./store";
import type { SceneControlDescriptor } from "./scene-controls";
import { sceneControlFieldKey, type SceneObjectRef } from "./scene-controls";
import type {
  SceneAmbient,
  SceneCamera,
  SceneVec2,
  SpecDocument,
  StudioLight,
} from "./types";

export function resolveSceneObject(
  doc: Pick<SpecDocument, "generationSettings">,
  id: string,
  preview?: SceneTransformPreview | null,
): SceneObjectRef | undefined {
  const transform = preview?.id === id ? preview : null;
  if (id === "camera") {
    const camera = doc.generationSettings?.camera;
    return camera
      ? {
          type: "camera",
          camera: transform
            ? {
                ...camera,
                ...(transform.canvas ? { position: transform.canvas } : {}),
                ...(transform.rotation !== undefined
                  ? { rotation: transform.rotation }
                  : {}),
              }
            : camera,
        }
      : undefined;
  }
  if (id === "ambient")
    return {
      type: "ambient",
      ambient: doc.generationSettings?.ambient ?? {
        enabled: false,
        intensity: 50,
        temperature: 5600,
      },
    };
  const light = doc.generationSettings?.studioLights?.find((l) => l.id === id);
  if (!light) return undefined;
  if (!transform) return { type: "light", light };
  return {
    type: "light",
    light: {
      ...light,
      ...(transform.canvas
        ? {
            canvas: transform.canvas,
            ...canvasToScene(transform.canvas, light.depth ?? "front"),
          }
        : {}),
      ...(transform.rotation !== undefined
        ? { rotation: transform.rotation }
        : {}),
    },
  };
}

/** `ref`'s screen-anchor position in normalized scene space, or `undefined`
 * for ambient (a global setting with no canvas position; see
 * scene-overlay/SceneOverlay.tsx, which likewise never anchors it there). */
export function sceneObjectAnchor(ref: SceneObjectRef): SceneVec2 | undefined {
  if (ref.type === "camera") return ref.camera.position;
  if (ref.type === "ambient") return undefined;
  return (
    ref.light.canvas ??
    sceneToCanvas({ azimuth: ref.light.azimuth, elevation: ref.light.elevation }).canvas
  );
}

/** A short label for `ref`, for toolbar/inspector headings; matches the Add
 * tab's own catalog labels. */
export function sceneObjectLabel(ref: SceneObjectRef): string {
  if (ref.type === "camera") return ref.camera.name ?? "Camera";
  if (ref.type === "ambient") return "Ambient";
  if (ref.light.role === "Rim") return "Rim";
  const kind = ref.light.kind ?? kindFromLegacy(ref.light);
  return SCENE_ASSETS.find((asset) => asset.kind === kind && !asset.roleOverride)?.label ?? "Light";
}

/** The Scene tab's icon id for `ref` (see environment-panel/scene-icons.tsx). */
export function sceneObjectIconId(ref: SceneObjectRef): string {
  if (ref.type === "camera") return "camera";
  if (ref.type === "ambient") return "ambient";
  if (ref.light.role === "Rim") return "rim";
  return ref.light.kind ?? kindFromLegacy(ref.light);
}

/** Dispatches one descriptor's edit for scene object `id` through the
 * matching store action, history-bracketed like every other store mutation
 * (`history` defaults to a single commit for discrete controls). */
export function applySceneControl(
  id: string,
  descriptor: SceneControlDescriptor,
  value: unknown,
  history = true,
): void {
  const s = useEditorStore.getState();
  if (descriptor.type === "button") {
    if (descriptor.key === "duplicate") s.duplicateSceneLight(id);
    else if (descriptor.key === "delete") s.removeSceneObject(id);
    return;
  }
  const key = sceneControlFieldKey(descriptor.key);
  if (id === "camera") {
    s.updateSceneCamera({ [key]: value } as Partial<SceneCamera>, history);
    return;
  }
  if (id === "ambient") {
    s.updateAmbient({ [key]: value } as Partial<SceneAmbient>, history);
    return;
  }
  s.updateSceneLight(id, { [key]: value } as Partial<StudioLight>, history);
}
