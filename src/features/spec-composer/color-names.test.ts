import { describe, expect, it } from "vitest";
import { contrastRatio, readableTextOn } from "./color-names";

describe("contrastRatio", () => {
  it("returns the maximum WCAG contrast for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("returns 1 for identical colors", () => {
    expect(contrastRatio("#445566", "#445566")).toBeCloseTo(1, 5);
  });
});

describe("readableTextOn", () => {
  it("falls back to a dark ink when the preferred color is too low-contrast", () => {
    expect(readableTextOn("#FFFFFF", "#F5F5F5")).toBe("#111311");
  });

  it("keeps the preferred color when it already has enough contrast", () => {
    expect(readableTextOn("#111111", "#F0F0F0")).toBe("#F0F0F0");
  });

  it("falls back when no preferred color is given", () => {
    expect(readableTextOn("#FFFFFF")).toBe("#111311");
    expect(readableTextOn("#0A0A0A")).toBe("#FFFFFF");
  });

  it("falls back when the preferred color is invalid", () => {
    expect(readableTextOn("#FFFFFF", "not-a-color")).toBe("#111311");
  });
});
