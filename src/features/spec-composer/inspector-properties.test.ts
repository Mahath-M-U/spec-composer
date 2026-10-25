import { describe, expect, it } from "vitest";
import { createDocument } from "./templates";
import { createElement } from "./registry";
import {
  commonValue,
  inspectorCategory,
  inspectorGeometry,
  materialState,
  semanticRole,
  toggledMaterial,
} from "./inspector-properties";
import { materialSuggestions } from "./art-direction";

const element = (kind: Parameters<typeof createElement>[0] = "shape") =>
  createElement(kind, createDocument().format, 0);
describe("inspector property semantics", () => {
  it("distinguishes empty, common defaults, and mixed values", () => {
    expect(commonValue([])).toEqual({ mixed: false, value: undefined });
    expect(commonValue(["", ""])).toEqual({ mixed: false, value: "" });
    expect(commonValue([0, 1])).toEqual({ mixed: true });
    expect(commonValue([0.125, 0.125]).value).toBe(0.125);
  });
  it("only exposes appearance for a compatible selection", () => {
    expect(inspectorCategory([])).toBeUndefined();
    expect(inspectorCategory([element("title"), element("body")])).toBe("text");
    expect(inspectorCategory([element("heroImage"), element("logo")])).toBe(
      "image",
    );
    expect(inspectorCategory([element("shape"), element("divider")])).toBe(
      "shape",
    );
    expect(inspectorCategory([element("shape"), element("title")])).toBe(
      "mixed",
    );
    expect(semanticRole({ ...element(), semanticRole: "text_area" })).toBe(
      "text area",
    );
  });
  it("translates and scales collective bounds without losing relative positions or precision", () => {
    const a = { ...element(), id: "a", x: 10.25, y: 20, width: 20, height: 10 };
    const b = { ...element(), id: "b", x: 50.25, y: 40, width: 20, height: 10 };
    expect(inspectorGeometry([a, b], "x", 0)?.["b"]?.x).toBe(40);
    const boxes = inspectorGeometry([a, b], "width", 120, true)!;
    expect(boxes["a"]).toEqual({ x: 10.25, y: 20, width: 40, height: 20 });
    expect(boxes["b"]).toEqual({ x: 90.25, y: 60, width: 40, height: 20 });
    expect(a.x).toBe(10.25);
  });
  it("rejects locked, hidden, nonfinite and too-small collective transforms", () => {
    const a = { ...element(), width: 2, height: 10 };
    const b = { ...element(), id: "b", x: a.x + 100, width: 20 };
    expect(inspectorGeometry([{ ...a, locked: true }], "x", 5)).toBeUndefined();
    expect(
      inspectorGeometry([{ ...a, visible: false }], "x", 5),
    ).toBeUndefined();
    expect(inspectorGeometry([a], "x", NaN)).toBeUndefined();
    expect(inspectorGeometry([a, b], "width", 1)).toBeUndefined();
  });
  it("preserves semantic circles through nonuniform collective scaling", () => {
    const circle = {
      ...element(),
      semanticRole: "decorative" as const,
      width: 20,
      height: 20,
      style: { shapeType: "circle" as const },
    };
    const result = inspectorGeometry([circle], "width", 60)![circle.id]!;
    expect(result).toEqual({ x: circle.x, y: circle.y, width: 60, height: 60 });
    expect(inspectorGeometry([circle], "height", 35)![circle.id]).toEqual({
      x: circle.x,
      y: circle.y,
      width: 35,
      height: 35,
    });
  });
  it("adds a mixed chip only to missing members, preserving independent materials", () => {
    const a = { ...element(), material: "Custom grain, Clear glass" };
    const b = { ...element(), material: "Paper stock" };
    expect(materialState([a, b], "Clear glass")).toBe("mixed");
    expect(toggledMaterial(a, "Clear glass", false)).toBe(a.material);
    expect(toggledMaterial(b, "Clear glass", false)).toBe(
      "Paper stock, Clear glass",
    );
    expect(toggledMaterial(a, "Clear glass", true)).toBe("Custom grain");
  });
  it("suggests role-appropriate materials and prioritizes explicit image kinds over ambiguous slots", () => {
    const product = { ...element("productImage"), slot: "subject" };
    expect(materialSuggestions([product])).toContain("Matte packaging");
    expect(materialSuggestions([product])).not.toContain(
      "Natural skin texture",
    );
    expect(materialSuggestions([element("humanModelImage")])).toContain(
      "Detailed hair",
    );
    expect(
      materialSuggestions([{ ...element(), semanticRole: "background" }]),
    ).toContain("Seamless paper");
    expect(materialSuggestions([element("heroImage")])).toEqual([]);
    expect(materialSuggestions([product, element("humanModelImage")])).toEqual(
      [],
    );
  });
});
