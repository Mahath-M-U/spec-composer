import { describe, expect, it } from "vitest";
import { hasPreset, togglePreset } from "./art-direction";
import {
  compileRegionPrompt,
  compileVisualPrompt,
  compileVisualSegments,
} from "./compiler";
import { compileDesignSkill, compileDesignSkillSegments } from "./design-md";
import { createElement } from "./registry";
import { createDocument } from "./templates";
import { parseSpecDocument, type SpecDocument } from "./types";

/** Returns a copy of `doc` with the given optional sections' "include in
 * output" switch turned on. */
const on = (
  doc: SpecDocument,
  ...sections: ("mood" | "scene" | "lighting")[]
): SpecDocument => ({
  ...doc,
  promptOptions: {
    ...doc.promptOptions,
    ...Object.fromEntries(sections.map((s) => [s, true])),
  },
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

describe("hasPreset", () => {
  it("is case-insensitive", () => {
    expect(hasPreset("Natural daylight", "natural DAYLIGHT")).toBe(true);
  });

  it("ignores other text in the comma list", () => {
    expect(hasPreset("Amber glow, Natural daylight", "Natural daylight")).toBe(
      true,
    );
    expect(hasPreset("Amber glow", "Natural daylight")).toBe(false);
  });
});

/** createDocument() with no template has no elements, so tests that need one
 * add it by hand via the same factory the canvas uses. */
const withElement = (patch: Partial<ReturnType<typeof createElement>> = {}) => {
  const doc = createDocument();
  const el = { ...createElement("productImage", doc.format, 0), ...patch };
  return { doc: { ...doc, elements: [el] }, el };
};

describe("compileVisualSegments", () => {
  it("always contains scene and lighting keys, ordered after mood", () => {
    const doc = createDocument();
    const keys = compileVisualSegments(doc).map((l) => l.key);
    const moodIndex = keys.indexOf("mood");
    expect(keys).toContain("scene");
    expect(keys).toContain("lighting");
    expect(keys.indexOf("scene")).toBe(moodIndex + 1);
    expect(keys.indexOf("lighting")).toBe(moodIndex + 2);
  });

  it("is empty text when unset", () => {
    const doc = createDocument();
    const lines = compileVisualSegments(doc);
    const scene = lines.find((l) => l.key === "scene");
    const lighting = lines.find((l) => l.key === "lighting");
    expect(scene?.segs).toEqual([]);
    expect(lighting?.segs).toEqual([]);
  });

  it("is overridden by promptParts.scene", () => {
    const doc = {
      ...createDocument(),
      promptParts: { scene: "Scene: custom." },
    };
    const line = compileVisualSegments(doc).find((l) => l.key === "scene");
    expect(line?.segs).toEqual(["Scene: custom."]);
    expect(line?.custom).toBe(true);
    // Scene's switch is off by default, even with an override in place.
    expect(line?.off).toBe(true);
  });
});

describe("compileVisualPrompt", () => {
  it("places Scene and Lighting as separate paragraphs right after Mood, in order", () => {
    const doc = on(
      {
        ...createDocument(),
        scene: "Marble countertop",
        lighting: "Soft studio light",
      },
      "mood",
      "scene",
      "lighting",
    );
    const text = compileVisualPrompt(doc);
    const paragraphs = text.split("\n\n");
    const moodIndex = paragraphs.findIndex((p) => p.startsWith("Mood:"));
    expect(moodIndex).toBeGreaterThanOrEqual(0);
    expect(paragraphs[moodIndex + 1]).toBe("Scene: Marble countertop.");
    expect(paragraphs[moodIndex + 2]).toBe("Lighting: Soft studio light.");
  });

  it("adds nothing when unset or whitespace-only", () => {
    const doc = on(
      { ...createDocument(), scene: "   ", lighting: undefined },
      "scene",
      "lighting",
    );
    const text = compileVisualPrompt(doc);
    expect(text).not.toContain("Scene:");
    expect(text).not.toContain("Lighting:");
  });

  it("strips trailing periods before re-adding one", () => {
    const doc = on(
      { ...createDocument(), scene: "Marble countertop.." },
      "scene",
    );
    expect(compileVisualPrompt(doc)).toContain("Scene: Marble countertop.");
  });

  it("has no Mood, Typography direction, Scene or Lighting by default", () => {
    const text = compileVisualPrompt(createDocument());
    expect(text).not.toContain("Mood:");
    expect(text).not.toContain("Typography direction");
    expect(text).not.toContain("Scene:");
    expect(text).not.toContain("Lighting:");
  });

  it("drops Scene even with a value when its switch is off", () => {
    const doc = { ...createDocument(), scene: "Marble countertop" };
    expect(compileVisualPrompt(doc)).not.toContain("Scene:");
  });

  it("drops a promptParts.scene override while off and includes it once turned on", () => {
    const off = {
      ...createDocument(),
      promptParts: { scene: "Scene: custom." },
    };
    expect(compileVisualPrompt(off)).not.toContain("Scene: custom.");
    expect(compileVisualPrompt(on(off, "scene"))).toContain("Scene: custom.");
  });
});

describe("material", () => {
  it("adds a Material and texture phrase to the element's prompt line and the region prompt", () => {
    const { doc, el } = withElement({ material: "Stainless steel" });
    const line = compileVisualSegments(doc).find((l) => l.key === `el:${el.id}`);
    const text = line?.segs
      .map((seg) => (typeof seg === "string" ? seg : seg.value || seg.fallback))
      .join("");
    expect(text).toContain("Material and texture: Stainless steel.");
    expect(compileRegionPrompt(doc, el.id)).toContain(
      "Material and texture: Stainless steel.",
    );
  });

  it("is absent when unset", () => {
    const { doc, el } = withElement();
    const line = compileVisualSegments(doc).find((l) => l.key === `el:${el.id}`);
    const text = line?.segs
      .map((seg) => (typeof seg === "string" ? seg : seg.value || seg.fallback))
      .join("");
    expect(text).not.toContain("Material and texture");
    expect(compileRegionPrompt(doc, el.id)).not.toContain(
      "Material and texture",
    );
  });
});

describe("compileDesignSkill", () => {
  it("adds ## Scene and ## Lighting sections when set", () => {
    const doc = on(
      {
        ...createDocument(),
        scene: "On a marble countertop",
        lighting: "Soft studio light",
      },
      "scene",
      "lighting",
    );
    const text = compileDesignSkill(doc, undefined);
    expect(text).toContain("## Scene\n\nOn a marble countertop.");
    expect(text).toContain("## Lighting\n\nSoft studio light.");
    expect(text).not.toContain("Art Direction");
  });

  it("omits both sections when unset", () => {
    const text = compileDesignSkill(createDocument(), undefined);
    expect(text).not.toContain("## Scene");
    expect(text).not.toContain("## Lighting");
  });

  it("has no ## Mood, ## Scene or ## Lighting, and no mood words, by default", () => {
    const text = compileDesignSkill(createDocument(), undefined);
    expect(text).not.toContain("## Mood");
    expect(text).not.toContain("## Scene");
    expect(text).not.toContain("## Lighting");
    expect(text).not.toContain("clean, confident");
  });

  it("adds a ## Mood section and the mood words in the overview when on", () => {
    const text = compileDesignSkill(on(createDocument(), "mood"), undefined);
    expect(text).toContain("## Mood\n\nclean, confident.");
    expect(text).toContain("with a clean, confident mood");
  });

  it("includes the material phrase in the element's slot line", () => {
    const { doc, el } = withElement({ material: "Stainless steel" });
    const line = compileDesignSkillSegments(doc).find(
      (l) => l.key === `skill:el:${el.id}`,
    );
    const text = line?.segs
      .map((seg) => (typeof seg === "string" ? seg : seg.value || seg.fallback))
      .join("");
    expect(text).toContain("Material and texture: Stainless steel.");
  });
});

describe("parseSpecDocument", () => {
  it("accepts scene, lighting and element material", () => {
    const { doc } = withElement({ material: "Stainless steel" });
    const parsed = parseSpecDocument({
      ...doc,
      scene: "Marble countertop",
      lighting: "Soft studio light",
    });
    expect(parsed).toBeDefined();
    expect(parsed?.scene).toBe("Marble countertop");
    expect(parsed?.lighting).toBe("Soft studio light");
    expect(parsed?.elements[0]?.material).toBe("Stainless steel");
  });

  it("strips the legacy artDirection key", () => {
    const parsed = parseSpecDocument({
      ...createDocument(),
      artDirection: { scene: "Old field" },
    });
    expect(parsed).toBeDefined();
    expect(parsed).not.toHaveProperty("artDirection");
  });

  it("defaults a brand-new document's Mood/Scene/Lighting flags to off", () => {
    const doc = createDocument();
    expect(doc.promptOptions.mood).toBe(false);
    expect(doc.promptOptions.scene).toBe(false);
    expect(doc.promptOptions.lighting).toBe(false);
  });

  it("migrates a legacy doc (no flags) to Mood on, Scene/Lighting on only with a value", () => {
    const legacy = { ...createDocument(), scene: "Marble countertop" };
    const raw: Record<string, unknown> = {
      ...legacy,
      promptOptions: { ...legacy.promptOptions },
    };
    const options = raw["promptOptions"] as Record<string, unknown>;
    delete options["mood"];
    delete options["scene"];
    delete options["lighting"];
    const parsed = parseSpecDocument(raw);
    expect(parsed?.promptOptions.mood).toBe(true);
    expect(parsed?.promptOptions.scene).toBe(true);
    expect(parsed?.promptOptions.lighting).toBe(false);
  });

  it("turns Mood off and drops the override when promptParts.mood was blanked", () => {
    const legacy = {
      ...createDocument(),
      promptParts: { mood: "" },
    };
    const raw: Record<string, unknown> = {
      ...legacy,
      promptOptions: { ...legacy.promptOptions },
    };
    delete (raw["promptOptions"] as Record<string, unknown>)["mood"];
    const parsed = parseSpecDocument(raw);
    expect(parsed?.promptOptions.mood).toBe(false);
    expect(parsed?.promptParts?.["mood"]).toBeUndefined();
  });

  it("preserves an explicit false flag instead of recomputing it from the value", () => {
    const doc = { ...createDocument(), scene: "Marble countertop" };
    const parsed = parseSpecDocument(doc);
    expect(parsed?.promptOptions.scene).toBe(false);
  });
});
