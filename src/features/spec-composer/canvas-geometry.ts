export interface Point {
  x: number;
  y: number;
}
export interface CanvasBox extends Point {
  width: number;
  height: number;
}
export interface View {
  zoom: number;
  pan: Point;
}
export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
export const RESIZE_HANDLES: ResizeHandle[] = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
];
export const clampZoom = (zoom: number) => Math.max(0.1, Math.min(3, zoom));
export const toDocumentPoint = (point: Point, view: View): Point => ({
  x: (point.x - view.pan.x) / view.zoom,
  y: (point.y - view.pan.y) / view.zoom,
});
export function zoomAt(view: View, point: Point, requestedZoom: number): View {
  const zoom = clampZoom(requestedZoom);
  const anchor = toDocumentPoint(point, view);
  return {
    zoom,
    pan: { x: point.x - anchor.x * zoom, y: point.y - anchor.y * zoom },
  };
}
export function wheelDelta(delta: number, mode: number, pageHeight: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? pageHeight : 1);
  return Math.max(-240, Math.min(240, pixels));
}
export function fitView(
  width: number,
  height: number,
  format: CanvasBox,
): View {
  const availableWidth = Math.max(80, width - 240);
  const zoom = Math.min(
    0.72,
    clampZoom(
      Math.min(
        Math.max(40, availableWidth - 48) / format.width,
        Math.max(40, height - 120) / format.height,
      ),
    ),
  );
  return {
    zoom,
    pan: {
      x: (availableWidth - format.width * zoom) / 2,
      y: (height - format.height * zoom) / 2,
    },
  };
}
export function movementLimits(box: CanvasBox, width: number, height: number) {
  return {
    left: Math.min(0, box.x),
    top: Math.min(0, box.y),
    right: Math.max(width, box.x + box.width),
    bottom: Math.max(height, box.y + box.height),
  };
}
export function constrainMove(
  box: CanvasBox,
  start: CanvasBox,
  width: number,
  height: number,
): CanvasBox {
  const b = movementLimits(start, width, height);
  return {
    ...box,
    x: Math.max(b.left, Math.min(b.right - box.width, box.x)),
    y: Math.max(b.top, Math.min(b.bottom - box.height, box.y)),
  };
}
export function resizeBox(
  start: CanvasBox,
  handle: ResizeHandle,
  delta: Point,
  ratio: boolean,
  minimum = { width: 1, height: 1 },
): CanvasBox {
  const west = handle.includes("w"),
    east = handle.includes("e");
  const north = handle.includes("n"),
    south = handle.includes("s");
  let width = Math.max(
    minimum.width,
    start.width + (east ? delta.x : west ? -delta.x : 0),
  );
  let height = Math.max(
    minimum.height,
    start.height + (south ? delta.y : north ? -delta.y : 0),
  );
  if (ratio) {
    const sx = width / start.width,
      sy = height / start.height;
    const scale = Math.max(
      minimum.width / start.width,
      minimum.height / start.height,
      !(east || west)
        ? sy
        : !(north || south)
          ? sx
          : Math.abs(sx - 1) >= Math.abs(sy - 1)
            ? sx
            : sy,
    );
    width = start.width * scale;
    height = start.height * scale;
  }
  return {
    x: west
      ? start.x + start.width - width
      : !(east || west)
        ? start.x + (start.width - width) / 2
        : start.x,
    y: north
      ? start.y + start.height - height
      : !(north || south)
        ? start.y + (start.height - height) / 2
        : start.y,
    width,
    height,
  };
}
export function transformBoxes<T extends CanvasBox & { id: string }>(
  elements: T[],
  start: CanvasBox,
  next: CanvasBox,
): Record<string, CanvasBox> {
  return Object.fromEntries(
    elements.map((el) => [
      el.id,
      {
        x: next.x + ((el.x - start.x) * next.width) / start.width,
        y: next.y + ((el.y - start.y) * next.height) / start.height,
        width: Math.max(1, (el.width * next.width) / start.width),
        height: Math.max(1, (el.height * next.height) / start.height),
      },
    ]),
  );
}
export function constrainResize(
  next: CanvasBox,
  start: CanvasBox,
  width: number,
  height: number,
): CanvasBox {
  const limits = movementLimits(start, width, height);
  let t = 1;
  if (next.x < limits.left)
    t = Math.min(t, (start.x - limits.left) / (start.x - next.x));
  if (next.y < limits.top)
    t = Math.min(t, (start.y - limits.top) / (start.y - next.y));
  const right = start.x + start.width,
    bottom = start.y + start.height;
  if (next.x + next.width > limits.right)
    t = Math.min(t, (limits.right - right) / (next.x + next.width - right));
  if (next.y + next.height > limits.bottom)
    t = Math.min(t, (limits.bottom - bottom) / (next.y + next.height - bottom));
  return {
    x: start.x + (next.x - start.x) * t,
    y: start.y + (next.y - start.y) * t,
    width: start.width + (next.width - start.width) * t,
    height: start.height + (next.height - start.height) * t,
  };
}
export function validBox(box: CanvasBox) {
  return (
    Object.values(box).every(Number.isFinite) &&
    box.width >= 1 &&
    box.height >= 1
  );
}
export function sameBox(a: CanvasBox, b: CanvasBox) {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

export type AlignEdge =
  "left" | "center" | "right" | "top" | "middle" | "bottom";

export interface AlignItem extends CanvasBox {
  id: string;
  locked?: boolean | undefined;
  groupId?: string | undefined;
}

export interface AlignUnit {
  ids: string[];
  box: CanvasBox;
  locked: boolean;
}

/**
 * Groups items sharing a groupId into a single rigid unit (first-seen order);
 * ungrouped items become their own single-member unit.
 */
export function alignUnits(items: AlignItem[]): AlignUnit[] {
  const order: string[] = [];
  const members = new Map<string, AlignItem[]>();
  for (const item of items) {
    const key = item.groupId ?? `el:${item.id}`;
    const list = members.get(key);
    if (list) {
      list.push(item);
    } else {
      members.set(key, [item]);
      order.push(key);
    }
  }
  return order.map((key) => {
    const group = members.get(key)!;
    return {
      ids: group.map((item) => item.id),
      box: boundsOfBoxes(group),
      locked: group.some((item) => item.locked),
    };
  });
}

function boundsOfBoxes(boxes: CanvasBox[]): CanvasBox {
  const first = boxes[0]!;
  let minX = first.x;
  let minY = first.y;
  let maxX = first.x + first.width;
  let maxY = first.y + first.height;
  for (const box of boxes) {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Computes per-element position deltas to align selected items along `edge`.
 * Grouped items move as a rigid unit; locked units never move and, when
 * present in a multi-unit selection, act as the alignment anchor instead of
 * `canvas`. Only elements whose position actually changes are returned.
 */
export function alignOffsets(
  items: AlignItem[],
  edge: AlignEdge,
  canvas: CanvasBox,
): Record<string, Point> {
  const units = alignUnits(items);
  const movable = units.filter((u) => !u.locked);
  if (!movable.length) return {};

  const lockedUnits = units.filter((u) => u.locked);
  const target: CanvasBox =
    units.length === 1
      ? canvas
      : lockedUnits.length
        ? boundsOfBoxes(lockedUnits.map((u) => u.box))
        : boundsOfBoxes(units.map((u) => u.box));

  const result: Record<string, Point> = {};
  const byId = new Map(items.map((item) => [item.id, item]));

  for (const unit of movable) {
    let nextX = unit.box.x;
    let nextY = unit.box.y;
    switch (edge) {
      case "left":
        nextX = target.x;
        break;
      case "right":
        nextX = target.x + target.width - unit.box.width;
        break;
      case "center":
        nextX = Math.round(target.x + (target.width - unit.box.width) / 2);
        break;
      case "top":
        nextY = target.y;
        break;
      case "bottom":
        nextY = target.y + target.height - unit.box.height;
        break;
      case "middle":
        nextY = Math.round(target.y + (target.height - unit.box.height) / 2);
        break;
    }
    const dx = nextX - unit.box.x;
    const dy = nextY - unit.box.y;
    if (dx === 0 && dy === 0) continue;
    for (const id of unit.ids) {
      const member = byId.get(id);
      if (!member) continue;
      result[id] = { x: member.x + dx, y: member.y + dy };
    }
  }
  return result;
}

/**
 * Computes per-element position deltas to evenly space selected items along
 * `axis`. Grouped items move as a rigid unit; locked units are excluded and
 * never move. Requires at least three movable units, otherwise returns {}.
 * The first and last movable units (by position) stay fixed; only elements
 * whose position actually changes are returned.
 */
export function distributeOffsets(
  items: AlignItem[],
  axis: "horizontal" | "vertical",
): Record<string, Point> {
  const units = alignUnits(items).filter((u) => !u.locked);
  if (units.length < 3) return {};

  const byId = new Map(items.map((item) => [item.id, item]));
  const result: Record<string, Point> = {};

  if (axis === "horizontal") {
    const sorted = [...units].sort((a, b) => a.box.x - b.box.x);
    const start = sorted[0]!;
    const end = sorted[sorted.length - 1]!;
    const span = end.box.x + end.box.width - start.box.x;
    const totalWidth = sorted.reduce((sum, u) => sum + u.box.width, 0);
    const gap = (span - totalWidth) / (sorted.length - 1);
    let cursor = start.box.x;
    for (const unit of sorted) {
      const nextX = Math.round(cursor);
      const dx = nextX - unit.box.x;
      if (dx !== 0) {
        for (const id of unit.ids) {
          const member = byId.get(id);
          if (!member) continue;
          result[id] = { x: member.x + dx, y: member.y };
        }
      }
      cursor += unit.box.width + gap;
    }
  } else {
    const sorted = [...units].sort((a, b) => a.box.y - b.box.y);
    const start = sorted[0]!;
    const end = sorted[sorted.length - 1]!;
    const span = end.box.y + end.box.height - start.box.y;
    const totalHeight = sorted.reduce((sum, u) => sum + u.box.height, 0);
    const gap = (span - totalHeight) / (sorted.length - 1);
    let cursor = start.box.y;
    for (const unit of sorted) {
      const nextY = Math.round(cursor);
      const dy = nextY - unit.box.y;
      if (dy !== 0) {
        for (const id of unit.ids) {
          const member = byId.get(id);
          if (!member) continue;
          result[id] = { x: member.x, y: member.y + dy };
        }
      }
      cursor += unit.box.height + gap;
    }
  }
  return result;
}
