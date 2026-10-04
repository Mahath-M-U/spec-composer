import type { SpecDocument, SpecElement } from "./types.ts";

export type ArtFieldKey = "scene" | "lighting";
export const ART_FIELD_KEYS = ["scene", "lighting"] as const;

export function isArtFieldKey(key: string): key is ArtFieldKey {
  return (ART_FIELD_KEYS as readonly string[]).includes(key);
}

/** Scene and Lighting: their own prompt.md and design.md sections, each free
 * text with preset chips. Order matters: it's the order they render and
 * compile in. */
export const ART_FIELDS: Record<
  ArtFieldKey,
  { label: string; placeholder: string; presets: readonly string[] }
> = {
  scene: {
    label: "Scene",
    placeholder: "e.g. On a marble countertop by a sunny window",
    presets: [
      "Seamless studio backdrop",
      "Marble countertop",
      "Abstract podium",
      "Outdoor nature",
      "Urban street",
      "Cozy interior",
    ],
  },
  lighting: {
    label: "Lighting",
    placeholder: "e.g. Soft directional window light",
    presets: [
      "Natural daylight",
      "Soft studio light",
      "High-contrast flash",
      "Cinematic light",
    ],
  },
};

/** Preset chips for an element's Material and texture field. */
export const MATERIAL_PRESETS = [
  "Matte packaging",
  "Stainless steel",
  "Glossy makeup",
  "Fabric weave",
  "Condensation",
  "Paper stock",
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

/** Trims a free-text value and drops a trailing period, so callers can
 * append their own without doubling it. */
export const artValue = (value?: string): string =>
  value?.trim().replace(/[.\s]+$/, "") ?? "";

/** One art field as its own prompt paragraph / design.md line, e.g.
 * "Scene: On a marble countertop.". Returns "" when unset. */
export function artLine(
  doc: Pick<SpecDocument, ArtFieldKey>,
  key: ArtFieldKey,
): string {
  const value = artValue(doc[key]);
  return value ? `${ART_FIELDS[key].label}: ${value}.` : "";
}

/** Sets (or clears, when blank) one top-level art field. */
export function setArtField(
  doc: Pick<SpecDocument, ArtFieldKey>,
  key: ArtFieldKey,
  value: string,
): void {
  if (value.trim()) doc[key] = value;
  else delete doc[key];
}

/** An element's material/texture as a trailing prompt phrase, e.g. " Material
 * and texture: Stainless steel.". Returns "" when unset. */
export function materialPhrase(el: Pick<SpecElement, "material">): string {
  const value = artValue(el.material);
  return value ? ` Material and texture: ${value}.` : "";
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

/** Whether `preset` is present in a comma-separated free-text field,
 * case-insensitively. */
export function hasPreset(value: string, preset: string): boolean {
  return value
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .includes(preset.toLowerCase());
}

/** Sections with their own "include in output" switch: off keeps the stored
 * value but drops it from both prompt.md and design.md. */
export const OPTIONAL_SECTIONS = ["mood", "scene", "lighting"] as const;
export type OptionalSection = (typeof OPTIONAL_SECTIONS)[number];

export const OPTIONAL_SECTION_LABEL: Record<OptionalSection, string> = {
  mood: "Mood",
  scene: "Scene",
  lighting: "Lighting",
};

/** Maps a prompt.md/design.md line key to the optional section it belongs
 * to — e.g. "scene" and "skill:scene" both map to "scene" — or undefined
 * for keys with no on/off switch. */
export function optionalSectionOf(key: string): OptionalSection | undefined {
  const bare = key.startsWith("skill:") ? key.slice("skill:".length) : key;
  return (OPTIONAL_SECTIONS as readonly string[]).includes(bare)
    ? (bare as OptionalSection)
    : undefined;
}

/** Whether an optional section's output switch is on. */
export function isSectionIncluded(
  doc: Pick<SpecDocument, "promptOptions">,
  section: OptionalSection,
): boolean {
  return doc.promptOptions[section] === true;
}

/** Flips one optional section's include switch, in place. */
export function setSectionIncluded(
  doc: Pick<SpecDocument, "promptOptions">,
  section: OptionalSection,
  on: boolean,
): void {
  doc.promptOptions[section] = on;
}
