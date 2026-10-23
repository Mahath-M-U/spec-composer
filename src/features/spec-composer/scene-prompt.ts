/** Natural-language prompt compilation for the environment editor's scene
 * objects (camera, lights, ambient): human-readable phrases with no raw
 * coordinates, ids or decimals — camera framing, each light's role/kind and
 * camera-relative direction, and ambient fill. Wired into `art-direction.ts`'s
 * `artLine` for the Scene and Lighting fields; see `hasStructuredCamera` /
 * `hasStructuredSceneLighting`, which gate this path so a document with none
 * of these new fields keeps compiling through the legacy
 * `compileStudioLighting`/`cameraAngle` path, byte-identically. */
import { describeDirection } from "./scene-space";
import { kindFromLegacy } from "./scene-objects";
import type {
  CameraProjection,
  CameraViewAngle,
  GenerationSettings,
  SceneAmbient,
  SceneCamera,
  StudioLight,
} from "./types";

export function hasStructuredCamera(
  settings: GenerationSettings | undefined,
): boolean {
  return !!settings?.camera;
}

/** Any scene-editor field beyond the legacy StudioLight shape: once set
 * (by addSceneLight, a drag, a preset, …), the light compiles through the
 * natural-language path rather than the legacy coordinate rig text. */
function hasSceneFields(light: StudioLight): boolean {
  return (
    light.kind !== undefined ||
    light.canvas !== undefined ||
    light.rotation !== undefined ||
    light.depth !== undefined ||
    light.color !== undefined ||
    light.coneAngle !== undefined ||
    light.radius !== undefined
  );
}

export function hasStructuredSceneLighting(
  settings: GenerationSettings | undefined,
): boolean {
  if (!settings) return false;
  if (settings.ambient !== undefined) return true;
  return (settings.studioLights ?? []).some(hasSceneFields);
}

const ANGLE_WORDS: Record<CameraViewAngle, string> = {
  "eye-level": "eye-level",
  low: "low-angle",
  high: "high-angle",
  "top-down": "top-down",
  "three-quarter": "three-quarter",
};

const PROJECTION_WORDS: Record<CameraProjection, string> = {
  normal: "",
  wide: "wide-angle ",
  telephoto: "telephoto ",
  orthographic: "orthographic ",
};

/** "eye-level camera with a 50mm lens perspective", "high-angle camera with
 * a 24mm wide-angle lens perspective", … — never the raw position/target. */
export function compileCameraPhrase(camera: SceneCamera): string {
  const angle = ANGLE_WORDS[camera.angle];
  const lens = `${camera.focalLength}mm ${PROJECTION_WORDS[camera.projection]}lens`.replace(
    /\s+/g,
    " ",
  );
  return `${angle} camera with a ${lens} perspective`;
}

function warmthWord(temperature: number): string {
  if (temperature < 4000) return "warm";
  if (temperature > 6500) return "cool";
  return "";
}

function intensityWord(intensity: number): string {
  if (intensity < 40) return "subtle";
  if (intensity < 75) return "soft";
  return "strong";
}

function ambientIntensityWord(intensity: number): string {
  if (intensity < 34) return "subtle";
  if (intensity < 67) return "controlled";
  return "bright";
}

const ROLE_WORDS: Partial<Record<StudioLight["role"], string>> = {
  Key: "key",
  Fill: "fill",
  Background: "background",
};

/** "soft diffused key light from the upper left", "subtle warm rim lighting
 * from behind" — kind/role/warmth/intensity in words, direction from
 * `describeDirection` (camera-relative, never azimuth/elevation numbers). */
function lightPhrase(light: StudioLight): string {
  const direction = describeDirection(light.azimuth, light.elevation);
  const intensity = intensityWord(light.intensity);
  const warmth = warmthWord(light.temperature);
  if (light.role === "Rim")
    return [intensity, warmth, "rim lighting", direction]
      .filter(Boolean)
      .join(" ");
  const kind = light.kind ?? kindFromLegacy(light);
  const role = ROLE_WORDS[light.role] ?? "accent";
  return [intensity, warmth, kind, `${role} light`, direction]
    .filter(Boolean)
    .join(" ");
}

/** "controlled ambient fill", "subtle warm ambient fill", … */
function ambientPhrase(ambient: SceneAmbient): string {
  const intensity = ambientIntensityWord(ambient.intensity);
  const warmth = warmthWord(ambient.temperature);
  return [intensity, warmth, "ambient fill"].filter(Boolean).join(" ");
}

/** "natural soft shadows" when every active light casts soft shadows,
 * "dramatic, hard-edged shadows" when every one casts hard shadows, "mixed
 * shadow quality" otherwise, or "" when no active light casts any. */
function shadowSummary(activeLights: readonly StudioLight[]): string {
  const withShadows = activeLights.filter((light) => light.shadows !== "None");
  if (!withShadows.length) return "";
  const soft = withShadows.filter((light) => light.shadows === "Soft").length;
  if (soft === withShadows.length) return "natural soft shadows";
  if (soft === 0) return "dramatic, hard-edged shadows";
  return "mixed shadow quality";
}

/** The Lighting field's natural-language description of `lights` and
 * `ambient`: one phrase per enabled light, then ambient fill, then an
 * overall shadow-quality phrase. Mirrors `compileStudioLighting`'s "nothing
 * active" fallback when there's no enabled light or ambient. */
export function compileSceneLighting(
  lights: readonly StudioLight[],
  ambient: SceneAmbient | undefined,
): string {
  const active = lights.filter((light) => light.enabled);
  const ambientOn = ambient?.enabled === true;
  if (!active.length && !ambientOn)
    return "No active light sources; use environment/ambient illumination only";
  const phrases = active.map(lightPhrase);
  if (ambientOn) phrases.push(ambientPhrase(ambient!));
  const shadows = shadowSummary(active);
  if (shadows) phrases.push(shadows);
  return phrases.join(", ");
}

/** The structured scene/lighting phrases for `settings`, or `undefined` for
 * a field with nothing structured to say (the legacy path applies instead).
 * Used by `art-direction.ts`'s `artLine`. */
export function compileSceneDescription(
  settings: GenerationSettings | undefined,
): { camera?: string; lighting?: string } {
  return {
    camera: hasStructuredCamera(settings)
      ? compileCameraPhrase(settings!.camera!)
      : undefined,
    lighting: hasStructuredSceneLighting(settings)
      ? compileSceneLighting(settings!.studioLights ?? [], settings!.ambient)
      : undefined,
  };
}
