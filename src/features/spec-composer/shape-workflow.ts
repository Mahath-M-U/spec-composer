import type { CanvasBox } from "./canvas-geometry";
import type { ShapeRole, SpecElement } from "./types";
import { resolveElementDetail } from "./description-templates";

export const SHAPE_TYPES = [
  "rectangle",
  "circle",
  "rounded rectangle",
  "ellipse",
  "triangle",
  "diamond",
  "line",
] as const;
export type ShapeType = (typeof SHAPE_TYPES)[number];
export const SHAPE_TYPE_LABELS: Readonly<Record<ShapeType, string>> = {
  rectangle: "Rectangle",
  circle: "Circle",
  "rounded rectangle": "Rounded rectangle",
  ellipse: "Ellipse",
  triangle: "Triangle",
  diamond: "Diamond",
  line: "Divider",
};
export const SHAPE_ROLE_OPTIONS: readonly (readonly [ShapeRole, string])[] = [
  ["subject", "Subject"],
  ["product", "Product"],
  ["background", "Background"],
  ["text_area", "Text area"],
  ["decorative", "Decorative element"],
];
export const shapeRoleLabel = (role: ShapeRole) =>
  SHAPE_ROLE_OPTIONS.find(([id]) => id === role)![1];
export const isShapeType = (value: string): value is ShapeType =>
  (SHAPE_TYPES as readonly string[]).includes(value);
export const isCircleShape = (el: Pick<SpecElement, "kind" | "style">) =>
  el.kind === "shape" && el.style.shapeType === "circle";
export function effectiveRadius(
  el: Pick<SpecElement, "kind" | "style" | "width" | "height">,
) {
  const limit = Math.max(0, Math.min(el.width, el.height) / 2);
  if (isCircleShape(el)) return limit;
  if (
    el.kind === "shape" &&
    ["ellipse", "triangle", "diamond", "line"].includes(
      el.style.shapeType ?? "",
    )
  )
    return 0;
  return Math.min(limit, Math.max(0, el.style.borderRadius ?? 0));
}
export function centeredCircle(box: CanvasBox): CanvasBox {
  const diameter = Math.min(box.width, box.height);
  return {
    x: box.x + (box.width - diameter) / 2,
    y: box.y + (box.height - diameter) / 2,
    width: diameter,
    height: diameter,
  };
}
export function shapePatch(type: ShapeType): Partial<SpecElement> {
  return {
    name: SHAPE_TYPE_LABELS[type],
    semanticRole: "decorative",
    width: type === "triangle" || type === "diamond" ? 200 : 240,
    height:
      type === "circle"
        ? 240
        : type === "triangle" || type === "diamond"
          ? 200
          : type === "line"
            ? 4
            : 160,
    rotation: 0,
    style: {
      shapeType: type,
      borderRadius: type === "rounded rectangle" ? 16 : 0,
      opacity: 1,
    },
  };
}
export const isSemanticVisual = (el: SpecElement) =>
  el.kind === "shape" &&
  (el.semanticRole === "subject" || el.semanticRole === "product");
export function shapeDescription(el: SpecElement) {
  const detail = resolveElementDetail(el).trim();
  const role = el.semanticRole ?? "decorative";
  const purpose =
    role === "subject" || role === "product"
      ? `${role} content placeholder`
      : role === "text_area"
        ? "reserved copy space"
        : role === "background"
          ? "background region"
          : "decorative primitive";
  return `${shapeRoleLabel(role)} — ${el.style.shapeType ?? "rectangle"}, ${purpose}; position ${el.x}, ${el.y} px; size ${el.width} × ${el.height} px; rotation ${el.rotation}°; corner radius ${effectiveRadius(el)}px${el.style.background ? `; fill ${el.style.background}` : ""}; opacity ${el.style.opacity ?? 1}${detail ? `; ${detail}` : ""}.`;
}
