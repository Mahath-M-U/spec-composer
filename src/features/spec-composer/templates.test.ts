import { describe, expect, it } from "vitest";
import { findAssetItem, promptFieldFor } from "./asset-catalog";
import { formats } from "./formats";
import { templateAssetPatch } from "./template-assets";
import {
  cloneTemplate,
  createDocument,
  matchesTemplateQuery,
  starterTemplates,
} from "./templates";
import { isImageKind, isTextKind, validateWritableDocument } from "./types";

describe("Library starter templates", () => {
  it("offers 50 unique editable starters in ten native formats, five per format", () => {
    expect(starterTemplates).toHaveLength(50);
    expect(
      new Set(starterTemplates.map((template) => template.name)).size,
    ).toBe(50);
    const counts: Record<string, number> = {};
    for (const { document: doc } of starterTemplates) {
      counts[doc.format.id] = (counts[doc.format.id] ?? 0) + 1;
      expect(validateWritableDocument(doc).name, doc.name).toBe(doc.name);
      expect(doc.imageBrief!.length, doc.name).toBeGreaterThan(60);
      expect(
        doc.elements.some((element) => isImageKind(element.kind)),
        doc.name,
      ).toBe(true);
      for (const element of doc.elements) {
        if (element.assetId) {
          const asset = findAssetItem(element.assetId);
          expect(asset?.kind, `${doc.name}: ${element.assetId}`).toBe(
            element.kind,
          );
          expect(element.slot).toBeTruthy();
          expect(
            promptFieldFor(element.kind) === "aiDescription"
              ? element.aiDescription
              : element.constraint?.positiveConstraint,
            `${doc.name}: ${element.name}`,
          ).toBeTruthy();
        }
        if (isImageKind(element.kind))
          expect(element.assetId, `${doc.name}: ${element.name}`).toBeTruthy();
      }
    }
    expect(counts).toEqual(
      Object.fromEntries(
        [
          "instagram-post",
          "instagram-square",
          "instagram-story",
          "whatsapp-status",
          "facebook-post",
          "linkedin-post",
          "x-post",
          "youtube-thumbnail",
          "tiktok-video",
          "pinterest-pin",
        ].map((id) => [id, 5]),
      ),
    );
  });

  it("keeps rotated visual extents inside every native canvas and reserves tall safe areas", () => {
    for (const { document: doc } of starterTemplates)
      for (const element of doc.elements) {
        const radians = (element.rotation * Math.PI) / 180;
        const width =
          Math.abs(element.width * Math.cos(radians)) +
          Math.abs(element.height * Math.sin(radians));
        const height =
          Math.abs(element.width * Math.sin(radians)) +
          Math.abs(element.height * Math.cos(radians));
        const x = element.x + element.width / 2 - width / 2;
        const y = element.y + element.height / 2 - height / 2;
        const label = `${doc.name}: ${element.name}`;
        expect(x, label).toBeGreaterThanOrEqual(-1);
        expect(y, label).toBeGreaterThanOrEqual(-1);
        expect(x + width, label).toBeLessThanOrEqual(doc.format.width + 1);
        expect(y + height, label).toBeLessThanOrEqual(doc.format.height + 1);
        if (isTextKind(element.kind)) {
          expect.soft(element.style.fontSize, label).toBeGreaterThanOrEqual(12);
          expect(
            (element.style.fontSize ?? 0) *
              (element.style.lineHeight ?? 1) *
              (element.content?.split("\n").length ?? 1),
            label,
          ).toBeLessThanOrEqual(element.height);
          if (doc.format.width / doc.format.height < 0.7) {
            expect(y, label).toBeGreaterThanOrEqual(doc.format.height * 0.09);
            expect(y + height, label).toBeLessThanOrEqual(
              doc.format.height * 0.87,
            );
          }
        }
        if (element.style.shapeType === "circle")
          expect(element.width, label).toBe(element.height);
      }
  });

  it("retains defaults and overrides while actually recomposing landscape and square clones", () => {
    expect(createDocument().format.id).toBe("instagram-post");
    expect(createDocument().elements).toHaveLength(0);
    for (const name of [
      "Product Launch",
      "Minimal Quote",
      "Street Style Fit Check",
    ]) {
      const square = cloneTemplate(name, "instagram-square");
      const wide = cloneTemplate(name, "youtube-thumbnail");
      expect(square.format.id).toBe("instagram-square");
      expect(wide.format.id).toBe("youtube-thumbnail");
      expect(square.id).not.toBe(wide.id);
      expect(
        square.elements.find((element) => element.kind === "title")!.x /
          square.format.width,
      ).not.toBeCloseTo(
        wide.elements.find((element) => element.kind === "title")!.x /
          wide.format.width,
      );
    }
    const custom = { ...formats[0]!, id: "custom", width: 1440, height: 900 };
    expect(cloneTemplate("Product Launch", custom).format).toEqual(custom);
    const street = starterTemplates.find(
      (template) => template.name === "Street Style Fit Check",
    )!.document;
    expect(
      street.elements.filter((element) => element.groupId === "group_model"),
    ).toHaveLength(2);
  });

  it("rejects unknown/mismatched Library IDs and preserves authored geometry over catalog size", () => {
    const colors = { bg: "#FFFFFF", ink: "#111111", accent: "#FF6600" };
    expect(() =>
      templateAssetPatch("missing", "productImage", formats[0]!, colors),
    ).toThrow();
    expect(() =>
      templateAssetPatch("food-bowl", "productImage", formats[0]!, colors),
    ).toThrow();
    const product = starterTemplates[0]!.document.elements.find(
      (element) => element.assetId === "fashion-product-bottle",
    )!;
    expect(product.width).toBe(Math.round(1080 * 0.52));
    expect(product.aiDescription).toContain("Frosted glass serum");
  });

  it("keeps native landscape copy blocks separate and every alternate-format clone valid", () => {
    for (const { name, document: doc } of starterTemplates) {
      if (doc.format.width > doc.format.height) {
        const text = doc.elements.filter((element) => isTextKind(element.kind));
        for (let i = 0; i < text.length; i++)
          for (const other of text.slice(i + 1)) {
            const element = text[i]!;
            const overlapX =
              Math.min(element.x + element.width, other.x + other.width) -
              Math.max(element.x, other.x);
            const overlapY =
              Math.min(element.y + element.height, other.y + other.height) -
              Math.max(element.y, other.y);
            expect(
              overlapX <= 1 || overlapY <= 1,
              `${name}: ${element.name} overlaps ${other.name}`,
            ).toBe(true);
          }
      }
      for (const id of [
        "instagram-post",
        "instagram-square",
        "youtube-thumbnail",
      ]) {
        expect(
          validateWritableDocument(cloneTemplate(name, id)).format.id,
        ).toBe(id);
      }
    }
  });

  it("searches format and platform together with existing name and category terms", () => {
    const template = starterTemplates.find(
      (item) => item.name === "Podcast Episode",
    )!;
    expect(
      matchesTemplateQuery(
        template.name,
        template.category,
        "podcast youtube",
        template.document.format,
      ),
    ).toBe(true);
    expect(
      matchesTemplateQuery(
        template.name,
        template.category,
        "social",
        template.document.format,
      ),
    ).toBe(true);
    expect(
      matchesTemplateQuery(
        template.name,
        template.category,
        "instagram",
        template.document.format,
      ),
    ).toBe(false);
  });
});
