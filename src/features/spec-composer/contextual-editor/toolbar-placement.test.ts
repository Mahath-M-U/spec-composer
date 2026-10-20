import { describe, expect, it } from "vitest";
import { toolbarPlacement } from "./toolbar-placement";
describe("screen-space toolbar placement", () => {
  const size = { width: 300, height: 48 },
    viewport = { width: 900, height: 700 };
  it("prefers above with clearance for handles", () => {
    expect(
      toolbarPlacement(
        { left: 300, top: 200, width: 400, height: 200 },
        size,
        viewport,
      ),
    ).toEqual({ left: 350, top: 134 });
  });
  it("flips below when the upper edge is clipped", () => {
    expect(
      toolbarPlacement(
        { left: 300, top: 0, width: 400, height: 200 },
        size,
        viewport,
      ),
    ).toEqual({ left: 350, top: 218 });
  });
  it("chooses a side when both vertical candidates are unavailable", () => {
    const position = toolbarPlacement(
      { left: 50, top: 5, width: 80, height: 630 },
      size,
      viewport,
    );
    expect(position.left).toBe(148);
    expect(position.top).toBe(8);
  });
  it("clamps large/zoomed selections and reserves bottom controls", () => {
    const position = toolbarPlacement(
      { left: -900, top: -800, width: 3000, height: 4000 },
      size,
      { width: 360, height: 600 },
    );
    expect(position.left).toBeGreaterThanOrEqual(8);
    expect(position.left + size.width).toBeLessThanOrEqual(352);
    expect(position.top).toBeGreaterThanOrEqual(8);
    expect(position.top + size.height).toBeLessThanOrEqual(546);
  });
});
