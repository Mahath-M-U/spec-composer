import type { ArtDirection, SpecDocument } from "./types.ts";

export type ArtDirectionField = {
  key: keyof ArtDirection;
  /** The field's label in the sidebar and the design.md bullet. */
  label: string;
  /** The field's label in the compiled prompt line, e.g. "Subject: …". */
  promptLabel: string;
  placeholder: string;
  presets: readonly string[];
  /** Whether this field also appears in the compiled DESIGN.md. */
  design: boolean;
};

/** The 8-field creative brief's prompt-only and style-level fields (aspect
 * ratio and brand tone are covered by Format and Mood already). Order
 * matters: it's the order fields render in and compile in. */
export const ART_DIRECTION_FIELDS: readonly ArtDirectionField[] = [
  {
    key: "subject",
    label: "Product or subject",
    promptLabel: "Subject",
    placeholder: "e.g. Amber glass serum bottle",
    presets: [],
    design: false,
  },
  {
    key: "scene",
    label: "Scene",
    promptLabel: "Scene",
    placeholder: "e.g. On a marble countertop with morning light",
    presets: [],
    design: true,
  },
  {
    key: "lighting",
    label: "Lighting",
    promptLabel: "Lighting",
    placeholder: "e.g. Soft directional window light",
    presets: [
      "Natural daylight",
      "Soft studio light",
      "High-contrast flash",
      "Cinematic light",
    ],
    design: true,
  },
  {
    key: "composition",
    label: "Composition",
    promptLabel: "Composition",
    placeholder: "e.g. Centered, slight angle",
    presets: [
      "Centered product shot",
      "Lifestyle angle",
      "Hero banner",
      "Close-up",
      "Split layout",
    ],
    design: true,
  },
  {
    key: "material",
    label: "Material and texture",
    promptLabel: "Materials and texture",
    placeholder: "e.g. Brushed aluminum, soft fabric",
    presets: [
      "Matte packaging",
      "Stainless steel",
      "Glossy makeup",
      "Fabric weave",
      "Condensation",
      "Paper stock",
    ],
    design: true,
  },
  {
    key: "textLayout",
    label: "Text layout",
    promptLabel: "Text layout",
    placeholder: "e.g. Large bold title, small caption below",
    presets: [
      "Big title",
      "Feature callouts",
      "Product labels",
      "Sticker-style tags",
      "Clean editorial type",
    ],
    design: true,
  },
] as const;

/** Preset chips for the Mood field, refining it as a brand-tone picker.
 * Lower-case, since `TagsControl` lower-cases every tag it stores. */
export const BRAND_TONES = [
  "minimal",
  "premium",
  "playful",
  "clean",
  "youthful",
  "technical",
  "wellness-focused",
  "luxury",
] as const;

const trimmed = (value: string | undefined) =>
  value?.trim().replace(/[.\s]+$/, "") ?? "";

/** The art-direction fields as a prompt paragraph, e.g. "Scene: … Lighting:
 * …." Empty fields add nothing; an unset `artDirection` yields "". */
export function artDirectionLine(
  doc: Pick<SpecDocument, "artDirection">,
): string {
  const ad = doc.artDirection;
  if (!ad) return "";
  return ART_DIRECTION_FIELDS.map((f) => {
    const value = trimmed(ad[f.key]);
    return value ? `${f.promptLabel}: ${value}.` : "";
  })
    .filter((line) => line.length > 0)
    .join(" ");
}

/** The style-level art-direction fields (everything but Subject) as
 * DESIGN.md bullet lines. Returns "" when none are set. */
export function artDirectionDesignSection(
  doc: Pick<SpecDocument, "artDirection">,
): string {
  const ad = doc.artDirection;
  if (!ad) return "";
  return ART_DIRECTION_FIELDS.filter((f) => f.design)
    .map((f) => {
      const value = trimmed(ad[f.key]);
      return value ? `- **${f.label}:** ${value}` : "";
    })
    .filter((line) => line.length > 0)
    .join("\n");
}

/** Toggles `preset` within a comma-separated free-text field: removes it
 * (case-insensitively) if present, else appends it, leaving any other text
 * in place. */
export function togglePreset(value: string, preset: string): string {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const i = parts.findIndex((p) => p.toLowerCase() === preset.toLowerCase());
  if (i >= 0) parts.splice(i, 1);
  else parts.push(preset);
  return parts.join(", ");
}
