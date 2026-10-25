import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_PRESETS,
  findEnvironmentPreset,
  mergeEnvironmentPreset,
} from "./environment-presets";
import { createStudioLight } from "./studio-lighting";
import {
  generationSettingsSchema,
  MAX_SCENE_LIGHTS,
  sceneAmbientSchema,
  sceneCameraSchema,
  studioLightSchema,
} from "./types";

describe("ENVIRONMENT_PRESETS", () => {
  it("has studio, outdoor, indoor, product-photography and abstract presets", () => {
    expect(ENVIRONMENT_PRESETS.map((p) => p.id)).toEqual([
      "studio",
      "outdoor",
      "indoor",
      "product-photography",
      "abstract",
    ]);
  });

  it("keeps every preset's light count within MAX_SCENE_LIGHTS and schema-valid", () => {
    for (const preset of ENVIRONMENT_PRESETS) {
      expect(preset.lights.length).toBeLessThanOrEqual(MAX_SCENE_LIGHTS);
      expect(preset.lights.length).toBeGreaterThan(0);
      for (const light of preset.lights) {
        expect(
          studioLightSchema.safeParse({ ...light, id: "x" }).success,
        ).toBe(true);
        expect(light.kind).toBeDefined();
      }
      expect(sceneCameraSchema.safeParse(preset.camera).success).toBe(true);
      expect(sceneAmbientSchema.safeParse(preset.ambient).success).toBe(true);
      expect(
        generationSettingsSchema.safeParse({
          camera: preset.camera,
          ambient: preset.ambient,
          studioLights: preset.lights.map((light, index) => ({
            ...light,
            id: `x${index}`,
          })),
        }).success,
      ).toBe(true);
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.scene.length).toBeGreaterThan(0);
    }
  });

  it("finds a preset by id and returns undefined for an unknown one", () => {
    expect(findEnvironmentPreset("studio")?.label).toBe("Studio");
    expect(findEnvironmentPreset("nope")).toBeUndefined();
  });
});

describe("mergeEnvironmentPreset", () => {
  it("appends a preset's lights onto the existing rig with fresh unique ids", () => {
    const existing = createStudioLight({ name: "Existing" });
    const preset = findEnvironmentPreset("studio")!;
    const result = mergeEnvironmentPreset({ studioLights: [existing] }, preset);
    expect(result.studioLights).toHaveLength(1 + preset.lights.length);
    expect(result.studioLights[0]).toBe(existing);
    const addedIds = result.studioLights.slice(1).map((l) => l.id);
    expect(new Set(addedIds).size).toBe(addedIds.length);
    expect(addedIds.every((id) => id !== existing.id)).toBe(true);
    expect(result.skipped).toBe(0);
  });

  it("clips added lights at MAX_SCENE_LIGHTS and reports the skipped count", () => {
    const existing = Array.from({ length: MAX_SCENE_LIGHTS - 1 }, (_, i) =>
      createStudioLight({ name: `Existing ${i}` }),
    );
    const preset = findEnvironmentPreset("studio")!; // 3 lights
    const result = mergeEnvironmentPreset({ studioLights: existing }, preset);
    expect(result.studioLights).toHaveLength(MAX_SCENE_LIGHTS);
    expect(result.skipped).toBe(preset.lights.length - 1);
  });

  it("skips every light once the rig is already at the cap", () => {
    const existing = Array.from({ length: MAX_SCENE_LIGHTS }, (_, i) =>
      createStudioLight({ name: `Existing ${i}` }),
    );
    const preset = findEnvironmentPreset("outdoor")!;
    const result = mergeEnvironmentPreset({ studioLights: existing }, preset);
    expect(result.studioLights).toHaveLength(MAX_SCENE_LIGHTS);
    expect(result.skipped).toBe(preset.lights.length);
  });

  it("sets ambient only when none is configured yet, keeping an existing (even disabled) one", () => {
    const preset = findEnvironmentPreset("studio")!;
    const withNoAmbient = mergeEnvironmentPreset({ studioLights: [] }, preset);
    expect(withNoAmbient.ambient).toEqual(preset.ambient);
    const disabled = { enabled: false, intensity: 10, temperature: 3000 } as const;
    const withAmbient = mergeEnvironmentPreset(
      { studioLights: [], ambient: disabled },
      preset,
    );
    expect(withAmbient.ambient).toEqual(disabled);
  });

  it("never touches the camera (merge keeps the existing one, including none at all)", () => {
    // mergeEnvironmentPreset's return type has no camera field at all — the
    // caller (store.ts's applyEnvironmentPreset) never assigns one in merge
    // mode, so there is nothing here to assert beyond the type itself.
    const preset = findEnvironmentPreset("studio")!;
    const result = mergeEnvironmentPreset({ studioLights: [] }, preset);
    expect("camera" in result).toBe(false);
  });
});
