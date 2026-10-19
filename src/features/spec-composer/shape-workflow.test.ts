import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { resizeBox, transformBoxes } from "./canvas-geometry";
import { compileVisualPrompt, dominantVisual } from "./compiler";
import { compileDesignSkill } from "./design-md";
import { createElement as createSpecElement } from "./registry";
import { ElementContent } from "./static-render";
import { resizeDocument } from "./resize";
import { createDocument } from "./templates";
import {
  SHAPE_ROLES,
  parseSpecDocument,
  validateWritableDocument,
} from "./types";
import { centeredCircle, effectiveRadius, shapePatch } from "./shape-workflow";

const shape = () => ({
  ...createSpecElement("shape", createDocument().format, 0),
  ...shapePatch("rounded rectangle"),
  id: "shape-test",
});

describe("shape data and output", () => {
  it("roundtrips old projects without adding roles/settings and validates new optional metadata", () => {
    const old = createDocument();
    expect(parseSpecDocument(old)?.generationSettings).toBeUndefined();
    const doc = {
      ...old,
      elements: [shape()],
      generationSettings: { lightIntensity: 0 },
      savedCustomText: { visual: "old writing" },
    };
    expect(validateWritableDocument(doc)).toMatchObject(doc);
    expect(
      parseSpecDocument({
        ...doc,
        elements: [{ ...shape(), semanticRole: "catalog-subject" }],
      }),
    ).toBeUndefined();
    for (const lightIntensity of [-1, 101, Infinity, NaN])
      expect(
        parseSpecDocument({ ...doc, generationSettings: { lightIntensity } }),
      ).toBeUndefined();
  });

  it.each(SHAPE_ROLES)(
    "compiles role %s in prompt and DESIGN.md",
    (semanticRole) => {
      const el = {
        ...shape(),
        semanticRole,
        detail: "A carefully composed region",
        rotation: 27,
        style: { ...shape().style, borderRadius: 999 },
      };
      const doc = { ...createDocument(), elements: [el] };
      for (const output of [
        compileVisualPrompt(doc),
        compileDesignSkill(doc),
      ]) {
        expect(output).toContain("A carefully composed region");
        expect(output).toContain("rotation 27°");
        expect(output).toContain("corner radius 80px");
        expect(output).toContain("omit");
        expect(output).toContain(
          semanticRole === "text_area"
            ? "reserved copy space"
            : semanticRole === "subject" || semanticRole === "product"
              ? `${semanticRole} content placeholder`
              : semanticRole === "background"
                ? "background region"
                : "decorative primitive",
        );
      }
      if (semanticRole === "subject" || semanticRole === "product") {
        expect(dominantVisual(doc)?.id).toBe(el.id);
        expect(compileDesignSkill(doc)).not.toContain("Type-only composition");
      }
    },
  );

  it("preserves distinct roles and descriptions in mixed shape components", () => {
    const product = {
      ...shape(),
      semanticRole: "product" as const,
      detail: "Glass bottle",
    };
    const text = {
      ...shape(),
      id: "copy-space",
      semanticRole: "text_area" as const,
      detail: "Headline goes here",
    };
    const output = compileDesignSkill({
      ...createDocument(),
      elements: [product, text],
    });
    expect(output).toContain("Glass bottle");
    expect(output).toContain("Headline goes here");
    expect(output).not.toContain("**Role:** Decorative or container shape");
  });
});

describe("circle and radius geometry", () => {
  it("keeps full-bleed semantic circles circular when the document aspect ratio changes", () => {
    const doc = createDocument();
    doc.elements = [
      {
        ...shape(),
        x: 0,
        y: 0,
        width: doc.format.width,
        height: doc.format.height,
        style: { shapeType: "circle" },
      },
    ];
    const resized = resizeDocument(doc, {
      ...doc.format,
      width: 1080,
      height: 1920,
    });
    expect(resized.elements[0]).toMatchObject({
      width: 1080,
      height: 1080,
      x: 0,
      y: 420,
    });
  });
  it.each(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const)(
    "keeps a circle circular when dragging %s",
    (handle) => {
      const start = { x: 100, y: 100, width: 200, height: 200 };
      const next = resizeBox(start, handle, { x: 30, y: 50 }, true);
      expect(next.width).toBe(next.height);
      if (handle.includes("w")) expect(next.x + next.width).toBe(300);
      if (handle.includes("n")) expect(next.y + next.height).toBe(300);
      if (handle.includes("e")) expect(next.x).toBe(100);
      if (handle.includes("s")) expect(next.y).toBe(100);
    },
  );

  it("centers a circular shape within its group-scaled bounds without affecting rectangles or legacy ellipses", () => {
    const circle = {
      ...shape(),
      id: "circle",
      semanticRole: "subject" as const,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      style: { shapeType: "circle" as const },
    };
    const rect = {
      ...circle,
      id: "rect",
      style: { shapeType: "rectangle" as const },
    };
    const legacy = { ...circle, id: "legacy", semanticRole: undefined };
    const boxes = transformBoxes(
      [circle, rect, legacy],
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 0, y: 0, width: 200, height: 100 },
    );
    expect(boxes["circle"]).toEqual({ x: 50, y: 0, width: 100, height: 100 });
    expect(boxes["rect"]?.width).toBe(200);
    expect(boxes["legacy"]?.width).toBe(200);
    expect(centeredCircle({ x: 0, y: 0, width: 100, height: 200 })).toEqual({
      x: 0,
      y: 50,
      width: 100,
      height: 100,
    });
  });

  it("clamps semantic radius consistently and excludes role labels from exported shared content", () => {
    const el = { ...shape(), style: { ...shape().style, borderRadius: 999 } };
    expect(effectiveRadius(el)).toBe(80);
    const html = renderToStaticMarkup(createElement(ElementContent, { el }));
    expect(html).toContain("border-radius:80px");
    expect(html).not.toContain("shape-role-label");
    expect(html).not.toContain("Decorative element");
  });

  it("preserves legacy rectangle radius and ellipse rendering, including after role assignment", () => {
    const legacy = {
      ...createSpecElement("shape", createDocument().format, 0),
      width: 200,
      height: 100,
      style: { shapeType: "rectangle" as const, borderRadius: 16 },
    };
    expect(
      renderToStaticMarkup(createElement(ElementContent, { el: legacy })),
    ).toContain("border-radius:16px");
    expect(
      renderToStaticMarkup(
        createElement(ElementContent, {
          el: { ...legacy, semanticRole: "subject" },
        }),
      ),
    ).toContain("border-radius:16px");
    expect(
      renderToStaticMarkup(
        createElement(ElementContent, {
          el: { ...legacy, style: { shapeType: "circle" } },
        }),
      ),
    ).toContain("border-radius:50%");
  });
});
