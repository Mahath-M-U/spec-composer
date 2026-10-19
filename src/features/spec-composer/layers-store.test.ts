import "fake-indexeddb/auto";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createDocument } from "./templates";
import { createElement } from "./registry";
import { useEditorStore } from "./store";
import { flattenLayers, toggleLayerSelection } from "./layer-tree";
import { specDocumentSchema } from "./types";
const state = () => useEditorStore.getState();
const doc = () => state().doc!;
const order = () =>
  [...doc().elements].sort((a, b) => b.zIndex - a.zIndex).map((el) => el.id);
const setup = (nested = false) => {
  const value = createDocument();
  value.elements = ["a", "b", "c", "d", "e"].map((id, index) => ({
    ...createElement("shape", value.format, index),
    id,
    name: id,
    zIndex: 5 - index,
  }));
  if (nested) {
    value.groups = [
      { id: "outer", name: "Outer" },
      { id: "inner", name: "Inner", parentId: "outer" },
    ];
    value.elements[1]!.groupId = "inner";
    value.elements[2]!.groupId = "inner";
    value.elements[3]!.groupId = "outer";
  }
  state().setDocument(value);
};
beforeAll(() => {
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  });
});
beforeEach(() => {
  vi.useFakeTimers();
  setup();
});
afterEach(() => {
  state().closeDocument();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("Layers store commands", () => {
  it("aligns explicit nested outer groups rigidly to canvas and other selections in one undo step", () => {
    setup(true);
    const value = structuredClone(doc());
    value.elements.forEach((el, index) => {
      el.x = [10, 100, 140, 220, 400][index]!;
      el.width = 20;
    });
    state().setDocument(value);
    state().selectLayers(["outer"]);
    state().align("left");
    expect(doc().elements.map((el) => el.x)).toEqual([10, 0, 40, 120, 400]);
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().elements.map((el) => el.x)).toEqual(
      value.elements.map((el) => el.x),
    );
    state().selectLayers(["outer", "e"]);
    state().align("right");
    expect(doc().elements.map((el) => el.x)).toEqual([10, 280, 320, 400, 400]);
    expect(doc().elements.map((el) => el.groupId)).toEqual(
      value.elements.map((el) => el.groupId),
    );
    state().undo();
    state().updateLayers(["b"], { locked: true });
    state().selectLayers(["outer"]);
    const before = doc(),
      history = state().past.length;
    state().align("left");
    expect(doc()).toBe(before);
    expect(state().past).toHaveLength(history);
  });
  it("distributes three explicit nested groups as rigid units, skipping insufficient or locked units", () => {
    const value = createDocument();
    value.elements = [];
    value.groups = [];
    for (let i = 0; i < 3; i++) {
      value.groups.push(
        { id: `g${i}`, name: `Group ${i}` },
        { id: `inner${i}`, name: "Inner", parentId: `g${i}` },
      );
      for (let j = 0; j < 3; j++)
        value.elements.push({
          ...createElement("shape", value.format, i * 3 + j),
          id: `${i}-${j}`,
          x: [0, 30, 90][i]! + j * 5,
          width: 10,
          groupId: j < 2 ? `inner${i}` : `g${i}`,
        });
    }
    state().setDocument(value);
    state().selectLayers(["g0", "g1"]);
    state().distribute("horizontal");
    expect(state().past).toHaveLength(0);
    state().selectLayers(["g0", "g1", "g2"]);
    state().distribute("horizontal");
    expect(doc().elements.map((el) => el.x)).toEqual([
      0, 5, 10, 45, 50, 55, 90, 95, 100,
    ]);
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().elements.map((el) => el.x)).toEqual(
      value.elements.map((el) => el.x),
    );
    state().updateLayers(["1-0"], { locked: true });
    state().selectLayers(["g0", "g1", "g2"]);
    const before = doc(),
      history = state().past.length;
    state().distribute("horizontal");
    expect(doc()).toBe(before);
    expect(state().past).toHaveLength(history);
  });
  it("selects canvas outer groups, explicit individual children, and modifier toggles independently", () => {
    setup(true);
    state().select("b");
    expect(state().selectedGroupIds).toEqual(["outer"]);
    expect(new Set(state().selectedIds)).toEqual(new Set(["b", "c", "d"]));
    state().selectLayers(["b"]);
    expect(state().selectedGroupIds).toEqual([]);
    expect(state().selectedIds).toEqual(["b"]);
    state().selectLayers(["inner"]);
    state().selectLayers(toggleLayerSelection(doc(), ["inner"], "outer"));
    expect(state().selectedGroupIds).toEqual(["outer"]);
    state().selectLayers(["inner"]);
    state().selectLayers(toggleLayerSelection(doc(), ["inner"], "b"));
    expect(state().selectedIds).toEqual(["c"]);
    expect(state().selectedGroupIds).toEqual([]);
    state().select("b", true);
    expect(state().selectedIds).toEqual(["c", "b"]);
    state().select("c", true);
    expect(state().selectedIds).toEqual(["b"]);
    state().selectBackground();
    expect(state().selectedIds).toEqual([]);
    expect(state().selectedGroupIds).toEqual([]);
  });
  it("renames and applies group flags in one transaction each without changing geometry, including undo/redo", () => {
    setup(true);
    const geometry = doc().elements.map(({ x, y, width, height }) => ({
      x,
      y,
      width,
      height,
    }));
    state().renameLayer("inner", "  Details  ");
    expect(doc().groups![1]!.name).toBe("Details");
    expect(state().past).toHaveLength(1);
    state().updateLayers(["outer", "b"], { visible: false });
    expect(state().past).toHaveLength(2);
    expect(
      doc()
        .elements.filter((el) => ["b", "c", "d"].includes(el.id))
        .every((el) => !el.visible),
    ).toBe(true);
    state().updateLayers(["outer"], { locked: true });
    expect(state().past).toHaveLength(3);
    expect(
      doc().elements.map(({ x, y, width, height }) => ({
        x,
        y,
        width,
        height,
      })),
    ).toEqual(geometry);
    const changed = JSON.stringify(doc());
    state().undo();
    expect(doc().elements.some((el) => el.locked)).toBe(false);
    state().redo();
    expect(JSON.stringify(doc())).toBe(changed);
    const count = state().past.length;
    state().updateLayers(["outer"], { locked: true });
    state().renameLayer("inner", "Details");
    state().renameLayer("inner", "  ");
    state().renameLayer("missing", "No");
    expect(state().past).toHaveLength(count);
  });
  it("groups eligible sibling nodes, preserves nested groups and ungroups only the selected parent", () => {
    setup(true);
    state().selectLayers(["inner", "d"]);
    state().group();
    const groupId = state().selectedGroupIds[0]!;
    expect(doc().groups!.find((group) => group.id === "inner")!.parentId).toBe(
      groupId,
    );
    expect(doc().groups!.find((group) => group.id === groupId)!.parentId).toBe(
      "outer",
    );
    expect(state().past).toHaveLength(1);
    state().ungroup();
    expect(doc().groups!.some((group) => group.id === groupId)).toBe(false);
    expect(doc().groups!.find((group) => group.id === "inner")!.parentId).toBe(
      "outer",
    );
    expect(state().selectedGroupIds).toEqual(["inner"]);
    expect(state().selectedIds).toEqual(["b", "c", "d"]);
    state().undo();
    expect(doc().groups!.some((group) => group.id === groupId)).toBe(true);
    state().redo();
    expect(doc().groups!.some((group) => group.id === groupId)).toBe(false);
  });
  it("does not normalize unrelated interleaved groups during grouping or reordering", () => {
    const value = structuredClone(doc());
    value.elements[0]!.groupId = "legacy";
    value.elements[2]!.groupId = "legacy";
    state().setDocument(value);
    state().selectLayers(["d", "e"]);
    state().group();
    expect(order()).toEqual(["a", "b", "c", "d", "e"]);
    state().undo();
    state().moveLayers(["e"], { targetId: "b", position: "before" });
    expect(order()).toEqual(["a", "e", "b", "c", "d"]);
    state().undo();
    expect(order()).toEqual(["a", "b", "c", "d", "e"]);
  });
  it("duplicates all levels of a subtree with fresh IDs, parent links, offsets and valid names", () => {
    setup(true);
    const value = structuredClone(doc());
    value.groups!.push({
      id: "middle",
      name: "m".repeat(200),
      parentId: "outer",
    });
    value.groups!.find((g) => g.id === "inner")!.parentId = "middle";
    state().setDocument(value);
    state().selectLayers(["outer"]);
    state().duplicate();
    const copied = state().selectedGroupIds[0]!;
    expect(copied).not.toBe("outer");
    expect(doc().groups).toHaveLength(6);
    expect(doc().elements).toHaveLength(8);
    const subtree = flattenLayers(doc()).find((row) => row.id === copied)!;
    expect(subtree.children).toHaveLength(2);
    expect(subtree.leaves).toHaveLength(3);
    expect(
      subtree.leaves.every(
        (el) =>
          el.id !== "b" &&
          el.x ===
            value.elements.find((old) => `${old.name} copy` === el.name)!.x +
              24,
      ),
    ).toBe(true);
    expect(specDocumentSchema.safeParse(doc()).success).toBe(true);
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().groups).toHaveLength(3);
    state().redo();
    expect(doc().groups).toHaveLength(6);
  });
  it("duplicates nested leaves and groups within their parent stack instead of above root siblings", () => {
    setup(true);
    state().selectLayers(["c"]);
    state().duplicate();
    const copy = state().selectedIds[0]!;
    expect(order()).toEqual(["a", "b", copy, "c", "d", "e"]);
    expect(doc().elements.find((el) => el.id === copy)!.groupId).toBe("inner");
    expect(state().selectedGroupIds).toEqual([]);
    state().undo();
    state().selectLayers(["inner"]);
    state().duplicate();
    const leaves = flattenLayers(doc())
      .find((row) => row.id === state().selectedGroupIds[0])!
      .leaves.map((el) => el.id);
    expect(order()).toEqual(["a", ...leaves, "b", "c", "d", "e"]);
  });
  it("reorders entire groups and individual siblings with bounds/lock guards and no-op history", () => {
    setup(true);
    state().selectLayers(["outer"]);
    state().bringForward();
    expect(order()).toEqual(["b", "c", "d", "a", "e"]);
    expect(state().past).toHaveLength(1);
    state().bringForward();
    expect(state().past).toHaveLength(1);
    state().sendToBack();
    expect(order()).toEqual(["a", "e", "b", "c", "d"]);
    expect(state().past).toHaveLength(2);
    state().undo();
    state().selectLayers(["c"]);
    state().bringForward();
    expect(order()).toEqual(["c", "b", "d", "a", "e"]);
    state().updateLayers(["c"], { locked: true });
    const count = state().past.length;
    state().sendBackward();
    state().moveLayers(["c"], { position: "after" });
    state().selectLayers(["b", "c"]);
    state().group();
    expect(state().past).toHaveLength(count);
    state().selectLayers([]);
    state().duplicate();
    state().ungroup();
    state().deleteSelected();
    expect(state().past).toHaveLength(count);
  });
  it("deletes locked group descendants atomically and clears metadata and stale selection", () => {
    setup(true);
    state().updateLayers(["outer"], { locked: true });
    state().selectLayers(["outer"]);
    state().deleteSelected();
    expect(order()).toEqual(["a", "e"]);
    expect(doc().groups).toEqual([]);
    expect(state().selectedIds).toEqual([]);
    expect(state().selectedGroupIds).toEqual([]);
    expect(state().past).toHaveLength(2);
    state().undo();
    expect(doc().groups).toHaveLength(2);
    expect(doc().elements).toHaveLength(5);
    state().redo();
    expect(order()).toEqual(["a", "e"]);
    setup(true);
    state().selectLayers(["outer"]);
    state().addElement("shape");
    expect(state().selectedGroupIds).toEqual([]);
    setup(true);
    state().selectLayers(["outer"]);
    const template = createDocument();
    state().applyTemplate(template, "Blank");
    expect(doc().groups).toBeUndefined();
    expect(state().selectedGroupIds).toEqual([]);
  });
});
