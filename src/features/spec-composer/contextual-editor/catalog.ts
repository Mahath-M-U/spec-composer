import {
  config,
  getCreativePurposes,
  getElementSchema,
  getLibraryGroups,
} from "./schema";
import type { SpecElement } from "../types";

export {
  getCreativePurposes,
  getElementSchema,
  getLibraryGroups,
} from "./schema";
export const catalogIds = Object.keys(config.elementSchemas);
export function findPurpose(id: string | undefined) {
  return getCreativePurposes()
    .flatMap((group) => group.items)
    .find((purpose) => purpose.id === id);
}
export function catalogLabel(id: string) {
  return id === "subjects.person"
    ? "Model"
    : (getElementSchema(id)?.label ?? id);
}
export function inferCatalogId(element: SpecElement): string | undefined {
  if (getElementSchema(element.catalogElementId))
    return element.catalogElementId;
  if (element.semanticRole)
    return {
      subject: "subjects.person",
      product: "subjects.product",
      background: "subjects.background",
      text_area: "structure.content_hierarchy",
      decorative: "decoration.shape",
    }[element.semanticRole];
  return {
    title: "information.headline",
    subheading: "information.title",
    body: "information.body",
    eyebrow: "information.label",
    offer: "information.offer_value",
    price: "information.price",
    badge: "decoration.badge",
    cta: "actions.cta",
    heroImage: "subjects.image",
    productImage: "subjects.product",
    humanModelImage: "subjects.person",
    supportingImage: "subjects.image",
    logo: "branding.logo",
    brandMark: "branding.brand_mark",
    shape: "decoration.shape",
    divider: "decoration.divider",
  }[element.kind];
}
export function isConstraint(element: SpecElement) {
  return (
    getElementSchema(element.catalogElementId)?.export.kind ===
    "layout_constraint"
  );
}
export function libraryEntries(
  purposeId: string | undefined,
  view: "recommended" | "all",
  search: string,
) {
  const purpose = findPurpose(purposeId);
  const required = new Set(purpose?.requiredElementIds);
  const recommended = new Set(purpose?.recommendedElementIds);
  const general = new Set(config.assetLibrary.alwaysBrowsableElementIds);
  const query = search.trim().toLowerCase();
  const rank = (id: string) =>
    required.has(id) ? 0 : recommended.has(id) ? 1 : 2;
  return getLibraryGroups().map((group) => ({
    ...group,
    entries: group.elementIds
      .filter((id) => {
        const aliases =
          id === "information.label"
            ? "eyebrow"
            : id === "subjects.person"
              ? "person human"
              : id === "information.title"
                ? "subheading"
                : id === "information.body"
                  ? "caption text"
                  : "";
        if (query)
          return `${id} ${catalogLabel(id)} ${group.label} ${aliases}`
            .toLowerCase()
            .includes(query);
        return (
          view === "all" ||
          required.has(id) ||
          recommended.has(id) ||
          general.has(id)
        );
      })
      .sort((a, b) => rank(a) - rank(b))
      .map((id) => ({
        id,
        label: catalogLabel(id),
        status: required.has(id)
          ? "Required"
          : recommended.has(id)
            ? "Suggested"
            : undefined,
      })),
  }));
}
export const CATALOG_DRAG_TYPE = "application/x-spec-contextual-element";
export function parseCatalogDrag(
  value: string,
): { elementId: string; preset?: string } | undefined {
  try {
    const payload: unknown = JSON.parse(value);
    if (
      !payload ||
      typeof payload !== "object" ||
      !("elementId" in payload) ||
      typeof payload.elementId !== "string" ||
      !getElementSchema(payload.elementId)
    )
      return undefined;
    if ("preset" in payload && typeof payload.preset !== "string")
      return undefined;
    return {
      elementId: payload.elementId,
      ...("preset" in payload ? { preset: payload.preset as string } : {}),
    };
  } catch {
    return undefined;
  }
}
