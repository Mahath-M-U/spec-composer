/**
 * Pure geometry for the custom inline-editor caret (see `canvas-caret.tsx`).
 * No DOM access here so it stays trivially testable: every input is a plain
 * rect or point, every output is a screen-space caret description.
 */

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** `x`/`y` is the caret's centre in host-local px; `angle` is degrees,
 * matching the CSS `rotate()` the element itself uses. */
export interface CaretGeometry {
  x: number;
  y: number;
  length: number;
  angle: number;
}

const DEFAULT_MIN_LENGTH = 6;

/**
 * Builds a caret from a DOM rect (typically `Range.getClientRects()`), both
 * still in viewport coordinates. Returns `null` for a fully empty rect
 * (width and height both 0) — the caller should fall back to
 * `fallbackCaret` instead.
 */
export function caretFromRect(
  rect: RectLike,
  host: { left: number; top: number },
  rotationDeg: number,
  minLength = DEFAULT_MIN_LENGTH,
): CaretGeometry | null {
  if (rect.width === 0 && rect.height === 0) return null;
  return {
    x: rect.left + rect.width / 2 - host.left,
    y: rect.top + rect.height / 2 - host.top,
    length: Math.max(Math.hypot(rect.width, rect.height), minLength),
    angle: rotationDeg,
  };
}

/** Rotates `(dx, dy)` by `degrees`, matching the direction of the CSS
 * `rotate()` transform (positive degrees turn clockwise on screen). */
function rotate(dx: number, dy: number, degrees: number): [number, number] {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [dx * cos - dy * sin, dx * sin + dy * cos];
}

/**
 * Caret geometry for the cases a text range gives no usable rect: an empty
 * editor, or an empty line. `boxCenter` is the text box's centre in
 * host-local px; `lineOffset` is how many lines away from that centre the
 * caret's line sits (fractional/negative allowed).
 */
export function fallbackCaret({
  boxCenter,
  width,
  fontSize,
  lineHeight,
  alignment,
  rotationDeg,
  zoom,
  lineOffset = 0,
  minLength = DEFAULT_MIN_LENGTH,
}: {
  boxCenter: { x: number; y: number };
  width: number;
  fontSize: number;
  lineHeight: number | undefined;
  alignment: "left" | "center" | "right" | undefined;
  rotationDeg: number;
  zoom: number;
  lineOffset?: number;
  minLength?: number;
}): CaretGeometry {
  const pad = 0.08 * fontSize;
  const half = Math.max(0, width / 2 - pad);
  const dx = alignment === "right" ? half : alignment === "left" ? -half : 0;
  const dy = lineOffset * fontSize * (lineHeight ?? 1.2);
  const [rx, ry] = rotate(dx, dy, rotationDeg);
  return {
    x: boxCenter.x + rx * zoom,
    y: boxCenter.y + ry * zoom,
    length: Math.max(fontSize * (lineHeight ?? 1.2) * zoom, minLength),
    angle: rotationDeg,
  };
}

/** True when `point` is inside `clip`, edges inclusive. */
export function isInside(
  point: { x: number; y: number },
  clip: RectLike,
): boolean {
  return (
    point.x >= clip.left &&
    point.x <= clip.left + clip.width &&
    point.y >= clip.top &&
    point.y <= clip.top + clip.height
  );
}
