import type { ImageKind, SpecElement } from "./types";

/**
 * Compositions for starter templates. Boxes are [x, y, width, height]
 * fractions of the format and font sizes are authored for the 1080 × 1350
 * base format; the template builder scales both to the target format. Slot
 * order is z-order: backgrounds and scrims first, then type and imagery.
 */

export interface Palette {
  bg: string;
  ink: string;
  accent: string;
}

/** One element of an authored layout; `box` is [x, y, width, height] as fractions of the format. */
export interface SlotSpec {
  kind: SpecElement["kind"];
  /** For ±90° rotation this is the rotated (visual) extent; the builder derives the element box. */
  box: [number, number, number, number];
  rotation?: number;
  name?: string;
  content?: string;
  aiDescription?: string;
  placeholderArt?: string;
  /** Font sizes and letter spacing are authored for the base format and scaled to the target. */
  style?: Partial<SpecElement["style"]>;
  /** Elements sharing a group land in the same `group_<id>` on the canvas. */
  group?: string;
}

export const BASE_WIDTH = 1080;
export const BASE_HEIGHT = 1350;

export const FONT = {
  sans: "Manrope",
  anton: "Anton",
  bebas: "Bebas Neue",
  archivo: "Archivo Black",
  serif: "DM Serif Display",
  playfair: "Playfair Display",
  italiana: "Italiana",
  script: "Great Vibes",
} as const;

/* ------------------------------------------------------------------ */
/* Measuring                                                           */
/* ------------------------------------------------------------------ */

interface Metrics {
  lower: number;
  upper: number;
  space: number;
  digit: number;
}

/** Average advance widths in em, measured in Chrome for each face at the weight templates use. */
const METRICS: Record<string, Metrics> = {
  [FONT.sans]: { lower: 0.56, upper: 0.67, space: 0.2, digit: 0.59 },
  [FONT.anton]: { lower: 0.46, upper: 0.47, space: 0.23, digit: 0.48 },
  [FONT.bebas]: { lower: 0.39, upper: 0.39, space: 0.16, digit: 0.4 },
  [FONT.archivo]: { lower: 0.61, upper: 0.76, space: 0.33, digit: 0.67 },
  [FONT.serif]: { lower: 0.5, upper: 0.6, space: 0.22, digit: 0.5 },
  [FONT.playfair]: { lower: 0.52, upper: 0.7, space: 0.23, digit: 0.54 },
  [FONT.italiana]: { lower: 0.46, upper: 0.57, space: 0.3, digit: 0.45 },
  [FONT.script]: { lower: 0.31, upper: 0.97, space: 0.17, digit: 0.38 },
};
const FALLBACK: Metrics = {
  lower: 0.55,
  upper: 0.68,
  space: 0.25,
  digit: 0.56,
};

/**
 * Width of `text` in em. Averages run a few percent narrow on words full of
 * wide letters (m, w), so results carry a 6% safety margin.
 */
function measure(text: string, m: Metrics, tracking: number) {
  let width = 0;
  for (const ch of text) {
    if (ch === " ") width += m.space;
    else if (/[0-9]/.test(ch)) width += m.digit;
    else if (/[A-Z]/.test(ch)) width += m.upper;
    else if (/[a-z]/.test(ch)) width += m.lower;
    else width += m.space * 1.4;
    width += tracking;
  }
  return width * 1.06;
}

/** Lines `text` wraps to at `size`, or null when a single word overflows. */
function wrapLines(
  text: string,
  size: number,
  maxWidth: number,
  m: Metrics,
  tracking: number,
) {
  let lines = 0;
  for (const hardLine of text.split("\n")) {
    let current = "";
    for (const word of hardLine.split(" ").filter(Boolean)) {
      if (measure(word, m, tracking) * size > maxWidth) return null;
      const candidate = current ? `${current} ${word}` : word;
      if (measure(candidate, m, tracking) * size <= maxWidth)
        current = candidate;
      else {
        lines += 1;
        current = word;
      }
    }
    lines += 1;
  }
  return lines;
}

/**
 * Largest size (at the base format) at which `text` wraps into at most
 * `lines` lines inside the box, allowing for the text box's 0.08em padding.
 */
function fitSize(
  text: string,
  widthPx: number,
  heightPx: number,
  font: string,
  o: { lh: number; lines: number; max: number; tracking: number },
) {
  const m = METRICS[font] ?? FALLBACK;
  for (let size = o.max; size > 8; size -= 1) {
    const maxWidth = widthPx * 0.97 - size * 0.16;
    const n = wrapLines(text, size, maxWidth, m, o.tracking);
    if (
      n !== null &&
      n <= Math.max(o.lines, text.split("\n").length) &&
      n * o.lh * size + size * 0.16 <= heightPx * 0.98
    )
      return size;
  }
  return 8;
}

function luminance(hex: string) {
  const value = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (r * 299 + g * 587 + b * 114) / 255000;
}

/** Near-black or white, whichever reads better on `hex`. */
const onColor = (hex: string) => (luminance(hex) > 0.6 ? "#111111" : "#FFFFFF");

/** A darker or lighter tone of the background, for backdrops that never clash with the subject. */
const tonal = (bg: string, strength = 1) =>
  luminance(bg) > 0.35
    ? `rgba(0, 0, 0, ${0.14 * strength})`
    : `rgba(255, 255, 255, ${0.12 * strength})`;

/* ------------------------------------------------------------------ */
/* Slot helpers                                                        */
/* ------------------------------------------------------------------ */

type Box = SlotSpec["box"];

interface TextOpts {
  font: string;
  color: string;
  /** Largest allowed size; with `fixed` it is the exact size. */
  max: number;
  weight?: number;
  lh?: number;
  /** Letter spacing in em. */
  tracking?: number;
  align?: "left" | "center" | "right";
  italic?: boolean;
  lines?: number;
  fixed?: boolean;
  background?: string;
  radius?: number;
  opacity?: number;
  rotate?: number;
}

function type(
  kind: SlotSpec["kind"],
  box: Box,
  content: string,
  o: TextOpts,
): SlotSpec {
  const sideways = Math.abs(o.rotate ?? 0) === 90;
  const lh = o.lh ?? 1.1;
  const tracking = o.tracking ?? 0;
  const size = o.fixed
    ? o.max
    : fitSize(
        content,
        sideways ? box[3] * BASE_HEIGHT : box[2] * BASE_WIDTH,
        sideways ? box[2] * BASE_WIDTH : box[3] * BASE_HEIGHT,
        o.font,
        { lh, lines: o.lines ?? 3, max: o.max, tracking },
      );
  return {
    kind,
    box,
    content,
    ...(o.rotate ? { rotation: o.rotate } : {}),
    style: {
      fontFamily: o.font,
      fontSize: size,
      fontWeight: o.weight ?? 400,
      lineHeight: lh,
      letterSpacing: Math.round(tracking * size * 10) / 10,
      alignment: o.align ?? "left",
      color: o.color,
      ...(o.italic ? { fontStyle: "italic" as const } : {}),
      ...(o.background ? { background: o.background } : {}),
      ...(o.radius !== undefined ? { borderRadius: o.radius } : {}),
      ...(o.opacity !== undefined ? { opacity: o.opacity } : {}),
    },
  };
}

/** Small tracked caps for dates, handles, and other corner details. */
const meta = (
  box: Box,
  content: string,
  color: string,
  align: "left" | "center" | "right" = "left",
) =>
  type("eyebrow", box, content.toUpperCase(), {
    font: FONT.sans,
    weight: 700,
    color,
    max: 26,
    lines: 1,
    tracking: 0.14,
    lh: 1.2,
    align,
  });

const body = (
  box: Box,
  content: string,
  color: string,
  align: "left" | "center" | "right" = "left",
  size = 28,
) =>
  type("body", box, content, {
    font: FONT.sans,
    weight: 500,
    color,
    max: size,
    fixed: true,
    lh: 1.4,
    align,
  });

const cta = (box: Box, label: string, fill: string) =>
  type("cta", box, label, {
    font: FONT.sans,
    weight: 800,
    color: onColor(fill),
    max: 25,
    fixed: true,
    tracking: 0.1,
    background: fill,
    radius: 999,
    align: "center",
  });

const rect = (
  box: Box,
  background: string,
  o: { name?: string; opacity?: number; radius?: number } = {},
): SlotSpec => ({
  kind: "shape",
  box,
  name: o.name ?? "Shape",
  style: {
    background,
    borderRadius: o.radius ?? 0,
    opacity: o.opacity ?? 1,
  },
});

const disc = (box: Box, background: string, name = "Disc"): SlotSpec => ({
  kind: "shape",
  box,
  name,
  style: {
    background,
    shapeType: "circle",
    borderRadius: 9999,
    opacity: 1,
  },
});

const rule = (box: Box, color: string, opacity = 1): SlotSpec => ({
  kind: "divider",
  box,
  style: { background: color, opacity, borderRadius: 0 },
});

export interface Visual {
  kind: ImageKind;
  art: string;
  ai: string;
  fit?: "cover" | "contain";
  /** Focal point for cropping, 0–1 on each axis. */
  focal?: [number, number];
}

/**
 * One layer of a `modelFeedPost` scene: its own visual, box and (for
 * `photo()`'s fit/focal). `box` is [x, y, width, height] as a fraction of the
 * photo frame (the whole canvas for "immersive"), not of the canvas.
 */
export interface SceneLayer {
  name: string;
  box: Box;
  visual: Visual;
  group?: string;
}

export const visual = (
  kind: ImageKind,
  art: string,
  ai: string,
  o: { fit?: "cover" | "contain"; focal?: [number, number] } = {},
): Visual => ({ kind, art, ai, ...o });

function photo(
  v: Visual,
  box: Box,
  defaults: {
    fit: "cover" | "contain";
    focal?: [number, number];
    radius?: number;
  },
): SlotSpec {
  const [focalX, focalY] = v.focal ?? defaults.focal ?? [0.5, 0.5];
  return {
    kind: v.kind,
    box,
    placeholderArt: v.art,
    aiDescription: v.ai,
    style: {
      objectFit: v.fit ?? defaults.fit,
      focalX,
      focalY,
      borderRadius: defaults.radius ?? 0,
    },
  };
}

/**
 * The corner zone of a rounded photo frame, as frame-local fractions: the
 * radius measured against the frame's own size on the 1080 × 1350 base
 * canvas. Zero for a square-cornered frame.
 */
export function cornerZone(frame: Box, radius: number): [number, number] {
  if (radius <= 0) return [0, 0];
  return [radius / (frame[2] * BASE_WIDTH), radius / (frame[3] * BASE_HEIGHT)];
}

/** True when a frame-local `box` overlaps any of the frame's four corner zones. */
export function reachesCorner(box: Box, zone: [number, number]): boolean {
  const [zx, zy] = zone;
  if (zx <= 0 || zy <= 0) return false;
  const [x, y, w, h] = box;
  // A box overlaps a corner rectangle when it overlaps it on both axes.
  const left = x < zx;
  const right = x + w > 1 - zx;
  const top = y < zy;
  const bottom = y + h > 1 - zy;
  return (left || right) && (top || bottom);
}

/**
 * Lays a scene's layers out inside a photo frame. Each layer's `box` is a
 * fraction of `frame` (itself a canvas fraction), so the same scene fits every
 * `modelFeedPost` variant. Each element is clipped on its own, so only a layer
 * that reaches a corner of the frame gets the frame's radius (the backdrop
 * always does); everything else stays square.
 */
export function sceneSlots(
  scene: SceneLayer[],
  frame: Box,
  radius: number,
): SlotSpec[] {
  const [fx, fy, fw, fh] = frame;
  const zone = cornerZone(frame, radius);
  return scene.map((layer, i) => {
    const [x, y, w, h] = layer.box;
    const round = i === 0 || reachesCorner(layer.box, zone);
    return {
      ...photo(layer.visual, [fx + x * fw, fy + y * fh, w * fw, h * fh], {
        fit: layer.visual.fit ?? "cover",
        ...(layer.visual.focal ? { focal: layer.visual.focal } : {}),
        radius: round ? radius : 0,
      }),
      name: layer.name,
      ...(layer.group ? { group: layer.group } : {}),
    };
  });
}

/** Logo slots are image kinds: they hold the user's logo, shown as a generic mark until one is added. */
export const logoSlot = (box: Box): SlotSpec => ({
  kind: "logo",
  box,
  placeholderArt: "logo-mark",
  style: { objectFit: "contain" },
});

export interface Copy {
  eyebrow?: string;
  note?: string;
  badge?: string;
  title: string;
  sub?: string;
  body?: string;
  price?: string;
  offer?: string;
  cta?: string;
}

/* ------------------------------------------------------------------ */
/* Archetypes                                                          */
/* ------------------------------------------------------------------ */

/**
 * Edge-to-edge condensed headline split around a full-bleed subject: the
 * title sits behind the subject, the subtitle runs on a strip in front.
 */
export function megaType(
  copy: Copy,
  v: Visual,
  o: { font?: string; scene?: boolean } = {},
) {
  return (c: Palette): SlotSpec[] => {
    const font = o.font ?? FONT.anton;
    return [
      meta([0.05, 0.028, 0.5, 0.03], copy.eyebrow ?? "", c.ink),
      meta([0.45, 0.028, 0.5, 0.03], copy.note ?? "", c.ink, "right"),
      type("title", [0.03, 0.06, 0.94, 0.25], copy.title, {
        font,
        color: c.ink,
        max: 380,
        lh: 0.86,
        lines: 2,
        align: "center",
      }),
      o.scene
        ? photo(v, [0, 0.3, 1, 0.42], { fit: "cover" })
        : photo(v, [0.08, 0.1, 0.84, 0.9], {
            fit: "cover",
            focal: [0.5, 0],
          }),
      rect([0, 0.7, 1, 0.12], c.ink, { name: "Strip" }),
      type("subheading", [0.03, 0.705, 0.94, 0.11], copy.sub ?? "", {
        font,
        color: c.bg,
        max: 150,
        lh: 0.9,
        lines: 1,
        align: "center",
      }),
      rect([0, 0.82, 1, 0.18], c.bg, { name: "Footer" }),
      body([0.05, 0.845, 0.55, 0.12], copy.body ?? "", c.ink),
      ...(copy.cta
        ? [cta([0.62, 0.862, 0.33, 0.065], copy.cta, c.accent)]
        : []),
    ];
  };
}

/**
 * Saturated field, giant word, and a subject on a tonal disc, with a sticker
 * for the offer and a band of details along the bottom.
 */
export function boldBlock(copy: Copy, v: Visual, o: { font?: string } = {}) {
  return (c: Palette): SlotSpec[] => {
    const font = o.font ?? FONT.archivo;
    const slots: SlotSpec[] = [
      meta([0.05, 0.028, 0.5, 0.03], copy.eyebrow ?? "", c.ink),
      meta([0.45, 0.028, 0.5, 0.03], copy.note ?? "", c.ink, "right"),
      disc([0.17, 0.29, 0.66, 0.528], tonal(c.bg, 1.3), "Backdrop"),
      type("title", [0.03, 0.06, 0.94, 0.24], copy.title, {
        font,
        color: c.ink,
        max: 300,
        lh: 0.9,
        lines: 2,
        align: "center",
      }),
      photo(v, [0.12, 0.25, 0.76, 0.57], { fit: "contain", focal: [0.5, 1] }),
    ];
    if (copy.offer)
      slots.push(
        disc([0.66, 0.54, 0.29, 0.232], c.accent, "Sticker"),
        type("offer", [0.675, 0.585, 0.26, 0.14], copy.offer, {
          font,
          color: onColor(c.accent),
          max: 96,
          lh: 0.95,
          lines: 3,
          align: "center",
          rotate: -10,
        }),
      );
    if (copy.sub)
      slots.push(
        type("subheading", [0.05, 0.825, 0.9, 0.045], copy.sub, {
          font: FONT.sans,
          weight: 800,
          color: c.ink,
          max: 34,
          lines: 1,
          align: "center",
        }),
      );
    slots.push(
      rect([0, 0.885, 1, 0.115], c.ink, { name: "Band" }),
      body([0.05, 0.9, 0.55, 0.09], copy.body ?? "", c.bg, "left", 26),
    );
    if (copy.cta)
      slots.push(cta([0.64, 0.91, 0.31, 0.062], copy.cta, c.accent));
    return slots;
  };
}

/** Large display serif, an italic accent line, and one framed photograph. */
export function editorialSerif(
  copy: Copy,
  v: Visual,
  o: { font?: string; radius?: number } = {},
) {
  return (c: Palette): SlotSpec[] => {
    const radius = o.radius ?? 0;
    const slots: SlotSpec[] = [
      meta([0.06, 0.035, 0.5, 0.03], copy.eyebrow ?? "", c.ink),
      meta([0.44, 0.035, 0.5, 0.03], copy.note ?? "", c.ink, "right"),
      rule([0.06, 0.074, 0.88, 0.0022], c.ink),
      type("title", [0.06, 0.09, 0.88, 0.2], copy.title, {
        font: o.font ?? FONT.serif,
        color: c.ink,
        max: 190,
        lh: 0.95,
        lines: 2,
      }),
    ];
    if (copy.sub)
      slots.push(
        type("subheading", [0.06, 0.295, 0.88, 0.06], copy.sub, {
          font: FONT.playfair,
          italic: true,
          color: c.accent,
          max: 58,
          lh: 1.1,
          lines: 1,
        }),
      );
    slots.push(
      rect([0.06, 0.38, 0.88, 0.45], c.accent, {
        name: "Photo backdrop",
        opacity: 0.2,
        radius,
      }),
      photo(v, [0.06, 0.38, 0.88, 0.45], { fit: "cover", radius }),
    );
    if (copy.price)
      slots.push(
        rect([0.7, 0.4, 0.21, 0.075], c.accent, { name: "Price tag", radius }),
        type("price", [0.7, 0.4, 0.21, 0.075], copy.price, {
          font: FONT.serif,
          color: onColor(c.accent),
          max: 64,
          lines: 1,
          align: "center",
        }),
      );
    slots.push(
      body([0.06, 0.852, 0.52, 0.11], copy.body ?? "", c.ink, "left", 27),
    );
    if (copy.cta) slots.push(cta([0.62, 0.868, 0.32, 0.065], copy.cta, c.ink));
    return slots;
  };
}

/** Three framed photographs in a grid with a condensed title block beneath. */
export function collage(
  copy: Copy,
  visuals: [Visual, Visual, Visual],
  o: { font?: string } = {},
) {
  return (c: Palette): SlotSpec[] => {
    const frames: Box[] = [
      [0.05, 0.04, 0.54, 0.56],
      [0.62, 0.04, 0.33, 0.27],
      [0.62, 0.33, 0.33, 0.27],
    ];
    const slots: SlotSpec[] = frames.flatMap((box, i) => [
      rect(box, c.accent, { name: "Photo backdrop", opacity: 0.22 }),
      photo(visuals[i]!, box, { fit: "cover", focal: [0.5, 0] }),
    ]);
    if (copy.badge)
      slots.push(
        type("badge", [0.08, 0.065, 0.3, 0.045], copy.badge, {
          font: FONT.sans,
          weight: 800,
          color: onColor(c.accent),
          max: 22,
          fixed: true,
          tracking: 0.12,
          background: c.accent,
          radius: 999,
          align: "center",
        }),
      );
    slots.push(
      type("title", [0.05, 0.625, 0.9, 0.17], copy.title, {
        font: o.font ?? FONT.bebas,
        color: c.ink,
        max: 220,
        lh: 0.9,
        lines: 2,
      }),
    );
    if (copy.sub)
      slots.push(
        type("subheading", [0.05, 0.795, 0.9, 0.05], copy.sub, {
          font: FONT.playfair,
          italic: true,
          color: c.accent,
          max: 44,
          lines: 1,
        }),
      );
    slots.push(
      body([0.05, 0.862, 0.55, 0.11], copy.body ?? "", c.ink, "left", 26),
    );
    if (copy.cta)
      slots.push(cta([0.62, 0.875, 0.33, 0.065], copy.cta, c.accent));
    return slots;
  };
}

/** Model-led feed layouts with photo-first hierarchy and quiet social copy. */
export function modelFeedPost(
  copy: Copy,
  model: Visual,
  o: {
    variant: "immersive" | "caption" | "split" | "framed" | "diary";
    detail?: Visual;
    /** Replaces the photo frame's single photo with a stack of scene layers, each its own element. */
    scene?: SceneLayer[];
    /** "split" only: the same, for the smaller detail frame. */
    detailScene?: SceneLayer[];
  },
) {
  const handle = (box: Box, color: string) =>
    type("eyebrow", box, copy.eyebrow ?? "", {
      font: FONT.sans,
      color,
      max: 24,
      weight: 800,
      lines: 1,
    });
  const heading = (box: Box, color: string, max = 72) =>
    type("title", box, copy.title, {
      font: FONT.sans,
      color,
      max,
      weight: 800,
      lh: 1.05,
      lines: 2,
    });

  /** One photo, or the scene's layers laid out inside the same frame. */
  const framed = (
    v: Visual,
    scene: SceneLayer[] | undefined,
    frame: Box,
    defaults: {
      fit: "cover" | "contain";
      focal?: [number, number];
      radius?: number;
    },
  ): SlotSpec[] =>
    scene
      ? sceneSlots(scene, frame, defaults.radius ?? 0)
      : [photo(v, frame, defaults)];

  return (c: Palette): SlotSpec[] => {
    switch (o.variant) {
      case "immersive":
        return [
          ...framed(model, o.scene, [0, 0, 1, 1], {
            fit: "cover",
            focal: [0.5, 0.38],
          }),
          rect([0, 0.73, 1, 0.27], `linear-gradient(transparent, ${c.bg})`, {
            name: "Caption shade",
          }),
          handle([0.06, 0.045, 0.55, 0.04], c.ink),
          heading([0.06, 0.8, 0.88, 0.09], c.ink, 82),
          body([0.06, 0.915, 0.88, 0.045], copy.body ?? "", c.ink, "left", 29),
        ];
      case "caption":
        return [
          handle([0.055, 0.035, 0.65, 0.035], c.ink),
          ...framed(model, o.scene, [0.045, 0.095, 0.91, 0.68], {
            fit: "cover",
            focal: [0.5, 0.35],
            radius: 28,
          }),
          heading([0.055, 0.79, 0.88, 0.075], c.ink, 70),
          body([0.055, 0.89, 0.8, 0.05], copy.body ?? "", c.ink, "left", 29),
          meta([0.055, 0.955, 0.88, 0.025], copy.note ?? "", c.accent),
        ];
      case "split":
        return [
          handle([0.045, 0.035, 0.6, 0.035], c.ink),
          ...framed(model, o.scene, [0.04, 0.1, 0.6, 0.67], {
            fit: "cover",
            focal: [0.5, 0.32],
            radius: 20,
          }),
          ...framed(o.detail ?? model, o.detailScene, [0.66, 0.25, 0.3, 0.52], {
            fit: "cover",
            radius: 20,
          }),
          heading([0.045, 0.8, 0.9, 0.07], c.ink, 70),
          body([0.045, 0.9, 0.88, 0.06], copy.body ?? "", c.ink, "left", 28),
        ];
      case "framed":
        return [
          handle([0.06, 0.04, 0.62, 0.035], c.ink),
          meta([0.68, 0.04, 0.27, 0.035], copy.note ?? "", c.accent, "right"),
          ...framed(model, o.scene, [0.055, 0.11, 0.89, 0.64], {
            fit: "cover",
            focal: [0.5, 0.36],
            radius: 34,
          }),
          heading([0.06, 0.79, 0.88, 0.075], c.ink, 68),
          body([0.06, 0.89, 0.88, 0.06], copy.body ?? "", c.ink, "left", 28),
        ];
      case "diary":
        return [
          ...framed(model, o.scene, [0.035, 0.035, 0.93, 0.81], {
            fit: "cover",
            focal: [0.5, 0.4],
            radius: 24,
          }),
          rect([0.035, 0.85, 0.93, 0.115], c.bg, {
            name: "Caption card",
            radius: 24,
          }),
          handle([0.06, 0.86, 0.42, 0.027], c.accent),
          heading([0.06, 0.89, 0.55, 0.057], c.ink, 51),
          body([0.61, 0.89, 0.32, 0.055], copy.body ?? "", c.ink, "right", 22),
        ];
    }
  };
}

/** Title set sideways along the left edge; subject and details to its right. */
export function verticalType(copy: Copy, v: Visual, o: { font?: string } = {}) {
  return (c: Palette): SlotSpec[] => [
    type("title", [0.03, 0.03, 0.2, 0.94], copy.title, {
      font: o.font ?? FONT.anton,
      color: c.ink,
      max: 260,
      lh: 0.9,
      lines: 1,
      align: "center",
      rotate: -90,
    }),
    disc([0.33, 0.1, 0.58, 0.464], tonal(c.bg, 1.4), "Backdrop"),
    photo(v, [0.26, 0.06, 0.72, 0.64], { fit: "contain", focal: [0.5, 1] }),
    meta([0.28, 0.735, 0.66, 0.03], copy.eyebrow ?? "", c.accent),
    type("subheading", [0.28, 0.77, 0.66, 0.09], copy.sub ?? "", {
      font: FONT.sans,
      weight: 700,
      color: c.ink,
      max: 38,
      lh: 1.2,
      lines: 2,
    }),
    ...(copy.cta ? [cta([0.28, 0.885, 0.32, 0.062], copy.cta, c.accent)] : []),
    meta([0.61, 0.9, 0.35, 0.03], copy.note ?? "", c.ink, "right"),
  ];
}

/** Dark stage with a radial glow, a centered subject, and spaced display type. */
export function spotlight(
  copy: Copy,
  v: Visual | null,
  o: { font?: string } = {},
) {
  return (c: Palette): SlotSpec[] => {
    const font = o.font ?? FONT.serif;
    const slots: SlotSpec[] = [
      rect(
        [0, 0, 1, 1],
        `radial-gradient(ellipse 62% 46% at 50% ${v ? 40 : 46}%, ${c.accent}70 0%, ${c.accent}00 72%)`,
        { name: "Glow" },
      ),
      meta([0.05, 0.03, 0.5, 0.03], copy.eyebrow ?? "", c.ink),
      meta([0.45, 0.03, 0.5, 0.03], copy.note ?? "", c.ink, "right"),
    ];
    if (v) {
      slots.push(
        rect(
          [0.18, 0.63, 0.64, 0.07],
          `radial-gradient(closest-side, ${c.accent}8C, ${c.accent}00)`,
          { name: "Floor glow" },
        ),
        photo(v, [0.2, 0.1, 0.6, 0.57], { fit: "contain", focal: [0.5, 1] }),
        type("title", [0.06, 0.7, 0.88, 0.12], copy.title, {
          font,
          color: c.ink,
          max: 150,
          lh: 1,
          lines: 2,
          align: "center",
        }),
      );
    } else
      slots.push(
        type("title", [0.06, 0.33, 0.88, 0.26], copy.title, {
          font,
          color: c.ink,
          max: 240,
          lh: 0.95,
          lines: 2,
          align: "center",
        }),
      );
    const y = v ? 0.825 : 0.62;
    if (copy.sub)
      slots.push(body([0.1, y, 0.8, 0.05], copy.sub, c.ink, "center", 29));
    if (copy.cta)
      slots.push(cta([0.34, y + 0.07, 0.32, 0.06], copy.cta, c.accent));
    return slots;
  };
}

/** Ornamental border, script headline, and centered invitation details. */
export function ornamentFrame(
  copy: Copy,
  v: Visual | null,
  o: { ornament: "gold-frame" | "floral-frame"; titleColor?: "ink" | "accent" },
) {
  return (c: Palette): SlotSpec[] => {
    const slots: SlotSpec[] = [
      {
        ...photo(
          visual(
            "supportingImage",
            o.ornament,
            o.ornament === "gold-frame"
              ? "Thin ornamental gold border with corner flourishes"
              : "Hand-painted floral corners framing the page",
          ),
          [0.02, 0.015, 0.96, 0.97],
          { fit: "contain" },
        ),
        name: "Ornament",
      },
    ];
    if (v) slots.push(photo(v, [0.28, 0.07, 0.44, 0.27], { fit: "contain" }));
    const top = v ? 0 : -0.1;
    slots.push(
      meta(
        [0.12, 0.365 + top, 0.76, 0.03],
        copy.eyebrow ?? "",
        c.ink,
        "center",
      ),
      type("title", [0.1, 0.405 + top, 0.8, 0.19], copy.title, {
        font: FONT.script,
        color: o.titleColor === "accent" ? c.accent : c.ink,
        max: 200,
        // Script swashes rise well above the cap height.
        lh: 1.3,
        lines: 2,
        align: "center",
      }),
    );
    if (copy.sub)
      slots.push(
        type("subheading", [0.12, 0.605 + top, 0.76, 0.05], copy.sub, {
          font: FONT.playfair,
          italic: true,
          color: c.ink,
          max: 40,
          lines: 1,
          align: "center",
        }),
      );
    slots.push(
      body([0.12, 0.665 + top, 0.76, 0.11], copy.body ?? "", c.ink, "center"),
    );
    if (copy.cta)
      slots.push(cta([0.34, 0.8 + top, 0.32, 0.058], copy.cta, c.ink));
    return slots;
  };
}

/** Chunky tilted headline on a saturated field with a round sticker. */
export function retroSticker(
  copy: Copy,
  v: Visual | null,
  o: { font?: string } = {},
) {
  return (c: Palette): SlotSpec[] => {
    const font = o.font ?? FONT.archivo;
    const slots: SlotSpec[] = [
      meta([0.06, 0.035, 0.5, 0.03], copy.eyebrow ?? "", c.ink),
      meta([0.44, 0.035, 0.5, 0.03], copy.note ?? "", c.ink, "right"),
      type("title", [0.06, 0.09, 0.88, v ? 0.42 : 0.52], copy.title, {
        font,
        color: c.ink,
        max: 230,
        lh: 0.95,
        lines: 4,
        rotate: -3,
      }),
    ];
    if (v) slots.push(photo(v, [0.04, 0.52, 0.54, 0.34], { fit: "contain" }));
    if (copy.badge)
      slots.push(
        disc([0.6, 0.53, 0.34, 0.272], c.accent, "Sticker"),
        type("badge", [0.62, 0.585, 0.3, 0.16], copy.badge, {
          font,
          color: onColor(c.accent),
          max: 64,
          lh: 1,
          lines: 3,
          align: "center",
          rotate: 12,
        }),
      );
    slots.push(
      body([0.06, 0.875, 0.56, 0.1], copy.body ?? "", c.ink, "left", 27),
    );
    if (copy.cta) slots.push(cta([0.64, 0.888, 0.3, 0.062], copy.cta, c.ink));
    return slots;
  };
}

/** Newspaper front page: masthead, double rule, headline, photo, and a text column. */
export function newsprint(copy: Copy, v: Visual) {
  return (c: Palette): SlotSpec[] => [
    meta([0.05, 0.03, 0.9, 0.03], copy.eyebrow ?? "", c.ink, "center"),
    type("title", [0.05, 0.06, 0.9, 0.11], copy.title, {
      font: FONT.playfair,
      weight: 900,
      color: c.ink,
      max: 150,
      lh: 1,
      lines: 1,
      align: "center",
    }),
    rule([0.05, 0.176, 0.9, 0.004], c.ink),
    rule([0.05, 0.185, 0.9, 0.0015], c.ink),
    type("subheading", [0.05, 0.2, 0.9, 0.16], copy.sub ?? "", {
      font: FONT.serif,
      color: c.ink,
      max: 96,
      lh: 1.02,
      lines: 3,
    }),
    rect([0.05, 0.38, 0.56, 0.4], c.ink, {
      name: "Photo backdrop",
      opacity: 0.08,
    }),
    photo(v, [0.05, 0.38, 0.56, 0.4], { fit: "cover", focal: [0.5, 0] }),
    type("body", [0.05, 0.788, 0.56, 0.03], copy.note ?? "", {
      font: FONT.playfair,
      italic: true,
      color: c.ink,
      max: 24,
      fixed: true,
      opacity: 0.8,
    }),
    rule([0.625, 0.38, 0.0015, 0.4], c.ink, 0.5),
    body([0.645, 0.38, 0.305, 0.43], copy.body ?? "", c.ink, "left", 24),
    rule([0.05, 0.84, 0.9, 0.0015], c.ink),
    ...(copy.cta ? [cta([0.05, 0.868, 0.34, 0.065], copy.cta, c.accent)] : []),
    meta([0.45, 0.888, 0.5, 0.03], copy.badge ?? "", c.ink, "right"),
  ];
}

/** Photo across the top half, a price tag on the seam, and a feature or price list. */
export function promoSplit(
  copy: Copy,
  v: Visual,
  o: { items?: [string, string][] } = {},
) {
  return (c: Palette): SlotSpec[] => {
    const slots: SlotSpec[] = [
      rect([0, 0, 1, 0.48], c.accent, {
        name: "Photo backdrop",
        opacity: 0.24,
      }),
      photo(v, [0, 0, 1, 0.48], { fit: "cover" }),
    ];
    if (copy.price)
      slots.push(
        rect([0.58, 0.435, 0.37, 0.09], c.accent, { name: "Price tag" }),
        type("price", [0.58, 0.435, 0.37, 0.09], copy.price, {
          font: FONT.playfair,
          weight: 900,
          color: onColor(c.accent),
          max: 64,
          lines: 1,
          align: "center",
        }),
      );
    slots.push(
      meta([0.06, 0.525, 0.5, 0.03], copy.eyebrow ?? "", c.accent),
      type("title", [0.06, 0.56, 0.5, 0.16], copy.title, {
        font: FONT.playfair,
        weight: 900,
        color: c.ink,
        max: 100,
        lh: 1,
        lines: 3,
      }),
    );
    if (copy.sub)
      slots.push(body([0.6, 0.565, 0.34, 0.15], copy.sub, c.ink, "left", 27));
    if (o.items)
      o.items.forEach(([name, price], i) => {
        const y = 0.745 + i * 0.045;
        slots.push(
          body([0.06, y, 0.64, 0.04], name, c.ink, "left", 30),
          type("price", [0.72, y, 0.22, 0.04], price, {
            font: FONT.sans,
            weight: 800,
            color: c.accent,
            max: 30,
            fixed: true,
            align: "right",
          }),
        );
      });
    else if (copy.body)
      slots.push(body([0.06, 0.735, 0.52, 0.14], copy.body, c.ink, "left", 27));
    if (copy.cta) slots.push(cta([0.06, 0.9, 0.34, 0.062], copy.cta, c.ink));
    slots.push(
      meta(
        copy.cta ? [0.45, 0.918, 0.5, 0.03] : [0.06, 0.93, 0.88, 0.03],
        copy.note ?? "",
        c.ink,
        copy.cta ? "right" : "left",
      ),
    );
    return slots;
  };
}

/* ------------------------------------------------------------------ */
/* Bespoke structures                                                  */
/* ------------------------------------------------------------------ */

export const businessCard = (c: Palette): SlotSpec[] => [
  rect([0, 0, 0.035, 1], c.accent, { name: "Accent bar" }),
  logoSlot([0.1, 0.08, 0.3, 0.08]),
  meta([0.1, 0.43, 0.6, 0.03], "Northwind Studio", c.accent),
  type("title", [0.1, 0.47, 0.84, 0.13], "Priya Raman", {
    font: FONT.serif,
    color: c.ink,
    max: 150,
    lh: 1,
    lines: 1,
  }),
  type("subheading", [0.1, 0.605, 0.8, 0.05], "Head of Product Design", {
    font: FONT.playfair,
    italic: true,
    color: c.ink,
    max: 44,
    lines: 1,
    opacity: 0.85,
  }),
  rule([0.1, 0.69, 0.84, 0.0022], c.ink, 0.3),
  body(
    [0.1, 0.72, 0.7, 0.17],
    "priya@northwind123.studio\n+1 (415) 555-0142\nnorthwind123.studio",
    c.ink,
    "left",
    32,
  ),
];

/** Ticket-style voucher with notched edges. */
export function voucher(copy: Copy & { offer: string }) {
  return (c: Palette): SlotSpec[] => {
    const on = onColor(c.accent);
    const slots: SlotSpec[] = [
      rect([0.07, 0.18, 0.86, 0.56], c.accent, { name: "Ticket", radius: 40 }),
      disc([0.035, 0.425, 0.07, 0.056], c.bg, "Notch"),
      disc([0.895, 0.425, 0.07, 0.056], c.bg, "Notch"),
      meta([0.1, 0.07, 0.8, 0.03], copy.eyebrow ?? "", c.ink, "center"),
      type("offer", [0.1, 0.24, 0.8, 0.2], copy.offer, {
        font: FONT.archivo,
        color: on,
        max: 240,
        lh: 0.95,
        lines: 1,
        align: "center",
      }),
      type("title", [0.14, 0.46, 0.72, 0.06], copy.title, {
        font: FONT.sans,
        weight: 800,
        color: on,
        max: 44,
        lines: 1,
        align: "center",
      }),
    ];
    if (copy.body)
      slots.push(
        type("badge", [0.28, 0.585, 0.44, 0.07], copy.body, {
          font: FONT.sans,
          weight: 800,
          color: c.ink,
          background: c.bg,
          max: 34,
          fixed: true,
          tracking: 0.2,
          radius: 999,
          align: "center",
        }),
      );
    if (copy.cta) slots.push(cta([0.32, 0.8, 0.36, 0.065], copy.cta, c.ink));
    slots.push(meta([0.1, 0.9, 0.8, 0.03], copy.note ?? "", c.ink, "center"));
    return slots;
  };
}
