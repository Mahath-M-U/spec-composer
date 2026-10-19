import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  commitInspectorEdit,
  commitInspectorGeometry,
  inspectorContext,
} from "./inspector-properties";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import { createElement } from "./registry";
import { materialState, toggledMaterial } from "./inspector-properties";
import { applyTextColorIntent } from "./text-color";
const state = () => useEditorStore.getState();
const doc = () => state().doc!;
beforeEach(() => {
  vi.useFakeTimers();
  const document = createDocument();
  document.groups = [
    { id: "outer", name: "Outer" },
    { id: "inner", name: "Inner", parentId: "outer" },
  ];
  document.elements = [0, 1].map((index) => ({
    ...createElement("shape", document.format, index),
    id: String(index),
    x: 10 + index * 100,
    y: 20 + index * 30,
    width: 50,
    height: 50,
    groupId: "inner",
    style: {
      background: index ? "#000000" : "#ffffff",
      shapeType: "rectangle" as const,
    },
    material: index ? "Paper stock" : "Custom grain, Clear glass",
  }));
  useEditorStore.setState({
    doc: document,
    selectedIds: ["0", "1"],
    selectedGroupIds: ["outer"],
    backgroundSelected: false,
    past: [],
    future: [],
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
describe("inspector store transactions", () => {
  it("reports accepted text-color changes and supports grouped history while leaving default transactions independent", () => {
    doc().elements.forEach((el) => {
      el.kind = "title";
      el.style.color = "#ff000080";
      el.style.opacity = 0.3;
    });
    const context = inspectorContext();
    const original = structuredClone(doc().elements);
    const edit = (alpha: number, history = true) =>
      commitInspectorEdit(
        context,
        (el) => {
          el.style.color = applyTextColorIntent(el.style.color, "color", {
            type: "alpha",
            alpha,
          })!;
        },
        false,
        history,
      );
    expect(edit(128 / 255)).toBe(false);
    expect(state().past).toHaveLength(0);
    expect(edit(0.25)).toBe(true);
    expect(edit(0.75, false)).toBe(true);
    expect(state().past).toHaveLength(1);
    const final = structuredClone(doc().elements);
    state().undo();
    expect(doc().elements).toEqual(original);
    state().redo();
    expect(doc().elements).toEqual(final);
    useEditorStore.setState({
      selectedIds: ["0", "1"],
      selectedGroupIds: ["outer"],
    });
    expect(edit(0.1)).toBe(true);
    expect(state().past).toHaveLength(2);
    expect(doc().elements.every((el) => el.style.opacity === 0.3)).toBe(true);
  });
  it("commits nested-group geometry atomically and undo/redo preserve all members", () => {
    const original = structuredClone(doc().elements);
    commitInspectorGeometry(inspectorContext(), "x", 25.125);
    expect(doc().elements.map((el) => el.x)).toEqual([25.125, 125.125]);
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().elements).toEqual(original);
    state().redo();
    expect(doc().elements[1]!.x).toBe(125.125);
    expect(doc().elements[1]!.groupId).toBe("inner");
  });
  it("does not write invalid, no-op, hidden, or locked geometry", () => {
    const context = inspectorContext();
    commitInspectorGeometry(context, "width", 150);
    commitInspectorGeometry(context, "width", NaN);
    expect(state().past).toHaveLength(0);
    doc().elements[1]!.locked = true;
    commitInspectorGeometry(context, "x", 40);
    expect(state().past).toHaveLength(0);
    doc().elements[1]!.locked = false;
    doc().elements[1]!.visible = false;
    commitInspectorGeometry(context, "x", 40);
    expect(state().past).toHaveLength(0);
  });
  it("patches one property for editable members, preserves geometry/unrelated style, and skips no-op history", () => {
    doc().elements[1]!.locked = true;
    const original = structuredClone(doc().elements);
    const context = inspectorContext();
    commitInspectorEdit(context, (el) => {
      el.style.opacity = 0.375;
    });
    expect(doc().elements[0]).toEqual({
      ...original[0],
      style: { ...original[0]!.style, opacity: 0.375 },
    });
    expect(doc().elements[1]).toEqual(original[1]);
    expect(state().past).toHaveLength(1);
    commitInspectorEdit(context, (el) => {
      el.style.opacity = 0.375;
    });
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().elements).toEqual(original);
    state().redo();
    expect(doc().elements[0]!.style.opacity).toBe(0.375);
  });
  it("keeps rotation individual and does not move geometry or material", () => {
    const original = structuredClone(doc().elements);
    commitInspectorEdit(
      inspectorContext(),
      (el) => {
        el.rotation = 12.75;
      },
      true,
    );
    for (let i = 0; i < 2; i++)
      expect(doc().elements[i]).toEqual({ ...original[i], rotation: 12.75 });
    expect(state().past).toHaveLength(1);
  });
  it("preserves circles and relative group layout on scale", () => {
    Object.assign(doc().elements[0]!, {
      semanticRole: "decorative",
      style: { shapeType: "circle" },
    });
    commitInspectorGeometry(inspectorContext(), "width", 300, true);
    expect(doc().elements[0]!.width).toBe(doc().elements[0]!.height);
    expect(doc().elements[1]!.x - doc().elements[0]!.x).toBe(200);
    expect(state().past).toHaveLength(1);
  });
  it("rejects stale selection/document handlers while allowing unrelated property edits", () => {
    const context = inspectorContext();
    commitInspectorEdit(context, (el) => {
      el.style.opacity = 0.5;
    });
    commitInspectorGeometry(context, "x", 30);
    expect(state().past).toHaveLength(2);
    useEditorStore.setState({ selectedIds: ["0"] });
    commitInspectorGeometry(context, "x", 60);
    expect(doc().elements[0]!.x).toBe(30);
    useEditorStore.setState({
      selectedIds: ["0", "1"],
      doc: { ...doc(), id: "different" },
    });
    commitInspectorEdit(context, (el) => {
      el.material = "Wrong document";
    });
    expect(doc().elements[0]!.material).not.toBe("Wrong document");
  });
  it("independently toggles mixed materials in one undo step", () => {
    const original = structuredClone(doc().elements);
    const remove = materialState(doc().elements, "Clear glass") === true;
    commitInspectorEdit(inspectorContext(), (el) => {
      el.material = toggledMaterial(el, "Clear glass", remove);
    });
    expect(doc().elements.map((el) => el.material)).toEqual([
      "Custom grain, Clear glass",
      "Paper stock, Clear glass",
    ]);
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().elements).toEqual(original);
  });
  it("clears material without retaining deleted keys and restores it through undo/redo", () => {
    const original = structuredClone(doc().elements);
    commitInspectorEdit(inspectorContext(), (el) => {
      delete el.material;
    });
    expect(doc().elements.every((el) => !("material" in el))).toBe(true);
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().elements).toEqual(original);
    state().redo();
    expect(doc().elements.every((el) => !("material" in el))).toBe(true);
  });
});
