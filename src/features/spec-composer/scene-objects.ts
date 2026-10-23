/** Catalog and derived views for the environment editor's scene objects
 * (camera, lights, ambient). Builds on the legacy studio lighting rig
 * (studio-lighting.ts) rather than replacing it: every scene light is a
 * `StudioLight` tagged with a `kind`. */
import { canvasToScene, clampNorm, defaultPlacement } from "./scene-space";
import { createStudioLight } from "./studio-lighting";
import {
  MAX_SCENE_LIGHTS,
  SCENE_LIGHT_KINDS,
  type GenerationSettings,
  type SceneCamera,
  type SceneDepth,
  type SceneLightKind,
  type SceneVec2,
  type SpecDocument,
  type StudioLight,
} from "./types";

type StudioLightRole = StudioLight["role"];

export { MAX_SCENE_LIGHTS } from "./types";

type SceneDisplayKind = SceneLightKind | "rim";

const KIND_LABELS: Record<SceneDisplayKind, string> = {
  sun: "Sunlight",
  diffused: "Diffused",
  spot: "Spotlight",
  point: "Point",
  area: "Area",
  rim: "Rim",
};

/** Heuristic defaults (shape/modifier/intensity/etc.) for a freshly created
 * light of each kind; tuned to read sensibly in the legacy studio-lighting
 * compiler without any new prompt text. */
const KIND_LIGHT_DEFAULTS: Record<
  SceneLightKind,
  Pick<
    StudioLight,
    | "role"
    | "shape"
    | "modifier"
    | "width"
    | "height"
    | "intensity"
    | "diffusion"
    | "temperature"
    | "shadows"
  > & { coneAngle?: number; radius?: number }
> = {
  sun: {
    role: "Key",
    shape: "Rectangle",
    modifier: "Bare",
    width: 3,
    height: 3,
    intensity: 90,
    diffusion: 20,
    temperature: 5600,
    shadows: "Hard",
  },
  diffused: {
    role: "Key",
    shape: "Rectangle",
    modifier: "Diffusion panel",
    width: 2.5,
    height: 2.5,
    intensity: 65,
    diffusion: 90,
    temperature: 5600,
    shadows: "Soft",
  },
  spot: {
    role: "Key",
    shape: "Disk",
    modifier: "Bare",
    width: 1,
    height: 1,
    intensity: 80,
    diffusion: 30,
    temperature: 5600,
    shadows: "Hard",
    coneAngle: 35,
  },
  point: {
    role: "Fill",
    shape: "Disk",
    modifier: "Bare",
    width: 0.3,
    height: 0.3,
    intensity: 60,
    diffusion: 50,
    temperature: 4000,
    shadows: "Soft",
    radius: 0.3,
  },
  area: {
    role: "Fill",
    shape: "Rectangle",
    modifier: "Softbox",
    width: 2,
    height: 1.2,
    intensity: 55,
    diffusion: 85,
    temperature: 5000,
    shadows: "Soft",
  },
};

export interface SceneAssetDef {
  id: string;
  label: string;
  hint: string;
  /** "camera" and "cameraFromView" are camera actions; everything else is a
   * light of that SceneLightKind (the Rim card reuses "spot" with a role
   * and depth override). */
  kind: SceneLightKind | "camera" | "cameraFromView";
  roleOverride?: StudioLightRole;
  depthOverride?: SceneDepth;
}

/** Add-tab catalog: Camera, Set from View, then one card per light kind,
 * with Rim as a role/depth variant of Spotlight. Ambient is a global
 * setting row, not a card (see AddTab.tsx). */
export const SCENE_ASSETS: readonly SceneAssetDef[] = [
  { id: "camera", label: "Camera", hint: "Frames the scene for the generated image.", kind: "camera" },
  {
    id: "camera-from-view",
    label: "Set from View",
    hint: "Matches the camera to your current canvas view.",
    kind: "cameraFromView",
  },
  { id: "sun", label: "Sunlight", hint: "Strong directional light with hard shadows.", kind: "sun" },
  { id: "diffused", label: "Diffused", hint: "Broad, soft light with gentle shadows.", kind: "diffused" },
  { id: "spot", label: "Spotlight", hint: "A focused cone of light.", kind: "spot" },
  { id: "point", label: "Point", hint: "Omnidirectional light from a single source.", kind: "point" },
  { id: "area", label: "Area", hint: "Soft light from a rectangular source.", kind: "area" },
  {
    id: "rim",
    label: "Rim",
    hint: "Edge light from behind for separation.",
    kind: "spot",
    roleOverride: "Rim",
    depthOverride: "back",
  },
] as const;

/** Legacy lights (saved before the environment editor) have no `kind`; this
 * recovers a reasonable one from their existing shape/modifier/diffusion so
 * they still get a sensible icon and label. */
export function kindFromLegacy(
  light: Pick<StudioLight, "shape" | "modifier" | "width" | "diffusion">,
): SceneLightKind {
  if (light.modifier === "Diffusion panel") return "diffused";
  if (light.shape === "Disk") return light.width <= 0.5 ? "point" : "spot";
  if (light.diffusion >= 85) return "diffused";
  return "area";
}

function displayKind(light: StudioLight): SceneDisplayKind {
  if (light.role === "Rim") return "rim";
  return light.kind ?? kindFromLegacy(light);
}

/** Builds a new scene light, placing it with a sensible default position
 * (or `at`, if given) and deriving azimuth/elevation so the legacy compiler
 * path keeps working unchanged. */
export function createSceneLight(
  kind: SceneLightKind,
  existing: readonly StudioLight[],
  at?: { x: number; y: number },
  overrides: { role?: StudioLightRole; depth?: SceneDepth } = {},
): StudioLight {
  const display: SceneDisplayKind = overrides.role === "Rim" ? "rim" : kind;
  const index = existing.filter((light) => displayKind(light) === display).length;
  const placement = defaultPlacement(kind, index);
  const canvas = at ? clampNorm(at) : placement.canvas;
  const depth = overrides.depth ?? placement.depth;
  const { azimuth, elevation } = canvasToScene(canvas, depth);
  const base = KIND_LIGHT_DEFAULTS[kind];
  return createStudioLight({
    name: `${KIND_LABELS[display]} ${index + 1}`,
    role: overrides.role ?? base.role,
    shape: base.shape,
    modifier: base.modifier,
    width: base.width,
    height: base.height,
    intensity: base.intensity,
    diffusion: base.diffusion,
    temperature: base.temperature,
    shadows: base.shadows,
    ...(base.coneAngle !== undefined ? { coneAngle: base.coneAngle } : {}),
    ...(base.radius !== undefined ? { radius: base.radius } : {}),
    azimuth,
    elevation,
    kind,
    canvas,
    rotation: placement.rotation,
    depth,
  });
}

/** Builds a new scene camera at a default (or given) position, looking at
 * the artboard centre. */
export function createSceneCamera(at?: { x: number; y: number }): SceneCamera {
  const position: SceneVec2 = at ? clampNorm(at) : { x: 0, y: -0.9 };
  return {
    enabled: true,
    position,
    rotation: 90,
    target: { x: 0, y: 0 },
    focalLength: 50,
    angle: "eye-level",
    projection: "normal",
  };
}

export function canAddLight(
  doc: Pick<SpecDocument, "generationSettings">,
): boolean {
  return (doc.generationSettings?.studioLights?.length ?? 0) < MAX_SCENE_LIGHTS;
}

export function canAddCamera(
  doc: Pick<SpecDocument, "generationSettings">,
): boolean {
  return !doc.generationSettings?.camera;
}

export interface SceneObjectSummary {
  id: string;
  type: "camera" | "light" | "ambient";
  label: string;
  enabled: boolean;
  guideHidden: boolean;
}

/** The Scene tab's flat list: camera (if any), every light, then Ambient —
 * always present so it can be toggled on even before anyone else set it. */
export function sceneObjectList(
  doc: Pick<SpecDocument, "generationSettings">,
): SceneObjectSummary[] {
  const settings: GenerationSettings | undefined = doc.generationSettings;
  const list: SceneObjectSummary[] = [];
  if (settings?.camera)
    list.push({
      id: "camera",
      type: "camera",
      label: "Camera",
      enabled: settings.camera.enabled,
      guideHidden: !!settings.camera.guideHidden,
    });
  const counts = new Map<SceneDisplayKind, number>();
  for (const light of settings?.studioLights ?? []) {
    const display = displayKind(light);
    const next = (counts.get(display) ?? 0) + 1;
    counts.set(display, next);
    list.push({
      id: light.id,
      type: "light",
      label: `${KIND_LABELS[display]} ${next}`,
      enabled: light.enabled,
      guideHidden: !!light.guideHidden,
    });
  }
  list.push({
    id: "ambient",
    type: "ambient",
    label: "Ambient",
    enabled: settings?.ambient?.enabled ?? false,
    guideHidden: true,
  });
  return list;
}

export { SCENE_LIGHT_KINDS };

/** Drag payload type for Add-tab cards onto the canvas; see
 * canvas-surface.tsx's onDragOver allow-list and onDrop handling. */
export const SCENE_DRAG_TYPE = "application/x-spec-scene-object";

export interface SceneDragPayload {
  type: "camera" | "light";
  kind?: SceneLightKind;
  role?: StudioLightRole;
  depth?: SceneDepth;
}

/** Validates a scene-object drag payload without trusting its contents;
 * mirrors contextual-editor/catalog.ts's parseCatalogDrag. */
export function parseSceneDrag(value: string): SceneDragPayload | undefined {
  try {
    const payload: unknown = JSON.parse(value);
    if (!payload || typeof payload !== "object" || !("type" in payload))
      return undefined;
    const type = (payload as { type: unknown }).type;
    if (type !== "camera" && type !== "light") return undefined;
    if (type === "camera") return { type };
    const kind = (payload as { kind?: unknown }).kind;
    if (typeof kind !== "string" || !SCENE_LIGHT_KINDS.includes(kind as SceneLightKind))
      return undefined;
    const role = (payload as { role?: unknown }).role;
    const depth = (payload as { depth?: unknown }).depth;
    return {
      type,
      kind: kind as SceneLightKind,
      ...(role === "Rim" ? { role: "Rim" as const } : {}),
      ...(depth === "front" || depth === "side" || depth === "back"
        ? { depth }
        : {}),
    };
  } catch {
    return undefined;
  }
}
