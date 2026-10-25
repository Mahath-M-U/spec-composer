import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compilePromptEditorOutput } from "./compiler";
import { compileDesignSkill } from "./design-md";
import {
  TEMPLATE_ARTWORK_REVISION,
  templateImageFor,
  templateSlug,
} from "./template-images";
import { starterTemplates } from "./templates";

describe("deferred template regeneration prompts", () => {
  it("carries the actual authored gradient and button colors without contradictory catalog defaults", () => {
    const doc = starterTemplates[0]!.document;
    const prompt = compilePromptEditorOutput(doc);
    const glow = doc.elements.find((element) => element.name === "Glow")!;
    const button = doc.elements.find((element) => element.kind === "cta")!;
    expect(prompt).toContain("radial-gradient(");
    expect(prompt).toContain(glow.style.background);
    expect(prompt).toContain(`${button.style.background} fill`);
    expect(prompt).toContain(`${button.style.color} text`);
    expect(prompt).not.toContain(
      "primary brand color fill with light high-contrast type",
    );
    expect(prompt).not.toContain("Flat solid rectangle");
  });

  it("exports all native formats with exact compiler output and deterministic SHA256 hashes", () => {
    const records = JSON.parse(
      readFileSync("public/template-cards/prompts.json", "utf8"),
    );
    expect(records).toHaveLength(50);
    expect(
      records.filter(
        (record: { status: string }) => record.status === "generated",
      ),
    ).toHaveLength(50);
    for (const { name, document: doc } of starterTemplates) {
      const record = records.find(
        (item: { name: string }) => item.name === name,
      );
      const prompt = compilePromptEditorOutput(doc);
      const promptHash = createHash("sha256").update(prompt).digest("hex");
      const current = templateImageFor(name, doc.format);
      expect(record, name).toMatchObject({
        slug: templateSlug(name),
        name,
        format: {
          id: doc.format.id,
          label: doc.format.label,
          width: doc.format.width,
          height: doc.format.height,
        },
        imageStyle: doc.imageStyle,
        artworkRevision: TEMPLATE_ARTWORK_REVISION,
        targetBitmapPath: `/template-cards/${templateSlug(name)}.webp`,
        status:
          current?.promptHash === promptHash
            ? "generated"
            : "pending-regeneration",
        designMarkdown: compileDesignSkill(doc),
        imageGenerationPrompt: prompt,
        promptHash: createHash("sha256").update(prompt).digest("hex"),
      });
      expect(record.libraryAssetIds).toEqual(
        [
          ...new Set(
            doc.elements.flatMap((element) =>
              element.assetId ? [element.assetId] : [],
            ),
          ),
        ].sort(),
      );
      expect(JSON.stringify(record)).not.toMatch(
        /project_[a-f0-9-]{36}|generatedAt|createdAt|updatedAt/,
      );
    }
  });

  it("retains reproducible submitted-prompt evidence for every generated preview", () => {
    const records = JSON.parse(
      readFileSync("public/template-cards/prompts.json", "utf8"),
    );
    const manifest = JSON.parse(
      readFileSync("public/template-cards/generation-manifest.json", "utf8"),
    );
    expect(Object.keys(manifest.images)).toHaveLength(50);
    for (const record of records.filter(
      (item: { status: string }) => item.status === "generated",
    )) {
      const evidence = manifest.images[record.slug];
      expect(evidence, record.name).toMatchObject({
        sourcePromptHash: record.promptHash,
        targetBitmapPath: record.targetBitmapPath,
        review: "approved",
      });
      const submitted =
        evidence.submittedPrompt ??
        manifest.wrappers[evidence.wrapperId]
          .replaceAll("${p.format.width}", String(record.format.width))
          .replaceAll("${p.format.height}", String(record.format.height))
          .replaceAll("${p.name}", record.name)
          .replaceAll(
            "${p.imageGenerationPrompt}",
            record.imageGenerationPrompt,
          )
          .replaceAll("${p.designMarkdown}", record.designMarkdown);
      expect(evidence.submittedPromptHash, record.name).toBe(
        createHash("sha256").update(submitted).digest("hex"),
      );
      const image = templateImageFor(record.name, record.format)!;
      expect(evidence.generatedAt, record.name).toBe(image.generatedAt);
      expect({ width: evidence.width, height: evidence.height }).toEqual({
        width: image.width,
        height: image.height,
      });
    }
  });
});
