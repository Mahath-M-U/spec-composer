import { describe, expect, it } from "vitest";
import { createOptionLabel, filterOptions, toggleValue } from "./multi-select-options";

describe("filterOptions", () => {
  const options = ["Innovation", "Trust", "Craftsmanship"];

  it("returns all options for an empty query", () => {
    expect(filterOptions(options, [], "")).toEqual(options);
    expect(filterOptions(options, [], "   ")).toEqual(options);
  });

  it("matches case-insensitively on a substring", () => {
    expect(filterOptions(options, [], "TRU")).toEqual(["Trust"]);
    expect(filterOptions(options, [], "ship")).toEqual(["Craftsmanship"]);
  });

  it("puts selected custom values (not in options) first", () => {
    expect(filterOptions(options, ["Honesty", "Innovation"], "")).toEqual([
      "Honesty",
      "Innovation",
      "Trust",
      "Craftsmanship",
    ]);
  });

  it("filters custom values by the query too", () => {
    expect(filterOptions(options, ["Honesty"], "trust")).toEqual(["Trust"]);
  });
});

describe("createOptionLabel", () => {
  const options = ["Innovation", "Trust"];

  it("is null for an empty or whitespace-only query", () => {
    expect(createOptionLabel("", options, [])).toBeNull();
    expect(createOptionLabel("   ", options, [])).toBeNull();
  });

  it("trims the query", () => {
    expect(createOptionLabel("  Boldness  ", options, [])).toBe("Boldness");
  });

  it("is null on a case-insensitive match with an option", () => {
    expect(createOptionLabel("trust", options, [])).toBeNull();
    expect(createOptionLabel("INNOVATION", options, [])).toBeNull();
  });

  it("is null on a case-insensitive match with a selected value", () => {
    expect(createOptionLabel("honesty", options, ["Honesty"])).toBeNull();
  });

  it("is null once selected.length reaches max", () => {
    expect(createOptionLabel("Boldness", options, ["A", "B"], 2)).toBeNull();
  });

  it("allows a new value under max", () => {
    expect(createOptionLabel("Boldness", options, ["A"], 2)).toBe("Boldness");
  });
});

describe("toggleValue", () => {
  it("adds a value not yet selected", () => {
    expect(toggleValue(["A"], "B")).toEqual(["A", "B"]);
  });

  it("removes a value already selected", () => {
    expect(toggleValue(["A", "B"], "A")).toEqual(["B"]);
  });

  it("blocks adding past max", () => {
    expect(toggleValue(["A", "B"], "C", 2)).toEqual(["A", "B"]);
  });

  it("still allows removal at max", () => {
    expect(toggleValue(["A", "B"], "A", 2)).toEqual(["B"]);
  });
});
