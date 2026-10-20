import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
import { inspectorContext } from "../inspector-properties";
import { parseSpecDocument } from "../types";
import { catalogIds } from "./catalog";
import { commitContextualEdit, uploadContextualAsset } from "./store";
import { readProperty, visibleFields } from "./properties";
import { readImageUpload } from "../image-upload";
vi.mock("../image-upload", () => ({ readImageUpload: vi.fn() }));

const state = () => useEditorStore.getState();
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
describe("contextual transactions", () => {
  it("inserts all 78 identities as new selected instances without replacing occupants or inventing claims", () => {
    for (const id of catalogIds) {
      state().addContextualElement(id);
      expect(state().doc!.elements.at(-1)!.catalogElementId).toBe(id);
      expect(state().selectedIds).toEqual([state().doc!.elements.at(-1)!.id]);
    }
    expect(state().doc!.elements).toHaveLength(78);
    expect(
      state().doc!.elements.every(
        (el) => !el.content && !el.src && !el.aiDescription,
      ),
    ).toBe(true);
    state().undo();
    expect(state().doc!.elements).toHaveLength(77);
    state().redo();
    expect(state().doc!.elements).toHaveLength(78);
  });
  it("purpose changes only recommendation metadata and round-trips", () => {
    state().addContextualElement("subjects.product");
    const elements = structuredClone(state().doc!.elements),
      selection = [...state().selectedIds];
    state().setCreativePurpose("product_showcase");
    expect(state().doc!.elements).toEqual(elements);
    expect(state().selectedIds).toEqual(selection);
    expect(
      parseSpecDocument(JSON.parse(JSON.stringify(state().doc)))
        ?.creativePurposeId,
    ).toBe("product_showcase");
    state().setCreativePurpose();
    expect(state().doc!.creativePurposeId).toBeUndefined();
  });
  it("guards delayed selection edits, locks and bulk history", () => {
    state().addContextualElement("information.headline");
    const first = state().selectedIds[0]!;
    const context = inspectorContext();
    state().addContextualElement("information.body");
    const second = state().selectedIds[0]!;
    expect(commitContextualEdit(context, "type.content", "stale")).toBe(false);
    state().selectMany([first, second]);
    const before = state().past.length;
    expect(
      commitContextualEdit(inspectorContext(), "type.content", "Both"),
    ).toBe(true);
    expect(state().past.length).toBe(before + 1);
    expect(state().doc!.elements.every((el) => el.content === "Both")).toBe(
      true,
    );
    state().mutate((doc) => {
      doc.elements[0]!.locked = true;
    });
    expect(commitContextualEdit(inspectorContext(), "type.content", "No")).toBe(
      false,
    );
  });
  it("checks stable target types and remaps duplicate relations, cleans deletion atomically", () => {
    state().addContextualElement("subjects.product");
    const product = state().selectedIds[0]!;
    state().addContextualElement("subjects.person");
    const person = state().selectedIds[0]!;
    expect(
      commitContextualEdit(
        inspectorContext(),
        "model.pose_action.interactingWith",
        person,
      ),
    ).toBe(false);
    expect(
      commitContextualEdit(
        inspectorContext(),
        "model.pose_action.interactingWith",
        product,
      ),
    ).toBe(true);
    expect(
      visibleFields(state().doc!.elements.find((el) => el.id === person)!).some(
        (field) => field.key === "model.pose_action.interaction",
      ),
    ).toBe(true);
    state().selectMany([product, person]);
    state().duplicate();
    const copies = state().doc!.elements.filter((el) =>
      state().selectedIds.includes(el.id),
    );
    expect(
      copies.find((el) => el.catalogElementId === "subjects.person")!
        .contextualProperties?.["model.pose_action.interactingWith"],
    ).toBe(copies.find((el) => el.catalogElementId === "subjects.product")!.id);
    state().deleteElements([product]);
    expect(
      state().doc!.elements.find((el) => el.id === person)!
        .contextualProperties?.["model.pose_action.interactingWith"],
    ).toBeUndefined();
    state().undo();
    expect(
      state().doc!.elements.find((el) => el.id === person)!
        .contextualProperties?.["model.pose_action.interactingWith"],
    ).toBe(product);
  });
  it("Held by Model reveals a compatible target selector without inventing an interaction or object", () => {
    state().addContextualElement("information.headline");
    const text = state().selectedIds[0]!;
    state().addContextualElement("subjects.person");
    const model = state().selectedIds[0]!;
    state().addContextualElement("subjects.product");
    const product = state().selectedIds[0]!;
    expect(
      commitContextualEdit(
        inspectorContext(),
        "item.presentation",
        "held_by_model",
      ),
    ).toBe(true);
    expect(
      visibleFields(state().doc!.elements.at(-1)!).some(
        (field) => field.key === "item.actor",
      ),
    ).toBe(true);
    expect(
      state().doc!.elements.at(-1)!.contextualProperties?.[
        "item.productInteraction"
      ],
    ).toBeUndefined();
    expect(commitContextualEdit(inspectorContext(), "item.actor", text)).toBe(
      false,
    );
    expect(
      commitContextualEdit(inspectorContext(), "item.actor", product),
    ).toBe(false);
    expect(commitContextualEdit(inspectorContext(), "item.actor", model)).toBe(
      true,
    );
    expect(state().doc!.elements).toHaveLength(3);
  });
  it("source swap, clear and Inspector source replacement stay synchronized", () => {
    state().addContextualElement("subjects.image");
    state().mutate((doc) => {
      doc.referenceAssets = {
        one: {
          source: "data:image/png;base64,one",
          name: "One",
          type: "image/png",
        },
        two: {
          source: "data:image/png;base64,two",
          name: "Two",
          type: "image/png",
        },
      };
    });
    expect(
      commitContextualEdit(inspectorContext(), "asset.source", "one"),
    ).toBe(true);
    expect(state().doc!.elements[0]!.src).toBe("data:image/png;base64,one");
    expect(readProperty(state().doc!.elements[0]!, "asset.source")).toBe("one");
    expect(
      commitContextualEdit(inspectorContext(), "asset.source", "two"),
    ).toBe(true);
    expect(state().doc!.elements[0]!.src).toBe("data:image/png;base64,two");
    state().mutate((doc) => {
      doc.elements[0]!.src = "data:image/png;base64,inspector";
    });
    expect(readProperty(state().doc!.elements[0]!, "asset.source")).toBe(
      "__current_source__",
    );
    expect(
      state().doc!.elements[0]!.contextualProperties?.["asset.source"],
    ).toBeUndefined();
    expect(
      commitContextualEdit(inspectorContext(), "asset.source", undefined),
    ).toBe(true);
    expect(state().doc!.elements[0]!.src).toBeUndefined();
    expect(
      commitContextualEdit(inspectorContext(), "asset.source", "missing"),
    ).toBe(false);
  });
  it("honors per-property locks for every owner in a bulk edit", () => {
    state().addContextualElement("subjects.person");
    const first = state().selectedIds[0]!;
    state().addContextualElement("subjects.person");
    const second = state().selectedIds[0]!;
    expect(
      commitContextualEdit(inspectorContext(), "model.references.lockFields", [
        "unknown.field",
      ]),
    ).toBe(false);
    expect(
      commitContextualEdit(inspectorContext(), "model.references.lockFields", [
        "model.pose_action.action",
      ]),
    ).toBe(true);
    state().selectMany([first, second]);
    expect(
      commitContextualEdit(
        inspectorContext(),
        "model.pose_action.action",
        "standing",
      ),
    ).toBe(false);
    expect(
      state().doc!.elements.every(
        (el) => el.contextualProperties?.["model.pose_action.action"] === "standing",
      ),
    ).toBe(true);
  });
  it("guards asynchronous uploads and commits stable reference plus pixels in one undo step", async () => {
    state().addContextualElement("subjects.image");
    let complete!: (source: string) => void;
    vi.mocked(readImageUpload).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const pending = uploadContextualAsset(inspectorContext(), "asset.source", {
      name: "provided.png",
      type: "image/png",
    } as File);
    state().addContextualElement("subjects.product");
    complete("data:image/png;base64,provided");
    expect(await pending).toBe(false);
    expect(state().doc!.referenceAssets).toBeUndefined();
    vi.mocked(readImageUpload).mockResolvedValueOnce(
      "data:image/png;base64,provided",
    );
    const before = state().past.length;
    expect(
      await uploadContextualAsset(inspectorContext(), "asset.source", {
        name: "provided.png",
        type: "image/png",
      } as File),
    ).toBe(true);
    expect(state().past).toHaveLength(before + 1);
    const id = state().doc!.elements.at(-1)!.contextualProperties?.[
      "asset.source"
    ] as string;
    expect(state().doc!.referenceAssets?.[id]?.name).toBe("provided.png");
    expect(state().doc!.elements.at(-1)!.src).toBe(
      "data:image/png;base64,provided",
    );
    state().undo();
    expect(state().doc!.referenceAssets).toBeUndefined();
    expect(state().doc!.elements.at(-1)!.src).toBeUndefined();
  });
});
