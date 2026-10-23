import { describe, expect, it } from "vitest";
import { controlsForSceneObject, sceneControlValue } from "./scene-controls";
import { createSceneCamera, createSceneLight } from "./scene-objects";
import type { SceneAmbient, SceneLightKind } from "./types";

const keys = (ref: ReturnType<typeof controlsForSceneObject>) => ref.map((d) => d.key);

describe("controlsForSceneObject", () => {
  it("gives the camera framing, angle, perspective and rotation, with no duplicate/delete", () => {
    const camera = createSceneCamera();
    const descriptors = controlsForSceneObject({ type: "camera", camera });
    expect(keys(descriptors)).toEqual(["focalLength", "angle", "projection", "rotation"]);
    expect(descriptors.find((d) => d.key === "angle")?.options?.map((o) => o.value)).toEqual([
      "eye-level",
      "low",
      "high",
      "top-down",
      "three-quarter",
    ]);
    expect(descriptors.find((d) => d.key === "projection")?.options?.map((o) => o.value)).toEqual([
      "normal",
      "wide",
      "telephoto",
      "orthographic",
    ]);
  });

  it("gives ambient an enabled toggle, intensity and temperature", () => {
    const ambient: SceneAmbient = { enabled: false, intensity: 50, temperature: 5600 };
    const descriptors = controlsForSceneObject({ type: "ambient", ambient });
    expect(keys(descriptors)).toEqual(["enabled", "intensity", "temperature"]);
    expect(descriptors[0]!.type).toBe("toggle");
  });

  it.each<[SceneLightKind, string[]]>([
    ["sun", ["elevation", "diffusion"]],
    ["spot", ["coneAngle", "diffusion"]],
    ["point", ["radius"]],
    ["area", ["width", "height", "spread"]],
    ["diffused", ["width", "height", "spread"]],
  ])("gives %s lights the shared set plus its own conditional controls", (kind, extraKeys) => {
    const light = createSceneLight(kind, []);
    const descriptors = controlsForSceneObject({ type: "light", light });
    expect(keys(descriptors)).toEqual([
      "kind",
      "intensity",
      "temperature",
      "color",
      "rotation",
      "shadows",
      ...extraKeys,
      "duplicate",
      "delete",
    ]);
  });

  it("every base light kind appears once in the Type select, excluding the Rim variant", () => {
    const light = createSceneLight("sun", []);
    const descriptors = controlsForSceneObject({ type: "light", light });
    const type = descriptors.find((d) => d.key === "kind")!;
    expect(type.options?.map((o) => o.value)).toEqual(["sun", "diffused", "spot", "point", "area"]);
    expect(type.options?.map((o) => o.label)).toEqual([
      "Sunlight",
      "Diffused",
      "Spotlight",
      "Point",
      "Area",
    ]);
  });

  it("relabels intensity as edge intensity for a Rim-role light, without adding a new key", () => {
    const rim = createSceneLight("spot", [], undefined, { role: "Rim", depth: "back" });
    const descriptors = controlsForSceneObject({ type: "light", light: rim });
    const intensity = descriptors.find((d) => d.key === "intensity")!;
    expect(intensity.label).toBe("Edge intensity");
    expect(keys(descriptors).filter((k) => k === "intensity")).toHaveLength(1);
  });

  it("falls back to kindFromLegacy for a light saved before the environment editor", () => {
    const light = createSceneLight("point", []);
    delete (light as { kind?: SceneLightKind }).kind;
    const descriptors = controlsForSceneObject({ type: "light", light });
    expect(keys(descriptors)).toContain("radius");
    expect(keys(descriptors)).not.toContain("width");
  });
});

describe("sceneControlValue", () => {
  it("reads a light's own field for most descriptors and diffusion for the spread alias", () => {
    const light = createSceneLight("area", []);
    const descriptors = controlsForSceneObject({ type: "light", light });
    const spread = descriptors.find((d) => d.key === "spread")!;
    expect(sceneControlValue({ type: "light", light }, spread)).toBe(light.diffusion);
    const intensity = descriptors.find((d) => d.key === "intensity")!;
    expect(sceneControlValue({ type: "light", light }, intensity)).toBe(light.intensity);
  });

  it("returns undefined for an action button", () => {
    const light = createSceneLight("sun", []);
    const descriptors = controlsForSceneObject({ type: "light", light });
    const duplicate = descriptors.find((d) => d.key === "duplicate")!;
    expect(sceneControlValue({ type: "light", light }, duplicate)).toBeUndefined();
  });

  it("reads camera and ambient fields directly", () => {
    const camera = createSceneCamera();
    const descriptors = controlsForSceneObject({ type: "camera", camera });
    const focal = descriptors.find((d) => d.key === "focalLength")!;
    expect(sceneControlValue({ type: "camera", camera }, focal)).toBe(camera.focalLength);
    const ambient: SceneAmbient = { enabled: true, intensity: 70, temperature: 6000 };
    const intensityDescriptor = controlsForSceneObject({ type: "ambient", ambient }).find(
      (d) => d.key === "intensity",
    )!;
    expect(sceneControlValue({ type: "ambient", ambient }, intensityDescriptor)).toBe(70);
  });
});
