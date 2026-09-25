import type { ArtKey } from "../motif-keys.ts";
import type { ElementKind, ElementStyle } from "../types.ts";

/** Top-level tab in the redesigned Assets panel. */
export type AssetCollectionId =
  "all" | "text" | "ui" | "ai" | "elements" | "imagery";

/** A section within a collection. Every category belongs to exactly one collection. */
export type AssetCategoryId =
  | "text"
  | "promo"
  | "devices"
  | "mobile"
  | "web"
  | "ai"
  | "social"
  | "charts"
  | "shapes"
  | "lines"
  | "frames"
  | "icons"
  | "backgrounds"
  | "abstract"
  | "brand"
  | "people"
  | "scenes"
  | "business"
  | "food"
  | "fashion"
  | "tech"
  | "events"
  | "seasonal"
  | "education"
  | "health"
  | "travel"
  | "realestate"
  | "finance";

export interface AssetCategory {
  id: AssetCategoryId;
  label: string;
  collection: AssetCollectionId;
}

/** Fractional size hint, relative to the target format's width/height. */
export interface AssetSize {
  w?: number;
  h?: number;
  /** width / height; used with `h` to derive `w`, or with `w` to derive `h`. */
  aspect?: number;
}

/**
 * One built-in catalog entry: a preset over an existing `ElementKind`, never
 * a schema change. `resolveAssetPatch` turns this into the
 * `Partial<SpecElement>` patch that `addElement` already accepts.
 */
export interface AssetItem {
  /** Stable id, `{category}-{slug}`. Persisted in usage storage: never rename. */
  id: string;
  /** <= 28 characters; becomes `element.name`, so it must carry no trademarks. */
  label: string;
  category: AssetCategoryId;
  kind: ElementKind;
  /** 3-10 search-only terms; never compiled into a prompt. */
  tags: string[];
  /** A unique, prompt-friendly description. See PROMPT_LIMITS and the rules in asset-catalog/index.ts. */
  prompt: string;
  /** Placeholder-art motif key, optionally with a ":silhouette" suffix. */
  art?: ArtKey;
  content?: string;
  /** May contain "$primary" / "$secondary" tokens, replaced by resolveAssetPatch. */
  style?: Partial<ElementStyle>;
  size?: AssetSize;
  /** Positions the element at (0, 0) at full canvas size, sent to the back. */
  placement?: "fill";
  rotation?: number;
  /** Curated popularity, 1 = most popular. Gaps are not allowed. */
  popularRank?: number;
}
