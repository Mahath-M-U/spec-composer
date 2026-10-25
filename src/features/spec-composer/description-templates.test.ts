import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_TEMPLATES,
  findDescriptionTemplate,
  renderDescriptionTemplate,
  resolveElementDetail,
  synchronizeElementDescriptions,
} from "./description-templates";
import { createDocument } from "./templates";
import { createElement } from "./registry";
import {
  descriptionDraftsSchema,
  descriptionTemplateSelectionSchema,
  parseSpecDocument,
  validateWritableDocument,
} from "./types";
import {
  compileRegionPrompt,
  compileVisualPrompt,
  buildJsonExport,
} from "./compiler";
import { compileDesignSkill } from "./design-md";
import { compileCopyText } from "./copy-output";

describe("protected description templates", () => {
  it.each(DESCRIPTION_TEMPLATES)(
    "renders useful defaults for $id without unresolved placeholders or lighting instructions",
    (template) => {
      const defaults = renderDescriptionTemplate(template.id, {});
      expect(defaults?.length).toBeGreaterThan(100);
      for (const field of template.fields)
        expect(defaults).toContain(field.defaultValue);
      expect(
        renderDescriptionTemplate(
          template.id,
          Object.fromEntries(template.fields.map((field) => [field.id, "  "])),
        ),
      ).toBe(defaults);
      expect(defaults).not.toMatch(
        /\{[^}]+\}|undefined|softbox|lighting|camera angle/i,
      );
    },
  );

  it("uses literal field values without evaluating braces, HTML-like strings or recursive tokens", () => {
    const literal = "<b>{product}</b> ${ignore_me}";
    const result = renderDescriptionTemplate("product-packshot", {
      product: `  ${literal}  `,
      material: "glass",
      view: "front",
      color: "red",
    });
    expect(result).toContain(literal);
    expect(result).toContain("faithful product proportions");
    expect(result).not.toContain("  <b>");
    expect(renderDescriptionTemplate("unknown-future", {})).toBeUndefined();
    expect(
      renderDescriptionTemplate("person-model", { person: "a".repeat(201) }),
    ).toBeUndefined();
  });

  it("resolves metadata rather than a stale cache and preserves unknown-template fallback", () => {
    expect(
      resolveElementDetail({
        detail: "stale",
        descriptionTemplate: {
          id: "product-packshot",
          values: { product: "A blue bottle" },
        },
      }),
    ).toContain("A blue bottle");
    expect(
      resolveElementDetail({
        detail: "Readable future template",
        descriptionTemplate: {
          id: "future-template",
          values: { model: "future" },
        },
      }),
    ).toBe("Readable future template");
    expect(resolveElementDetail({ detail: "Legacy custom detail" })).toBe(
      "Legacy custom detail",
    );
  });

  it("validates bounded metadata and retains unknown IDs without migrating legacy projects", () => {
    const doc = createDocument();
    const element = createElement("shape", doc.format, 0);
    const metadata = {
      id: "future-template",
      values: { future: "a literal field" },
    };
    doc.elements = [
      {
        ...element,
        descriptionTemplate: metadata,
        descriptionDrafts: {
          custom: "My custom text",
          templates: { older: { values: {}, rendered: "An older draft" } },
        },
      },
    ];
    expect(
      validateWritableDocument(doc).elements[0]?.descriptionTemplate,
    ).toEqual(metadata);
    expect(
      parseSpecDocument({ ...doc, elements: [element] })?.elements[0]
        ?.descriptionTemplate,
    ).toBeUndefined();
    for (const invalid of [
      { id: "x".repeat(81), values: {} },
      { id: "ok", values: { ["x".repeat(41)]: "value" } },
      { id: "ok", values: { field: "x".repeat(201) } },
      {
        id: "ok",
        values: Object.fromEntries(
          Array.from({ length: 9 }, (_, i) => [`key${i}`, "value"]),
        ),
      },
    ])
      expect(
        descriptionTemplateSelectionSchema.safeParse(invalid).success,
      ).toBe(false);
    expect(
      descriptionDraftsSchema.safeParse({ custom: "x".repeat(20001) }).success,
    ).toBe(false);
    expect(
      descriptionDraftsSchema.safeParse({
        templates: { saved: { values: {}, rendered: "x".repeat(20001) } },
      }).success,
    ).toBe(false);
    expect(
      descriptionDraftsSchema.safeParse({
        templates: Object.fromEntries(
          Array.from({ length: 11 }, (_, i) => [
            `template${i}`,
            { values: {} },
          ]),
        ),
      }).success,
    ).toBe(false);
  });

  it("keeps unknown metadata untouched during unrelated synchronization", () => {
    const doc = createDocument();
    doc.elements = [
      {
        ...createElement("shape", doc.format, 0),
        detail: "Fallback description",
        descriptionTemplate: { id: "future", values: { future: "raw" } },
      },
    ];
    const next = structuredClone(doc);
    next.elements[0]!.x += 10;
    synchronizeElementDescriptions(doc, next);
    expect(next.elements[0]?.descriptionTemplate).toEqual(
      doc.elements[0]?.descriptionTemplate,
    );
    expect(next.elements[0]?.detail).toBe("Fallback description");
  });

  it("uses one resolved description across prompt, regional prompt, DESIGN.md, copy and JSON", () => {
    const doc = createDocument();
    const el = {
      ...createElement("shape", doc.format, 0),
      semanticRole: "product" as const,
      descriptionTemplate: {
        id: "product-packshot",
        values: { product: "A jade glass bottle" },
      },
      detail: "STALE CACHE",
    };
    doc.elements = [el];
    const description = resolveElementDetail(el);
    const exported = buildJsonExport(doc);
    expect(exported.spec.elements[0]?.detail).toBe(description);
    expect(doc.elements[0]?.detail).toBe("STALE CACHE");
    const unknown = {
      ...el,
      id: "unknown",
      detail: "Future fallback",
      descriptionTemplate: { id: "future-template", values: {} },
    };
    expect(
      buildJsonExport({ ...doc, elements: [unknown] }).spec.elements[0],
    ).toEqual(unknown);
    for (const text of [
      compileVisualPrompt(doc),
      compileRegionPrompt(doc, el.id),
      compileDesignSkill(doc),
      compileCopyText(doc, undefined, "prompt"),
      compileCopyText(doc, undefined, "design"),
      buildJsonExport(doc).prompt,
    ]) {
      expect(text).toContain(description);
      expect(text).not.toContain("STALE CACHE");
    }
    const next = structuredClone(doc);
    synchronizeElementDescriptions(doc, next);
    expect(next.elements[0]?.detail).toBe(description);
  });
});
