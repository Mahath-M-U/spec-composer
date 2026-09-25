import { CATEGORIES } from "./categories.ts";
import { textItems } from "./items/text.ts";
import { promoItems } from "./items/promo.ts";
import { uiItems } from "./items/ui.ts";
import { aiItems } from "./items/ai.ts";
import { elementsItems } from "./items/elements.ts";
import { peopleItems } from "./items/people.ts";
import { scenesItems } from "./items/scenes.ts";
import { topicsItems } from "./items/topics.ts";
import type {
  AssetCategory,
  AssetCategoryId,
  AssetCollectionId,
  AssetItem,
  AssetSize,
} from "./types.ts";
import type { ElementKind, SpecElement } from "../types.ts";

export type { AssetCategory, AssetCategoryId, AssetCollectionId, AssetItem };

/** The full built-in catalog, in display order within each category. */
export const ASSET_CATALOG: AssetItem[] = [
  ...textItems,
  ...promoItems,
  ...uiItems,
  ...aiItems,
  ...elementsItems,
  ...peopleItems,
  ...scenesItems,
  ...topicsItems,
];

export { CATEGORIES };

/** Character-count rules enforced by tests/asset-catalog.test.mjs. */
export const PROMPT_LIMITS = {
  aiDescription: { min: 60, max: 400 },
  positiveConstraint: { min: 40, max: 260 },
} as const;

/**
 * Brands, trademarks, product names, AI vendors, stock sites and
 * franchises kept out of item labels, prompts and content. Tags are
 * exempt: search vocabulary isn't compiled into a prompt.
 */
export const BANNED_TERMS = [
  "apple",
  "iphone",
  "ipad",
  "macbook",
  "android",
  "samsung",
  "galaxy",
  "google",
  "instagram",
  "facebook",
  "whatsapp",
  "tiktok",
  "youtube",
  "snapchat",
  "pinterest",
  "linkedin",
  "twitter",
  "chatgpt",
  "openai",
  "gpt",
  "claude",
  "anthropic",
  "gemini",
  "copilot",
  "siri",
  "alexa",
  "nike",
  "adidas",
  "starbucks",
  "amazon",
  "netflix",
  "spotify",
  "uber",
  "airbnb",
  "bitcoin",
  "ethereum",
  "visa",
  "mastercard",
  "paypal",
  "stripe",
  "figma",
  "canva",
  "unsplash",
  "kittl",
  "disney",
  "marvel",
  "lego",
] as const;

const byId = new Map(ASSET_CATALOG.map((item) => [item.id, item]));
const categoryById = new Map(
  CATEGORIES.map((category) => [category.id, category]),
);

export function findAssetItem(id: string): AssetItem | undefined {
  return byId.get(id);
}

export function itemsInCategory(category: AssetCategoryId): AssetItem[] {
  return ASSET_CATALOG.filter((item) => item.category === category);
}

export function categoriesInCollection(
  collection: AssetCollectionId,
): AssetCategory[] {
  return CATEGORIES.filter((category) => category.collection === collection);
}

const PHOTO_KINDS = new Set<ElementKind>([
  "heroImage",
  "productImage",
  "humanModelImage",
  "supportingImage",
]);

/** Which compiled field an item's prompt is written to. */
export function promptFieldFor(
  kind: ElementKind,
): "aiDescription" | "positiveConstraint" {
  return PHOTO_KINDS.has(kind) ? "aiDescription" : "positiveConstraint";
}

/* --------------------------- resolveAssetPatch --------------------------- */

export interface AssetContext {
  format: { width: number; height: number };
  colors: { primary: string; secondary: string };
}

export interface ResolvedAsset {
  patch: Partial<SpecElement>;
  atBack: boolean;
}

function substituteTokens(
  value: string,
  colors: AssetContext["colors"],
): string {
  return value
    .replaceAll("$primary", colors.primary)
    .replaceAll("$secondary", colors.secondary);
}

function resolveStyle(
  style: AssetItem["style"],
  colors: AssetContext["colors"],
): AssetItem["style"] | undefined {
  if (!style) return undefined;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(style)) {
    next[key] =
      typeof value === "string" ? substituteTokens(value, colors) : value;
  }
  return next as AssetItem["style"];
}

/**
 * Derives a pixel width/height from an item's fractional `size`, then scales
 * the result down (preserving aspect) to fit within 0.95 × the format.
 */
function resolveSize(
  size: AssetSize | undefined,
  format: AssetContext["format"],
): { width?: number; height?: number } {
  if (!size) return {};
  let width: number | undefined;
  let height: number | undefined;

  if (size.w !== undefined) {
    width = Math.round(format.width * size.w);
    height =
      size.h !== undefined
        ? Math.round(format.height * size.h)
        : size.aspect !== undefined
          ? Math.round(width / size.aspect)
          : undefined;
  } else if (size.h !== undefined) {
    height = Math.round(format.height * size.h);
    width =
      size.aspect !== undefined ? Math.round(height * size.aspect) : undefined;
  }

  if (width === undefined || height === undefined) {
    return {
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
    };
  }

  const maxWidth = format.width * 0.95;
  const maxHeight = format.height * 0.95;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  if (scale < 1) {
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  return { width, height };
}

/** Compact catalog copy should occupy a chip or button, not the generic
 * 40%-wide text box used when adding a bare element from the toolbar. */
function compactTextSize(
  item: AssetItem,
  format: AssetContext["format"],
): { width: number; height: number; scale: number } | undefined {
  if (
    item.size ||
    !item.content ||
    !["eyebrow", "offer", "price", "badge", "cta"].includes(item.kind)
  )
    return undefined;

  const fontSize = item.style?.fontSize ?? 28;
  const letterSpacing = item.style?.letterSpacing ?? 0;
  const lines = item.content.split("\n");
  const textWidth = Math.max(
    ...lines.map((line) =>
      Array.from(line).reduce((width, character) => {
        const glyphWidth = /\s/.test(character)
          ? 0.34
          : /[ilI.,:!|]/.test(character)
            ? 0.38
            : /[MW@%]/.test(character)
              ? 0.95
              : 0.7;
        return width + fontSize * glyphWidth + letterSpacing;
      }, 0),
    ),
  );
  const width = Math.ceil(textWidth * 1.08 + Math.max(24, fontSize * 1.1));
  const height = Math.ceil(
    lines.length * fontSize * (item.style?.lineHeight ?? 1.15) +
      Math.max(12, fontSize * 0.6),
  );
  const scale = Math.min(
    1,
    (format.width * 0.95) / width,
    (format.height * 0.95) / height,
  );
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}

/**
 * Builds the `Partial<SpecElement>` patch `addElement` already accepts, from
 * a catalog item and the target document's format and brand colors. Never
 * mutates `item`.
 */
export function resolveAssetPatch(
  item: AssetItem,
  ctx: AssetContext,
): ResolvedAsset {
  const patch: Partial<SpecElement> = { name: item.label };

  if (item.art !== undefined) patch.placeholderArt = item.art;
  if (item.content !== undefined) patch.content = item.content;
  if (item.rotation !== undefined) patch.rotation = item.rotation;

  const style = resolveStyle(item.style, ctx.colors);
  if (style) patch.style = style;

  const prompt = substituteTokens(item.prompt, ctx.colors);
  if (promptFieldFor(item.kind) === "aiDescription")
    patch.aiDescription = prompt;
  else patch.constraint = { positiveConstraint: prompt };

  if (item.placement === "fill") {
    patch.x = 0;
    patch.y = 0;
    patch.width = ctx.format.width;
    patch.height = ctx.format.height;
    return { patch, atBack: true };
  }

  const { width, height } = resolveSize(item.size, ctx.format);
  if (width !== undefined) patch.width = width;
  if (height !== undefined) patch.height = height;

  const compact = compactTextSize(item, ctx.format);
  if (compact) {
    patch.width = compact.width;
    patch.height = compact.height;
    patch.style = {
      ...style,
      alignment: style?.alignment ?? "center",
      ...(compact.scale < 1 && style?.fontSize
        ? { fontSize: style.fontSize * compact.scale }
        : {}),
    };
  }

  return { patch, atBack: false };
}

/* ------------------------------ searchAssets ------------------------------ */

const SEARCH_SYNONYMS: Record<string, string[]> = {
  mockup: ["device", "phone", "laptop"],
  ai: ["agent", "assistant", "bot", "llm"],
  button: ["cta"],
  discount: ["sale", "offer"],
  website: ["web", "browser", "landing"],
  phone: ["mobile", "smartphone"],
  graph: ["chart"],
};

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function expandTerm(term: string): string[] {
  return [term, ...(SEARCH_SYNONYMS[term] ?? [])];
}

/** -1 means the variant didn't match at all; 0+ is a match score. */
function scoreVariant(
  item: AssetItem,
  category: AssetCategory | undefined,
  variant: string,
): number {
  const label = normalize(item.label);
  const words = label.split(/\s+/).filter(Boolean);
  const tags = item.tags.map(normalize);
  const categoryLabel = normalize(item.category);
  const collection = normalize(category?.collection ?? "");
  const kind = normalize(item.kind);

  let score = 0;
  let matched = false;
  if (label.startsWith(variant)) {
    score += 100;
    matched = true;
  }
  if (words.some((word) => word.startsWith(variant))) {
    score += 30;
    matched = true;
  }
  if (tags.includes(variant)) {
    score += 20;
    matched = true;
  }
  if (tags.some((tag) => tag.startsWith(variant))) {
    score += 10;
    matched = true;
  }
  if (categoryLabel === variant || categoryLabel.startsWith(variant)) {
    score += 5;
    matched = true;
  }
  if (!matched && (collection === variant || kind === variant)) matched = true;
  return matched ? score : -1;
}

/**
 * Every query term must match (label, tags, category, collection or kind),
 * expanded through SEARCH_SYNONYMS. Results are ranked by the summed score
 * plus a curated-popularity bonus, capped at 80 items. An empty query
 * returns [].
 */
export function searchAssets(query: string): AssetItem[] {
  const normalized = normalize(query).trim();
  if (!normalized) return [];
  const terms = normalized.split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const results: { item: AssetItem; score: number }[] = [];
  for (const item of ASSET_CATALOG) {
    const category = categoryById.get(item.category);
    let total = 0;
    let matchesAllTerms = true;
    for (const term of terms) {
      let best = -1;
      for (const variant of expandTerm(term)) {
        const score = scoreVariant(item, category, variant);
        if (score > best) best = score;
      }
      if (best < 0) {
        matchesAllTerms = false;
        break;
      }
      total += best;
    }
    if (!matchesAllTerms) continue;
    total += item.popularRank ? Math.max(0, 20 - item.popularRank) : 0;
    results.push({ item, score: total });
  }

  results.sort(
    (a, b) =>
      b.score - a.score ||
      (a.item.popularRank ?? Number.MAX_SAFE_INTEGER) -
        (b.item.popularRank ?? Number.MAX_SAFE_INTEGER) ||
      a.item.label.localeCompare(b.item.label),
  );
  return results.slice(0, 80).map((result) => result.item);
}
