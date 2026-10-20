import { describe, expect, it } from "vitest";
import purposeLabels from "./config/creative-purposes.json";
import {
  CONTROL_TYPES,
  config,
  getCreativePurposes,
  getElementFields,
  getElementSchema,
  getLibraryGroups,
} from "./schema";
import { catalogIds } from "./catalog";
import { RENDER_KINDS } from "./creation";

describe("supplied contextual catalog", () => {
  it("retains all 31 purposes, 7 groups and 78 canonical elements", () => {
    expect(getCreativePurposes().flatMap((group) => group.items)).toHaveLength(
      31,
    );
    expect(
      getCreativePurposes().flatMap((group) =>
        group.items.map((item) => item.label),
      ),
    ).toEqual(purposeLabels.creativePurposes.flatMap((group) => group.items));
    expect(getLibraryGroups()).toHaveLength(7);
    expect(catalogIds).toHaveLength(78);
    expect(
      new Set(getLibraryGroups().flatMap((group) => group.elementIds)).size,
    ).toBe(78);
    expect(Object.keys(RENDER_KINDS).sort()).toEqual([...catalogIds].sort());
  });
  it("resolves every purpose recommendation and normalizes every supported control", () => {
    for (const purpose of getCreativePurposes().flatMap((group) => group.items))
      for (const id of [
        ...purpose.requiredElementIds,
        ...purpose.recommendedElementIds,
      ])
        expect(getElementSchema(id)).toBeDefined();
    for (const id of catalogIds) {
      expect(getElementFields(id).length).toBeGreaterThan(0);
      for (const field of getElementFields(id))
        expect(CONTROL_TYPES).toContain(field.control);
      for (const ref of getElementSchema(id)!.facetRefs)
        expect(config.facetLibrary[ref]).toBeDefined();
    }
    expect(
      getElementFields("subjects.person").some((field) =>
        field.key.endsWith("standingPose"),
      ),
    ).toBe(false);
  });
});
