import type { ElementStyle, SpecElement } from "../types";
import { inferCatalogId } from "./catalog";
import { applicableFields, availableOptions } from "./conditions";
import { fieldOptions, getElementFields, getElementSchema, type Field } from "./schema";
import { normalizedModelEdit } from "./model-preview";

export type PropertyValue = NonNullable<
  SpecElement["contextualProperties"]
>[string];
const geometry = new Set(["x", "y", "width", "height", "rotation"]);
const styles: Record<string, keyof ElementStyle> = {
  "type.family": "fontFamily",
  "type.size": "fontSize",
  "type.align": "alignment",
  "type.color": "color",
  "type.lineHeight": "lineHeight",
  "type.letterSpacing": "letterSpacing",
  "surface.fill": "background",
  "surface.strokeColor": "borderColor",
  "surface.strokeWidth": "borderWidth",
  "surface.cornerRadius": "borderRadius",
};
const weights: Record<string, number> = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};
export function readProperty(element: SpecElement, key: string): unknown {
  const transform = key.startsWith("transform.") ? key.slice(10) : "";
  if (geometry.has(transform)) return element[transform as "x"];
  if (key === "transform.opacity") return (element.style.opacity ?? 1) * 100;
  if (key === "type.content") return element.content;
  if (key === "type.weight")
    return Object.keys(weights).find(
      (weight) => weights[weight] === element.style.fontWeight,
    );
  if (styles[key]) return element.style[styles[key]];
  if (key === "asset.fit")
    return element.style.objectFit === "none"
      ? "original_size"
      : element.style.objectFit;
  if (key === "asset.source")
    return (
      element.contextualProperties?.[key] ??
      (element.src ? "__current_source__" : undefined)
    );
  if (key === "surface.shape")
    return (
      element.contextualProperties?.[key] ??
      (element.style.shapeType === "rounded rectangle"
        ? "rounded_rectangle"
        : element.style.shapeType)
    );
  if (
    key === "surface.fillType" &&
    !element.contextualProperties?.[key] &&
    element.style.background
  )
    return "solid";
  if (
    key === "surface.strokeStyle" &&
    !element.contextualProperties?.[key] &&
    element.style.borderWidth
  )
    return "solid";
  return element.contextualProperties?.[key] ?? (inferCatalogId(element) === "subjects.person" ? getElementSchema("subjects.person")?.creationDefaults?.[key] : undefined);
}
export function visibleFields(element: SpecElement) {
  return applicableFields(inferCatalogId(element) ?? "", (key) =>
    readProperty(element, key),
  );
}
export function validProperty(
  field: Field,
  value: unknown,
  element: SpecElement,
): value is PropertyValue {
  if (value === undefined || value === null) return true;
  const options = availableOptions(field, (key) => readProperty(element, key));
  const option = (value: unknown) =>
    typeof value === "string" &&
    (!fieldOptions(field).length ||
      options.some((option) => option.value === value));
  switch (field.control) {
    case "number":
    case "slider":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        Math.abs(value) <= 100_000 &&
        (field.min === undefined || value >= field.min) &&
        (field.max === undefined || value <= field.max)
      );
    case "toggle":
      return typeof value === "boolean";
    case "select":
      return option(value);
    case "multiselect":
      return Array.isArray(value) && value.every(option);
    case "color_list":
      return (
        Array.isArray(value) &&
        value.length <= 32 &&
        value.every(
          (item) =>
            typeof item === "string" &&
            /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(item),
        )
      );
    case "field_keys":
      return (
        Array.isArray(value) &&
        value.every(
          (key) =>
            typeof key === "string" &&
            getElementFields(inferCatalogId(element) ?? "").some(
              (field) => field.key === key,
            ),
        )
      );
    case "tags":
    case "element_references":
      return (
        Array.isArray(value) &&
        value.length <= 200 &&
        value.every((item) => typeof item === "string" && item.length <= 20_000)
      );
    case "repeatable":
      return (
        Array.isArray(value) &&
        value.length <= 200 &&
        value.every(
          (row) =>
            !!row &&
            typeof row === "object" &&
            !Array.isArray(row) &&
            Object.entries(row).every(
              ([key, value]) =>
                !Array.isArray(field.options) &&
                field.options?.itemFields.includes(key) &&
                typeof value === "string",
            ),
        )
      );
    case "data_table":
      return (
        Array.isArray(value) &&
        value.length <= 200 &&
        value.every(
          (row) =>
            !!row &&
            typeof row === "object" &&
            !Array.isArray(row) &&
            Object.values(row).every(
              (cell) =>
                typeof cell === "string" ||
                (typeof cell === "number" && Number.isFinite(cell)),
            ),
        )
      );
    case "gradient_stops":
      return (
        Array.isArray(value) &&
        value.length <= 32 &&
        value.every(
          (stop) =>
            !!stop &&
            typeof stop === "object" &&
            "color" in stop &&
            typeof stop.color === "string" &&
            /^#[\da-f]{6}$/i.test(stop.color) &&
            "position" in stop &&
            typeof stop.position === "number" &&
            stop.position >= 0 &&
            stop.position <= 100,
        )
      );
    default:
      return (
        typeof value === "string" &&
        value.length <= 20_000 &&
        (field.control !== "color" ||
          /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value))
      );
  }
}
/** Rendered properties live in existing Inspector fields; only extra metadata uses the map. */
export function writeProperty(
  element: SpecElement,
  key: string,
  value: PropertyValue | undefined,
): boolean {
  const field = visibleFields(element).find((field) => field.key === key);
  if (!field || !validProperty(field, value, element)) return false;
  const locked = element.contextualProperties?.["model.references.lockFields"];
  if (
    key !== "model.references.lockFields" &&
    Array.isArray(locked) &&
    locked.includes(key)
  )
    return false;
  const transform = key.startsWith("transform.") ? key.slice(10) : "";
  if (geometry.has(transform)) {
    // Geometry remains in the existing Inspector properties.
    if (typeof value !== "number") return false;
    element[transform as "x"] = value;
  } else if (key === "transform.opacity")
    element.style.opacity = typeof value === "number" ? value / 100 : undefined;
  else if (key === "type.content")
    element.content = typeof value === "string" ? value : undefined;
  else if (key === "type.weight")
    element.style.fontWeight =
      typeof value === "string" ? weights[value] : undefined;
  else if (styles[key]) {
    Object.assign(element.style, { [styles[key]]: value ?? undefined });
  } else if (key === "asset.fit") {
    element.style.objectFit =
      value === "original_size"
        ? "none"
        : (value as "contain" | "cover" | "fill" | undefined);
    delete element.contextualProperties?.[key];
  } else if (
    key === "surface.shape" &&
    ["rectangle", "rounded_rectangle", "circle", "ellipse"].includes(
      String(value),
    )
  ) {
    element.style.shapeType =
      value === "rounded_rectangle"
        ? "rounded rectangle"
        : (value as "rectangle");
    delete element.contextualProperties?.[key];
  } else {
    if(inferCatalogId(element)==="subjects.person"&&(key.startsWith("model.")||key==="item.personMode")){
      const next=normalizedModelEdit(element,key,value);if(!next)return false;element.contextualProperties=next;return true;
    }
    element.contextualProperties ??= {};
    if (value === null || value === undefined)
      delete element.contextualProperties[key];
    else element.contextualProperties[key] = value;
    if (key === "surface.shape" && value === "pill") {
      element.style.shapeType = "rounded rectangle";
      element.style.borderRadius = Math.min(element.width, element.height) / 2;
    }
    if (
      key === "surface.fillType" &&
      ["none", "transparent"].includes(String(value))
    )
      element.style.background = "transparent";
    if (key === "surface.strokeStyle" && value === "none")
      element.style.borderWidth = 0;
  }
  // Never keep a second stale value for an Inspector-bound property.
  if (
    geometry.has(transform) ||
    styles[key] ||
    ["transform.opacity", "type.content", "type.weight"].includes(key)
  )
    delete element.contextualProperties?.[key];
  return true;
}
