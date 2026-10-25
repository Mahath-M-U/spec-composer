import type { ElementStyle, ShapeRole, SpecElement } from "./types";
import {
  findDescriptionTemplate,
  renderDescriptionTemplate,
  type DescriptionTemplateId,
} from "./description-templates";
import { shapePatch, type ShapeType } from "./shape-workflow";
import type { MotifKey } from "./motif-keys";

export type AssetPresetId =
  "model" | "product" | "pedestal" | "backdrop" | "copy-space" | "label";
export type AssetPresetDefinition = {
  id: AssetPresetId;
  label: string;
  description: string;
  shapeType: ShapeType;
  role: ShapeRole;
  width: number;
  height: number;
  templateId: DescriptionTemplateId;
  templateValues: Readonly<Record<string, string>>;
  style: Readonly<Partial<ElementStyle>>;
  /** Inline art shown on the canvas and the Assets panel tile for this preset. */
  art: MotifKey;
};

export const ASSET_PRESETS: readonly AssetPresetDefinition[] = [
  {
    id: "model",
    label: "Model / person",
    description: "Reserve a portrait region for an adult model.",
    shapeType: "rounded rectangle",
    role: "subject",
    width: 240,
    height: 360,
    templateId: "person-model",
    templateValues: {},
    style: { background: "#DDE7F1" },
    art: "person-standing",
  },
  {
    id: "product",
    label: "Product",
    description: "A product packshot with editable material and view.",
    shapeType: "rounded rectangle",
    role: "product",
    width: 240,
    height: 280,
    templateId: "product-packshot",
    templateValues: {},
    style: { background: "#E8DED0" },
    art: "product-bottle",
  },
  {
    id: "pedestal",
    label: "Pedestal / display",
    description: "A low display plinth for a product or object.",
    shapeType: "rounded rectangle",
    role: "decorative",
    width: 320,
    height: 80,
    templateId: "decorative-element",
    templateValues: {
      element: "a low product display pedestal",
      material: "matte stone",
      color: "warm ivory",
      treatment: "a clean, solid plinth with a level top",
    },
    style: { background: "#D2C6B5" },
    art: "scene-pedestal",
  },
  {
    id: "backdrop",
    label: "Backdrop",
    description: "A quiet textured region behind the composition.",
    shapeType: "rectangle",
    role: "background",
    width: 480,
    height: 320,
    templateId: "texture-background",
    templateValues: {},
    style: { background: "#ECE4D9" },
    art: "scene-backdrop",
  },
  {
    id: "copy-space",
    label: "Copy space",
    description: "Protect negative space for later copy.",
    shapeType: "rectangle",
    role: "text_area",
    width: 320,
    height: 180,
    templateId: "reserved-text",
    templateValues: {},
    style: { background: "#EEF0EC" },
    art: "scene-copy-space",
  },
  {
    id: "label",
    label: "Label / callout",
    description: "A compact decorative region for a callout.",
    shapeType: "rounded rectangle",
    role: "decorative",
    width: 240,
    height: 80,
    templateId: "decorative-element",
    templateValues: {
      element: "a compact label or callout panel",
      material: "smooth paper",
      color: "soft warm white",
      treatment: "a simple rounded silhouette with clear margins",
    },
    style: { background: "#F0DFD4" },
    art: "scene-callout",
  },
];

export const findAssetPreset = (id: string) =>
  ASSET_PRESETS.find((preset) => preset.id === id);
export function assetPresetPatch(
  id: AssetPresetId,
  templateId?: DescriptionTemplateId,
): Partial<SpecElement> | undefined {
  const preset = findAssetPreset(id);
  if (!preset) return undefined;
  const template = findDescriptionTemplate(templateId ?? preset.templateId);
  if (!template) return undefined;
  const values = Object.fromEntries(
    template.fields.map((field) => [
      field.id,
      template.id === preset.templateId
        ? (preset.templateValues[field.id] ?? field.defaultValue)
        : field.defaultValue,
    ]),
  );
  const patch = shapePatch(preset.shapeType);
  return {
    ...patch,
    name: preset.label,
    width: preset.width,
    height: preset.height,
    semanticRole: template.role,
    style: { ...patch.style, ...preset.style },
    descriptionTemplate: { id: template.id, values },
    detail: renderDescriptionTemplate(template.id, values) ?? "",
    placeholderArt: preset.art,
  };
}
