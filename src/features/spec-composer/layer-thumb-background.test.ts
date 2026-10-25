import { describe, expect, it } from "vitest";
import { createElement } from "./registry";
import { backgroundStyle } from "./static-render";
import { createDocument } from "./templates";
import { layerThumbBackground, THUMB_DARK, THUMB_LIGHT } from "./layer-thumb-background";

describe("layerThumbBackground", () => {
  it("swaps to a dark backing when white content sits on a white document background", () => {
    const doc = createDocument();
    doc.background = { type: "solid", value: "#FFFFFF" };
    const title = createElement("title", doc.format, 0);
    title.style = { ...title.style, color: "#FFFFFF" };
    expect(layerThumbBackground(doc, [title])).toEqual({
      background: THUMB_DARK,
    });
  });

  it("swaps to a light backing when near-black content sits on a near-black document background", () => {
    const doc = createDocument();
    doc.background = { type: "solid", value: "#0a0a0a" };
    const title = createElement("title", doc.format, 0);
    title.style = { ...title.style, color: "#111111" };
    expect(layerThumbBackground(doc, [title])).toEqual({
      background: THUMB_LIGHT,
    });
  });

  it("keeps the document background when content already contrasts against it", () => {
    const doc = createDocument();
    doc.background = { type: "solid", value: "#FFFFFF" };
    const title = createElement("title", doc.format, 0);
    title.style = { ...title.style, color: "#111111" };
    expect(layerThumbBackground(doc, [title])).toEqual(backgroundStyle(doc));
  });

  it("reads a translucent shape fill as its opaque color and swaps backing when it blends in", () => {
    const doc = createDocument();
    doc.background = { type: "solid", value: "#fafafa" };
    const shape = createElement("shape", doc.format, 0);
    shape.style = { ...shape.style, background: "rgba(255,255,255,0.9)" };
    expect(layerThumbBackground(doc, [shape])).toEqual({
      background: THUMB_DARK,
    });
  });

  it("falls back to the document background for unreadable css var or hsl backgrounds", () => {
    const title = createElement("title", createDocument().format, 0);
    title.style = { ...title.style, color: "#FFFFFF" };

    const cssVarDoc = createDocument();
    cssVarDoc.background = { type: "solid", value: "var(--x)" };
    expect(layerThumbBackground(cssVarDoc, [title])).toEqual(
      backgroundStyle(cssVarDoc),
    );

    const hslDoc = createDocument();
    hslDoc.background = { type: "solid", value: "hsl(0 0% 100%)" };
    expect(layerThumbBackground(hslDoc, [title])).toEqual(
      backgroundStyle(hslDoc),
    );
  });

  it("falls back to the document background for transparent shapes without a border and for images", () => {
    const doc = createDocument();
    doc.background = { type: "solid", value: "#FFFFFF" };
    const shape = createElement("shape", doc.format, 0);
    shape.style = { ...shape.style, background: "transparent" };
    const image = createElement("productImage", doc.format, 1);
    expect(layerThumbBackground(doc, [shape, image])).toEqual(
      backgroundStyle(doc),
    );
  });

  it("uses the worst-contrast gradient stop to decide whether to swap the backing", () => {
    const doc = createDocument();
    doc.background = {
      type: "gradient",
      value: "#FFFFFF",
      secondaryValue: "#000000",
    };
    const title = createElement("title", doc.format, 0);
    title.style = { ...title.style, color: "#FFFFFF" };
    expect(layerThumbBackground(doc, [title])).toEqual({
      background: THUMB_DARK,
    });
  });

  it("area-weights a group's leaves so a large white shape outweighs tiny black text", () => {
    const doc = createDocument();
    doc.background = { type: "solid", value: "#FFFFFF" };
    const shape = createElement("shape", doc.format, 0);
    shape.style = { ...shape.style, background: "#FFFFFF" };
    shape.width = 400;
    shape.height = 400;
    const text = createElement("title", doc.format, 1);
    text.style = { ...text.style, color: "#000000" };
    text.width = 4;
    text.height = 4;
    expect(layerThumbBackground(doc, [shape, text])).toEqual({
      background: THUMB_DARK,
    });
  });
});
