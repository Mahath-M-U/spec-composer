import { describe, expect, it } from "vitest";
import {
  ASSET_CATALOG,
  BANNED_TERMS,
  PROMPT_LIMITS,
  promptFieldFor,
  findAssetItem,
  isAssetRole,
  isFreeFloat,
  ROLE_OVERRIDES,
  roleOf,
} from "./index.ts";
import { MOTIF_KEYS } from "../motif-keys.ts";

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
