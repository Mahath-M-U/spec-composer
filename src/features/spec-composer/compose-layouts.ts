import type { ElementKind, SpecDocument, SpecElement } from "./types";

/** A rectangle in canvas px. Shared with the store so canvas-transform code
 * and compose() planning speak the same shape. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ComposeGroup = "split" | "overlay" | "centered" | "editorial";

export type ComposeLayout =
  | "copy-left"
  | "copy-right"
  | "grid-2up"
  | "split-top"
  | "split-bottom"
  | "sidebar-left"
  | "framed"
  | "collage"
  | "layered-card"
  | "full-bleed-overlay"
  | "overlay-top"
  | "stack-center"
  | "corner-badge"
  | "spotlight"
  | "diagonal"
  | "visual-band"
  | "zigzag";

export interface ComposeLayoutInfo {
  id: ComposeLayout;
  label: string;
  hint: string;
  group: ComposeGroup;
  /** Minimum visual content the layout needs to make sense; see
   * isComposeAvailable. Layouts that work from copy alone omit this. */
  requires?: "visual" | "twoVisuals";
}

export const COMPOSE_LAYOUTS: ComposeLayoutInfo[] = [
  {
    id: "copy-left",
    label: "Copy left",
    hint: "Text block on the left, visual on the right",
    group: "split",
    requires: "visual",
  },
  {
    id: "copy-right",
    label: "Copy right",
    hint: "Text block on the right, visual on the left",
    group: "split",
    requires: "visual",
  },
  {
    id: "grid-2up",
    label: "Two-up grid",
    hint: "Equal visual and copy columns",
    group: "split",
    requires: "visual",
  },
  {
    id: "split-top",
    label: "Visual on top",
    hint: "Visual fills the top half, copy below",
    group: "split",
    requires: "visual",
  },
  {
    id: "split-bottom",
    label: "Visual on bottom",
    hint: "Visual fills the bottom half, copy above",
    group: "split",
    requires: "visual",
  },
  {
    id: "sidebar-left",
    label: "Narrow column",
    hint: "Slim copy column, visual fills the rest",
    group: "split",
    requires: "visual",
  },
  {
    id: "framed",
    label: "Framed visual",
    hint: "Inset visual with copy beneath",
    group: "split",
    requires: "visual",
  },
  {
    id: "collage",
    label: "Image grid",
    hint: "2–4 images in a grid, copy below",
    group: "split",
    requires: "twoVisuals",
  },
  {
    id: "layered-card",
    label: "Layered card",
    hint: "Full-bleed visual with copy on a centered card",
    group: "overlay",
    requires: "visual",
  },
  {
    id: "full-bleed-overlay",
    label: "Full-bleed overlay",
    hint: "Visual fills the canvas, copy overlays the base",
    group: "overlay",
    requires: "visual",
  },
  {
    id: "overlay-top",
    label: "Overlay, copy on top",
    hint: "Full-bleed visual, copy at the top",
    group: "overlay",
    requires: "visual",
  },
  {
    id: "stack-center",
    label: "Centered stack",
    hint: "Everything centered, top to bottom",
    group: "centered",
  },
  {
    id: "corner-badge",
    label: "Corner badge",
    hint: "Badge and CTA pinned to opposite corners",
    group: "centered",
  },
  {
    id: "spotlight",
    label: "Spotlight",
    hint: "Centered visual between headline and details",
    group: "centered",
    requires: "visual",
  },
  {
    id: "diagonal",
    label: "Diagonal cascade",
    hint: "Elements cascade from corner to corner",
    group: "editorial",
  },
  {
    id: "visual-band",
    label: "Middle band",
    hint: "Headline, visual band, details",
    group: "editorial",
    requires: "visual",
  },
  {
    id: "zigzag",
    label: "Z-pattern",
    hint: "Headline top-left, visual right, CTA bottom-right",
    group: "editorial",
    requires: "visual",
  },
];

/** Image kinds compose() treats as the "visual" — logo/brandMark are brand
 * marks, not photography, so they're placed separately (see composePool). */
const VISUAL_IMAGE_KINDS: readonly ElementKind[] = [
  "heroImage",
  "productImage",
  "humanModelImage",
  "supportingImage",
];
const LOGO_KINDS: readonly ElementKind[] = ["logo", "brandMark"];
const STRUCTURE_KINDS: readonly ElementKind[] = ["shape", "divider"];
/** Text kinds that stretch to the column width when stacked; the rest (cta,
 * badge, price) keep their own width, capped at the column width. */
const FILL_TEXT_KINDS: readonly ElementKind[] = [
  "title",
  "subheading",
  "body",
  "eyebrow",
  "offer",
];
/** The "headline" of a copy stack, used by layouts that place it separately
 * from the rest of the copy (visual-band, spotlight, zigzag). */
const HEADLINE_KINDS: readonly ElementKind[] = ["eyebrow", "badge", "title"];

export interface ComposePool {
  visuals: SpecElement[];
  logos: SpecElement[];
  /** Everything else that isn't structure, sorted in reading order
   * (top to bottom, then left to right). */
  copy: SpecElement[];
  /** Shapes and dividers — compose() never moves these. */
  structure: SpecElement[];
}

/** The elements compose() is allowed to move: the selection if there is one,
 * otherwise every visible element, minus anything locked. */
export function composePool(
  doc: SpecDocument,
  selectedIds: string[],
): ComposePool {
  const base = doc.elements.filter(
    (e) =>
      (selectedIds.length ? selectedIds.includes(e.id) : e.visible) &&
      !e.locked,
  );
  const visuals = base.filter((e) => VISUAL_IMAGE_KINDS.includes(e.kind));
  const logos = base.filter((e) => LOGO_KINDS.includes(e.kind));
  const structure = base.filter((e) => STRUCTURE_KINDS.includes(e.kind));
  const copy = base
    .filter(
      (e) =>
        !VISUAL_IMAGE_KINDS.includes(e.kind) &&
        !LOGO_KINDS.includes(e.kind) &&
        !STRUCTURE_KINDS.includes(e.kind),
    )
    .sort((a, b) => a.y - b.y || a.x - b.x);
  return { visuals, logos, copy, structure };
}

function splitHeadline(copy: readonly SpecElement[]): {
  headline: SpecElement[];
  rest: SpecElement[];
} {
  return {
    headline: copy.filter((e) => HEADLINE_KINDS.includes(e.kind)),
    rest: copy.filter((e) => !HEADLINE_KINDS.includes(e.kind)),
  };
}

/** Whether `pool` has enough visual content for `layout` to make sense. */
export function isComposeAvailable(
  layout: ComposeLayout,
  pool: ComposePool,
): boolean {
  const info = COMPOSE_LAYOUTS.find((l) => l.id === layout);
  if (!info?.requires) return true;
  if (info.requires === "twoVisuals") return pool.visuals.length >= 2;
  return pool.visuals.length >= 1;
}

/** How far a stack spanning `top`..`bottom` needs to shift up to fit inside
 * `bounds`, capped so it never moves above `bounds.top`. Returns 0 if it
 * already fits. Shared by `stackCopy` and `applyTidy`'s per-column overflow
 * handling. */
function overflowShift(
  top: number,
  bottom: number,
  bounds: { top: number; bottom: number },
): number {
  return bottom > bounds.bottom
    ? Math.max(0, Math.min(bottom - bounds.bottom, top - bounds.top))
    : 0;
}

/** Stacks `items` top to bottom starting at (x, y0). Fill-kind text
 * (title/subheading/body/eyebrow/offer) is stretched to `width`; cta, badge
 * and price keep their own width, capped at `width`, and align to the
 * column's start edge (or center, with `align: "center"`). When `bounds` is
 * given and the stack overflows `bounds.bottom`, the whole stack shifts up —
 * but never above `bounds.top`. */
function stackCopy(
  boxes: Record<string, Box>,
  items: readonly SpecElement[],
  x: number,
  y0: number,
  width: number,
  gap: number,
  align: "start" | "center" = "start",
  bounds?: { top: number; bottom: number },
): void {
  let y = y0;
  const placedIds: string[] = [];
  const firstTop = y0;
  for (const e of items) {
    const isFill = FILL_TEXT_KINDS.includes(e.kind);
    const itemWidth = isFill ? width : Math.min(e.width, width);
    const itemX = align === "center" ? x + (width - itemWidth) / 2 : x;
    boxes[e.id] = {
      x: Math.round(itemX),
      y: Math.round(y),
      width: Math.round(itemWidth),
      height: e.height,
    };
    placedIds.push(e.id);
    y += e.height + gap;
  }
  if (bounds && placedIds.length) {
    const shift = overflowShift(firstTop, y - gap, bounds);
    if (shift > 0)
      for (const id of placedIds) {
        const box = boxes[id]!;
        box.y = Math.round(box.y - shift);
      }
  }
}

type Corner = "tl" | "tr" | "bl" | "br";

/** Logos keep their own size and pin to a canvas corner rather than join
 * the copy stack (which would stretch them to column width). */
function placeLogos(
  boxes: Record<string, Box>,
  logos: readonly SpecElement[],
  corner: Corner,
  w: number,
  h: number,
  m: number,
): void {
  for (const logo of logos) {
    const x = corner === "tl" || corner === "bl" ? m : w - m - logo.width;
    const y = corner === "tl" || corner === "tr" ? m : h - m - logo.height;
    boxes[logo.id] = {
      x: Math.round(x),
      y: Math.round(y),
      width: logo.width,
      height: logo.height,
    };
  }
}

function copyLeft(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  stackCopy(boxes, pool.copy, m, h * 0.16, w * 0.38, h * 0.03, "start", {
    top: m,
    bottom: h - m,
  });
  const visual = pool.visuals[0];
  if (visual)
    boxes[visual.id] = {
      x: Math.round(w * 0.52),
      y: Math.round(h * 0.12),
      width: Math.round(w * 0.42),
      height: Math.round(h * 0.72),
    };
  placeLogos(boxes, pool.logos, "br", w, h, m);
  return boxes;
}

function copyRight(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const visual = pool.visuals[0];
  if (visual)
    boxes[visual.id] = {
      x: m,
      y: Math.round(h * 0.15),
      width: Math.round(w * 0.48),
      height: Math.round(h * 0.7),
    };
  stackCopy(boxes, pool.copy, w * 0.58, h * 0.16, w * 0.35, h * 0.03, "start", {
    top: m,
    bottom: h - m,
  });
  placeLogos(boxes, pool.logos, "bl", w, h, m);
  return boxes;
}

function grid2up(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const visual = pool.visuals[0];
  if (visual)
    boxes[visual.id] = { x: 0, y: 0, width: Math.round(w * 0.5), height: h };
  stackCopy(boxes, pool.copy, w * 0.58, h * 0.18, w * 0.36, h * 0.03, "start", {
    top: m,
    bottom: h - m,
  });
  placeLogos(boxes, pool.logos, "bl", w, h, m);
  return boxes;
}

function splitTop(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const visual = pool.visuals[0];
  if (visual)
    boxes[visual.id] = { x: 0, y: 0, width: w, height: Math.round(h * 0.55) };
  stackCopy(
    boxes,
    pool.copy,
    m,
    h * 0.62,
    w - m * 2,
    h * 0.025,
    "start",
    { top: m, bottom: h - m },
  );
  placeLogos(boxes, pool.logos, "tr", w, h, m);
  return boxes;
}

function splitBottom(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const visual = pool.visuals[0];
  if (visual)
    boxes[visual.id] = {
      x: 0,
      y: Math.round(h * 0.45),
      width: w,
      height: Math.round(h * 0.55),
    };
  stackCopy(
    boxes,
    pool.copy,
    m,
    h * 0.08,
    w - m * 2,
    h * 0.025,
    "start",
    { top: m, bottom: h - m },
  );
  placeLogos(boxes, pool.logos, "br", w, h, m);
  return boxes;
}

function sidebarLeft(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  stackCopy(boxes, pool.copy, m, h * 0.14, w * 0.28, h * 0.03, "start", {
    top: m,
    bottom: h - m,
  });
  const visual = pool.visuals[0];
  if (visual)
    boxes[visual.id] = {
      x: Math.round(w * 0.38),
      y: 0,
      width: Math.round(w * 0.62),
      height: h,
    };
  placeLogos(boxes, pool.logos, "br", w, h, m);
  return boxes;
}

function framed(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const visualHeight = Math.round(h * 0.55);
  const visual = pool.visuals[0];
  if (visual)
    boxes[visual.id] = {
      x: m,
      y: m,
      width: w - 2 * m,
      height: visualHeight,
    };
  const gap = Math.round(h * 0.03);
  stackCopy(
    boxes,
    pool.copy,
    m,
    m + visualHeight + gap,
    w - 2 * m,
    gap,
    "start",
    { top: m, bottom: h - m },
  );
  placeLogos(boxes, pool.logos, "tr", w, h, m);
  return boxes;
}

/** 2-4 images fill a grid in the canvas's top 60%; copy stacks below it. */
function collage(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const images = pool.visuals;
  const gutter = Math.round(m / 2);
  const bandH = Math.round(h * 0.6);
  if (images.length === 2) {
    const cellW = Math.round((w - gutter) / 2);
    boxes[images[0]!.id] = { x: 0, y: 0, width: cellW, height: bandH };
    boxes[images[1]!.id] = {
      x: cellW + gutter,
      y: 0,
      width: w - cellW - gutter,
      height: bandH,
    };
  } else if (images.length === 3) {
    const bigW = Math.round((w - gutter) * 0.6);
    const smallX = bigW + gutter;
    const smallW = w - smallX;
    const smallH = Math.round((bandH - gutter) / 2);
    boxes[images[0]!.id] = { x: 0, y: 0, width: bigW, height: bandH };
    boxes[images[1]!.id] = { x: smallX, y: 0, width: smallW, height: smallH };
    boxes[images[2]!.id] = {
      x: smallX,
      y: smallH + gutter,
      width: smallW,
      height: bandH - smallH - gutter,
    };
  } else if (images.length >= 4) {
    const cellW = Math.round((w - gutter) / 2);
    const cellH = Math.round((bandH - gutter) / 2);
    images.slice(0, 4).forEach((img, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      boxes[img.id] = {
        x: col === 0 ? 0 : cellW + gutter,
        y: row === 0 ? 0 : cellH + gutter,
        width: col === 0 ? cellW : w - cellW - gutter,
        height: row === 0 ? cellH : bandH - cellH - gutter,
      };
    });
  }
  const gap = Math.round(h * 0.03);
  stackCopy(boxes, pool.copy, m, bandH + gap, w - 2 * m, gap, "start", {
    top: bandH,
    bottom: h - m,
  });
  placeLogos(boxes, pool.logos, "tr", w, h, m);
  return boxes;
}

function layeredCard(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const visual = pool.visuals[0];
  if (visual) boxes[visual.id] = { x: 0, y: 0, width: w, height: h };
  const cardW = Math.round(w * 0.72);
  const cardX = Math.round((w - cardW) / 2);
  stackCopy(boxes, pool.copy, cardX, h * 0.32, cardW, h * 0.025, "start", {
    top: m,
    bottom: h - m,
  });
  placeLogos(boxes, pool.logos, "tl", w, h, m);
  return boxes;
}

function fullBleedOverlay(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const visual = pool.visuals[0];
  if (visual) boxes[visual.id] = { x: 0, y: 0, width: w, height: h };
  stackCopy(boxes, pool.copy, m, h * 0.68, w - m * 2, h * 0.02, "start", {
    top: m,
    bottom: h - m,
  });
  placeLogos(boxes, pool.logos, "tr", w, h, m);
  return boxes;
}

function overlayTop(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const visual = pool.visuals[0];
  if (visual) boxes[visual.id] = { x: 0, y: 0, width: w, height: h };
  stackCopy(boxes, pool.copy, m, h * 0.08, w - 2 * m, h * 0.025, "start", {
    top: m,
    bottom: h - m,
  });
  placeLogos(boxes, pool.logos, "br", w, h, m);
  return boxes;
}

/** stack-center and diagonal move the full visuals+copy pool (not just text),
 * in reading order, so a lone visual cascades with the copy instead of
 * sitting still. */
function readingOrderPool(pool: ComposePool): SpecElement[] {
  return [...pool.visuals, ...pool.copy].sort(
    (a, b) => a.y - b.y || a.x - b.x,
  );
}

function stackCenter(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  let y = h * 0.12;
  for (const e of readingOrderPool(pool)) {
    boxes[e.id] = {
      x: Math.round((w - e.width) / 2),
      y: Math.round(y),
      width: e.width,
      height: e.height,
    };
    y += e.height + h * 0.025;
  }
  placeLogos(boxes, pool.logos, "tl", w, h, m);
  return boxes;
}

function cornerBadge(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const badge = pool.copy.find(
    (e) => e.kind === "badge" || e.kind === "eyebrow",
  );
  const cta = pool.copy.find((e) => e.kind === "cta");
  if (badge)
    boxes[badge.id] = { x: m, y: m, width: badge.width, height: badge.height };
  if (cta)
    boxes[cta.id] = {
      x: Math.round(w - m - cta.width),
      y: Math.round(h - m - cta.height),
      width: cta.width,
      height: cta.height,
    };
  const centerCopy = pool.copy.filter((e) => e !== badge && e !== cta);
  const centerWidth = Math.round(w * 0.7);
  stackCopy(
    boxes,
    centerCopy,
    Math.round((w - centerWidth) / 2),
    h * 0.38,
    centerWidth,
    h * 0.02,
    "start",
    { top: m, bottom: h - m },
  );
  placeLogos(boxes, pool.logos, "tr", w, h, m);
  return boxes;
}

function spotlight(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const s = Math.round(Math.min(w, h) * 0.5);
  const sx = Math.round((w - s) / 2);
  const sy = Math.round(h * 0.26);
  const visual = pool.visuals[0];
  if (visual) boxes[visual.id] = { x: sx, y: sy, width: s, height: s };
  const { headline, rest } = splitHeadline(pool.copy);
  const colW = Math.round(w * 0.7);
  const colX = Math.round((w - colW) / 2);
  stackCopy(boxes, headline, colX, m, colW, h * 0.025, "center", {
    top: m,
    bottom: sy,
  });
  stackCopy(
    boxes,
    rest,
    colX,
    sy + s + Math.round(h * 0.03),
    colW,
    h * 0.025,
    "center",
    { top: sy + s, bottom: h - m },
  );
  placeLogos(boxes, pool.logos, "tl", w, h, m);
  return boxes;
}

function diagonal(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  let y = h * 0.1;
  readingOrderPool(pool).forEach((e, i) => {
    boxes[e.id] = {
      x: Math.round(m + i * w * 0.06),
      y: Math.round(y),
      width: e.width,
      height: e.height,
    };
    y += e.height + h * 0.05;
  });
  placeLogos(boxes, pool.logos, "tl", w, h, m);
  return boxes;
}

function visualBand(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const { headline, rest } = splitHeadline(pool.copy);
  stackCopy(boxes, headline, m, h * 0.07, w - 2 * m, h * 0.025, "start", {
    top: m,
    bottom: h * 0.3,
  });
  const visual = pool.visuals[0];
  if (visual)
    boxes[visual.id] = {
      x: 0,
      y: Math.round(h * 0.3),
      width: w,
      height: Math.round(h * 0.38),
    };
  stackCopy(boxes, rest, m, h * 0.72, w - 2 * m, h * 0.025, "start", {
    top: h * 0.72,
    bottom: h - m,
  });
  placeLogos(boxes, pool.logos, "tr", w, h, m);
  return boxes;
}

function zigzag(
  pool: ComposePool,
  w: number,
  h: number,
  m: number,
): Record<string, Box> {
  const boxes: Record<string, Box> = {};
  const { headline, rest } = splitHeadline(pool.copy);
  const cta = rest.find((e) => e.kind === "cta");
  const body = rest.filter((e) => e !== cta);
  stackCopy(boxes, headline, m, m, w * 0.6, h * 0.025, "start", {
    top: m,
    bottom: h * 0.3,
  });
  const visual = pool.visuals[0];
  if (visual)
    boxes[visual.id] = {
      x: Math.round(w * 0.42),
      y: Math.round(h * 0.3),
      width: Math.round(w * 0.58 - m),
      height: Math.round(h * 0.4),
    };
  stackCopy(boxes, body, m, h * 0.74, w * 0.5, h * 0.025, "start", {
    top: h * 0.74,
    bottom: h - m,
  });
  if (cta)
    boxes[cta.id] = {
      x: Math.round(w - m - cta.width),
      y: Math.round(h - m - cta.height),
      width: cta.width,
      height: cta.height,
    };
  placeLogos(boxes, pool.logos, "tr", w, h, m);
  return boxes;
}

/** Computes where `applyComposeLayout` would move each element, without
 * mutating anything — used both to apply a layout and to preview it (active
 * marker, thumbnails). */
export function planComposeBoxes(
  doc: SpecDocument,
  layout: ComposeLayout,
  selectedIds: string[],
): Record<string, Box> {
  const pool = composePool(doc, selectedIds);
  const w = doc.format.width;
  const h = doc.format.height;
  const m = Math.round(w * 0.07);
  switch (layout) {
    case "copy-left":
      return copyLeft(pool, w, h, m);
    case "copy-right":
      return copyRight(pool, w, h, m);
    case "grid-2up":
      return grid2up(pool, w, h, m);
    case "split-top":
      return splitTop(pool, w, h, m);
    case "split-bottom":
      return splitBottom(pool, w, h, m);
    case "sidebar-left":
      return sidebarLeft(pool, w, h, m);
    case "framed":
      return framed(pool, w, h, m);
    case "collage":
      return collage(pool, w, h, m);
    case "layered-card":
      return layeredCard(pool, w, h, m);
    case "full-bleed-overlay":
      return fullBleedOverlay(pool, w, h, m);
    case "overlay-top":
      return overlayTop(pool, w, h, m);
    case "stack-center":
      return stackCenter(pool, w, h, m);
    case "corner-badge":
      return cornerBadge(pool, w, h, m);
    case "spotlight":
      return spotlight(pool, w, h, m);
    case "diagonal":
      return diagonal(pool, w, h, m);
    case "visual-band":
      return visualBand(pool, w, h, m);
    case "zigzag":
      return zigzag(pool, w, h, m);
    default:
      return {};
  }
}

/** Applies a compose layout's planned boxes to `doc.elements` in place. */
export function applyComposeLayout(
  doc: SpecDocument,
  layout: ComposeLayout,
  selectedIds: string[],
): void {
  const boxes = planComposeBoxes(doc, layout, selectedIds);
  doc.elements.forEach((e) => {
    const box = boxes[e.id];
    if (box) Object.assign(e, box);
  });
}

const TIDY_TEXT_KINDS: readonly ElementKind[] = [
  "title",
  "subheading",
  "body",
  "eyebrow",
  "offer",
  "price",
  "badge",
  "cta",
];

const FULL_BLEED_COVERAGE = 0.9;
const FULL_BLEED_TOLERANCE = 1;

/** applyTidy's snap grid, in px. */
const TIDY_GRID = 4;
function snapToGrid(v: number): number {
  return Math.round(v / TIDY_GRID) * TIDY_GRID;
}
/** Canvas margin and x-alignment tolerance, as a ratio of the format's
 * shorter side — so both scale with format size instead of a fixed px. */
const TIDY_MARGIN_RATIO = 0.06;
const TIDY_ALIGN_RATIO = 0.03;
/** Vertical gap ratios by role, also relative to the shorter side. Only
 * eyebrow/badge → next is "tight"; title → next is "loose"; everything else,
 * including any → cta, falls in between (see tidyGapKind). */
const TIDY_GAP_RATIOS = {
  tight: 0.015,
  medium: 0.03,
  loose: 0.045,
  cta: 0.04,
} as const;
const TIDY_MIN_GAP_RATIO = 0.008;
/** A pair is only pushed apart when the actual gap is below this fraction of
 * the required gap — small-but-intentional spacing above that is left
 * alone (applyTidy only ever pushes text apart, never pulls it closer). */
const TIDY_PUSH_TOLERANCE = 0.625;
/** Minimum horizontal overlap ratio for an element to join a column. */
const TIDY_COLUMN_OVERLAP = 0.5;

function tidyGapPx(base: number, ratio: number): number {
  return Math.max(TIDY_GRID, snapToGrid(base * ratio));
}

type TidyGapKind = keyof typeof TIDY_GAP_RATIOS;

/** Which gap ratio applies between two vertically adjacent text elements. */
function tidyGapKind(prev: SpecElement, cur: SpecElement): TidyGapKind {
  if (prev.kind === "eyebrow" || prev.kind === "badge") return "tight";
  if (cur.kind === "cta") return "cta";
  if (prev.kind === "title") return "loose";
  return "medium";
}

/** The fraction of the narrower box's width that `a` and `b` overlap on the
 * x axis — used to decide whether two text elements belong in the same
 * column. */
function horizontalOverlapRatio(a: Box, b: Box): number {
  const overlap = Math.max(
    0,
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
  );
  return overlap / Math.max(1, Math.min(a.width, b.width));
}

/** Groups `text` (already sorted top to bottom, then left to right) into
 * vertical columns: each element joins the column whose last member
 * overlaps it horizontally the most, provided that overlap ratio is at
 * least TIDY_COLUMN_OVERLAP (ties keep the first/earlier column);
 * otherwise it starts a new column. */
function clusterTidyColumns(
  text: readonly SpecElement[],
): SpecElement[][] {
  const columns: SpecElement[][] = [];
  for (const e of text) {
    let bestColumn = -1;
    let bestRatio = 0;
    columns.forEach((col, i) => {
      const ratio = horizontalOverlapRatio(col[col.length - 1]!, e);
      if (ratio >= TIDY_COLUMN_OVERLAP && ratio > bestRatio) {
        bestRatio = ratio;
        bestColumn = i;
      }
    });
    if (bestColumn >= 0) columns[bestColumn]!.push(e);
    else columns.push([e]);
  }
  return columns;
}

/** True if `box` spans (or overflows past) the whole canvas on an axis — a
 * hero background or an edge-to-edge band, which `applyTidy` must leave
 * alone. Reaching just one edge (e.g. a sidebar flush against x=0) doesn't
 * count: the box has to reach or pass both opposite edges of that axis, or
 * cover most of both axes at once. */
export function isFullBleed(box: Box, width: number, height: number): boolean {
  if (
    box.width >= FULL_BLEED_COVERAGE * width &&
    box.height >= FULL_BLEED_COVERAGE * height
  )
    return true;
  if (
    box.x <= FULL_BLEED_TOLERANCE &&
    box.x + box.width >= width - FULL_BLEED_TOLERANCE
  )
    return true;
  if (
    box.y <= FULL_BLEED_TOLERANCE &&
    box.y + box.height >= height - FULL_BLEED_TOLERANCE
  )
    return true;
  return false;
}

/** Snaps non-full-bleed elements to a 4px grid, keeps them inside a canvas
 * margin, clusters text into columns and pushes overlapping members apart
 * with role-aware gaps (eyebrow/badge → next is tight, title → next is
 * loose, everything else medium/cta), and pins logos to the nearest top
 * corner. Margin, alignment tolerance and gaps all scale with the format's
 * shorter side. applyTidy only ever pushes text apart — it never pulls
 * already-spaced text closer — and if a column still overflows the canvas
 * after shifting up, it compresses only the gaps above the 4px minimum,
 * proportionally, rather than resizing or moving anything above the
 * margin. Mirrors the old store.ts `tidy` body, but skips full-bleed
 * backgrounds/bands, locked elements, and, when `selectedIds` is
 * non-empty, only touches the selected elements. */
export function applyTidy(doc: SpecDocument, selectedIds: string[]): void {
  const W = doc.format.width;
  const H = doc.format.height;
  const base = Math.min(W, H);
  const pool = doc.elements.filter(
    (e) =>
      (selectedIds.length ? selectedIds.includes(e.id) : true) &&
      !e.locked &&
      !isFullBleed(e, W, H),
  );
  const margin = snapToGrid(base * TIDY_MARGIN_RATIO);
  const alignPx = Math.round(base * TIDY_ALIGN_RATIO);
  const minGap = tidyGapPx(base, TIDY_MIN_GAP_RATIO);

  pool.forEach((e) => {
    const maxX = Math.floor((W - margin - e.width) / TIDY_GRID) * TIDY_GRID;
    const maxY = Math.floor((H - margin - e.height) / TIDY_GRID) * TIDY_GRID;
    e.x = Math.max(margin, Math.min(maxX, snapToGrid(e.x)));
    e.y = Math.max(margin, Math.min(maxY, snapToGrid(e.y)));
  });

  const text = pool
    .filter((e) => TIDY_TEXT_KINDS.includes(e.kind))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const columns = clusterTidyColumns(text);

  for (const column of columns) {
    for (let i = 1; i < column.length; i++) {
      const prev = column[i - 1]!;
      const cur = column[i]!;
      if (
        Math.abs(cur.x - prev.x) < alignPx &&
        prev.x + cur.width <= W - margin
      )
        cur.x = prev.x;
      const req = tidyGapPx(base, TIDY_GAP_RATIOS[tidyGapKind(prev, cur)]);
      if (cur.y < prev.y + prev.height + req * TIDY_PUSH_TOLERANCE)
        cur.y = prev.y + prev.height + req;
    }

    const top = column[0]!.y;
    const bottom = Math.max(...column.map((e) => e.y + e.height));
    const shift = overflowShift(top, bottom, {
      top: margin,
      bottom: H - margin,
    });
    if (shift > 0) for (const e of column) e.y -= shift;

    const remaining = bottom - shift - (H - margin);
    if (remaining > 0) {
      const gaps = column
        .slice(1)
        .map((cur, i) => cur.y - (column[i]!.y + column[i]!.height));
      const compressible = gaps.reduce(
        (sum, g) => sum + Math.max(0, g - minGap),
        0,
      );
      if (compressible > 0) {
        const f = Math.min(1, remaining / compressible);
        let y = column[0]!.y;
        for (let i = 1; i < column.length; i++) {
          const g = gaps[i - 1]!;
          const newGap =
            g > minGap ? minGap + Math.floor((g - minGap) * (1 - f)) : g;
          y += column[i - 1]!.height + newGap;
          column[i]!.y = y;
        }
      }
    }
  }

  const logos = pool.filter(
    (e) => e.kind === "logo" || e.kind === "brandMark",
  );
  logos.forEach((logo) => {
    const nearRight = logo.x + logo.width / 2 > W / 2;
    logo.x = nearRight ? W - margin - logo.width : margin;
    logo.y = Math.max(margin, Math.min(logo.y, H - margin - logo.height));
  });
}
