import { PALETTE_PRESETS } from "./brand-profile";
import { materialRoleColors } from "./material-kits";
import type { BrandKit, BrandKitColor, BrandProfile } from "./types";

export type BrandKitBuilderMode = "create" | "generate" | "edit";

export interface BrandKitDialogDraft {
  name: string;
  emotions: string[];
  style: string;
  typography: string;
  profile: BrandProfile;
  colors: BrandKitColor[];
  /** Material seed is initialization metadata; colors remain authoritative. */
  seed: string;
  paletteTouched: boolean;
  typographyTouched: boolean;
}

export function createBrandKitDraft(
  mode: BrandKitBuilderMode,
  initialKit?: BrandKit,
): BrandKitDialogDraft {
  if (mode === "edit" && initialKit) {
    return {
      name: initialKit.name,
      emotions: [...initialKit.emotions],
      style: initialKit.style,
      typography: initialKit.typography,
      profile: structuredClone(initialKit.profile ?? {}),
      colors: structuredClone(initialKit.colors),
      seed: "#6750A4",
      paletteTouched: initialKit.colors.length > 0,
      typographyTouched: !!initialKit.typography,
    };
  }
  const generated = mode === "generate";
  return {
    name: generated ? "Modern studio" : "",
    emotions: generated ? ["Calm", "Confident"] : [],
    style: generated ? "Tech" : "Minimal",
    typography: "Manrope",
    profile: generated
      ? {
          visionThemes: ["Innovation", "Simplicity"],
          missionFocus: ["Customer success", "Quality first"],
          values: ["Quality", "Simplicity"],
          archetype: "creator",
          voiceTraits: ["Warm", "Confident"],
          audienceAges: ["Adults (25-34)"],
          audienceSegments: ["Creators", "Small business"],
          audienceInterests: ["Technology"],
          positioningTier: "mainstream",
          differentiators: ["Design", "Quality"],
        }
      : {},
    colors: (generated
      ? materialRoleColors("#6750A4")
      : PALETTE_PRESETS[0]!.colors
    ).map((color) => ({ ...color, id: crypto.randomUUID().slice(0, 8) })),
    seed: "#6750A4",
    paletteTouched: generated,
    typographyTouched: generated,
  };
}

/** Only editable fields; an explicit empty profile clears previous strategy. */
export function brandKitPatchFromDraft(draft: BrandKitDialogDraft) {
  return {
    name: draft.name.trim() || "Untitled kit",
    colors: structuredClone(draft.colors),
    emotions: [...draft.emotions],
    style: draft.style,
    typography: draft.typography,
    profile: structuredClone(draft.profile),
  } satisfies Pick<
    BrandKit,
    "name" | "colors" | "emotions" | "style" | "typography" | "profile"
  >;
}
