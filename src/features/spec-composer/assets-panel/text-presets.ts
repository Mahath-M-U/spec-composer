import type { SpecElement, TextKind } from "../types";

type TextPreset = {
  id: string;
  label: string;
  sample: string;
  kind: TextKind;
  patch?: Partial<SpecElement>;
};

export const PRIMARY_TEXT_PRESETS = [
  { id: "headline", label: "Headline", sample: "H1", kind: "title" },
  { id: "subheading", label: "Subheading", sample: "H2", kind: "subheading" },
  { id: "body", label: "Body copy", sample: "Aa", kind: "body" },
  {
    id: "caption",
    label: "Caption",
    sample: "Aa",
    kind: "body",
    patch: { name: "Caption", content: "Caption" },
  },
] as const satisfies readonly TextPreset[];

export const MORE_TEXT_PRESETS = [
  { id: "eyebrow", label: "Eyebrow", sample: "Aa", kind: "eyebrow" },
  { id: "offer", label: "Offer", sample: "%", kind: "offer" },
  { id: "price", label: "Price", sample: "$", kind: "price" },
  { id: "badge", label: "Badge", sample: "Aa", kind: "badge" },
  { id: "cta", label: "Call to action", sample: "Go", kind: "cta" },
] as const satisfies readonly TextPreset[];

export function findTextPreset(id: string): TextPreset | undefined {
  return [...PRIMARY_TEXT_PRESETS, ...MORE_TEXT_PRESETS].find(
    (preset) => preset.id === id,
  );
}
