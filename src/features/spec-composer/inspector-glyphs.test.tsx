import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InspectorGlyph, type InspectorGlyphName } from "./inspector-glyphs";

const NAMES: InspectorGlyphName[] = [
  "transform",
  "appearance",
  "material",
  "content",
  "background",
  "rotation",
  "opacity",
  "line-height",
  "letter-spacing",
  "border-width",
  "corner-radius",
  "angle",
  "kind-text",
  "kind-image",
  "kind-shape",
  "kind-mixed",
];

describe("InspectorGlyph", () => {
  it.each(NAMES)("renders %s as a hidden, title-less, textless svg", (name) => {
    const html = renderToStaticMarkup(
      createElement(InspectorGlyph, { name }),
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<title");
    expect(html).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(html.replace(/<[^>]+>/g, "").trim()).toBe("");
  });
});
