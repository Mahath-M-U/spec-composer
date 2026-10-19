import { describe, expect, it } from "vitest";
import {
  ASSET_PRESETS,
  assetPresetPatch,
  findAssetPreset,
  type AssetPresetId,
} from "./asset-presets";
import {
  findDescriptionTemplate,
  resolveElementDetail,
} from "./description-templates";
import { createDocument } from "./templates";
import { createElement } from "./registry";
import { SHAPE_TYPES, effectiveRadius, shapePatch } from "./shape-workflow";
import { validateWritableDocument } from "./types";
import { hasPlaceholderArt } from "./illustrations";

describe("semantic scene starters", () => {
  it.each(ASSET_PRESETS)(
    "provides a valid self-contained $id starter without catalog placement or identity",
    (preset) => {
      const patch = assetPresetPatch(preset.id)!;
      expect(patch).toMatchObject({
        width: preset.width,
        height: preset.height,
        semanticRole: preset.role,
        descriptionTemplate: { id: preset.templateId },
        placeholderArt: preset.art,
      });
      expect(hasPlaceholderArt(patch.placeholderArt)).toBe(true);
      for (const key of ["id", "slot", "assetId", "zIndex", "groupId"])
        expect(patch).not.toHaveProperty(key);
      expect(findDescriptionTemplate(preset.templateId)?.role).toBe(
        preset.role,
      );
      expect(resolveElementDetail(patch).length).toBeGreaterThan(100);
      const doc = createDocument();
      doc.elements = [{ ...createElement("shape", doc.format, 0), ...patch }];
      expect(() => validateWritableDocument(doc)).not.toThrow();
    },
  );

  it("gives every preset a unique art key", () => {
    const keys = ASSET_PRESETS.map((preset) => preset.art);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses preset field overrides only for its default template, and alternate-template role/defaults otherwise", () => {
    expect(resolveElementDetail(assetPresetPatch("pedestal")!)).toContain(
      "low product display pedestal",
    );
    expect(resolveElementDetail(assetPresetPatch("label")!)).toContain(
      "compact label or callout panel",
    );
    const alternate = assetPresetPatch("model", "product-pedestal")!;
    expect(alternate.semanticRole).toBe("product");
    expect(alternate.descriptionTemplate?.id).toBe("product-pedestal");
    expect(resolveElementDetail(alternate)).toContain("a skincare jar");
    expect(alternate.width).toBe(240);
    expect(alternate.height).toBe(360);
    expect(findAssetPreset("future")).toBeUndefined();
    expect(assetPresetPatch("future" as AssetPresetId)).toBeUndefined();
  });
});

describe("additional editable primitives", () => {
  it.each(SHAPE_TYPES)("persists a valid %s primitive", (type) => {
    const doc = createDocument();
    const patch = shapePatch(type);
    doc.elements = [{ ...createElement("shape", doc.format, 0), ...patch }];
    expect(() => validateWritableDocument(doc)).not.toThrow();
    if (["ellipse", "triangle", "diamond", "line"].includes(type))
      expect(
        effectiveRadius({
          ...doc.elements[0]!,
          style: { ...doc.elements[0]!.style, borderRadius: 100 },
        }),
      ).toBe(0);
    if (type === "ellipse")
      expect(patch).toMatchObject({ width: 240, height: 160 });
    if (type === "triangle" || type === "diamond")
      expect(patch).toMatchObject({ width: 200, height: 200 });
    if (type === "line")
      expect(patch).toMatchObject({ width: 240, height: 4, name: "Divider" });
  });
});
