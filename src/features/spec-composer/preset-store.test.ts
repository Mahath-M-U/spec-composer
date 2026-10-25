import "fake-indexeddb/auto";
import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import { MAX_SCENE_LIGHTS } from "./scene-objects";
import { findEnvironmentPreset } from "./environment-presets";
import { createStudioLight } from "./studio-lighting";

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

describe("applyEnvironmentPreset", () => {
  it("returns applied: false for an unknown preset id, touching neither doc nor history", () => {
    const before = doc();
    const history = state().past.length;
    const result = state().applyEnvironmentPreset("not-a-preset", "replace");
    expect(result).toEqual({ applied: false, skipped: 0 });
    expect(doc()).toBe(before);
    expect(state().past.length).toBe(history);
  });

  it("replace mode sets camera, lights and ambient from the preset in one history entry", () => {
    const preset = findEnvironmentPreset("studio")!;
    const history = state().past.length;
    const result = state().applyEnvironmentPreset("studio", "replace");
    expect(result.applied).toBe(true);
    expect(result.skipped).toBe(0);
    expect(state().past.length).toBe(history + 1);
    expect(doc().generationSettings?.camera).toEqual(preset.camera);
    expect(doc().generationSettings?.studioLights).toHaveLength(
      preset.lights.length,
    );
    expect(doc().generationSettings?.ambient).toEqual(preset.ambient);
    expect(doc().generationSettings?.scenePreset).toBe("studio");
    expect(doc().scene).toBe(preset.scene);
    expect(doc().promptOptions.scene).toBe(true);
    expect(doc().promptOptions.lighting).toBe(true);
  });

  it("replace mode overwrites an existing rig and camera, and overwrites doc.scene even if already set", () => {
    state().addSceneCamera();
    state().addSceneLight("point");
    state().mutate((d) => {
      d.scene = "Already set";
    });
    const result = state().applyEnvironmentPreset("outdoor", "replace");
    const preset = findEnvironmentPreset("outdoor")!;
    expect(result).toEqual({ applied: true, skipped: 0 });
    expect(doc().generationSettings?.studioLights).toHaveLength(
      preset.lights.length,
    );
    expect(doc().generationSettings?.camera).toEqual(preset.camera);
    expect(doc().scene).toBe(preset.scene);
  });

  it("merge mode appends lights, keeps the existing camera untouched, and reports skipped at the cap", () => {
    state().addSceneCamera({ x: 0.3, y: -0.5 });
    const cameraBefore = doc().generationSettings?.camera;
    for (let i = 0; i < MAX_SCENE_LIGHTS - 1; i++) state().addSceneLight("point");
    const preset = findEnvironmentPreset("studio")!; // 3 lights
    const history = state().past.length;
    const result = state().applyEnvironmentPreset("studio", "merge");
    expect(state().past.length).toBe(history + 1);
    expect(result.applied).toBe(true);
    expect(result.skipped).toBe(preset.lights.length - 1);
    expect(doc().generationSettings?.studioLights).toHaveLength(MAX_SCENE_LIGHTS);
    expect(doc().generationSettings?.camera).toEqual(cameraBefore);
  });

  it("merge mode leaves doc.scene untouched once it's already set, but fills it in when empty", () => {
    expect(doc().scene).toBeUndefined();
    const preset = findEnvironmentPreset("indoor")!;
    state().applyEnvironmentPreset("indoor", "merge");
    expect(doc().scene).toBe(preset.scene);
    state().mutate((d) => {
      d.scene = "Custom scene text";
    });
    state().applyEnvironmentPreset("abstract", "merge");
    expect(doc().scene).toBe("Custom scene text");
  });

  it("merge mode sets ambient only if none is configured yet", () => {
    state().updateAmbient({ enabled: false, intensity: 5, temperature: 2200 });
    const ambientBefore = doc().generationSettings?.ambient;
    state().applyEnvironmentPreset("studio", "merge");
    expect(doc().generationSettings?.ambient).toEqual(ambientBefore);
  });

  it("undo restores the pre-preset document in a single step", () => {
    state().addSceneLight("sun");
    const before = doc();
    state().applyEnvironmentPreset("studio", "merge");
    expect(doc()).not.toBe(before);
    state().undo();
    expect(doc()).toEqual(before);
  });

  it("clears selectedSceneId when the selected light disappears under a replace", () => {
    const id = state().addSceneLight("sun");
    expect(state().selectedSceneId).toBe(id);
    state().applyEnvironmentPreset("outdoor", "replace");
    expect(state().selectedSceneId).toBeNull();
  });

  it("keeps a still-valid selection (camera) across a preset application", () => {
    state().addSceneCamera();
    expect(state().selectedSceneId).toBe("camera");
    state().applyEnvironmentPreset("studio", "merge");
    expect(state().selectedSceneId).toBe("camera");
  });

  it("assigns fresh, unique ids to every merged-in preset light", () => {
    const existing = createStudioLight({ name: "Pre-existing" });
    state().mutate((d) => {
      d.generationSettings ??= {};
      d.generationSettings.studioLights = [existing];
    });
    state().applyEnvironmentPreset("studio", "merge");
    const ids = doc().generationSettings!.studioLights!.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
