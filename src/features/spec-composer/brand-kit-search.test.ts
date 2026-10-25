import { describe, expect, it } from "vitest";
import {
  matchesBrandKitQuery,
  orderBrandKitsActiveFirst,
} from "./brand-kit-search";
import type { BrandKit } from "./types";

function makeKit(overrides: Partial<BrandKit> & { id: string }): BrandKit {
  return {
    name: "Untitled kit",
    colors: [],
    emotions: [],
    style: "Minimal",
    typography: "Manrope",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("matchesBrandKitQuery", () => {
  it("matches by name (case-insensitive)", () => {
    const kit = makeKit({ id: "a", name: "Aurora Studio" });
    expect(matchesBrandKitQuery(kit, "aurora")).toBe(true);
    expect(matchesBrandKitQuery(kit, "STUDIO")).toBe(true);
    expect(matchesBrandKitQuery(kit, "nope")).toBe(false);
  });

  it("matches by typography (font family)", () => {
    const kit = makeKit({
      id: "b",
      name: "Night Market",
      typography: "Fraunces",
    });
    expect(matchesBrandKitQuery(kit, "fraunces")).toBe(true);
    expect(matchesBrandKitQuery(kit, "manrope")).toBe(false);
  });

  it("matches every kit on an empty query", () => {
    const kit = makeKit({ id: "c" });
    expect(matchesBrandKitQuery(kit, "")).toBe(true);
    expect(matchesBrandKitQuery(kit, "   ")).toBe(true);
  });
});

describe("orderBrandKitsActiveFirst", () => {
  const kits = [
    makeKit({ id: "1" }),
    makeKit({ id: "2" }),
    makeKit({ id: "3" }),
  ];

  it("moves the active kit to index 0 and keeps the rest stable", () => {
    const ordered = orderBrandKitsActiveFirst(kits, "3");
    expect(ordered.map((kit) => kit.id)).toEqual(["3", "1", "2"]);
  });

  it("leaves order unchanged when activeId is undefined", () => {
    const ordered = orderBrandKitsActiveFirst(kits, undefined);
    expect(ordered.map((kit) => kit.id)).toEqual(["1", "2", "3"]);
  });

  it("leaves order unchanged when activeId matches no kit", () => {
    const ordered = orderBrandKitsActiveFirst(kits, "unknown");
    expect(ordered.map((kit) => kit.id)).toEqual(["1", "2", "3"]);
  });

  it("leaves order unchanged when the active kit is already first", () => {
    const ordered = orderBrandKitsActiveFirst(kits, "1");
    expect(ordered.map((kit) => kit.id)).toEqual(["1", "2", "3"]);
    expect(ordered).not.toBe(kits);
  });

  it("does not mutate the input array", () => {
    const original = [...kits];
    orderBrandKitsActiveFirst(kits, "2");
    expect(kits).toEqual(original);
  });
});
