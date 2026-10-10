import type { AssetCategoryId, AssetItem } from "./types.ts";
import { isImageKind, isTextKind, type ElementKind } from "../types.ts";

/** Role tab in the redesigned Assets panel; also drives auto-slot targeting. */
export type AssetRole =
  | "background"
  | "subject"
  | "headline"
  | "offer"
  | "cta"
  | "brand"
  | "decor";

/** Ordered for display: Background, Subject, Headline, Offer, CTA, Brand,
 * Decor. Headline also holds body/eyebrow/caption text. */
export const ASSET_ROLES: { id: AssetRole; label: string }[] = [
  { id: "background", label: "Background" },
  { id: "subject", label: "Subject" },
  { id: "headline", label: "Headline" },
  { id: "offer", label: "Offer" },
  { id: "cta", label: "CTA" },
  { id: "brand", label: "Brand" },
  { id: "decor", label: "Decor" },
];

const ASSET_ROLE_IDS = new Set<string>(ASSET_ROLES.map((role) => role.id));

export function isAssetRole(value: string): value is AssetRole {
  return ASSET_ROLE_IDS.has(value);
}

/** Role implied by an element kind alone, before any category override. */
export function roleOfKind(kind: ElementKind): AssetRole {
  if (
    kind === "title" ||
    kind === "subheading" ||
    kind === "body" ||
    kind === "eyebrow"
  )
    return "headline";
  if (kind === "offer" || kind === "price" || kind === "badge") return "offer";
  if (kind === "cta") return "cta";
  if (kind === "logo" || kind === "brandMark") return "brand";
  if (kind === "shape" || kind === "divider") return "decor";
  // heroImage, productImage, humanModelImage, supportingImage
  return "subject";
}

const DECOR_CATEGORIES = new Set<AssetCategoryId>([
  "shapes",
  "lines",
  "frames",
  "icons",
  "abstract",
]);

/** Per-id exceptions to the category/kind rules below. */
export const ROLE_OVERRIDES: Record<string, AssetRole> = {
  "text-url": "cta",
  "social-link-in-bio": "cta",
  "text-hashtag": "brand",
  "social-handle": "brand",
  "social-follower-count": "brand",
  "charts-big-stat": "headline",
  "ai-sparkle": "decor",
  "ai-chip": "decor",
  "events-confetti": "decor",
  "events-balloons": "decor",
  "seasonal-fireworks": "decor",
  "seasonal-florals": "decor",
  "events-sun-waves": "decor",
  "seasonal-sun": "decor",
  "travel-landscape": "background",
  "travel-city": "background",
  "realestate-city": "background",
};

/** `ROLE_OVERRIDES[item.id]` first; then category rules; else `roleOfKind`. */
export function roleOf(item: AssetItem): AssetRole {
  const override = ROLE_OVERRIDES[item.id];
  if (override) return override;
  if (item.category === "backgrounds") return "background";
  if (item.category === "brand") return "brand";
  if (DECOR_CATEGORIES.has(item.category)) return "decor";
  if (item.category === "scenes")
    return item.kind === "heroImage" ? "background" : "decor";
  return roleOfKind(item.kind);
}

/** Decor items (and any badge) take no slot: drop and nudge as free-float. */
export function isFreeFloat(item: AssetItem): boolean {
  return roleOf(item) === "decor" || item.kind === "badge";
}

/** How slotting an asset into an occupied role chooses what it replaces:
 * "role" matches any element of that role; "kind" also requires the same
 * element kind; "none" never replaces (decor is always free-float). */
export type RoleReplacePolicy = "role" | "kind" | "none";

export const ROLE_REPLACE: Record<AssetRole, RoleReplacePolicy> = {
  background: "role",
  subject: "role",
  cta: "role",
  headline: "kind",
  offer: "kind",
  brand: "kind",
  decor: "none",
};

export function kindFamily(
  kind: ElementKind,
): "text" | "image" | "structure" {
  if (isTextKind(kind)) return "text";
  if (isImageKind(kind)) return "image";
  return "structure";
}

/** A short, prompt-forward tile caption: the subject up to the first comma
 * or period, clamped to 60 characters, with brand-color tokens spelled out. */
export function promptSnippet(item: AssetItem): string {
  const cut = item.prompt.match(/^[^,.]*/);
  let snippet = (cut ? cut[0] : item.prompt).trim();
  snippet = snippet
    .replaceAll("$primary", "brand color")
    .replaceAll("$secondary", "brand color");
  if (snippet.length > 60) snippet = snippet.slice(0, 60).trimEnd();
  return snippet;
}
