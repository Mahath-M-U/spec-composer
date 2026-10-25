export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}
export interface Hsv {
  h: number;
  s: number;
  v: number;
}
export type TextColorProperty = "color" | "background";
export type TextColorIntent =
  | { type: "color"; value: string }
  | { type: "rgb"; color: Pick<Rgba, "r" | "g" | "b"> }
  | { type: "alpha"; alpha: number }
  | { type: "remove" };
export type TextColorState =
  | { kind: "solid"; color: Rgba; css: string }
  | { kind: "unsupported"; css: string }
  | { kind: "none" }
  | { kind: "mixed" };
export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export function parseColor(value: string | undefined): Rgba | undefined {
  if (!value) return undefined;
  const text = value.trim().toLowerCase();
  if (text === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.exec(text)?.[1];
  if (hex) {
    const expanded =
      hex.length < 5 ? [...hex].map((digit) => digit + digit).join("") : hex;
    return {
      r: parseInt(expanded.slice(0, 2), 16),
      g: parseInt(expanded.slice(2, 4), 16),
      b: parseInt(expanded.slice(4, 6), 16),
      a: expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    };
  }
  const rgb = /^rgba?\(([^()]+)\)$/.exec(text)?.[1];
  if (!rgb) return undefined;
  let parts: string[];
  if (rgb.includes(",")) {
    if (rgb.includes("/")) return undefined;
    parts = rgb.split(",").map((part) => part.trim());
  } else {
    const split = rgb.trim().split("/");
    if (split.length > 2) return undefined;
    parts = split[0]!.trim().split(/\s+/);
    if (parts.length !== 3) return undefined;
    if (split[1] !== undefined) parts.push(split[1].trim());
  }
  if (
    parts.length < 3 ||
    parts.length > 4 ||
    parts.some((part) => !/^[+-]?(?:\d+\.?\d*|\.\d+)%?$/.test(part))
  )
    return undefined;
  const channel = (part: string) =>
    clamp(parseFloat(part) * (part.endsWith("%") ? 255 / 100 : 1), 0, 255);
  const alpha = parts[3];
  return {
    r: channel(parts[0]!),
    g: channel(parts[1]!),
    b: channel(parts[2]!),
    a:
      alpha === undefined
        ? 1
        : clamp(parseFloat(alpha) / (alpha.endsWith("%") ? 100 : 1)),
  };
}
export function serializeColor(color: Rgba): string {
  const byte = (value: number) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, "0");
  const alpha = Math.round(clamp(color.a) * 255);
  return `#${byte(color.r)}${byte(color.g)}${byte(color.b)}${alpha === 255 ? "" : byte(alpha)}`;
}
export function rgbToHsv({ r, g, b }: Pick<Rgba, "r" | "g" | "b">): Hsv {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  let h =
    delta === 0
      ? 0
      : max === r
        ? ((g - b) / delta) % 6
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
  h = (h * 60 + 360) % 360;
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}
export function hsvToRgb({ h, s, v }: Hsv): Pick<Rgba, "r" | "g" | "b"> {
  h = ((h % 360) + 360) % 360;
  s = clamp(s);
  v = clamp(v);
  const c = v * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = v - c;
  const channels =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return {
    r: Math.round((channels[0]! + m) * 255),
    g: Math.round((channels[1]! + m) * 255),
    b: Math.round((channels[2]! + m) * 255),
  };
}
export function planePosition(
  x: number,
  y: number,
  rect: { left: number; top: number; width: number; height: number },
) {
  return {
    s: clamp((x - rect.left) / Math.max(1, rect.width)),
    v: 1 - clamp((y - rect.top) / Math.max(1, rect.height)),
  };
}
export function textColorState(
  values: Array<string | undefined>,
  property: TextColorProperty,
): TextColorState {
  const states = values.map((value): TextColorState => {
    if (!value && property === "background") return { kind: "none" };
    const css = value ?? "#18181b";
    const color = parseColor(css);
    if (!color) return { kind: "unsupported", css };
    if (property === "background" && color.a === 0) return { kind: "none" };
    return { kind: "solid", color, css: serializeColor(color) };
  });
  const first = states[0];
  return !first ||
    states.some(
      (state) =>
        state.kind !== first.kind ||
        ("css" in state && "css" in first && state.css !== first.css),
    )
    ? { kind: "mixed" }
    : first;
}
/** Partial edits resolve against each member's current value, never the first layer. */
export function applyTextColorIntent(
  value: string | undefined,
  property: TextColorProperty,
  intent: TextColorIntent,
): string | undefined {
  if (intent.type === "remove")
    return property === "background" ? undefined : value;
  const current = parseColor(
    value ?? (property === "color" ? "#18181b" : "transparent"),
  );
  const finish = (next: Rgba) => {
    const css = serializeColor(next);
    return current && serializeColor(current) === css ? value : css;
  };
  if (intent.type === "color") {
    const parsed = parseColor(intent.value);
    return parsed ? finish(parsed) : value;
  }
  if (intent.type === "alpha")
    return current && Number.isFinite(intent.alpha)
      ? finish({ ...current, a: clamp(intent.alpha) })
      : value;
  if (!Object.values(intent.color).every(Number.isFinite)) return value;
  return finish({ ...intent.color, a: current?.a ?? 1 });
}

export function textColorPresets(values: string[]): string[] {
  return [
    ...new Set(
      values.flatMap((value) => {
        const color = parseColor(value);
        return color && color.a === 1 ? [serializeColor(color)] : [];
      }),
    ),
  ].slice(0, 10);
}

/** Freeform opaque editors never emit alpha into RGB-only material/brand math. */
export function opaqueColor(value: string): string | undefined {
  const color = parseColor(value);
  return color && color.a === 1 ? serializeColor(color) : undefined;
}
