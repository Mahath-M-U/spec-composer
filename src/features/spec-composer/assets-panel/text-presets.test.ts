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
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
import {
  findTextPreset,
  MORE_TEXT_PRESETS,
  PRIMARY_TEXT_PRESETS,
} from "./text-presets";

const state = () => useEditorStore.getState();
beforeAll(() => {
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  });
});
beforeEach(() => {
  state().setDocument(createDocument());
  state().setPanel("assets");
});
afterEach(() => state().closeDocument());

describe("text palette presets", () => {
  it("resolves every primary and expanded choice and rejects foreign IDs", () => {
    const presets = [...PRIMARY_TEXT_PRESETS, ...MORE_TEXT_PRESETS];
    expect(new Set(presets.map((preset) => preset.id)).size).toBe(
      presets.length,
    );
    for (const preset of presets)
      expect(findTextPreset(preset.id)).toEqual(preset);
    for (const id of ["unknown", "__proto__", "title", "", "Caption"])
      expect(findTextPreset(id)).toBeUndefined();
  });

  it("uses one shared insertion action for click and positioned drag, including Caption overrides", () => {
    for (const point of [undefined, { x: 110, y: 85 }]) {
      const count = state().doc!.elements.length,
        history = state().past.length;
      state().addTextPreset("caption", point);
      const added = state().doc!.elements.at(-1)!;
      expect(added).toMatchObject({
        kind: "body",
        name: "Caption",
        content: "Caption",
        ...point,
      });
      expect(state().doc!.elements).toHaveLength(count + 1);
      expect(state().past).toHaveLength(history + 1);
      expect(state().selectedIds).toEqual([added.id]);
      expect(state().panel).toBe("assets");
      state().undo();
      expect(state().doc!.elements).toHaveLength(count);
      state().redo();
    }
  });

  it("leaves document, selection and undo history unchanged for invalid IDs or coordinates", () => {
    const before = state().doc,
      history = state().past.length,
      selected = state().selectedIds;
    state().addTextPreset("foreign");
    state().addTextPreset("caption", { x: NaN, y: 10 });
    expect(state().doc).toBe(before);
    expect(state().past).toHaveLength(history);
    expect(state().selectedIds).toBe(selected);
  });
});
