import "fake-indexeddb/auto";
import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import { sceneToCanvas } from "./scene-space";
import { createStudioLight } from "./studio-lighting";
import { MAX_SCENE_LIGHTS } from "./scene-objects";

beforeAll(() => {
  vi.stubGlobal("window", globalThis);
  const memory = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  });
});
const state = () => useEditorStore.getState();
const doc = () => state().doc!;
beforeEach(() => {
  state().setDocument(createDocument());
  state().setPanel("environment");
});
afterEach(() => state().closeDocument());

describe("scene store actions", () => {
  it("adds a scene light, selects it, and preserves the simple-mode/empty-rig distinction", () => {
    expect(doc().generationSettings?.studioLights).toBeUndefined();
    const history = state().past.length;
    const id = state().addSceneLight("sun");
    expect(id).not.toBeNull();
    expect(state().past.length).toBe(history + 1);
    expect(doc().generationSettings?.studioLights).toHaveLength(1);
    expect(doc().generationSettings?.studioLights?.[0]?.kind).toBe("sun");
    expect(doc().promptOptions.lighting).toBe(true);
    expect(state().selectedSceneId).toBe(id);
  });

  it("caps lights at MAX_SCENE_LIGHTS and returns null without touching history", () => {
    for (let i = 0; i < MAX_SCENE_LIGHTS; i++) state().addSceneLight("point");
    expect(doc().generationSettings?.studioLights).toHaveLength(MAX_SCENE_LIGHTS);
    const before = doc();
    const history = state().past.length;
    const id = state().addSceneLight("point");
    expect(id).toBeNull();
    expect(doc()).toBe(before);
    expect(state().past.length).toBe(history);
  });

  it("adds a camera once, selects it, and never sets studioLights", () => {
    expect(doc().generationSettings).toBeUndefined();
    expect(state().addSceneCamera()).toBe(true);
    expect(doc().generationSettings?.camera).toBeDefined();
    expect(doc().generationSettings?.studioLights).toBeUndefined();
    expect(state().selectedSceneId).toBe("camera");
    expect(doc().promptOptions.scene).toBe(true);
    const before = doc();
    expect(state().addSceneCamera()).toBe(false);
    expect(doc()).toBe(before);
  });

  it("duplicates a light, renames it, and removes it (clearing its selection)", () => {
    const id = state().addSceneLight("area")!;
    const copyId = state().duplicateSceneLight(id);
    expect(copyId).not.toBeNull();
    expect(copyId).not.toBe(id);
    expect(doc().generationSettings?.studioLights).toHaveLength(2);
    expect(state().selectedSceneId).toBe(copyId);
    state().renameSceneObject(copyId!, "My area light");
    expect(
      doc().generationSettings?.studioLights?.find((l) => l.id === copyId)?.name,
    ).toBe("My area light");
    state().removeSceneObject(copyId!);
    expect(doc().generationSettings?.studioLights).toHaveLength(1);
    expect(state().selectedSceneId).toBeNull();
  });

  it("removing the camera deletes it; removing ambient only disables it", () => {
    state().addSceneCamera();
    state().removeSceneObject("camera");
    expect(doc().generationSettings?.camera).toBeUndefined();
    state().updateAmbient({ enabled: true, intensity: 40, temperature: 4000 });
    state().removeSceneObject("ambient");
    expect(doc().generationSettings?.ambient?.enabled).toBe(false);
    // Ambient's settings (intensity/temperature) survive being disabled.
    expect(doc().generationSettings?.ambient?.intensity).toBe(40);
  });

  it("enforces mutual exclusivity between scene and element/background selection", () => {
    const lightId = state().addSceneLight("sun")!;
    expect(state().selectedSceneId).toBe(lightId);
    state().addShape("circle", { x: 10, y: 10 });
    const elementId = doc().elements[0]!.id;
    state().select(elementId);
    expect(state().selectedSceneId).toBeNull();
    expect(state().selectedIds).toEqual([elementId]);
    state().selectScene(lightId);
    expect(state().selectedIds).toEqual([]);
    expect(state().selectedSceneId).toBe(lightId);
    state().selectBackground();
    expect(state().selectedSceneId).toBeNull();
    state().selectScene(lightId);
    state().selectMany([elementId]);
    expect(state().selectedSceneId).toBeNull();
  });

  it("ignores selectScene for an id that doesn't resolve on the current document", () => {
    state().selectScene("not-a-real-id");
    expect(state().selectedSceneId).toBeNull();
    expect(state().selectScene("ambient")).toBeUndefined();
    expect(state().selectedSceneId).toBe("ambient");
  });

  it("clears the scene selection on undo and redo", () => {
    const id = state().addSceneLight("sun")!;
    expect(state().selectedSceneId).toBe(id);
    state().undo();
    expect(state().selectedSceneId).toBeNull();
    state().redo();
    expect(state().selectedSceneId).toBeNull();
  });

  it("recomputes azimuth/elevation when canvas or depth change, in one history entry", () => {
    const id = state().addSceneLight("point", { x: 0, y: 0 })!;
    const before = doc().generationSettings!.studioLights![0]!;
    const history = state().past.length;
    state().updateSceneLight(id, { canvas: { x: 0.5, y: 0.2 } });
    expect(state().past.length).toBe(history + 1);
    const after = doc().generationSettings!.studioLights![0]!;
    expect(after.canvas).toEqual({ x: 0.5, y: 0.2 });
    expect(after.azimuth).not.toBe(before.azimuth);
  });

  it("commits a drag as exactly one history entry", () => {
    const id = state().addSceneLight("area")!;
    const history = state().past.length;
    state().commitSceneTransform(id, { canvas: { x: 0.3, y: -0.4 }, rotation: 45 });
    expect(state().past.length).toBe(history + 1);
    const light = doc().generationSettings!.studioLights!.find((l) => l.id === id)!;
    expect(light.canvas).toEqual({ x: 0.3, y: -0.4 });
    expect(light.rotation).toBe(45);
  });

  it("toggles guideHidden for lights and the camera independently of enabled", () => {
    const id = state().addSceneLight("sun")!;
    state().addSceneCamera();
    state().toggleSceneGuide(id);
    expect(
      doc().generationSettings?.studioLights?.find((l) => l.id === id)?.guideHidden,
    ).toBe(true);
    state().toggleSceneGuide("camera");
    expect(doc().generationSettings?.camera?.guideHidden).toBe(true);
    expect(
      doc().generationSettings?.studioLights?.find((l) => l.id === id)?.enabled,
    ).toBe(true);
  });

  it("sets sceneGuidesVisible without adding history", () => {
    const history = state().past.length;
    state().setSceneGuidesVisible(false);
    expect(state().sceneGuidesVisible).toBe(false);
    expect(state().past.length).toBe(history);
    state().setSceneGuidesVisible(true);
  });

  it("creates a Rim card as a spot light with the Rim role and back depth, counted toward the shared cap", () => {
    const id = state().addSceneLight("spot", undefined, { role: "Rim", depth: "back" })!;
    const light = doc().generationSettings!.studioLights!.find((l) => l.id === id)!;
    expect(light.role).toBe("Rim");
    expect(light.depth).toBe("back");
    expect(light.kind).toBe("spot");
  });
  it("renames cameras with trimming and validation while preserving legacy defaults", () => {
    state().addSceneCamera();
    expect(doc().generationSettings?.camera).not.toHaveProperty("name");
    state().renameSceneObject("camera", "  Product view  ");
    expect(doc().generationSettings?.camera?.name).toBe("Product view");
    state().renameSceneObject("camera", "   ");
    expect(doc().generationSettings?.camera?.name).toBe("Product view");
    state().renameSceneObject("camera", "a".repeat(70));
    expect(doc().generationSettings?.camera?.name).toHaveLength(60);
    state().undo();
    expect(doc().generationSettings?.camera?.name).toBe("Product view");
  });

  it("keeps canvas position synchronized with inspector elevation and retains legacy positions on depth changes", () => {
    const id = state().addSceneLight("sun")!;
    state().updateSceneLight(id, { elevation: 30 });
    expect(doc().generationSettings?.studioLights?.[0]?.canvas?.y).toBeCloseTo(
      30 / 45,
    );
    const legacy = createStudioLight({ azimuth: 40, elevation: 20 });
    useEditorStore.setState({
      doc: {
        ...createDocument(),
        generationSettings: { studioLights: [legacy] },
      },
    });
    state().updateSceneLight(legacy.id, { depth: "back" });
    expect(doc().generationSettings?.studioLights?.[0]?.elevation).toBeCloseTo(
      20,
    );
    expect(
      doc().generationSettings?.studioLights?.[0]?.azimuth,
    ).toBeGreaterThan(120);
    expect(sceneToCanvas(legacy).canvas.x).toBeGreaterThan(0);
  });

});
