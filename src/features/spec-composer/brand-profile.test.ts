import { describe, expect, it } from "vitest";
import {
  brandProfileLines,
  countFilledSections,
  FILLED_SECTION_TOTAL,
  isBrandProfileEmpty,
  normalizeBrandProfile,
  PERSONALITY_AXES,
} from "./brand-profile";
import { applyBrandKitToDocument, normalizeBrandKits } from "./brand-kits";
import { matchesBrandKitQuery } from "./brand-kit-search";
import {
  brandKitFromMaterialKit,
  createStyleKit,
  materialRoleColors,
} from "./material-kits";
import { createDocument } from "./templates";
import type { BrandKit } from "./types";

const baseKit = (overrides: Partial<BrandKit> = {}): BrandKit => ({
  id: "brandkit_test",
  name: "Test kit",
  colors: [],
  emotions: [],
  style: "Minimal",
  typography: "Manrope",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("normalizeBrandProfile", () => {
  it("returns undefined for garbage input", () => {
    expect(normalizeBrandProfile(null)).toBeUndefined();
    expect(normalizeBrandProfile("not an object")).toBeUndefined();
    expect(normalizeBrandProfile(42)).toBeUndefined();
    expect(normalizeBrandProfile([])).toBeUndefined();
    expect(normalizeBrandProfile({})).toBeUndefined();
  });

  it("keeps a partial input", () => {
    expect(normalizeBrandProfile({ vision: "See far", values: ["Honesty"] })).toEqual(
      { vision: "See far", values: ["Honesty"] },
    );
  });

  it("filters non-string entries out of array fields", () => {
    const profile = normalizeBrandProfile({
      values: ["Honesty", 42, null, "Quality"],
    });
    expect(profile?.values).toEqual(["Honesty", "Quality"]);
  });

  it("clamps slider values to 0-100 and drops non-numbers", () => {
    const profile = normalizeBrandProfile({
      personality: { classicModern: 150, playfulSerious: -20, bogus: "x", understatedBold: 40 },
    });
    expect(profile?.personality).toEqual({
      classicModern: 100,
      playfulSerious: 0,
      understatedBold: 40,
    });
  });
});

describe("brandProfileLines", () => {
  it("is empty for an undefined or empty profile", () => {
    expect(brandProfileLines(undefined)).toEqual([]);
    expect(brandProfileLines({})).toEqual([]);
  });

  it("maps slider poles correctly and omits neutral sliders", () => {
    const left = PERSONALITY_AXES[0]!;
    const right = PERSONALITY_AXES[1]!;
    const lines = brandProfileLines({
      personality: { [left.id]: 10, [right.id]: 90 },
    });
    expect(lines[0]).toContain(left.left);
    expect(lines[0]).toContain(right.right);
  });

  it("omits a slider left exactly neutral (50)", () => {
    const axis = PERSONALITY_AXES[0]!;
    const lines = brandProfileLines({ personality: { [axis.id]: 50 } });
    expect(lines).toEqual([]);
  });
});

describe("isBrandProfileEmpty", () => {
  it("is true for undefined and empty-field profiles", () => {
    expect(isBrandProfileEmpty(undefined)).toBe(true);
    expect(isBrandProfileEmpty({ values: [], vision: "  " })).toBe(true);
  });

  it("is false once a field has content", () => {
    expect(isBrandProfileEmpty({ vision: "See far" })).toBe(false);
  });
});

describe("countFilledSections", () => {
  const base = {
    profile: {},
    emotions: [] as string[],
    paletteTouched: false,
    typographyTouched: false,
  };

  it("is 0 for an empty profile with nothing touched (the '3 of 10' regression)", () => {
    expect(countFilledSections(base)).toBe(0);
  });

  it("counts vision themes alone as 1", () => {
    expect(
      countFilledSections({ ...base, profile: { visionThemes: ["Trust"] } }),
    ).toBe(1);
  });

  it("counts a vision note alone as 1", () => {
    expect(
      countFilledSections({ ...base, profile: { vision: "See far" } }),
    ).toBe(1);
  });

  it("doesn't count personality sliders left at 50", () => {
    const axis = PERSONALITY_AXES[0]!;
    expect(
      countFilledSections({
        ...base,
        profile: { personality: { [axis.id]: 50 } },
      }),
    ).toBe(0);
  });

  it("counts personality once a slider moves off 50", () => {
    const axis = PERSONALITY_AXES[0]!;
    expect(
      countFilledSections({
        ...base,
        profile: { personality: { [axis.id]: 70 } },
      }),
    ).toBe(1);
  });

  it("counts voice traits alone as 1 (merged personality & voice section)", () => {
    expect(
      countFilledSections({ ...base, profile: { voiceTraits: ["Warm"] } }),
    ).toBe(1);
  });

  it("still counts as 1 when archetype, voice traits and a voice tone slider are all set", () => {
    const axis = PERSONALITY_AXES[0]!;
    expect(
      countFilledSections({
        ...base,
        profile: {
          archetype: "sage",
          voiceTraits: ["Warm"],
          voiceTone: { [axis.id]: 70 },
        },
      }),
    ).toBe(1);
  });

  it("adds 2 when both palette and typography are touched", () => {
    expect(
      countFilledSections({ ...base, paletteTouched: true, typographyTouched: true }),
    ).toBe(2);
  });

  it("counts 9 (= FILLED_SECTION_TOTAL) when everything is filled", () => {
    expect(
      countFilledSections({
        profile: {
          visionThemes: ["Trust"],
          missionFocus: ["Quality first"],
          values: ["Honesty"],
          archetype: "sage",
          audienceAges: ["Adults (25-34)"],
          positioningTier: "premium",
        },
        emotions: ["Calm"],
        paletteTouched: true,
        typographyTouched: true,
      }),
    ).toBe(FILLED_SECTION_TOTAL);
  });
});

describe("matchesBrandKitQuery", () => {
  it("matches on a core value in the profile", () => {
    const kit = baseKit({ profile: { values: ["Sustainability"] } });
    expect(matchesBrandKitQuery(kit, "sustainability")).toBe(true);
    expect(matchesBrandKitQuery(kit, "luxury")).toBe(false);
  });
});

describe("normalizeBrandKits", () => {
  it("still loads a legacy kit without a profile", () => {
    const kit = normalizeBrandKits([baseKit()])[0];
    expect(kit).toBeDefined();
    expect(kit?.profile).toBeUndefined();
  });

  it("preserves a stored profile", () => {
    const kit = normalizeBrandKits([
      baseKit({ profile: { vision: "See far", values: ["Honesty"] } }),
    ])[0];
    expect(kit?.profile).toEqual({ vision: "See far", values: ["Honesty"] });
  });
});

describe("applyBrandKitToDocument", () => {
  it("copies the kit's profile into creativeDirection.brandProfile", () => {
    const doc = createDocument();
    const kit = baseKit({ profile: { vision: "See far" } });
    applyBrandKitToDocument(doc, kit);
    expect(doc.creativeDirection.brandProfile).toEqual({ vision: "See far" });
  });

  it("deletes creativeDirection.brandProfile when the kit has none", () => {
    const doc = createDocument();
    doc.creativeDirection.brandProfile = { vision: "Old" };
    applyBrandKitToDocument(doc, baseKit());
    expect(doc.creativeDirection.brandProfile).toBeUndefined();
  });
});

describe("materialRoleColors", () => {
  it("matches the hexes produced by brandKitFromMaterialKit for the same seed", () => {
    const seed = "#6750A4";
    const styleKit = createStyleKit("Seed kit", seed);
    const brandKit = brandKitFromMaterialKit(styleKit);
    const preview = materialRoleColors(seed);
    const byRole = (colors: typeof preview) =>
      Object.fromEntries(colors.map((c) => [c.role, c.hex]));
    expect(byRole(brandKit.colors)).toEqual(byRole(preview));
  });
});
