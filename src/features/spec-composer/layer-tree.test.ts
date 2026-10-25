import { describe, expect, it } from "vitest";
import { createDocument } from "./templates";
import { createElement } from "./registry";
import {
  canonicalLayers,
  canGroupLayers,
  flattenLayers,
  layerAlignmentItems,
  layerRange,
  movedLayers,
  nextLayerDropPoint,
  selectedLayerIds,
  toggleLayerSelection,
} from "./layer-tree";
import { specDocumentSchema, type SpecDocument } from "./types";

export function layerDocument(): SpecDocument {
  const doc = createDocument();
  doc.elements = ["a", "b", "c", "d", "e"].map((id, index) => ({
    ...createElement("shape", doc.format, index),
    id,
    name: id,
    zIndex: 5 - index,
  }));
  return doc;
}
const order = (doc: SpecDocument) =>
  [...doc.elements].sort((a, b) => b.zIndex - a.zIndex).map((el) => el.id);

describe("layer hierarchy", () => {
  it("selects explicit unchecked children without subtracting them from a selected parent", () => {
    const doc = layerDocument();
    doc.groups = [{ id: "g", name: "Group" }];
    doc.elements[0]!.groupId = "g";
    doc.elements[1]!.groupId = "g";
    const before = JSON.stringify(doc);
    expect(toggleLayerSelection(doc, ["g", "c"], "a", "explicit")).toEqual([
      "a",
      "c",
    ]);
    expect(toggleLayerSelection(doc, ["a", "c"], "a", "explicit")).toEqual([
      "c",
    ]);
    expect(toggleLayerSelection(doc, ["a", "c"], "g", "explicit")).toEqual([
      "g",
      "c",
    ]);
    expect(new Set(toggleLayerSelection(doc, ["g", "c"], "a"))).toEqual(
      new Set(["b", "c"]),
    );
    expect(JSON.stringify(doc)).toBe(before);
  });
  it("uses temporary explicit outer-group alignment membership without changing the document", () => {
    const doc = layerDocument();
    doc.groups = [
      { id: "outer", name: "Outer" },
      { id: "inner", name: "Inner", parentId: "outer" },
    ];
    doc.elements[0]!.groupId = "inner";
    doc.elements[1]!.groupId = "inner";
    doc.elements[2]!.groupId = "outer";
    const original = JSON.stringify(doc);
    const items = layerAlignmentItems(doc, ["a", "b", "c", "d"], ["outer"]);
    expect(items.map((el) => el.groupId)).toEqual([
      "outer",
      "outer",
      "outer",
      undefined,
    ]);
    expect(JSON.stringify(doc)).toBe(original);
    expect(
      layerAlignmentItems(doc, ["a", "c"], []).map((el) => el.groupId),
    ).toEqual(["inner", "outer"]);
  });
  it("orders negative and zero z-indices exactly like canvas rendering", () => {
    const doc = layerDocument();
    const indices = [-4, 0, -1, -3, -2];
    doc.elements.forEach((el, index) => {
      el.zIndex = indices[index]!;
    });
    expect(flattenLayers(doc).map((row) => row.id)).toEqual([
      "b",
      "c",
      "e",
      "d",
      "a",
    ]);
    doc.elements[0]!.groupId = "g";
    doc.elements[3]!.groupId = "g";
    expect(flattenLayers(doc).map((row) => row.id)).toEqual([
      "b",
      "c",
      "e",
      "g",
      "d",
      "a",
    ]);
  });
  it("cycles through every measured keyboard drop zone without skipping group nesting", () => {
    const points = [
      { id: "before", x: 50, y: 5 },
      { id: "inside", x: 50, y: 19 },
      { id: "after", x: 50, y: 33 },
      { id: "root", x: 50, y: 70 },
    ];
    expect(
      nextLayerDropPoint(points, "before", { x: 50, y: 5 }, true)?.id,
    ).toBe("inside");
    expect(
      nextLayerDropPoint(points, "inside", { x: 50, y: 19 }, true)?.id,
    ).toBe("after");
    expect(
      nextLayerDropPoint(points, "after", { x: 50, y: 33 }, false)?.id,
    ).toBe("inside");
    expect(
      nextLayerDropPoint(points, "after", { x: 50, y: 33 }, true)?.id,
    ).toBe("root");
    expect(
      nextLayerDropPoint(points, "root", { x: 50, y: 70 }, true),
    ).toBeUndefined();
  });
  it("synthesizes legacy groups without changing stacking or document data", () => {
    const doc = layerDocument();
    doc.elements[0]!.groupId = "legacy";
    doc.elements[2]!.groupId = "legacy";
    const before = JSON.stringify(doc);
    expect(flattenLayers(doc).map((row) => [row.id, row.depth])).toEqual([
      ["legacy", 0],
      ["a", 1],
      ["c", 1],
      ["b", 0],
      ["d", 0],
      ["e", 0],
    ]);
    expect(JSON.stringify(doc)).toBe(before);
    expect(
      specDocumentSchema
        .parse(JSON.parse(before))
        .elements.map((el) => el.zIndex),
    ).toEqual([5, 4, 3, 2, 1]);
  });
  it("roundtrips nested metadata and rejects collisions, cycles and dangling parents", () => {
    const doc = layerDocument();
    doc.groups = [
      { id: "outer", name: "Outer" },
      { id: "inner", name: "Inner", parentId: "outer" },
    ];
    doc.elements[0]!.groupId = "inner";
    expect(
      specDocumentSchema.parse(JSON.parse(JSON.stringify(doc))).groups,
    ).toEqual(doc.groups);
    for (const groups of [
      [{ id: "a", name: "Collision" }],
      [
        { id: "g", name: "One" },
        { id: "g", name: "Two" },
      ],
      [{ id: "g", name: "Dangling", parentId: "missing" }],
      [
        { id: "g", name: "Cycle", parentId: "h" },
        { id: "h", name: "Cycle", parentId: "g" },
      ],
    ])
      expect(specDocumentSchema.safeParse({ ...doc, groups }).success).toBe(
        false,
      );
  });
  it("keeps explicit group selection separate, canonicalizes children and respects collapsed ranges", () => {
    const doc = layerDocument();
    doc.groups = [{ id: "g", name: "Group" }];
    doc.elements[0]!.groupId = "g";
    doc.elements[1]!.groupId = "g";
    expect(
      canonicalLayers(doc, ["g", "a", "c"]).map((node) => node.id),
    ).toEqual(["g", "c"]);
    expect(selectedLayerIds(doc, ["a", "b", "c"], ["g"])).toEqual(["g", "c"]);
    const before = JSON.stringify(doc);
    expect(layerRange(doc, new Set(["g"]), "g", "d")).toEqual(["g", "c", "d"]);
    expect(JSON.stringify(doc)).toBe(before);
    expect(canGroupLayers(doc, ["a", "b"])).toBe(true);
    expect(canGroupLayers(doc, ["a", "c"])).toBe(false);
    doc.elements[0]!.locked = true;
    expect(canGroupLayers(doc, ["a", "b"])).toBe(false);
  });
  it("moves in and out of nested groups without changing coordinates; prunes empty groups", () => {
    const doc = layerDocument();
    doc.groups = [
      { id: "outer", name: "Outer" },
      { id: "inner", name: "Inner", parentId: "outer" },
    ];
    doc.elements[0]!.groupId = "inner";
    doc.elements[1]!.groupId = "outer";
    const into = movedLayers(doc, ["c"], {
      targetId: "inner",
      position: "inside",
    })!;
    expect(into.elements.find((el) => el.id === "c")!.groupId).toBe("inner");
    expect(order(into)).toEqual(["a", "c", "b", "d", "e"]);
    expect(
      into.elements.map(({ x, y, width, height }) => ({ x, y, width, height })),
    ).toEqual(
      doc.elements.map(({ x, y, width, height }) => ({ x, y, width, height })),
    );
    const out = movedLayers(into, ["a", "c"], { position: "after" })!;
    expect(out.groups?.map((g) => g.id)).toEqual(["outer"]);
    expect(order(out)).toEqual(["b", "d", "e", "a", "c"]);
  });
  it("rejects circular/self nesting, locked sources and destinations, and true no-ops", () => {
    const doc = layerDocument();
    doc.groups = [
      { id: "g", name: "G" },
      { id: "h", name: "H", parentId: "g" },
    ];
    doc.elements[0]!.groupId = "h";
    expect(
      movedLayers(doc, ["g"], { targetId: "h", position: "inside" }),
    ).toBeUndefined();
    expect(
      movedLayers(doc, ["g"], { targetId: "g", position: "before" }),
    ).toBeUndefined();
    expect(
      movedLayers(doc, ["b"], { targetId: "a", position: "inside" }),
    ).toBeUndefined();
    expect(movedLayers(doc, ["e"], { position: "after" })).toBeUndefined();
    doc.elements[0]!.locked = true;
    expect(
      movedLayers(doc, ["g"], { targetId: "b", position: "after" }),
    ).toBeUndefined();
    expect(
      movedLayers(doc, ["b"], { targetId: "g", position: "inside" }),
    ).toBeUndefined();
  });
  it("preserves unrelated interleaved legacy stacks on root reorder and moved descendant relative order", () => {
    const doc = layerDocument();
    doc.elements[0]!.groupId = "g";
    doc.elements[2]!.groupId = "g";
    const next = movedLayers(doc, ["e"], {
      targetId: "b",
      position: "before",
    })!;
    expect(order(next)).toEqual(["a", "e", "b", "c", "d"]);
    doc.groups = [
      { id: "outer", name: "Outer" },
      { id: "g", name: "G", parentId: "outer" },
    ];
    doc.elements[1]!.groupId = "outer";
    const moved = movedLayers(doc, ["outer", "a"], {
      targetId: "e",
      position: "after",
    })!;
    expect(order(moved)).toEqual(["d", "e", "a", "b", "c"]);
  });
});
