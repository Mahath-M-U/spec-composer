import type { BrandKit } from "./types";

/**
 * True when every whitespace-separated word of `query` appears in the kit's
 * name, style, typography, emotions or colour hex values (case-insensitive).
 * An empty query matches every kit.
 */
export function matchesBrandKitQuery(kit: BrandKit, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const haystack = [
    kit.name,
    kit.style,
    kit.typography,
    kit.emotions.join(" "),
    ...kit.colors.map((color) => color.hex),
  ]
    .join(" ")
    .toLowerCase();
  return trimmed.split(/\s+/).every((term) => haystack.includes(term));
}
