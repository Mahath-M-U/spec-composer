import { describe, expect, it } from "vitest";
import {
  ASSET_CATALOG,
  BANNED_TERMS,
  PROMPT_LIMITS,
  promptFieldFor,
  elementRole,
  findAssetItem,
  isAssetRole,
  isFreeFloat,
  ROLE_OVERRIDES,
  roleOf,
  searchAssets,
} from "./index.ts";
import { MOTIF_KEYS } from "../motif-keys.ts";
import { createElement } from "../registry.ts";
import type { Format } from "../types.ts";

/** Render-style wording kept out of aiDescription-field prompts: subject and
 * composition come from the catalog, visual style from the document. */
const STYLE_BLOCKLIST =
  /flat vector|vector illustration|illustration style|editorial|studio light|photoreal|3d render|isometric|\bmood\b|\bstyling\b/i;

describe("ASSET_CATALOG", () => {
  it("has unique ids, each prefixed with its own category", () => {
    const seen = new Set<string>();
    for (const item of ASSET_CATALOG) {
      expect(seen.has(item.id), `duplicate id ${item.id}`).toBe(false);
      seen.add(item.id);
      expect(item.id.startsWith(`${item.category}-`), item.id).toBe(true);
    }
  });

  it("id list matches the known-good snapshot", () => {
    const ids = ASSET_CATALOG.map((item) => item.id).sort();
    expect(ids).toMatchSnapshot();
  });

  it("labels are at most 28 characters", () => {
    for (const item of ASSET_CATALOG) {
      expect(item.label.length, `${item.id}: "${item.label}"`).toBeLessThanOrEqual(28);
    }
  });

  it("has between 3 and 10 tags", () => {
    for (const item of ASSET_CATALOG) {
      expect(item.tags.length, item.id).toBeGreaterThanOrEqual(3);
      expect(item.tags.length, item.id).toBeLessThanOrEqual(10);
    }
  });

  it("prompt length stays within PROMPT_LIMITS for its compiled field", () => {
    for (const item of ASSET_CATALOG) {
      const { min, max } = PROMPT_LIMITS[promptFieldFor(item.kind)];
      expect(item.prompt.length, `${item.id}: ${item.prompt.length} chars`).toBeGreaterThanOrEqual(min);
      expect(item.prompt.length, `${item.id}: ${item.prompt.length} chars`).toBeLessThanOrEqual(max);
    }
  });

  it("has a unique prompt per item", () => {
    const seen = new Map<string, string>();
    for (const item of ASSET_CATALOG) {
      const existing = seen.get(item.prompt);
      expect(existing, `${item.id} duplicates the prompt from ${existing}`).toBeUndefined();
      seen.set(item.prompt, item.id);
    }
  });

  it("keeps label, prompt and content free of banned terms", () => {
    const pattern = new RegExp(`\\b(${BANNED_TERMS.join("|")})\\b`, "i");
    for (const item of ASSET_CATALOG) {
      expect(item.label, `${item.id} label`).not.toMatch(pattern);
      expect(item.prompt, `${item.id} prompt`).not.toMatch(pattern);
      if (item.content !== undefined) {
        expect(item.content, `${item.id} content`).not.toMatch(pattern);
      }
    }
  });

  it("popularRank values are exactly 1..N with no gaps or duplicates", () => {
    const ranks = ASSET_CATALOG.map((item) => item.popularRank).filter(
      (rank): rank is number => rank !== undefined,
    );
    const sorted = [...ranks].sort((a, b) => a - b);
    const expected = Array.from({ length: sorted.length }, (_, i) => i + 1);
    expect(sorted).toEqual(expected);
  });

  it("every art key (minus a :silhouette suffix) names a real motif", () => {
    const motifs = new Set<string>(MOTIF_KEYS);
    for (const item of ASSET_CATALOG) {
      if (!item.art) continue;
      const base = item.art.replace(/:silhouette$/, "");
      expect(motifs.has(base), `${item.id}: unknown motif "${base}"`).toBe(true);
    }
  });

  it("keeps aiDescription prompts free of render-style wording", () => {
    for (const item of ASSET_CATALOG) {
      if (promptFieldFor(item.kind) !== "aiDescription") continue;
      expect(item.prompt, `${item.id}: "${item.prompt}"`).not.toMatch(STYLE_BLOCKLIST);
    }
  });
});

describe("asset roles", () => {
  it("every item resolves to a role in ASSET_ROLES", () => {
    for (const item of ASSET_CATALOG) {
      const role = roleOf(item);
      expect(role, item.id).toBeTruthy();
      expect(isAssetRole(role), `${item.id}: "${role}"`).toBe(true);
    }
  });

  it("every ROLE_OVERRIDES key names a real catalog item", () => {
    for (const id of Object.keys(ROLE_OVERRIDES)) {
      expect(findAssetItem(id), `unknown override id "${id}"`).toBeDefined();
    }
  });

  it("promo-sold-out is free-float while an offer-kind promo item is not", () => {
    const soldOut = findAssetItem("promo-sold-out");
    const percentOff = findAssetItem("promo-percent-off");
    expect(soldOut, "promo-sold-out").toBeDefined();
    expect(percentOff, "promo-percent-off").toBeDefined();
    expect(soldOut!.kind).toBe("badge");
    expect(percentOff!.kind).toBe("offer");
    expect(isFreeFloat(soldOut!)).toBe(true);
    expect(isFreeFloat(percentOff!)).toBe(false);
  });
});

describe("searchAssets filter", () => {
  it('returns only subject items for searchAssets("phone", i => roleOf(i) === "subject")', () => {
    const results = searchAssets("phone", (item) => roleOf(item) === "subject");
    expect(results.length).toBeGreaterThan(0);
    for (const item of results) {
      expect(roleOf(item), item.id).toBe("subject");
    }
  });

  it("doesn't truncate a broad query to 80 before applying the filter", () => {
    const unfiltered = searchAssets("imagery");
    expect(unfiltered.length).toBe(80);

    const allFood = ASSET_CATALOG.filter((item) => item.category === "food");
    // At least one food item scores low enough to fall outside the
    // unfiltered top 80, proving this query is actually broad.
    const foodInUnfiltered = unfiltered.filter(
      (item) => item.category === "food",
    ).length;
    expect(foodInUnfiltered).toBeLessThan(allFood.length);

    const filtered = searchAssets("imagery", (item) => item.category === "food");
    expect(filtered.length).toBe(allFood.length);
  });
});

describe("elementRole", () => {
  const FORMAT: Format = {
    id: "test-1080x1080",
    label: "Test square",
    subtitle: "",
    width: 1080,
    height: 1080,
    category: "Test",
  };

  it("a valid el.slot wins over everything else", () => {
    const el = createElement("body", FORMAT, 0);
    expect(elementRole({ ...el, slot: "cta" })).toBe("cta");
  });

  it("an unrecognized el.slot falls through to the kind/assetId rules", () => {
    const el = createElement("cta", FORMAT, 0);
    expect(elementRole({ ...el, slot: "bogus" })).toBe("cta");
  });

  it("resolves via el.assetId when no valid slot is set", () => {
    const item = findAssetItem("text-url")!;
    const el = createElement("cta", FORMAT, 0);
    expect(
      elementRole({ ...el, assetId: item.id }, findAssetItem),
    ).toBe(roleOf(item));
    expect(roleOf(item)).toBe("cta");
  });

  it("a full-canvas image kind is 'background' only when a format is given", () => {
    const el = {
      ...createElement("heroImage", FORMAT, 0),
      x: 0,
      y: 0,
      width: FORMAT.width,
      height: FORMAT.height,
    };
    expect(elementRole(el, undefined, FORMAT)).toBe("background");
    expect(elementRole(el)).toBe("subject");
  });

  it("falls back to roleOfKind for a logo", () => {
    const el = createElement("logo", FORMAT, 0);
    expect(elementRole(el)).toBe("brand");
  });
});
