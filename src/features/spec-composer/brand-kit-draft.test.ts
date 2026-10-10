import { describe, expect, it } from "vitest";
import { brandKitPatchFromDraft, createBrandKitDraft } from "./brand-kit-draft";
import {
  ARCHETYPES,
  AUDIENCE_AGES,
  AUDIENCE_INTERESTS,
  AUDIENCE_SEGMENTS,
  CORE_VALUES,
  DIFFERENTIATORS,
  FILLED_SECTION_TOTAL,
  MISSION_FOCUS,
  PALETTE_PRESETS,
  POSITIONING_TIERS,
  VISION_THEMES,
  VOICE_TRAITS,
  countFilledSections,
} from "./brand-profile";
import { materialRoleColors } from "./material-kits";
import type { BrandKit } from "./types";

const kit: BrandKit = {
  id: "brandkit_existing",
  name: "Custom kit",
  colors: [
    {
      id: "old-id",
      role: "primary",
      hex: "#C55454",
      secondaryHex: "#D9A15B",
      type: "gradient",
      angle: 42,
      usecase: "Custom purpose",
    },
  ],
  emotions: ["Custom emotion"],
  style: "Custom style",
  typography: "Custom font",
  profile: {
    values: ["Custom value"],
    personality: { classicModern: 70 },
    voiceTone: { formalCasual: 30 },
  },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  sourceKind: "material3",
  styleKitId: "style_existing",
};

describe("createBrandKitDraft", () => {
  it("preserves Create defaults with fresh editable palette IDs", () => {
    const draft = createBrandKitDraft("create");
    expect(draft).toMatchObject({
      name: "",
      style: "Minimal",
      typography: "Manrope",
      profile: {},
      emotions: [],
      paletteTouched: false,
      typographyTouched: false,
    });
    expect(draft.colors.map((color) => color.hex)).toEqual(
      PALETTE_PRESETS[0]!.colors.map((color) => color.hex),
    );
    expect(draft.colors.map((color) => color.id)).not.toEqual(
      PALETTE_PRESETS[0]!.colors.map((color) => color.id),
    );
  });

  it("generates a coherent editable starter with all nine sections filled", () => {
    const draft = createBrandKitDraft("generate");
    expect(draft).toMatchObject({
      name: "Modern studio",
      typography: "Manrope",
      style: "Tech",
      emotions: ["Calm", "Confident"],
    });
    expect(countFilledSections(draft)).toBe(FILLED_SECTION_TOTAL);
    expect(draft.colors.map((color) => color.hex)).toEqual(
      materialRoleColors("#6750A4").map((color) => color.hex),
    );
    const p = draft.profile;
    for (const [selected, options] of [
      [p.visionThemes, VISION_THEMES],
      [p.missionFocus, MISSION_FOCUS],
      [p.values, CORE_VALUES],
      [p.voiceTraits, VOICE_TRAITS],
      [p.audienceAges, AUDIENCE_AGES],
      [p.audienceSegments, AUDIENCE_SEGMENTS],
      [p.audienceInterests, AUDIENCE_INTERESTS],
      [p.differentiators, DIFFERENTIATORS],
    ] as const) {
      expect(
        selected?.every((value) =>
          (options as readonly string[]).includes(value),
        ),
      ).toBe(true);
    }
    expect(ARCHETYPES.some((option) => option.id === p.archetype)).toBe(true);
    expect(
      POSITIONING_TIERS.some((option) => option.id === p.positioningTier),
    ).toBe(true);
  });

  it("keeps the generated editable palette authoritative after changes", () => {
    const draft = createBrandKitDraft("generate");
    draft.colors[0]!.hex = "#123456";
    draft.seed = "#DC2626";
    expect(brandKitPatchFromDraft(draft).colors[0]!.hex).toBe("#123456");
  });

  it("deep clones Edit fields without losing IDs, gradient metadata or custom values", () => {
    const draft = createBrandKitDraft("edit", kit);
    expect(draft.colors).toEqual(kit.colors);
    expect(draft).toMatchObject({
      style: kit.style,
      typography: kit.typography,
      emotions: kit.emotions,
      profile: kit.profile,
    });
    draft.colors[0]!.hex = "#123456";
    draft.emotions.push("Calm");
    draft.profile.values!.push("Quality");
    draft.profile.personality!["classicModern"] = 10;
    draft.profile.voiceTone!["formalCasual"] = 80;
    expect(kit.colors[0]!.hex).toBe("#C55454");
    expect(kit.emotions).toEqual(["Custom emotion"]);
    expect(kit.profile).toEqual({
      values: ["Custom value"],
      personality: { classicModern: 70 },
      voiceTone: { formalCasual: 30 },
    });
  });
});

describe("brandKitPatchFromDraft", () => {
  it("patches editable fields only and explicitly clears an old profile", () => {
    const draft = createBrandKitDraft("edit", kit);
    draft.name = "  Renamed kit  ";
    draft.profile = {};
    const patch = brandKitPatchFromDraft(draft);
    expect(Object.keys(patch).sort()).toEqual(
      ["name", "colors", "emotions", "style", "typography", "profile"].sort(),
    );
    expect(patch.name).toBe("Renamed kit");
    expect(patch.profile).toEqual({});
    expect({ ...kit, ...patch }).toMatchObject({
      id: kit.id,
      createdAt: kit.createdAt,
      sourceKind: "material3",
      styleKitId: kit.styleKitId,
      profile: {},
    });
    patch.colors[0]!.angle = 180;
    expect(draft.colors[0]!.angle).toBe(42);
  });
});
