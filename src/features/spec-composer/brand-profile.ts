import type { BrandKitColor, BrandProfile } from "./types";

/** Creative styles offered for a design kit's overall look. Shared by the
 * card editor and the one-screen builder. */
export const CREATIVE_STYLES = [
  "Minimal",
  "Editorial",
  "Bold",
  "Luxury",
  "Playful",
  "Tech",
  "Corporate",
  "Retro",
] as const;

/** Brand emotion chips. Shared by the card editor and the one-screen builder. */
export const EMOTION_PRESETS = [
  "Calm",
  "Energetic",
  "Playful",
  "Elegant",
  "Bold",
  "Confident",
  "Cheerful",
  "Mysterious",
  "Romantic",
  "Nostalgic",
  "Serene",
  "Dramatic",
] as const;

export const VISION_THEMES = [
  "Innovation",
  "Sustainability",
  "Community",
  "Craftsmanship",
  "Simplicity",
  "Empowerment",
  "Trust",
  "Excellence",
  "Accessibility",
  "Transformation",
] as const;

export const MISSION_FOCUS = [
  "Customer success",
  "Quality first",
  "Social impact",
  "Affordability",
  "Speed to market",
  "Education",
  "Inclusion",
  "Craftsmanship",
  "Sustainability",
  "Innovation",
] as const;

export const CORE_VALUES = [
  "Honesty",
  "Integrity",
  "Innovation",
  "Quality",
  "Transparency",
  "Sustainability",
  "Inclusivity",
  "Collaboration",
  "Excellence",
  "Boldness",
  "Simplicity",
  "Reliability",
] as const;

export interface Archetype {
  id: string;
  label: string;
  description: string;
}

/** The 12 classic brand archetypes (Mark & Pearson). */
export const ARCHETYPES: Archetype[] = [
  { id: "innocent", label: "The Innocent", description: "Optimistic, honest, simple" },
  { id: "everyman", label: "The Everyman", description: "Relatable, down-to-earth, belonging" },
  { id: "hero", label: "The Hero", description: "Courageous, determined, triumphant" },
  { id: "outlaw", label: "The Outlaw", description: "Rebellious, disruptive, free" },
  { id: "explorer", label: "The Explorer", description: "Adventurous, independent, pioneering" },
  { id: "creator", label: "The Creator", description: "Imaginative, expressive, original" },
  { id: "ruler", label: "The Ruler", description: "Authoritative, polished, in control" },
  { id: "magician", label: "The Magician", description: "Visionary, transformative, inventive" },
  { id: "lover", label: "The Lover", description: "Passionate, intimate, sensory" },
  { id: "caregiver", label: "The Caregiver", description: "Nurturing, generous, compassionate" },
  { id: "jester", label: "The Jester", description: "Playful, witty, joyful" },
  { id: "sage", label: "The Sage", description: "Wise, thoughtful, truth-seeking" },
];

export interface BipolarAxis {
  id: string;
  left: string;
  right: string;
}

/** Personality sliders: 0 = left pole, 100 = right pole, 50 = neutral. */
export const PERSONALITY_AXES: BipolarAxis[] = [
  { id: "classicModern", left: "Classic", right: "Modern" },
  { id: "playfulSerious", left: "Playful", right: "Serious" },
  { id: "friendlyAuthoritative", left: "Friendly", right: "Authoritative" },
  { id: "understatedBold", left: "Understated", right: "Bold" },
  { id: "youthfulMature", left: "Youthful", right: "Mature" },
];

export const AUDIENCE_AGES = [
  "Teens (13-17)",
  "Young adults (18-24)",
  "Adults (25-34)",
  "Established adults (35-49)",
  "Mature adults (50-64)",
  "Seniors (65+)",
] as const;

export const AUDIENCE_SEGMENTS = [
  "B2C",
  "B2B",
  "Gen Z",
  "Millennials",
  "Parents",
  "Students",
  "Professionals",
  "Enterprises",
  "Small business",
  "Creators",
] as const;

export const AUDIENCE_INTERESTS = [
  "Technology",
  "Fashion",
  "Wellness",
  "Finance",
  "Travel",
  "Food & drink",
  "Sustainability",
  "Gaming",
  "Fitness",
  "Home & living",
  "Beauty",
  "Education",
] as const;

export interface PositioningTier {
  id: string;
  label: string;
  description: string;
}

export const POSITIONING_TIERS: PositioningTier[] = [
  { id: "budget", label: "Budget", description: "Lowest price, highest accessibility" },
  { id: "mainstream", label: "Mainstream", description: "Good value for most buyers" },
  { id: "premium", label: "Premium", description: "Higher quality, higher price" },
  { id: "luxury", label: "Luxury", description: "Exclusive, aspirational, top-tier" },
];

export const DIFFERENTIATORS = [
  "Price",
  "Quality",
  "Speed",
  "Sustainability",
  "Craftsmanship",
  "Innovation",
  "Service",
  "Convenience",
  "Design",
  "Heritage",
] as const;

/** Voice sliders: 0 = left pole, 100 = right pole, 50 = neutral. */
export const VOICE_AXES: BipolarAxis[] = [
  { id: "formalCasual", left: "Formal", right: "Casual" },
  { id: "seriousFunny", left: "Serious", right: "Funny" },
  { id: "respectfulIrreverent", left: "Respectful", right: "Irreverent" },
  { id: "matterOfFactEnthusiastic", left: "Matter-of-fact", right: "Enthusiastic" },
];

export const VOICE_TRAITS = [
  "Warm",
  "Witty",
  "Confident",
  "Direct",
  "Playful",
  "Authoritative",
  "Empathetic",
  "Bold",
  "Reassuring",
  "Inspiring",
] as const;

const PRESET_ROLE_USECASE: Record<BrandKitColor["role"], string> = {
  primary: "Headlines, Buttons",
  secondary: "Subheadings, Highlights",
  background: "Canvas",
  text: "Headings, Body text",
  accent: "Accents",
};

export interface PalettePreset {
  name: string;
  colors: BrandKitColor[];
}

function palette(
  name: string,
  hexes: Record<BrandKitColor["role"], string>,
): PalettePreset {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return {
    name,
    colors: (
      Object.entries(hexes) as [BrandKitColor["role"], string][]
    ).map(([role, hex]) => ({
      id: `${slug}-${role}`,
      hex,
      secondaryHex: hex,
      angle: 135,
      type: "solid",
      role,
      usecase: PRESET_ROLE_USECASE[role],
    })),
  };
}

/** Named starting palettes offered in the Color Palette section of the builder. */
export const PALETTE_PRESETS: PalettePreset[] = [
  palette("Warm Minimal", {
    primary: "#C55454",
    secondary: "#D9A15B",
    background: "#EFE9DE",
    text: "#141413",
    accent: "#8B5CF6",
  }),
  palette("Ocean Calm", {
    primary: "#2563EB",
    secondary: "#38BDF8",
    background: "#F0F9FF",
    text: "#0F172A",
    accent: "#F59E0B",
  }),
  palette("Forest Craft", {
    primary: "#2F6B4F",
    secondary: "#8FA998",
    background: "#F3F1E7",
    text: "#1C2B22",
    accent: "#D97706",
  }),
  palette("Luxury Noir", {
    primary: "#D4AF37",
    secondary: "#8C8C8C",
    background: "#111111",
    text: "#F5F5F5",
    accent: "#B91C1C",
  }),
  palette("Playful Pop", {
    primary: "#FF4D6D",
    secondary: "#FFD166",
    background: "#FFFFFF",
    text: "#1B1B1F",
    accent: "#06D6A0",
  }),
  palette("Tech Mono", {
    primary: "#3B82F6",
    secondary: "#A855F7",
    background: "#0B0F19",
    text: "#E5E7EB",
    accent: "#22D3EE",
  }),
  palette("Soft Pastel", {
    primary: "#F3A5C0",
    secondary: "#A7C7E7",
    background: "#FFF8F0",
    text: "#3A3A3A",
    accent: "#C3B1E1",
  }),
  palette("Earthy Neutral", {
    primary: "#A1664B",
    secondary: "#C9A66B",
    background: "#EDE6DA",
    text: "#2B2420",
    accent: "#6B8E6E",
  }),
  palette("Clean Mono", {
    primary: "#171717",
    secondary: "#737373",
    background: "#FAFAFA",
    text: "#171717",
    accent: "#C55454",
  }),
  palette("Slate Studio", {
    primary: "#93C5FD",
    secondary: "#94A3B8",
    background: "#151B26",
    text: "#F1F5F9",
    accent: "#FBBF24",
  }),
  palette("Crimson Ink", {
    primary: "#B91C1C",
    secondary: "#78716C",
    background: "#FAF7F5",
    text: "#201A1A",
    accent: "#D97706",
  }),
  palette("Citrus Fresh", {
    primary: "#3F6212",
    secondary: "#A3E635",
    background: "#F7FEE7",
    text: "#1A2E05",
    accent: "#F97316",
  }),
  palette("Lavender Editorial", {
    primary: "#6D28D9",
    secondary: "#A78BFA",
    background: "#F5F3FF",
    text: "#2E1065",
    accent: "#DB2777",
  }),
  palette("Coastal Sand", {
    primary: "#0F766E",
    secondary: "#D6B78C",
    background: "#FAF5EC",
    text: "#203632",
    accent: "#E76F51",
  }),
  palette("Midnight Berry", {
    primary: "#F472B6",
    secondary: "#C4B5FD",
    background: "#211526",
    text: "#FAF5FF",
    accent: "#FBBF24",
  }),
  palette("Terracotta Sky", {
    primary: "#C65D3B",
    secondary: "#7CA6B8",
    background: "#FFF7ED",
    text: "#35251F",
    accent: "#667A45",
  }),
];

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length ? strings : undefined;
};

const toTrimmedString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const toSliderMap = (value: unknown): Record<string, number> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "number" && Number.isFinite(raw))
      out[key] = Math.min(100, Math.max(0, raw));
  }
  return Object.keys(out).length ? out : undefined;
};

/** Validates and back-fills a stored/imported brand profile. Non-objects
 * normalize to `undefined`; array fields drop non-string entries; sliders
 * clamp to 0-100 and drop non-numbers. Returns `undefined` when nothing
 * meaningful is left, so empty profiles never round-trip through storage. */
export function normalizeBrandProfile(value: unknown): BrandProfile | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const v = value as Record<string, unknown>;
  const profile: BrandProfile = {
    visionThemes: toStringArray(v["visionThemes"]),
    vision: toTrimmedString(v["vision"]),
    missionFocus: toStringArray(v["missionFocus"]),
    mission: toTrimmedString(v["mission"]),
    values: toStringArray(v["values"]),
    archetype: toTrimmedString(v["archetype"]),
    personality: toSliderMap(v["personality"]),
    audienceAges: toStringArray(v["audienceAges"]),
    audienceSegments: toStringArray(v["audienceSegments"]),
    audienceInterests: toStringArray(v["audienceInterests"]),
    audience: toTrimmedString(v["audience"]),
    positioningTier: toTrimmedString(v["positioningTier"]),
    differentiators: toStringArray(v["differentiators"]),
    positioning: toTrimmedString(v["positioning"]),
    voiceTone: toSliderMap(v["voiceTone"]),
    voiceTraits: toStringArray(v["voiceTraits"]),
  };
  for (const key of Object.keys(profile) as (keyof BrandProfile)[])
    if (profile[key] === undefined) delete profile[key];
  return Object.keys(profile).length ? profile : undefined;
}

export function isBrandProfileEmpty(profile?: BrandProfile): boolean {
  if (!profile) return true;
  return Object.values(profile).every((value) => {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    if (typeof value === "string") return value.trim() === "";
    return false;
  });
}

/** How many of the 9 brand-strategy sections have anything in them, for the
 * builder's "x of 9 sections filled" counter. A slider only counts once
 * it's been moved off its neutral 50; palette/typography only count once
 * the caller marks them touched (so defaults don't inflate the count).
 * Personality and voice share one "Personality & voice" section. */
export function countFilledSections(input: {
  profile: BrandProfile;
  emotions: string[];
  paletteTouched: boolean;
  typographyTouched: boolean;
}): number {
  const p = input.profile;
  const touched = (values: Record<string, number> | undefined) =>
    !!values && Object.values(values).some((v) => v !== 50);
  const checks = [
    !!(p.visionThemes?.length || p.vision?.trim()),
    !!(p.missionFocus?.length || p.mission?.trim()),
    !!p.values?.length,
    !!input.emotions.length,
    !!(
      p.archetype ||
      touched(p.personality) ||
      p.voiceTraits?.length ||
      touched(p.voiceTone)
    ),
    !!(
      p.audienceAges?.length ||
      p.audienceSegments?.length ||
      p.audienceInterests?.length ||
      p.audience?.trim()
    ),
    !!(p.positioningTier || p.differentiators?.length || p.positioning?.trim()),
    input.paletteTouched,
    input.typographyTouched,
  ];
  return checks.filter(Boolean).length;
}

/** Total number of sections `countFilledSections` can report as filled. */
export const FILLED_SECTION_TOTAL = 9;

function fieldSentence(
  label: string,
  chips: string[] | undefined,
  note: string | undefined,
): string | undefined {
  const parts = [
    chips?.length ? chips.join(", ") : undefined,
    note?.trim() || undefined,
  ].filter((part): part is string => !!part);
  if (!parts.length) return undefined;
  return `${label}: ${parts.join(" — ")}.`;
}

/** Maps slider values to their pole word: <35 -> left pole, >65 -> right
 * pole, in between is neutral and omitted. */
function axisDescriptors(
  axes: BipolarAxis[],
  values: Record<string, number> | undefined,
): string[] {
  if (!values) return [];
  const out: string[] = [];
  for (const axis of axes) {
    const value = values[axis.id];
    if (value == null) continue;
    if (value < 35) out.push(axis.left);
    else if (value > 65) out.push(axis.right);
  }
  return out;
}

/**
 * One sentence per filled field of the brand profile, for the compiled
 * visual prompt / DESIGN.md "Brand identity" block. Emotion, palette and
 * typography already have their own lines elsewhere and are not repeated.
 */
export function brandProfileLines(profile?: BrandProfile): string[] {
  if (!profile) return [];
  const lines: string[] = [];

  const vision = fieldSentence("Vision", profile.visionThemes, profile.vision);
  if (vision) lines.push(vision);

  const mission = fieldSentence(
    "Mission",
    profile.missionFocus,
    profile.mission,
  );
  if (mission) lines.push(mission);

  if (profile.values?.length)
    lines.push(`Core values: ${profile.values.join(", ")}.`);

  const archetypeLabel = profile.archetype
    ? ARCHETYPES.find((a) => a.id === profile.archetype)?.label ??
      profile.archetype
    : undefined;
  const personalityWords = axisDescriptors(PERSONALITY_AXES, profile.personality);
  if (archetypeLabel || personalityWords.length)
    lines.push(
      `Personality: ${[archetypeLabel, ...personalityWords].filter(Boolean).join(", ")}.`,
    );

  const audienceChips = [
    ...(profile.audienceAges ?? []),
    ...(profile.audienceSegments ?? []),
    ...(profile.audienceInterests ?? []),
  ];
  const audience = fieldSentence(
    "Target audience",
    audienceChips,
    profile.audience,
  );
  if (audience) lines.push(audience);

  const tierLabel = profile.positioningTier
    ? POSITIONING_TIERS.find((t) => t.id === profile.positioningTier)?.label ??
      profile.positioningTier
    : undefined;
  const positioningChips = [
    ...(tierLabel ? [tierLabel] : []),
    ...(profile.differentiators ?? []),
  ];
  const positioning = fieldSentence(
    "Positioning",
    positioningChips,
    profile.positioning,
  );
  if (positioning) lines.push(positioning);

  const voiceWords = axisDescriptors(VOICE_AXES, profile.voiceTone);
  const voiceChips = [...voiceWords, ...(profile.voiceTraits ?? [])];
  if (voiceChips.length) lines.push(`Voice: ${voiceChips.join(", ")}.`);

  return lines;
}
