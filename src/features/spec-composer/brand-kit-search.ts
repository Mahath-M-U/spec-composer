import type { BrandKit } from "./types";

/**
 * True when every whitespace-separated word of `query` appears in the kit's
 * name, style, typography, emotions, colour hex values, or brand profile
 * (core values, archetype, voice traits, audience ages/segments/interests)
 * (case-insensitive). An empty query matches every kit.
 */
export function matchesBrandKitQuery(kit: BrandKit, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const p = kit.profile;
  const haystack = [
    kit.name,
    kit.style,
    kit.typography,
    kit.emotions.join(" "),
    ...kit.colors.map((color) => color.hex),
    ...(p?.values ?? []),
    p?.archetype ?? "",
    ...(p?.voiceTraits ?? []),
    ...(p?.audienceAges ?? []),
    ...(p?.audienceSegments ?? []),
    ...(p?.audienceInterests ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return trimmed.split(/\s+/).every((term) => haystack.includes(term));
}

/**
 * Returns a new array with the active kit (if any) moved to index 0, keeping
 * the relative order of every other kit unchanged. Does not mutate `kits`.
 * When `activeId` is undefined or doesn't match any kit, the order is
 * unchanged.
 */
export function orderBrandKitsActiveFirst(
  kits: BrandKit[],
  activeId?: string,
): BrandKit[] {
  if (!activeId) return [...kits];
  const activeIndex = kits.findIndex((kit) => kit.id === activeId);
  if (activeIndex <= 0) return [...kits];
  const active = kits[activeIndex]!;
  return [
    active,
    ...kits.slice(0, activeIndex),
    ...kits.slice(activeIndex + 1),
  ];
}
