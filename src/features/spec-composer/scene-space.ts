/** Pure coordinate math for the environment editor's 2D scene canvas. The
 * canvas represents the camera's view plane: origin at the artboard centre,
 * +x right, +y up (document y grows downward, so normalized y is flipped).
 * Nothing here touches the store or React; see SceneOverlay for rendering
 * and store.ts for the actions that call into this module. */
import type { SceneDepth, SceneVec2 } from "./types";

export interface SceneFormat {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** Clamps a normalized scene point to the schema's +/-1.5 bounds. */
export function clampNorm(point: SceneVec2): SceneVec2 {
  return { x: clamp(point.x, -1.5, 1.5), y: clamp(point.y, -1.5, 1.5) };
}

/** Document pixel point -> normalized scene point. */
export function docToNorm(
  point: { x: number; y: number },
  format: SceneFormat,
): SceneVec2 {
  return {
    x: (point.x - format.width / 2) / (format.width / 2),
    y: -(point.y - format.height / 2) / (format.height / 2),
  };
}

/** Normalized scene point -> document pixel point. */
export function normToDoc(
  point: SceneVec2,
  format: SceneFormat,
): { x: number; y: number } {
  return {
    x: point.x * (format.width / 2) + format.width / 2,
    y: -point.y * (format.height / 2) + format.height / 2,
  };
}

/** Normalized scene point -> screen pixel point, given the canvas's current
 * pan/zoom (matching canvas-surface.tsx's own screen-space math). */
export function normToScreen(
  point: SceneVec2,
  format: SceneFormat,
  pan: { x: number; y: number },
  zoom: number,
): { x: number; y: number } {
  const doc = normToDoc(point, format);
  return { x: pan.x + doc.x * zoom, y: pan.y + doc.y * zoom };
}

const toDeg = (radians: number) => (radians * 180) / Math.PI;
const toRad = (degrees: number) => (degrees * Math.PI) / 180;
const sign = (value: number) => (value < 0 ? -1 : 1);

/** Canvas position + depth -> camera-relative azimuth/elevation, matching
 * the existing studio-lighting convention: azimuth 0 is front, +90 right,
 * +/-180 behind; elevation 0 is subject level, +90 overhead. */
export function canvasToScene(
  canvas: SceneVec2,
  depth: SceneDepth,
): { azimuth: number; elevation: number } {
  const { x, y } = canvas;
  let azimuth: number;
  if (depth === "front") azimuth = toDeg(Math.atan(x));
  else if (depth === "side")
    azimuth = sign(x || 1) * clamp(60 + 30 * Math.abs(x), 60, 90);
  else azimuth = sign(x || 1) * (180 - toDeg(Math.atan(Math.abs(x))));
  const elevation = clamp(y * 45, -90, 90);
  return { azimuth: clamp(azimuth, -180, 180), elevation };
}

/** Inverse of canvasToScene, for legacy lights that only carry
 * azimuth/elevation: derives a canvas position and depth band from them. */
export function sceneToCanvas(light: {
  azimuth: number;
  elevation: number;
}): { canvas: SceneVec2; depth: SceneDepth } {
  const az = light.azimuth;
  const absAz = Math.abs(az);
  const depth: SceneDepth = absAz < 60 ? "front" : absAz <= 120 ? "side" : "back";
  const s = sign(az || 1);
  let x: number;
  if (depth === "front") x = Math.tan(toRad(az));
  else if (depth === "side") x = (s * (absAz - 60)) / 30;
  else x = s * Math.tan(toRad(180 - absAz));
  const y = light.elevation / 45;
  return { canvas: clampNorm({ x, y }), depth };
}

/** A 2D aim (0 = pointing right, counter-clockwise) as a unit vector in the
 * same +x right/+y up space as the scene canvas. */
export function rotationToVector(rotation: number): SceneVec2 {
  const radians = toRad(rotation);
  return { x: Math.cos(radians), y: Math.sin(radians) };
}

/** A short, human phrase for a light's camera-relative bearing, used by the
 * natural-language prompt compiler (Step C). Never mentions coordinates. */
export function describeDirection(azimuth: number, elevation: number): string {
  const absAz = Math.abs(azimuth);
  const side = azimuth > 1 ? "right" : azimuth < -1 ? "left" : "";
  const horizontal =
    absAz < 15
      ? "the front"
      : absAz > 165
        ? "behind"
        : absAz < 100
          ? `the front ${side}`.trim()
          : absAz <= 140
            ? `the ${side || "side"}`
            : `behind the ${side}`.trim();
  const vertical = elevation > 25 ? "above" : elevation < -25 ? "below" : "";
  if (!vertical) return `from ${horizontal}`;
  return horizontal === "behind"
    ? `from ${vertical} and behind`
    : `from ${vertical} and ${horizontal}`;
}

const KIND_PLACEMENT: Record<
  string,
  { canvas: SceneVec2; rotation: number; depth: SceneDepth }
> = {
  sun: { canvas: { x: 0.65, y: 0.95 }, rotation: -135, depth: "back" },
  diffused: { canvas: { x: -0.55, y: 0.35 }, rotation: -30, depth: "front" },
  spot: { canvas: { x: -0.85, y: 0.25 }, rotation: -20, depth: "front" },
  point: { canvas: { x: 0, y: 0.65 }, rotation: -90, depth: "front" },
  area: { canvas: { x: 0.85, y: 0.25 }, rotation: -160, depth: "front" },
};

/** A default canvas placement for a new light of `kind`; `index` (the count
 * of same-kind lights already present) spreads repeats apart so they don't
 * land exactly on top of each other. */
export function defaultPlacement(
  kind: string,
  index: number,
): { canvas: SceneVec2; rotation: number; depth: SceneDepth } {
  const base = KIND_PLACEMENT[kind] ?? KIND_PLACEMENT["area"]!;
  const spread = (index % 4) * 0.25 * (base.canvas.x < 0 ? 1 : -1);
  return {
    canvas: clampNorm({ x: base.canvas.x + spread, y: base.canvas.y }),
    rotation: base.rotation,
    depth: base.depth,
  };
}
