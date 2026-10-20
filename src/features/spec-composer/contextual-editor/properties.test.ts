import { describe, expect, it } from "vitest";
import { createElement } from "../registry";
import { createDocument } from "../templates";
import { parseSpecDocument } from "../types";
import { evaluateCondition } from "./conditions";
import { readProperty, visibleFields, writeProperty } from "./properties";

const model = () => ({
  ...createElement("humanModelImage", createDocument().format, 0),
  catalogElementId: "subjects.person",
});
describe("contextual property bridge", () => {
  it("keeps pill shape selection effective and clears metadata for directly rendered shapes", () => {
    const element = { ...createElement("shape", createDocument().format, 0), catalogElementId: "decoration.shape" };
    expect(writeProperty(element, "surface.shape", "pill")).toBe(true);
    expect(readProperty(element, "surface.shape")).toBe("pill");
    expect(element.style.borderRadius).toBe(Math.min(element.width, element.height) / 2);
    expect(writeProperty(element, "surface.shape", "circle")).toBe(true);
    expect(readProperty(element, "surface.shape")).toBe("circle");
    expect(element.contextualProperties?.["surface.shape"]).toBeUndefined();
  });
  it("writes existing render fields and reads Inspector changes without duplicates", () => {
    const element = {
      ...createElement("title", createDocument().format, 0),
      catalogElementId: "information.headline",
    };
    expect(writeProperty(element, "type.content", "Supplied copy")).toBe(true);
    expect(writeProperty(element, "type.size", 42)).toBe(true);
    expect(writeProperty(element, "transform.opacity", 45)).toBe(true);
    expect(element.content).toBe("Supplied copy");
    expect(element.style.fontSize).toBe(42);
    expect(element.style.opacity).toBe(0.45);
    element.style.fontSize = 64;
    expect(readProperty(element, "type.size")).toBe(64);
    expect(element.contextualProperties?.["type.size"]).toBeUndefined();
    expect(writeProperty(element, "type.size", -2)).toBe(false);
    expect(writeProperty(element, "type.weight", "invented")).toBe(false);
  });
  it("clears incompatible pose values and never activates turning from a hidden standing ancestor", () => {
    const element = model();
    const visible = (key: string) =>
      visibleFields(element).some((field) => field.key === key);
    expect(readProperty(element, "model.pose_action.action")).toBe("standing");
    expect(visible("model.pose_action.standingVariation")).toBe(true);
    writeProperty(element, "model.pose_action.action", "standing");
    expect(visible("model.pose_action.standingVariation")).toBe(true);
    writeProperty(
      element,
      "model.pose_action.standingVariation",
      "turning_around",
    );
    expect(visible("model.pose_action.turningPhase")).toBe(true);
    writeProperty(element, "model.pose_action.turningPhase", "mid_turn");
    writeProperty(element, "model.pose_action.action", "sitting");
    expect(visible("model.pose_action.standingVariation")).toBe(false);
    expect(visible("model.pose_action.turningPhase")).toBe(false);
    expect(visible("model.pose_action.sittingSurface")).toBe(true);
    expect(
      writeProperty(element, "model.pose_action.standingVariation", "neutral"),
    ).toBe(false);
    expect(element.contextualProperties?.["model.pose_action.standingVariation"]).toBeUndefined();
  });
  it("validates child options and preserves arbitrary JSON metadata on reload", () => {
    const element = model();
    writeProperty(element, "model.identity.modelPreset", "girl");
    expect(writeProperty(element, "model.outfit.top", "crop_top")).toBe(false);
    element.contextualProperties = {
      ...element.contextualProperties,
      "custom.user": { rows: [1, false, null, "kept"] },
    };
    const doc = createDocument();
    doc.elements = [element];
    expect(
      parseSpecDocument(JSON.parse(JSON.stringify(doc)))?.elements[0]
        ?.contextualProperties,
    ).toEqual(element.contextualProperties);
  });
  it("evaluates the complete declared operator set and defers unset dependencies", () => {
    const read = () => 2;
    for (const operator of ["eq", "in", "not_empty", "gt", "lt", "neq"])
      expect(
        evaluateCondition(
          {
            field: "x",
            operator,
            value:
              operator === "lt"
                ? 3
                : operator === "gt" || operator === "neq"
                  ? 1
                  : 2,
            values: [2],
          },
          read,
        ),
      ).toBe(true);
    expect(
      evaluateCondition(
        { field: "x", operator: "neq", value: "none" },
        () => undefined,
      ),
    ).toBe(false);
    expect(evaluateCondition({ field: "x", operator: "empty" }, () => [])).toBe(
      true,
    );
  });
});
