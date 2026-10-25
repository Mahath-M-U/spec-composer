import {
  descriptionValuesSchema,
  type ShapeRole,
  type SpecDocument,
  type SpecElement,
} from "./types";

export type DescriptionTemplateId =
  | "person-model"
  | "product-packshot"
  | "product-pedestal"
  | "texture-background"
  | "reserved-text"
  | "decorative-element";
export type DescriptionTemplateDefinition = {
  id: DescriptionTemplateId;
  label: string;
  role: ShapeRole;
  fields: readonly {
    id: string;
    label: string;
    defaultValue: string;
    placeholder?: string;
  }[];
  segments: readonly (string | { field: string })[];
};

export const DESCRIPTION_TEMPLATES: readonly DescriptionTemplateDefinition[] = [
  {
    id: "person-model",
    label: "Person / model",
    role: "subject",
    fields: [
      { id: "person", label: "Person", defaultValue: "an adult model" },
      {
        id: "wardrobe",
        label: "Wardrobe",
        defaultValue: "simple tailored clothing",
      },
      { id: "pose", label: "Pose", defaultValue: "a relaxed standing pose" },
      {
        id: "expression",
        label: "Expression",
        defaultValue: "a calm, natural expression",
      },
    ],
    segments: [
      "Depict ",
      { field: "person" },
      " wearing ",
      { field: "wardrobe" },
      ", in ",
      { field: "pose" },
      ", with ",
      { field: "expression" },
      ". Preserve coherent adult anatomy, natural hands and believable wardrobe construction. Keep the subject within this region.",
    ],
  },
  {
    id: "product-packshot",
    label: "Product packshot",
    role: "product",
    fields: [
      {
        id: "product",
        label: "Product",
        defaultValue: "a premium reusable bottle",
      },
      {
        id: "material",
        label: "Material",
        defaultValue: "brushed stainless steel",
      },
      { id: "color", label: "Color", defaultValue: "warm ivory" },
      { id: "view", label: "View", defaultValue: "a front three-quarter view" },
    ],
    segments: [
      "Show ",
      { field: "product" },
      " made of ",
      { field: "material" },
      " in ",
      { field: "color" },
      ", presented in ",
      { field: "view" },
      ". Preserve faithful product proportions, material character and recognizable construction. Do not invent branding or packaging text.",
    ],
  },
  {
    id: "product-pedestal",
    label: "Product on pedestal",
    role: "product",
    fields: [
      { id: "product", label: "Product", defaultValue: "a skincare jar" },
      { id: "material", label: "Material", defaultValue: "frosted glass" },
      {
        id: "pedestal",
        label: "Pedestal",
        defaultValue: "a low matte stone display plinth",
      },
      { id: "view", label: "View", defaultValue: "a front three-quarter view" },
    ],
    segments: [
      "Present ",
      { field: "product" },
      " in ",
      { field: "material" },
      " on ",
      { field: "pedestal" },
      ", shown in ",
      { field: "view" },
      ". Maintain faithful product proportions, a convincing contact surface and distinct material textures. Keep the arrangement inside this region; do not invent labels or text.",
    ],
  },
  {
    id: "texture-background",
    label: "Textured background",
    role: "background",
    fields: [
      {
        id: "surface",
        label: "Surface",
        defaultValue: "a continuous backdrop",
      },
      { id: "material", label: "Material", defaultValue: "fine plaster" },
      { id: "color", label: "Color", defaultValue: "warm neutral beige" },
      { id: "finish", label: "Finish", defaultValue: "a subtle matte texture" },
    ],
    segments: [
      "Fill this background region with ",
      { field: "surface" },
      " made of ",
      { field: "material" },
      " in ",
      { field: "color" },
      ", with ",
      { field: "finish" },
      ". Keep the surface visually continuous and restrained so foreground subjects remain legible; introduce no objects, lettering or logos.",
    ],
  },
  {
    id: "reserved-text",
    label: "Reserved copy space",
    role: "text_area",
    fields: [
      { id: "purpose", label: "Purpose", defaultValue: "a short headline" },
      {
        id: "placement",
        label: "Placement",
        defaultValue: "the center of this region",
      },
      { id: "tone", label: "Tone", defaultValue: "clean and understated" },
    ],
    segments: [
      "Reserve clear negative space for ",
      { field: "purpose" },
      " at ",
      { field: "placement" },
      ". Keep this area ",
      { field: "tone" },
      ", with comfortable breathing room and strong readability. Do not generate placeholder copy, invented words or decorative lettering.",
    ],
  },
  {
    id: "decorative-element",
    label: "Decorative element",
    role: "decorative",
    fields: [
      {
        id: "element",
        label: "Element",
        defaultValue: "a simple sculptural accent",
      },
      { id: "material", label: "Material", defaultValue: "matte ceramic" },
      { id: "color", label: "Color", defaultValue: "soft warm white" },
      {
        id: "treatment",
        label: "Treatment",
        defaultValue: "a restrained, minimal treatment",
      },
    ],
    segments: [
      "Create ",
      { field: "element" },
      " in ",
      { field: "material" },
      ", colored ",
      { field: "color" },
      ", with ",
      { field: "treatment" },
      ". Respect this region's silhouette and scale. Keep it subordinate to the subject and copy, without invented text or branding.",
    ],
  },
];

export const findDescriptionTemplate = (id: string) =>
  DESCRIPTION_TEMPLATES.find((template) => template.id === id);

export function renderDescriptionTemplate(
  id: string,
  values: Readonly<Record<string, string>>,
): string | undefined {
  const template = findDescriptionTemplate(id);
  if (!template || !descriptionValuesSchema.safeParse(values).success)
    return undefined;
  const fields = new Map(
    template.fields.map((field) => [
      field.id,
      values[field.id]?.trim() || field.defaultValue,
    ]),
  );
  return template.segments
    .map((segment) =>
      typeof segment === "string" ? segment : (fields.get(segment.field) ?? ""),
    )
    .join("");
}

export function resolveElementDetail(
  el: Pick<SpecElement, "detail" | "descriptionTemplate">,
): string {
  const selection = el.descriptionTemplate;
  return (
    (selection && renderDescriptionTemplate(selection.id, selection.values)) ??
    el.detail ??
    ""
  );
}

function saveTemplateDraft(target: SpecElement, source: SpecElement) {
  const selection = source.descriptionTemplate;
  if (!selection) return true;
  const drafts = target.descriptionDrafts?.templates ?? {};
  if (
    !Object.prototype.hasOwnProperty.call(drafts, selection.id) &&
    Object.keys(drafts).length >= 10
  )
    return false;
  target.descriptionDrafts = {
    ...target.descriptionDrafts,
    templates: {
      ...target.descriptionDrafts?.templates,
      [selection.id]: {
        values: { ...selection.values },
        rendered: resolveElementDetail(source),
      },
    },
  };
  return true;
}

function retainDescription(target: SpecElement, original: SpecElement) {
  for (const key of [
    "detail",
    "descriptionTemplate",
    "descriptionDrafts",
    "semanticRole",
  ] as const) {
    if (key in original)
      Object.assign(target, { [key]: structuredClone(original[key]) });
    else delete target[key];
  }
}

/** Synchronizes cached plain detail and keeps previous modes recoverable in the same transaction. */
export function synchronizeElementDescriptions(
  previous: SpecDocument,
  next: SpecDocument,
): void {
  const originals = new Map(previous.elements.map((el) => [el.id, el]));
  for (const el of next.elements) {
    if (el.kind !== "shape") continue;
    const original = originals.get(el.id);
    const changedSelection =
      JSON.stringify(original?.descriptionTemplate) !==
      JSON.stringify(el.descriptionTemplate);
    const changedTemplate =
      original?.descriptionTemplate?.id !== el.descriptionTemplate?.id;
    if (changedTemplate && original?.descriptionTemplate) {
      if (!saveTemplateDraft(el, original)) {
        retainDescription(el, original);
        continue;
      }
    } else if (changedTemplate && original && el.descriptionTemplate) {
      const isDetachedRendering =
        original.descriptionDrafts?.custom !== undefined &&
        Object.values(original.descriptionDrafts.templates ?? {}).some(
          (draft) => draft.rendered === original.detail,
        );
      if (!isDetachedRendering)
        el.descriptionDrafts = {
          ...el.descriptionDrafts,
          custom: original.detail ?? "",
        };
    }
    const selection = el.descriptionTemplate;
    const template = selection && findDescriptionTemplate(selection.id);
    if (!selection || !template) continue;
    const roleChanged =
      original &&
      original.semanticRole !== el.semanticRole &&
      el.semanticRole !== template.role;
    const customChanged =
      original?.descriptionTemplate &&
      !changedSelection &&
      original.detail !== el.detail;
    if (roleChanged || customChanged) {
      if (!saveTemplateDraft(el, original ?? el)) {
        if (original) retainDescription(el, original);
        continue;
      }
      if (!customChanged) el.detail = resolveElementDetail(el);
      delete el.descriptionTemplate;
    } else {
      el.detail =
        renderDescriptionTemplate(selection.id, selection.values) ?? el.detail;
    }
  }
}
