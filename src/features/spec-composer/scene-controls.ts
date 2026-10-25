/** Pure descriptor model for the environment editor's per-object controls:
 * the Scene Overlay's contextual toolbar (SceneObjectToolbar.tsx) and the
 * Design Inspector's scene section both render the same descriptor list for
 * the selected object, reading live store state, so they stay in sync.
 * Nothing here touches the store or React. */
import { kindFromLegacy, SCENE_ASSETS } from "./scene-objects";
import {
  CAMERA_PROJECTIONS,
  CAMERA_VIEW_ANGLES,
  SCENE_LIGHT_KINDS,
  SHADOW_TYPES,
  type CameraProjection,
  type CameraViewAngle,
  type SceneAmbient,
  type SceneCamera,
  type SceneLightKind,
  type StudioLight,
} from "./types";

export type SceneControlType = "slider" | "select" | "color" | "toggle" | "button";

export interface SceneControlOption {
  value: string;
  label: string;
}

export interface SceneControlDescriptor {
  type: SceneControlType;
  /** Field key on the object's StudioLight/SceneCamera/SceneAmbient shape,
   * or (for buttons) a scene-controls-store.ts action name. */
  key: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: SceneControlOption[];
}

export type SceneObjectRef =
  | { type: "light"; light: StudioLight }
  | { type: "camera"; camera: SceneCamera }
  | { type: "ambient"; ambient: SceneAmbient };

/** The "Type" select's options, one per base light kind, sourced from the
 * Add tab's own catalog so the two stay in lockstep (the Rim card is a
 * role/depth variant of Spotlight, not a distinct kind, so it's excluded). */
const LIGHT_KIND_OPTIONS: SceneControlOption[] = SCENE_ASSETS.filter(
  (asset) =>
    !asset.roleOverride &&
    (SCENE_LIGHT_KINDS as readonly string[]).includes(asset.kind),
).map((asset) => ({ value: asset.kind, label: asset.label }));

const SHADOW_OPTIONS: SceneControlOption[] = SHADOW_TYPES.map((value) => ({
  value,
  label: value,
}));

const CAMERA_ANGLE_LABELS: Record<CameraViewAngle, string> = {
  "eye-level": "Eye level",
  low: "Low angle",
  high: "High angle",
  "top-down": "Top-down",
  "three-quarter": "Three-quarter",
};
const CAMERA_ANGLE_OPTIONS: SceneControlOption[] = CAMERA_VIEW_ANGLES.map(
  (value) => ({ value, label: CAMERA_ANGLE_LABELS[value] }),
);

const CAMERA_PROJECTION_LABELS: Record<CameraProjection, string> = {
  normal: "Normal",
  wide: "Wide",
  telephoto: "Telephoto",
  orthographic: "Orthographic",
};
const CAMERA_PROJECTION_OPTIONS: SceneControlOption[] = CAMERA_PROJECTIONS.map(
  (value) => ({ value, label: CAMERA_PROJECTION_LABELS[value] }),
);

function cameraControls(): SceneControlDescriptor[] {
  return [
    { type: "slider", key: "focalLength", label: "Focal length", min: 14, max: 300, step: 1 },
    { type: "select", key: "angle", label: "Angle", options: CAMERA_ANGLE_OPTIONS },
    { type: "select", key: "projection", label: "Perspective", options: CAMERA_PROJECTION_OPTIONS },
    { type: "slider", key: "rotation", label: "Rotation", min: -180, max: 180, step: 1 },
  ];
}

function ambientControls(): SceneControlDescriptor[] {
  return [
    { type: "toggle", key: "enabled", label: "Enabled" },
    { type: "slider", key: "intensity", label: "Intensity", min: 0, max: 100, step: 1 },
    { type: "slider", key: "temperature", label: "Temperature", min: 2000, max: 10000, step: 50 },
  ];
}

function lightKind(light: StudioLight): SceneLightKind {
  return light.kind ?? kindFromLegacy(light);
}

function lightControls(light: StudioLight): SceneControlDescriptor[] {
  const kind = lightKind(light);
  const isRim = light.role === "Rim";
  const descriptors: SceneControlDescriptor[] = [
    { type: "select", key: "kind", label: "Type", options: LIGHT_KIND_OPTIONS },
    {
      type: "slider",
      key: "intensity",
      label: isRim ? "Edge intensity" : "Intensity",
      min: 0,
      max: 100,
      step: 1,
    },
    { type: "slider", key: "temperature", label: "Temperature", min: 2000, max: 10000, step: 50 },
    { type: "color", key: "color", label: "Color" },
    { type: "slider", key: "rotation", label: "Direction", min: -180, max: 180, step: 1 },
    { type: "select", key: "shadows", label: "Shadows", options: SHADOW_OPTIONS },
  ];
  if (kind === "sun")
    descriptors.push(
      { type: "slider", key: "elevation", label: "Elevation", min: -90, max: 90, step: 1 },
      { type: "slider", key: "diffusion", label: "Softness", min: 0, max: 100, step: 1 },
    );
  else if (kind === "spot")
    descriptors.push(
      { type: "slider", key: "coneAngle", label: "Cone angle", min: 5, max: 120, step: 1 },
      { type: "slider", key: "diffusion", label: "Softness", min: 0, max: 100, step: 1 },
    );
  else if (kind === "point")
    descriptors.push({
      type: "slider",
      key: "radius",
      label: "Influence radius",
      min: 0.05,
      max: 3,
      step: 0.05,
    });
  else if (kind === "area" || kind === "diffused")
    descriptors.push(
      { type: "slider", key: "width", label: "Width", min: 0.1, max: 5, step: 0.1 },
      { type: "slider", key: "height", label: "Height", min: 0.1, max: 5, step: 0.1 },
      { type: "slider", key: "spread", label: "Spread", min: 0, max: 100, step: 1 },
    );
  descriptors.push(
    { type: "button", key: "duplicate", label: "Duplicate" },
    { type: "button", key: "delete", label: "Delete" },
  );
  return descriptors;
}

/** The compact control set for `ref`'s object kind, shared by the toolbar
 * and the inspector. Order matters: it's the display order in both. */
export function controlsForSceneObject(ref: SceneObjectRef): SceneControlDescriptor[] {
  if (ref.type === "camera") return cameraControls();
  if (ref.type === "ambient") return ambientControls();
  return lightControls(ref.light);
}

/** "spread" (area/diffused lights) is a friendlier label for the schema's
 * `diffusion` field, reused from "softness" (sun/spot); every other
 * descriptor key names its schema field directly. */
export function sceneControlFieldKey(key: string): string {
  return key === "spread" ? "diffusion" : key;
}

/** The current value of `descriptor.key` on `ref`'s object; action buttons
 * have no value and resolve to `undefined`. */
export function sceneControlValue(
  ref: SceneObjectRef,
  descriptor: SceneControlDescriptor,
): unknown {
  if (descriptor.type === "button") return undefined;
  const object: Record<string, unknown> =
    ref.type === "camera" ? ref.camera : ref.type === "ambient" ? ref.ambient : ref.light;
  return object[sceneControlFieldKey(descriptor.key)];
}
