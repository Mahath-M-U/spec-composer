import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement as createSpecElement } from "../registry";
import { createDocument } from "../templates";
import { useEditorStore } from "../store";
import { getElementFields, CONTROL_TYPES } from "./schema";
import { writeProperty } from "./properties";
import { toolbarControls } from "./toolbar-controls";
import {
  FloatingContextualToolbar,
  LayerOrderControl,
} from "./FloatingContextualToolbar";
import { ContextualField } from "./ContextualField";
import { catalogIds } from "./catalog";
import { inspectorContext } from "../inspector-properties";
import { contextualCreation } from "./creation";

vi.mock("../store", async (importOriginal) => {
  const original = await importOriginal<typeof import("../store")>();
  type State = ReturnType<typeof original.useEditorStore.getState>;
  return {
    ...original,
    useEditorStore: Object.assign(
      <T = State,>(selector?: (state: State) => T) =>
        selector
          ? selector(original.useEditorStore.getState())
          : original.useEditorStore.getState(),
      original.useEditorStore,
    ),
  };
});
beforeEach(() => {
  vi.useFakeTimers();
  const doc = createDocument();
  doc.elements = [];
  useEditorStore.setState({
    doc,
    selectedIds: [],
    selectedGroupIds: [],
    backgroundSelected: false,
    past: [],
    future: [],
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
const model = () => ({
  ...createSpecElement("humanModelImage", createDocument().format, 0),
  catalogElementId: "subjects.person",
});
describe("adaptive contextual toolbar", () => {
  it("offers every existing layer order action in a compact accessible control", () => {
    const html = renderToStaticMarkup(createElement(LayerOrderControl));
    for (const label of [
      "Layer order",
      "Bring to front",
      "Bring forward",
      "Send backward",
      "Send to back",
    ])
      expect(html).toContain(label);
  });
  it("selects composed model slots and refills only with applicable fields", () => {
    const element = model();
    writeProperty(element, "model.pose_action.action", "standing");
    let controls = toolbarControls([element]);
    expect(controls.primary).toHaveLength(5);
    expect(controls.primary.map((control) => control.label)).toEqual([
      "Model",
      "Pose",
      "Variation",
      "Outfit",
      "Look",
    ]);
    expect(controls.primary[2]!.field.key).toContain("standingVariation");
    writeProperty(element, "model.pose_action.action", "sitting");
    controls = toolbarControls([element]);
    expect(controls.primary[2]!.field.key).toContain("sittingVariation");
    expect(
      [
        ...controls.primary.flatMap((control) => control.fields),
        ...controls.overflow,
      ].some((field) => field.key.includes("standingVariation")),
    ).toBe(false);
  });
  it("provides up to five quick controls and all other fields for every catalog identity", () => {
    for (const id of catalogIds) {
      const creation = contextualCreation(id)!;
      const element = {
        ...createSpecElement(creation.kind, createDocument().format, 0),
        ...creation.patch,
      };
      const controls = toolbarControls([element]);
      expect(controls.primary.length).toBeGreaterThan(0);
      expect(controls.primary.length).toBeLessThanOrEqual(5);
      const keys = [
        ...controls.primary.map((control) => control.field.key),
        ...controls.overflow.map((field) => field.key),
      ];
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
  it("intersects compatible fields for mixed selections", () => {
    const text = createSpecElement("title", createDocument().format, 0),
      image = model();
    const controls = toolbarControls([text, image]);
    expect(
      controls.primary.some((control) => control.field.key === "type.content"),
    ).toBe(false);
    expect(
      [
        ...controls.primary.map((control) => control.field),
        ...controls.overflow,
      ].some((field) => field.key === "transform.x"),
    ).toBe(true);
  });
  it("renders accessible floating quick controls plus separate Inspector action", () => {
    const element = model();
    useEditorStore.setState({
      selectedIds: [element.id],
      doc: { ...createDocument(), elements: [element] },
    });
    const html = renderToStaticMarkup(
      createElement(FloatingContextualToolbar, {
        elements: [element],
        screenBox: { left: 200, top: 200, width: 100, height: 100 },
      }),
    );
    expect(html).toContain('role="toolbar"');
    expect(html).toContain("More controls");
    expect(html).toContain("Open Design Inspector");
    expect(html.match(/class="contextual-quick"/g)).toHaveLength(5);
  });
  it("renders every configured control without a raw JSON fallback", () => {
    const examples = new Map(
      CONTROL_TYPES.map((control) => [
        control,
        undefined as
          | { id: string; field: ReturnType<typeof getElementFields>[number] }
          | undefined,
      ]),
    );
    for (const id of catalogIds)
      for (const field of getElementFields(id))
        examples.set(field.control, { id, field });
    for (const [control, example] of examples) {
      expect(example, control).toBeDefined();
      const creation = contextualCreation(example!.id)!;
      const element = {
        ...createSpecElement(creation.kind, createDocument().format, 0),
        ...creation.patch,
      };
      useEditorStore.setState({
        selectedIds: [element.id],
        doc: { ...createDocument(), elements: [element] },
      });
      const html = renderToStaticMarkup(
        createElement(ContextualField, {
          field: example!.field,
          elements: [element],
          context: inspectorContext(),
        }),
      );
      expect(html).toContain("contextual-field");
      expect(html).not.toContain("JSON");
    }
  });
});
