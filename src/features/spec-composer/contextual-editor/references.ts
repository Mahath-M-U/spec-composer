import type { SpecDocument, SpecElement } from "../types";
import { inferCatalogId } from "./catalog";
import { getElementFields, getElementSchema, type Field } from "./schema";

export function referenceTargets(
  doc: SpecDocument,
  element: SpecElement,
  field: Field,
) {
  const roles =
    field.allowedElementTypes ??
    getElementSchema(inferCatalogId(element))?.linkedElementRoles;
  return doc.elements.filter(
    (target) =>
      target.id !== element.id &&
      (!roles?.length ||
        field.key === "relation.targets" ||
        roles.includes(inferCatalogId(target) ?? "")),
  );
}
export function validReference(
  doc: SpecDocument,
  element: SpecElement,
  field: Field,
  value: unknown,
) {
  if (value === null || value === undefined || value === "") return true;
  const allowed = new Set(
    referenceTargets(doc, element, field).map((target) => target.id),
  );
  return field.control === "element_references"
    ? Array.isArray(value) &&
        value.every((id) => typeof id === "string" && allowed.has(id))
    : typeof value === "string" && allowed.has(value);
}
export function remapReferences(
  element: SpecElement,
  ids: Map<string, string>,
  deleted = new Set<string>(),
) {
  const fields = getElementFields(inferCatalogId(element) ?? "");
  for (const field of fields) {
    if (!["element_reference", "element_references"].includes(field.control))
      continue;
    const value = element.contextualProperties?.[field.key];
    if (typeof value === "string") {
      if (deleted.has(value)) delete element.contextualProperties![field.key];
      else element.contextualProperties![field.key] = ids.get(value) ?? value;
    } else if (Array.isArray(value))
      element.contextualProperties![field.key] = value
        .filter((id) => typeof id === "string" && !deleted.has(id))
        .map((id) => ids.get(String(id)) ?? id);
  }
}
