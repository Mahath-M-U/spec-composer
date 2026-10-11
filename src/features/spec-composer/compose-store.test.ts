import "fake-indexeddb/auto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createDocument, starterTemplates } from "./templates";
import { formats } from "./formats";
import { useEditorStore } from "./store";

beforeAll(() => {
  vi.stubGlobal("window", globalThis);
  const memory = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
  });
});

const story = formats.find((f) => f.id === "instagram-story")!;

describe("compose / doc.layout lifecycle", () => {
  it("sets doc.layout on compose, as one undo step, and clears it on undo", () => {
    useEditorStore
      .getState()
      .setDocument(createDocument("instagram-post", "Product Launch"));
    useEditorStore.getState().select();
    const pastBefore = useEditorStore.getState().past.length;
    useEditorStore.getState().compose("copy-left");
    expect(useEditorStore.getState().doc?.layout).toBe("copy-left");
    expect(useEditorStore.getState().past.length).toBe(pastBefore + 1);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().doc?.layout).toBeUndefined();
    useEditorStore.getState().closeDocument();
  });

  it("sets doc.layout with a selection too", () => {
    useEditorStore
      .getState()
      .setDocument(createDocument("instagram-post", "Product Launch"));
    const first = useEditorStore.getState().doc!.elements[0]!;
    useEditorStore.getState().select(first.id);
    useEditorStore.getState().compose("split-top");
    expect(useEditorStore.getState().doc?.layout).toBe("split-top");
    useEditorStore.getState().closeDocument();
  });

  it("resetCompose clears doc.layout", () => {
    useEditorStore
      .getState()
      .setDocument(createDocument("instagram-post", "Product Launch"));
    useEditorStore.getState().select();
    useEditorStore.getState().compose("copy-left");
    useEditorStore.getState().resetCompose();
    expect(useEditorStore.getState().doc?.layout).toBeUndefined();
    useEditorStore.getState().closeDocument();
  });

  it("resizeCurrent keeps doc.layout", () => {
    useEditorStore
      .getState()
      .setDocument(createDocument("instagram-post", "Product Launch"));
    useEditorStore.getState().select();
    useEditorStore.getState().compose("copy-left");
    useEditorStore.getState().resizeCurrent(story);
    expect(useEditorStore.getState().doc?.layout).toBe("copy-left");
    useEditorStore.getState().closeDocument();
  });

  it("applyTemplate clears doc.layout", () => {
    useEditorStore
      .getState()
      .setDocument(createDocument("instagram-post", "Product Launch"));
    useEditorStore.getState().select();
    useEditorStore.getState().compose("copy-left");
    const starter = starterTemplates[0]!;
    useEditorStore.getState().applyTemplate(starter.document, starter.name);
    expect(useEditorStore.getState().doc?.layout).toBeUndefined();
    useEditorStore.getState().closeDocument();
  });
});
