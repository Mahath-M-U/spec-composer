import { describe, expect, it } from "vitest";
import {
  artDirectionLine,
  togglePreset,
  ART_DIRECTION_FIELDS,
} from "./art-direction";
import { compileVisualPrompt } from "./compiler";
import { compileDesignSkill } from "./design-md";
import { createDocument } from "./templates";
import { parseSpecDocument } from "./types";

describe("artDirectionLine", () => {
  it("returns \"\" when artDirection is undefined", () => {
    expect(artDirectionLine({ artDirection: undefined })).toBe("");
  });

  it("returns \"\" when every field is blank", () => {
    expect(
      artDirectionLine({ artDirection: { subject: "   ", scene: "" } }),
    ).toBe("");
  });

  it("orders fields and labels them, stripping trailing periods", () => {
    expect(
      artDirectionLine({
        artDirection: {
          textLayout: "Big title.",
          subject: "Amber glass serum bottle",
          lighting: "Soft studio light",
        },
      }),
    ).toBe(
      "Subject: Amber glass serum bottle. Lighting: Soft studio light. Text layout: Big title.",
    );
  });
});

describe("togglePreset", () => {
  it("adds a preset to an empty value", () => {
    expect(togglePreset("", "Natural daylight")).toBe("Natural daylight");
  });

  it("appends a preset to existing free text", () => {
    expect(togglePreset("Amber glow", "Natural daylight")).toBe(
      "Amber glow, Natural daylight",
    );
  });

  it("removes a preset case-insensitively, keeping other entries", () => {
    expect(togglePreset("Amber glow, natural daylight", "Natural Daylight")).toBe(
      "Amber glow",
    );
  });
});

describe("compileVisualPrompt", () => {
  it("places a set art-direction field right after the Purpose paragraph", () => {
    const doc = {
      ...createDocument(),
      imageBrief: "X",
      artDirection: { lighting: "Soft studio light" },
    };
    const text = compileVisualPrompt(doc);
    expect(text).toContain("Lighting: Soft studio light.");
    const paragraphs = text.split("\n\n");
    const purposeIndex = paragraphs.findIndex((p) => p === "Purpose: X.");
    expect(purposeIndex).toBeGreaterThanOrEqual(0);
    expect(paragraphs[purposeIndex + 1]).toBe("Lighting: Soft studio light.");
  });

  it("adds nothing when artDirection is unset", () => {
    const doc = { ...createDocument(), imageBrief: "X" };
    expect(compileVisualPrompt(doc)).not.toContain("Lighting:");
  });
});

describe("compileDesignSkill", () => {
  it("adds an Art Direction section for style-level fields only", () => {
    const doc = {
      ...createDocument(),
      artDirection: { scene: "On a marble countertop", subject: "A bottle" },
    };
    const text = compileDesignSkill(doc, undefined);
    expect(text).toContain("## Art Direction");
    expect(text).toContain("- **Scene:** On a marble countertop");
    expect(text).not.toContain("Subject");
  });

  it("omits the section when only Subject (or nothing) is set", () => {
    const withSubjectOnly = {
      ...createDocument(),
      artDirection: { subject: "A bottle" },
    };
    expect(compileDesignSkill(withSubjectOnly, undefined)).not.toContain(
      "## Art Direction",
    );
    expect(compileDesignSkill(createDocument(), undefined)).not.toContain(
      "## Art Direction",
    );
  });
});

describe("parseSpecDocument", () => {
  it("accepts documents with and without artDirection", () => {
    const base = createDocument();
    expect(parseSpecDocument(base)).toBeDefined();
    expect(
      parseSpecDocument({
        ...base,
        artDirection: { lighting: "Soft studio light" },
      }),
    ).toBeDefined();
  });
});

describe("ART_DIRECTION_FIELDS", () => {
  it("has 6 fields, 5 of which are style-level (design)", () => {
    expect(ART_DIRECTION_FIELDS.length).toBe(6);
    expect(ART_DIRECTION_FIELDS.filter((f) => f.design).length).toBe(5);
  });
});
