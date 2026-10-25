import configuration from "./config/contextual-toolbar.json";

export const CONTROL_TYPES = [
  "select",
  "text",
  "textarea",
  "number",
  "slider",
  "toggle",
  "color",
  "color_or_text",
  "multiselect",
  "tags",
  "color_list",
  "asset_reference",
  "element_reference",
  "element_references",
  "data_table",
  "repeatable",
  "gradient_stops",
  "field_keys",
] as const;
export type ControlType = (typeof CONTROL_TYPES)[number];
export interface Condition {
  field: string;
  operator: string;
  value?: unknown;
  values?: unknown[];
}
export interface Option {
  value: string;
  label: string;
}
export interface Field {
  key: string;
  label: string;
  control: ControlType;
  options?: (string | Option)[] | { itemFields: string[] };
  min?: number;
  max?: number;
  unit?: string;
  visibleWhen?: Condition;
  deprecated?: boolean;
  renderInNewEditor?: boolean;
  replacedBy?: string;
  group: string;
  facetId: string;
  allowedElementTypes?: string[];
}
export interface ElementSchema {
  creationDefaults?: Record<string, string | number | boolean | string[]>;
  preview?: { renderer: string; localFields: string[]; generationStyles?: string[] };
  elementId: string;
  label: string;
  groupId: string;
  facetRefs: string[];
  elementFields: Omit<Field, "group" | "facetId">[];
  facetVisibilityWhen?: Record<string, Condition>;
  linkedElementRoles?: string[];
  contextualRules?: {
    when: Condition;
    reveal?: string[];
    filterOptions?: unknown;
  }[];
  toolbar: {
    quickFields: string[];
    quickControlCandidates?: {
      fieldKey: string;
      priority: number;
      visibleWhen?: Condition;
    }[];
    popoverGroups?: Record<string, string[]>;
    defaultComposedSlots?: {
      slot: string;
      field?: string;
      adaptiveFieldPaths?: string[];
      popover?: string;
    }[];
  };
  export: { kind: string };
}
export interface Purpose {
  id: string;
  label: string;
  requiredElementIds: string[];
  recommendedElementIds: string[];
}
interface Configuration {
  groups: {
    id: string;
    label: string;
    description: string;
    elementIds: string[];
  }[];
  facetLibrary: Record<
    string,
    { id: string; label: string; fields: Omit<Field, "group" | "facetId">[] }
  >;
  elementSchemas: Record<string, ElementSchema>;
  creativePurposes: { id: string; label: string; items: Purpose[] }[];
  assetLibrary: { alwaysBrowsableElementIds: string[] };
}
// The configuration is data only. Human-readable guidance is never executed.
export const config = configuration as unknown as Configuration;
export function getElementSchema(id: string | undefined) {
  return id ? config.elementSchemas[id] : undefined;
}
export function getCreativePurposes() {
  return config.creativePurposes;
}
export function getLibraryGroups() {
  return config.groups;
}
const fieldCache = new Map<string, Field[]>();
export function getElementFields(id: string): Field[] {
  const cached = fieldCache.get(id);
  if (cached) return cached;
  const schema = getElementSchema(id);
  if (!schema) return [];
  const fields = schema.facetRefs.flatMap((facetId) => {
    const facet = config.facetLibrary[facetId];
    return (facet?.fields ?? []).map((field) => ({
      ...field,
      group: facet!.label.replace(/Â·/g, "·"),
      facetId,
    }));
  });
  fields.push(
    ...schema.elementFields.map((field) => ({
      ...field,
      group: schema.label,
      facetId: "item",
    })),
  );
  const result = [
    ...new Map(
      fields
        .filter(
          (field) => !field.deprecated && field.renderInNewEditor !== false,
        )
        .map((field) => [field.key, field]),
    ).values(),
  ];
  fieldCache.set(id, result);
  return result;
}
export function fieldOptions(field: Field): Option[] {
  return Array.isArray(field.options)
    ? field.options.map((option) =>
        typeof option === "string"
          ? { value: option, label: option.replace(/_/g, " ") }
          : option,
      )
    : [];
}
