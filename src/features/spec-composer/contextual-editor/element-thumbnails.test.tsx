import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { catalogIds } from "./catalog";
import { ElementThumbnail } from "./element-thumbnails";

const DEDICATED_IDS = [
  "subjects.product",
  "subjects.image",
  "subjects.person",
  "subjects.illustration",
  "subjects.background",
  "information.title",
  "information.benefit",
  "information.price",
  "information.headline",
  "information.body",
  "information.label",
  "actions.cta",
  "branding.logo",
  "structure.stage",
  "decoration.badge",
  "decoration.shape",
  "decoration.divider",
  "decoration.icon",
  "decoration.arrow",
];

describe("element thumbnails", () => {
  it("renders a safe inline svg for every catalog id", () => {
    for (const id of catalogIds) {
      const html = renderToStaticMarkup(createElement(ElementThumbnail, { id }));
      expect(html).toContain("<svg");
      expect(html).not.toContain("<img");
      // Lucide's svg wrapper declares the standard xmlns namespace url; forbid
      // only attributes that would fetch an external resource.
      expect(html).not.toMatch(/(?:href|src)="http/);
    }
  });

  it("gives each of the 19 dedicated ids a distinct dedicated thumbnail", () => {
    const markups = DEDICATED_IDS.map((id) =>
      renderToStaticMarkup(createElement(ElementThumbnail, { id })),
    );
    expect(DEDICATED_IDS).toHaveLength(19);
    for (const html of markups) {
      expect(html).toContain('data-thumbnail="dedicated"');
    }
    expect(new Set(markups).size).toBe(19);
  });

  it("falls back to a generic thumbnail for unknown ids", () => {
    const html = renderToStaticMarkup(
      createElement(ElementThumbnail, { id: "foreign.thing" }),
    );
    expect(html).toContain('data-thumbnail="generic"');
  });

  it("falls back to a group thumbnail for known group, undedicated ids", () => {
    expect(catalogIds).toContain("dataProof.citation");
    const html = renderToStaticMarkup(
      createElement(ElementThumbnail, { id: "dataProof.citation" }),
    );
    expect(html).toContain('data-thumbnail="group"');
  });
});
