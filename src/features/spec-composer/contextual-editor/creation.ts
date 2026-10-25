import type { ElementKind, SpecElement } from "../types";
import { getElementSchema } from "./schema";
import { shapePatch, isShapeType } from "../shape-workflow";
import { findTextPreset } from "../assets-panel/text-presets";
import { assetPresetPatch, findAssetPreset } from "../asset-presets";

/** Explicit semantic-to-rendering bridge. Catalog identities never become new kinds. */
export const RENDER_KINDS: Record<string, ElementKind> = {
  "subjects.image": "supportingImage",
  "subjects.product": "productImage",
  "subjects.person": "humanModelImage",
  "subjects.illustration": "supportingImage",
  "subjects.screenshot": "supportingImage",
  "subjects.artwork": "supportingImage",
  "subjects.mockup": "supportingImage",
  "subjects.environment": "heroImage",
  "subjects.character": "supportingImage",
  "subjects.product_3d": "productImage",
  "subjects.background": "heroImage",
  "information.headline": "title",
  "information.title": "subheading",
  "information.body": "body",
  "information.label": "eyebrow",
  "information.date_time": "body",
  "information.location": "body",
  "information.status": "badge",
  "information.offer_value": "offer",
  "information.benefit": "subheading",
  "information.quote": "body",
  "information.attribution": "body",
  "information.steps": "body",
  "information.list": "body",
  "information.options": "body",
  "information.question": "subheading",
  "information.answer": "body",
  "information.price": "price",
  "information.disclaimer": "body",
  "dataProof.metric": "body",
  "dataProof.metric_value": "body",
  "dataProof.metric_label": "body",
  "dataProof.chart": "shape",
  "dataProof.review": "body",
  "dataProof.rating": "body",
  "dataProof.testimonial_quote": "body",
  "dataProof.customer_attribution": "body",
  "dataProof.outcome": "body",
  "dataProof.award": "body",
  "dataProof.comparison_data": "shape",
  "dataProof.citation": "body",
  "actions.cta": "cta",
  "actions.participation_prompt": "body",
  "actions.link": "body",
  "actions.qr_code": "supportingImage",
  "branding.logo": "logo",
  "branding.brand_mark": "brandMark",
  "branding.brand_name": "body",
  "branding.partner_identity": "logo",
  "branding.creator_handle": "body",
  "branding.watermark": "logo",
  "structure.split_comparison": "shape",
  "structure.before_after": "shape",
  "structure.step_sequence": "shape",
  "structure.list_hierarchy": "shape",
  "structure.content_hierarchy": "shape",
  "structure.checklist": "shape",
  "structure.data_layout": "shape",
  "structure.choice_layout": "shape",
  "structure.focal_composition": "shape",
  "structure.scene_composition": "shape",
  "structure.asset_placement": "shape",
  "structure.label_placement": "shape",
  "structure.camera_angle": "shape",
  "structure.lighting": "shape",
  "structure.stage": "shape",
  "structure.character_pose": "shape",
  "structure.canvas_coverage": "shape",
  "decoration.badge": "badge",
  "decoration.shape": "shape",
  "decoration.shadow": "shape",
  "decoration.accent": "shape",
  "decoration.gradient": "shape",
  "decoration.divider": "divider",
  "decoration.overlay": "shape",
  "decoration.icon": "supportingImage",
  "decoration.arrow": "shape",
  "decoration.texture_overlay": "supportingImage",
};
export function contextualCreation(
  id: string,
  preset?: string,
): { kind: ElementKind; patch: Partial<SpecElement> } | undefined {
  const schema = getElementSchema(id),
    kind = RENDER_KINDS[id];
  if (!schema || !kind) return undefined;
  const patch: Partial<SpecElement> = {
    catalogElementId: id,
    name: id === "subjects.person" ? "Model" : schema.label,
    content: "",
    aiDescription: "",
    contextualProperties: {},
  };
  if (id === "subjects.person")
    patch.contextualProperties = { ...schema.creationDefaults };
  if (schema.export.kind === "layout_constraint")
    patch.style = { background: "transparent", borderWidth: 0, opacity: 1 };
  if (preset) {
    if (
      isShapeType(preset) &&
      (id === "decoration.shape" || id === "decoration.divider")
    )
      Object.assign(patch, shapePatch(preset));
    else if (preset.startsWith("text:")) {
      const text = findTextPreset(preset.slice(5));
      if (!text || text.kind !== kind) return undefined;
      Object.assign(patch, text.patch);
      if (text.id === "eyebrow")
        patch.contextualProperties = { "type.case": "uppercase" };
    } else if (preset.startsWith("scene:")) {
      const scene = findAssetPreset(preset.slice(6));
      if (!scene) return undefined;
      return {
        kind: "shape",
        patch: { ...assetPresetPatch(scene.id), catalogElementId: id },
      };
    } else return undefined;
  }
  return { kind, patch };
}
