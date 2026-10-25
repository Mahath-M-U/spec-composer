import { describe, expect, it } from "vitest";
import { contextualPopoverPlacement, toolbarPlacement } from "./toolbar-placement";
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

describe("selection-anchored contextual menus", () => {
  const size = { width: 326, height: 360 };
  const viewport = { width: 1200, height: 800 };
  const separated = (
    menu: NonNullable<ReturnType<typeof contextualPopoverPlacement>>,
    selection: { left: number; top: number; width: number; height: number },
  ) =>
    menu.left >= selection.left + selection.width + 16 ||
    menu.left + menu.width <= selection.left - 16 ||
    menu.top >= selection.top + selection.height + 16 ||
    menu.top + menu.height <= selection.top - 16;

  it("prefers the right side with handle clearance", () => {
    const selection = { left: 300, top: 200, width: 300, height: 300 };
    const menu = contextualPopoverPlacement(selection, size, viewport)!;
    expect(menu).toMatchObject({ side: "right", left: 616, top: 200, width: 326, sideOffset: 16, alignOffset: 0 });
    expect(separated(menu, selection)).toBe(true);
  });

  it("uses the left side when the right has no usable width", () => {
    const selection = { left: 700, top: 200, width: 350, height: 300 };
    const menu = contextualPopoverPlacement(selection, size, viewport)!;
    expect(menu).toMatchObject({ side: "left", left: 358, width: 326 });
    expect(separated(menu, selection)).toBe(true);
  });

  it("shrinks into a narrow side like the reported canvas selection", () => {
    const selection = { left: 237, top: 176, width: 328, height: 351 };
    const menu = contextualPopoverPlacement(selection, size, { width: 707, height: 689 })!;
    expect(menu).toMatchObject({ side: "left", left: 8, width: 213 });
    expect(separated(menu, selection)).toBe(true);
  });

  it("clamps vertically inside an offset workspace and limits tall menus", () => {
    const selection = { left: 500, top: 550, width: 200, height: 100 };
    const menu = contextualPopoverPlacement(selection, { width: 326, height: 900 }, { left: 180, top: 100, width: 1100, height: 600 })!;
    expect(menu).toMatchObject({ side: "right", left: 716, top: 108, height: 584, maxHeight: 584, alignOffset: -442 });
    expect(menu.left + menu.width).toBeLessThanOrEqual(1272);
    expect(menu.top + menu.height).toBe(692);
    expect(separated(menu, selection)).toBe(true);
  });

  it.each([
    { selection: { left: 8, top: 400, width: 884, height: 250 }, side: "top" },
    { selection: { left: 8, top: 8, width: 884, height: 180 }, side: "bottom" },
  ])("uses $side only when it leaves the selection clear", ({ selection, side }) => {
    const menu = contextualPopoverPlacement(selection, size, { width: 900, height: 700 })!;
    expect(menu.side).toBe(side);
    expect(separated(menu, selection)).toBe(true);
  });

  it("uses the roomier left side of the reported offset workspace with a 16px gap", () => {
    const selection = { left: 1203, top: 359, width: 327, height: 351 };
    const menu = contextualPopoverPlacement(selection, size, { left: 520, top: 70, width: 1509, height: 830 })!;
    expect(menu).toMatchObject({ side: "left", left: 861, top: 359, width: 326, sideOffset: 16 });
    expect(separated(menu, selection)).toBe(true);
  });

  it("returns no floating panel when every placement would cover the artwork", () => {
    const selection = { left: -500, top: -300, width: 1800, height: 1400 };
    const menu = contextualPopoverPlacement(selection, size, { width: 360, height: 600 });
    expect(menu).toBeNull();
  });
});
