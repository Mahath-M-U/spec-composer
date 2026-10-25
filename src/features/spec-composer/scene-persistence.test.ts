import "fake-indexeddb/auto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { parseSpecDocument, type SpecDocument } from "./types";
import { createDocument } from "./templates";
import { createSceneCamera, createSceneLight } from "./scene-objects";
import { useEditorStore } from "./store";

beforeAll(() => {
  vi.stubGlobal("window", globalThis);
  const memory = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  });
});

describe("environment editor round-trip persistence", () => {
  it("round-trips a camera, ambient and scene-editor lights through JSON + parseSpecDocument unchanged", () => {
    const doc = createDocument();
    doc.generationSettings = {
      camera: { ...createSceneCamera({ x: 0.2, y: -0.4 }), name: "Product view" },
      ambient: { enabled: true, intensity: 40, temperature: 4800 },
      studioLights: [
        createSceneLight("sun", []),
        {
          ...createSceneLight("spot", []),
          role: "Rim",
          depth: "back",
          color: "#ff8800",
          coneAngle: 45,
        },
      ],
      scenePreset: "studio",
    };
    const roundTripped = parseSpecDocument(JSON.parse(JSON.stringify(doc)));
    expect(roundTripped).toBeDefined();
    expect(roundTripped!.generationSettings).toEqual(doc.generationSettings);
  });

  it("round-trips a point light's radius and an area light's color", () => {
    const doc = createDocument();
    const point = { ...createSceneLight("point", []), radius: 1.2 };
    const area = { ...createSceneLight("area", []), color: "#00aaff" };
    doc.generationSettings = { studioLights: [point, area] };
    const roundTripped = parseSpecDocument(JSON.parse(JSON.stringify(doc)));
    expect(roundTripped!.generationSettings?.studioLights?.[0]?.radius).toBe(1.2);
    expect(roundTripped!.generationSettings?.studioLights?.[1]?.color).toBe(
      "#00aaff",
    );
  });

  it("rejects a document with duplicate light ids (unique-id constraint already enforced)", () => {
    const doc = createDocument();
    const light = createSceneLight("sun", []);
    doc.generationSettings = {
      studioLights: [light, { ...createSceneLight("point", []), id: light.id }],
    };
    expect(parseSpecDocument(JSON.parse(JSON.stringify(doc)))).toBeUndefined();
  });

  it("still parses a legacy document with no camera/ambient/kind fields at all", () => {
    const legacy: unknown = {
      ...createDocument(),
      generationSettings: { cameraAngle: "Overhead", lightType: "Studio" },
    };
    const parsed = parseSpecDocument(JSON.parse(JSON.stringify(legacy)));
    expect(parsed).toBeDefined();
    expect(parsed!.generationSettings?.camera).toBeUndefined();
    expect(parsed!.generationSettings?.cameraAngle).toBe("Overhead");
  });

  it("loading any document — with or without a camera — leaves selectedSceneId null", () => {
    const withCamera: SpecDocument = {
      ...createDocument(),
      generationSettings: { camera: createSceneCamera() },
    };
    useEditorStore.getState().setDocument(withCamera);
    expect(useEditorStore.getState().selectedSceneId).toBeNull();

    // Select something, then load a document with no camera at all.
    useEditorStore.getState().addSceneLight("sun");
    expect(useEditorStore.getState().selectedSceneId).not.toBeNull();
    const withoutCamera = createDocument();
    useEditorStore.getState().setDocument(withoutCamera);
    expect(useEditorStore.getState().selectedSceneId).toBeNull();
    expect(
      useEditorStore.getState().doc?.generationSettings?.camera,
    ).toBeUndefined();
  });
});
