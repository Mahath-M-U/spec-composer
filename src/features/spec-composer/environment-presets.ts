/** Curated environment presets for the Add tab's Presets section: a camera,
 * a small light rig, ambient fill and a scene description, all built from
 * the same schema as a hand-placed scene (see scene-objects.ts,
 * scene-space.ts). Nothing here touches the store or React; `store.ts`'s
 * `applyEnvironmentPreset` wires the pure `mergeEnvironmentPreset` helper
 * (merge mode) and the raw preset (replace mode) into one undo step. */
import { canvasToScene } from "./scene-space";
import {
  MAX_SCENE_LIGHTS,
  type GenerationSettings,
  type SceneAmbient,
  type SceneCamera,
  type SceneDepth,
  type SceneLightKind,
  type SceneVec2,
  type StudioLight,
} from "./types";

/** A preset's light, same shape as a placed StudioLight minus the id —
 * `applyEnvironmentPreset` assigns a fresh unique id per application. */
export type PresetLight = Omit<StudioLight, "id">;

function presetLight(
  kind: SceneLightKind,
  canvas: SceneVec2,
  depth: SceneDepth,
  rotation: number,
  overrides: Partial<PresetLight> = {},
): PresetLight {
  const { azimuth, elevation } = canvasToScene(canvas, depth);
  return {
    name: "Light",
    enabled: true,
    role: "Key",
    shape: "Rectangle",
    modifier: "Softbox",
    width: 2,
    height: 2,
    intensity: 70,
    diffusion: 60,
    temperature: 5600,
    shadows: "Soft",
    ...overrides,
    azimuth,
    elevation,
    kind,
    canvas,
    rotation,
    depth,
  };
}

export interface EnvironmentPreset {
  id: string;
  label: string;
  description: string;
  camera: SceneCamera;
  /** At most `MAX_SCENE_LIGHTS` (enforced by environment-presets.test.ts). */
  lights: PresetLight[];
  ambient: SceneAmbient;
  /** Merged into `doc.scene` free text; see `applyEnvironmentPreset`. */
  scene: string;
}

export const ENVIRONMENT_PRESETS: readonly EnvironmentPreset[] = [
  {
    id: "studio",
    label: "Studio",
    description: "Classic three-point studio rig on a seamless backdrop.",
    scene: "Seamless studio backdrop",
    camera: {
      enabled: true,
      position: { x: 0, y: -0.9 },
      rotation: 90,
      target: { x: 0, y: 0 },
      focalLength: 50,
      angle: "eye-level",
      projection: "normal",
    },
    ambient: { enabled: true, intensity: 20, temperature: 5600 },
    lights: [
      presetLight(
        "diffused",
        { x: -0.6, y: 0.35 },
        "front",
        -30,
        { name: "Studio key", role: "Key", modifier: "Diffusion panel", width: 2.5, height: 2.5, intensity: 75, diffusion: 90, shadows: "Soft" },
      ),
      presetLight(
        "area",
        { x: 0.7, y: 0.2 },
        "front",
        -150,
        { name: "Studio fill", role: "Fill", width: 2, height: 2, intensity: 40, diffusion: 85, shadows: "Soft" },
      ),
      presetLight(
        "spot",
        { x: 0, y: 0.9 },
        "back",
        -90,
        { name: "Studio rim", role: "Rim", shape: "Disk", width: 0.6, height: 0.6, intensity: 55, diffusion: 30, temperature: 6000, shadows: "Hard", coneAngle: 40 },
      ),
    ],
  },
  {
    id: "outdoor",
    label: "Outdoor",
    description: "Natural sunlight with a soft bounce fill, under open sky.",
    scene: "Outdoor nature",
    camera: {
      enabled: true,
      position: { x: 0, y: -0.9 },
      rotation: 90,
      target: { x: 0, y: 0 },
      focalLength: 24,
      angle: "eye-level",
      projection: "wide",
    },
    ambient: { enabled: true, intensity: 55, temperature: 6000 },
    lights: [
      presetLight(
        "sun",
        { x: 0.65, y: 0.95 },
        "back",
        -135,
        { name: "Sunlight", role: "Key", width: 3, height: 3, intensity: 90, diffusion: 15, temperature: 5200, shadows: "Hard" },
      ),
      presetLight(
        "diffused",
        { x: -0.55, y: 0.3 },
        "front",
        -30,
        { name: "Sky bounce", role: "Fill", modifier: "Diffusion panel", width: 2.5, height: 2.5, intensity: 35, diffusion: 90, temperature: 6500, shadows: "Soft" },
      ),
    ],
  },
  {
    id: "indoor",
    label: "Indoor",
    description: "Cozy window light with a warm lamp fill.",
    scene: "Cozy interior",
    camera: {
      enabled: true,
      position: { x: 0, y: -0.9 },
      rotation: 90,
      target: { x: 0, y: 0 },
      focalLength: 35,
      angle: "eye-level",
      projection: "normal",
    },
    ambient: { enabled: true, intensity: 35, temperature: 4200 },
    lights: [
      presetLight(
        "area",
        { x: -0.75, y: 0.3 },
        "front",
        -25,
        { name: "Window light", role: "Key", width: 2, height: 3, intensity: 65, diffusion: 80, temperature: 5500, shadows: "Soft" },
      ),
      presetLight(
        "point",
        { x: 0.5, y: 0.1 },
        "front",
        -100,
        { name: "Lamp fill", role: "Fill", shape: "Disk", width: 0.3, height: 0.3, intensity: 40, diffusion: 55, temperature: 3200, shadows: "Soft", radius: 0.3 },
      ),
    ],
  },
  {
    id: "product-photography",
    label: "Product photography",
    description: "Crisp spot key with a soft fill and a separating rim.",
    scene: "Marble countertop",
    camera: {
      enabled: true,
      position: { x: 0, y: -0.9 },
      rotation: 90,
      target: { x: 0, y: 0 },
      focalLength: 85,
      angle: "eye-level",
      projection: "telephoto",
    },
    ambient: { enabled: true, intensity: 15, temperature: 5600 },
    lights: [
      presetLight(
        "spot",
        { x: -0.7, y: 0.25 },
        "front",
        -25,
        { name: "Product key", role: "Key", shape: "Disk", width: 1, height: 1, intensity: 85, diffusion: 25, shadows: "Hard", coneAngle: 30 },
      ),
      presetLight(
        "area",
        { x: 0.8, y: 0.2 },
        "front",
        -155,
        { name: "Product fill", role: "Fill", width: 2.5, height: 2.5, intensity: 45, diffusion: 90, shadows: "Soft" },
      ),
      presetLight(
        "spot",
        { x: 0, y: 0.85 },
        "back",
        -90,
        { name: "Product rim", role: "Rim", shape: "Disk", width: 0.4, height: 0.4, intensity: 60, diffusion: 25, temperature: 6200, shadows: "Hard", coneAngle: 35 },
      ),
    ],
  },
  {
    id: "abstract",
    label: "Abstract",
    description: "Bold color gels on a graphic podium backdrop.",
    scene: "Abstract podium",
    camera: {
      enabled: true,
      position: { x: 0, y: -0.9 },
      rotation: 90,
      target: { x: 0, y: 0 },
      focalLength: 35,
      angle: "three-quarter",
      projection: "normal",
    },
    ambient: { enabled: true, intensity: 45, temperature: 7000 },
    lights: [
      presetLight(
        "area",
        { x: -0.6, y: 0.3 },
        "front",
        -35,
        { name: "Color gel key", role: "Key", width: 2, height: 2.5, intensity: 70, diffusion: 65, temperature: 7500, shadows: "Soft", color: "#7c3aed" },
      ),
      presetLight(
        "point",
        { x: 0.65, y: 0.15 },
        "front",
        -140,
        { name: "Color gel accent", role: "Fill", shape: "Disk", width: 0.35, height: 0.35, intensity: 55, diffusion: 50, temperature: 9000, shadows: "Soft", radius: 0.4, color: "#06b6d4" },
      ),
    ],
  },
] as const;

export function findEnvironmentPreset(
  id: string,
): EnvironmentPreset | undefined {
  return ENVIRONMENT_PRESETS.find((preset) => preset.id === id);
}

export interface MergeEnvironmentPresetResult {
  studioLights: StudioLight[];
  ambient: SceneAmbient | undefined;
  /** Lights that didn't fit under `MAX_SCENE_LIGHTS` and were left out. */
  skipped: number;
}

/** Merge mode: appends `preset`'s lights (fresh ids) onto `current`'s,
 * clipped at `MAX_SCENE_LIGHTS`; sets ambient only if `current` has none
 * yet. Never touches the camera — merge always keeps the existing one (see
 * Key decisions: "preset Merge keeps existing camera"). */
export function mergeEnvironmentPreset(
  current: Pick<GenerationSettings, "studioLights" | "ambient">,
  preset: EnvironmentPreset,
): MergeEnvironmentPresetResult {
  const currentLights = current.studioLights ?? [];
  const room = Math.max(0, MAX_SCENE_LIGHTS - currentLights.length);
  const added: StudioLight[] = preset.lights
    .slice(0, room)
    .map((light) => ({ ...light, id: crypto.randomUUID() }));
  return {
    studioLights: [...currentLights, ...added],
    ambient: current.ambient ?? preset.ambient,
    skipped: preset.lights.length - added.length,
  };
}
