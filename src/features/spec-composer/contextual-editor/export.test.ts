import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createElement as createSpecElement } from "../registry";
import { createDocument } from "../templates";
import { parseSpecDocument } from "../types";
import {
  buildJsonExport,
  compileRegionPrompt,
  compileVisualPrompt,
} from "../compiler";
import { compileDesignSkill } from "../design-md";
import { StaticDocument } from "../static-render";
import { contextualCreation } from "./creation";
import { projectContextualProperties } from "./export";

function fixture() {
  const doc = createDocument();
  doc.elements = [];
  return doc;
}
describe("contextual export projection", () => {
  it("uses the same explicit applicable properties in visual, design and region prompts", () => {
    const doc = fixture();
    const el = {
      ...createSpecElement("humanModelImage", doc.format, 0),
      catalogElementId: "subjects.person",
      src: "data:image/png;base64,supplied",
      contextualProperties: {
        "model.pose_action.action": "sitting",
        "model.pose_action.standingVariation": "turning_around",
        "model.pose_action.turningPhase": "mid_turn",
        "model.pose_action.sittingVariation": "upright",
        "model.outfit.top": "crop_top",
        "model.identity.modelPreset": "girl",
        "model.pose_action.interactingWith": "deleted",
        "quality.reference": "missing",
        "custom.user": "saved",
      },
    };
    doc.elements = [el];
    const properties = projectContextualProperties(el, doc);
    expect(properties["model.pose_action.action"]).toBe("sitting");
    expect(properties["model.pose_action.standingVariation"]).toBeUndefined();
    expect(properties["model.pose_action.turningPhase"]).toBeUndefined();
    expect(properties["model.outfit.top"]).toBeUndefined();
    expect(properties["model.pose_action.interactingWith"]).toBeUndefined();
    for (const prompt of [
      compileVisualPrompt(doc),
      compileDesignSkill(doc),
      compileRegionPrompt(doc, el.id),
    ]) {
      expect(prompt).toContain("sitting");
      expect(prompt).not.toContain("turning around");
      expect(prompt).not.toContain("crop top");
      expect(prompt).not.toContain("deleted");
      expect(prompt).not.toContain("base64");
    }
    const output = buildJsonExport(doc);
    expect(output.spec.elements[0]!.src).toBe(el.src);
    expect(output.spec.elements[0]!.contextualProperties).toEqual(properties);
    expect(el.contextualProperties["custom.user"]).toBe("saved");
  });
  it("keeps semantic structure layers roundtrippable without exporting their rectangle proxy", () => {
    const doc = fixture(),
      creation = contextualCreation("structure.split_comparison")!;
    const el = {
      ...createSpecElement(creation.kind, doc.format, 0),
      ...creation.patch,
      id: "layout-guide",
      groupId: "layout",
    };
    doc.groups = [{ id: "layout", name: "Layout" }];
    doc.elements = [el];
    const visual = compileVisualPrompt(doc),
      design = compileDesignSkill(doc);
    expect(visual).toContain("Layout constraint");
    expect(design).toContain("Layout constraint");
    expect(visual).not.toContain("rectangle");
    expect(design).not.toContain("rectangle");
    expect(
      renderToStaticMarkup(createElement(StaticDocument, { doc })),
    ).not.toContain("layout-guide");
    const restored = parseSpecDocument(
      JSON.parse(JSON.stringify(buildJsonExport(doc).spec)),
    )!;
    expect(restored.elements[0]!.catalogElementId).toBe(
      "structure.split_comparison",
    );
    expect(restored.elements[0]!.groupId).toBe("layout");
    expect(restored.groups).toEqual(doc.groups);
  });
  it("preserves real supplied asset references and marks actions as visual", () => {
    const doc = fixture();
    doc.referenceAssets = {
      supplied: {
        source: "data:image/png;base64,pixels",
        name: "reference.png",
        type: "image/png",
      },
    };
    const creation = contextualCreation("actions.cta")!;
    doc.elements = [
      {
        ...createSpecElement(creation.kind, doc.format, 0),
        ...creation.patch,
        content: "Visit",
        contextualProperties: { "quality.reference": "missing" },
      },
    ];
    expect(compileVisualPrompt(doc)).toContain("Static visual design only");
    expect(buildJsonExport(doc).spec.referenceAssets).toEqual({});
  });
});
