import type { SpecDocument, SpecElement } from "../types";
import { inferCatalogId, isConstraint } from "./catalog";
import {
  readProperty,
  validProperty,
  visibleFields,
  type PropertyValue,
} from "./properties";
import { validReference } from "./references";
import { getElementSchema } from "./schema";

export function projectContextualProperties(
  element: SpecElement,
  doc: SpecDocument,
) {
  const properties: Record<string, PropertyValue> = {};
  for (const field of visibleFields(element)) {
    const value = element.contextualProperties?.[field.key];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      !validProperty(field, value, element)
    )
      continue;
    if (
      field.control.startsWith("element_reference") &&
      !validReference(doc, element, field, value)
    )
      continue;
    if (
      field.control === "asset_reference" &&
      (typeof value !== "string" || !doc.referenceAssets?.[value])
    )
      continue;
    properties[field.key] = value;
  }
  return properties;
}
export function contextualDescription(element: SpecElement, doc: SpecDocument) {
  if (!element.catalogElementId) return "";
  const schema = getElementSchema(element.catalogElementId);
  if (!schema) return "";
  const fields = visibleFields(element),
    properties = projectContextualProperties(element, doc);
  const values = Object.entries(properties).map(([key, value]) => {
    const field = fields.find((field) => field.key === key)!;
    const display =
      field.control === "asset_reference" && typeof value === "string"
        ? `supplied reference ${value} (${doc.referenceAssets![value]!.name})`
        : typeof value === "string"
          ? value.replace(/_/g, " ")
          : JSON.stringify(value);
    return `${field.label}: ${display}`;
  });
  const prefix = isConstraint(element)
    ? `Layout constraint ${schema.label}`
    : `${schema.label} (${schema.elementId})`;
  return `${prefix}${values.length ? ` — ${values.join("; ")}` : ""}.${element.catalogElementId.startsWith("actions.") ? " Static visual design only; no interactive functionality is implied." : ""}`;
}
export function contextualPromptLines(doc: SpecDocument): [string, string[]][] {
  return doc.elements
    .filter((element) => element.visible && element.catalogElementId)
    .flatMap((element) => {
      const description = contextualDescription(element, doc);
      return description
        ? [[`contextual:${element.id}`, [description]] as [string, string[]]]
        : [];
    });
}
export function projectContextualExport(doc: SpecDocument) {
  const projected = structuredClone(doc);
  projected.elements.forEach((element) => {
    if (element.contextualProperties)
      element.contextualProperties = projectContextualProperties(element, doc);
  });
  // Semantic constraint layers stay serializable/selectable for JSON reimport.
  // Static rendering and both prompt compilers exclude their proxy artwork.
  const usedAssets = new Set(
    projected.elements
      .flatMap((element) =>
        visibleFields(element)
          .filter((field) => field.control === "asset_reference")
          .map((field) => readProperty(element, field.key)),
      )
      .filter((value): value is string => typeof value === "string"),
  );
  if (projected.referenceAssets)
    projected.referenceAssets = Object.fromEntries(
      Object.entries(projected.referenceAssets).filter(([id]) =>
        usedAssets.has(id),
      ),
    );
  return projected;
}
