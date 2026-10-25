import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeHero } from "./discovery";
import { TemplateCardMedia } from "./template-card-media";
import {
  isCurrentTemplateImage,
  TEMPLATE_ARTWORK_REVISION,
  templateImageFor,
  type TemplateImage,
} from "./template-images";
import { starterTemplates } from "./templates";
import * as imageRegistry from "./template-images";

vi.mock("./static-render", () => ({
  DocumentPreview: ({ doc }: { doc: { name: string } }) =>
    createElement("div", { "data-editable-preview": doc.name }),
}));
vi.mock("./design-editor-cards", () => ({
  DesignEditorSections: ({ parts }: { parts: unknown[] }) =>
    createElement("div", { "data-prompt-parts": parts.length }),
}));

describe("current template artwork", () => {
  const fixture: TemplateImage = {
    src: "/fixture-generated.webp",
    alt: "Generated fixture",
    width: 1092,
    height: 1440,
    promptHash: "fixture-hash",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: TEMPLATE_ARTWORK_REVISION,
    sourceFormatId: "instagram-post",
  };
  afterEach(() => vi.restoreAllMocks());

  it("provides current native artwork for all 50 starter templates", () => {
    expect(starterTemplates).toHaveLength(50);
    for (const template of starterTemplates) {
      expect(
        templateImageFor(template.name, template.document.format),
        template.name,
      ).toBeDefined();
    }
  });

  it("accepts approved native images with modest actual pixel variation", () => {
    expect(
      isCurrentTemplateImage(fixture, {
        id: "instagram-post",
        width: 1080,
        height: 1350,
      }),
    ).toBe(true);
    expect(
      isCurrentTemplateImage(
        { ...fixture, width: 1080, height: 1350 },
        { width: 1080, height: 1350 },
      ),
    ).toBe(true);
    expect(
      isCurrentTemplateImage(
        { ...fixture, width: 1080, height: 1000 },
        { width: 1000, height: 1000 },
      ),
    ).toBe(true);
    expect(
      isCurrentTemplateImage(
        { ...fixture, width: 925, height: 1000 },
        { width: 1000, height: 1000 },
      ),
    ).toBe(true);
    expect(
      isCurrentTemplateImage(
        { ...fixture, width: 1081, height: 1000 },
        { width: 1000, height: 1000 },
      ),
    ).toBe(false);
  });

  it("rejects stale revisions, unapproved outputs, wrong formats, and invalid or distorted dimensions", () => {
    expect(isCurrentTemplateImage({ ...fixture, artworkRevision: "old" })).toBe(
      false,
    );
    expect(isCurrentTemplateImage({ ...fixture, status: "pilot" })).toBe(false);
    expect(
      isCurrentTemplateImage(fixture, {
        id: "instagram-story",
        width: 1080,
        height: 1350,
      }),
    ).toBe(false);
    expect(isCurrentTemplateImage(fixture, { width: 1280, height: 720 })).toBe(
      false,
    );
    expect(
      isCurrentTemplateImage(
        { ...fixture, width: 900, height: 1000 },
        { width: 1000, height: 1000 },
      ),
    ).toBe(false);
    // Cross-orientation stays invalid even when a non-square target is close enough numerically.
    expect(
      isCurrentTemplateImage(
        { ...fixture, width: 999, height: 1000 },
        { width: 1081, height: 1000 },
      ),
    ).toBe(false);
    for (const value of [0, -1, Infinity, NaN]) {
      expect(isCurrentTemplateImage({ ...fixture, width: value })).toBe(false);
      expect(isCurrentTemplateImage({ ...fixture, height: value })).toBe(false);
      expect(
        isCurrentTemplateImage(fixture, { width: value, height: 1000 }),
      ).toBe(false);
    }
  });

  it("shows the generated hero and fits both frames to the document native ratio", () => {
    vi.spyOn(imageRegistry, "templateImageFor").mockReturnValue(fixture);
    const html = renderToStaticMarkup(
      createElement(HomeHero, { onCreate: () => {} }),
    );
    expect(html).toContain('src="/fixture-generated.webp"');
    expect(html.match(/data-editable-preview="Product Launch"/g)).toHaveLength(
      1,
    );
    expect(html.match(/aspect-ratio:1080 \/ 1350/g)).toHaveLength(2);
    expect(html).toMatch(/data-prompt-parts="[1-9]/);
  });

  it("shows the editable document when regeneration is pending", () => {
    const doc = starterTemplates[0]!.document;
    const html = renderToStaticMarkup(
      createElement(TemplateCardMedia, { doc, image: undefined }),
    );
    expect(html).toContain('data-editable-preview="Product Launch"');
    expect(html).not.toContain("<img");
  });

  it("keeps the home hero and its compiled specification visible with unavailable bitmap previews", () => {
    vi.spyOn(imageRegistry, "templateImageFor").mockReturnValue(undefined);
    const html = renderToStaticMarkup(
      createElement(HomeHero, { onCreate: () => {} }),
    );
    expect(html).toContain('data-hero-template="Product Launch"');
    expect(html.match(/data-editable-preview="Product Launch"/g)).toHaveLength(
      2,
    );
    expect(html).toMatch(/data-prompt-parts="[1-9]/);
    expect(html).not.toContain("/template-cards/product-launch.webp");
  });
});
