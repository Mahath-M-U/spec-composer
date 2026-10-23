import { describe, expect, it } from "vitest";
import { artLine } from "./art-direction";
import {
  compileCameraPhrase,
  compileSceneDescription,
  compileSceneLighting,
  hasStructuredCamera,
  hasStructuredSceneLighting,
} from "./scene-prompt";
import { createSceneCamera, createSceneLight } from "./scene-objects";
import { createStudioLight } from "./studio-lighting";
import { createDocument } from "./templates";
import type { StudioLight } from "./types";

/** No raw scene-canvas coordinates, ids or decimal numbers anywhere in a
 * compiled phrase (AC5 / Step C point 4). */
const hasCoordinateLikeNumber = (text: string) => /\d+\.\d+/.test(text);

describe("compileCameraPhrase", () => {
  it("describes angle, focal length and a normal lens with no extra word", () => {
    const camera = createSceneCamera();
    expect(compileCameraPhrase(camera)).toBe(
      "eye-level camera with a 50mm lens perspective",
    );
  });

  it("names non-normal projections and other angles", () => {
    const camera = { ...createSceneCamera(), angle: "high" as const, projection: "wide" as const, focalLength: 24 };
    expect(compileCameraPhrase(camera)).toBe(
      "high-angle camera with a 24mm wide-angle lens perspective",
    );
  });

  it("never includes the raw position, rotation or target", () => {
    const camera = createSceneCamera({ x: 0.33, y: -0.77 });
    const phrase = compileCameraPhrase(camera);
    expect(hasCoordinateLikeNumber(phrase)).toBe(false);
    expect(phrase).not.toContain("0.33");
    expect(phrase).not.toContain(String(camera.rotation));
  });
});

describe("compileSceneLighting", () => {
  it("falls back to the no-sources line when nothing is active", () => {
    expect(compileSceneLighting([], undefined)).toBe(
      "No active light sources; use environment/ambient illumination only",
    );
    expect(
      compileSceneLighting([{ ...createSceneLight("sun", []), enabled: false }], {
        enabled: false,
        intensity: 50,
        temperature: 5600,
      }),
    ).toBe("No active light sources; use environment/ambient illumination only");
  });

  it("describes a diffused key light's direction, intensity and shadows in words", () => {
    const light: StudioLight = {
      ...createSceneLight("diffused", []),
      intensity: 65,
      temperature: 5600,
      shadows: "Soft",
      azimuth: -45,
      elevation: 10,
    };
    const text = compileSceneLighting([light], undefined);
    expect(text).toContain("soft diffused key light");
    expect(text).toContain("from");
    expect(text).toContain("natural soft shadows");
    expect(text).not.toContain("warm");
    expect(text).not.toContain("cool");
  });

  it("describes a Rim light as rim lighting (not by kind) with warmth and intensity words", () => {
    const light: StudioLight = {
      ...createSceneLight("spot", [], undefined, { role: "Rim", depth: "back" }),
      intensity: 20,
      temperature: 3200,
      azimuth: 175,
      elevation: 0,
      shadows: "None",
    };
    const text = compileSceneLighting([light], undefined);
    expect(text).toBe("subtle warm rim lighting from behind");
    expect(text).not.toContain("spot");
  });

  it("adds an ambient-fill phrase only when ambient is enabled", () => {
    const light = createSceneLight("area", []);
    expect(
      compileSceneLighting([light], { enabled: false, intensity: 80, temperature: 5600 }),
    ).not.toContain("ambient");
    const withAmbient = compileSceneLighting([light], {
      enabled: true,
      intensity: 50,
      temperature: 5600,
    });
    expect(withAmbient).toContain("controlled ambient fill");
  });

  it("summarizes shadows as mixed when active lights disagree", () => {
    const soft = { ...createSceneLight("area", []), shadows: "Soft" as const };
    const hard = {
      ...createSceneLight("spot", [soft]),
      shadows: "Hard" as const,
    };
    const text = compileSceneLighting([soft, hard], undefined);
    expect(text).toContain("mixed shadow quality");
  });

  it("never includes raw azimuth/elevation numbers, ids or decimals", () => {
    const light = {
      ...createSceneLight("point", []),
      azimuth: -72.5,
      elevation: 31.25,
    };
    const text = compileSceneLighting([light], {
      enabled: true,
      intensity: 50,
      temperature: 5600,
    });
    expect(hasCoordinateLikeNumber(text)).toBe(false);
    expect(text).not.toContain(light.id);
  });
});

describe("hasStructuredCamera / hasStructuredSceneLighting", () => {
  it("is false for undefined or legacy-only settings", () => {
    expect(hasStructuredCamera(undefined)).toBe(false);
    expect(hasStructuredSceneLighting(undefined)).toBe(false);
    expect(hasStructuredCamera({ cameraAngle: "Overhead" })).toBe(false);
    expect(
      hasStructuredSceneLighting({ studioLights: [createStudioLight()] }),
    ).toBe(false);
  });

  it("is true once a camera, ambient, or any scene-editor light field is set", () => {
    expect(hasStructuredCamera({ camera: createSceneCamera() })).toBe(true);
    expect(
      hasStructuredSceneLighting({
        ambient: { enabled: true, intensity: 50, temperature: 5600 },
      }),
    ).toBe(true);
    expect(
      hasStructuredSceneLighting({
        studioLights: [createSceneLight("sun", [])],
      }),
    ).toBe(true);
  });
});

describe("compileSceneDescription", () => {
  it("returns undefined fields for settings with nothing structured", () => {
    expect(compileSceneDescription(undefined)).toEqual({
      camera: undefined,
      lighting: undefined,
    });
    expect(
      compileSceneDescription({ cameraAngle: "Overhead", lightType: "Studio" }),
    ).toEqual({ camera: undefined, lighting: undefined });
  });
});

describe("artLine integration (Step C wiring)", () => {
  it("compiles the Scene field's camera phrase without a 'Camera angle:' label or coordinates", () => {
    const doc = { ...createDocument(), generationSettings: { camera: createSceneCamera() } };
    const line = artLine(doc, "scene");
    expect(line).toContain("eye-level camera with a 50mm lens perspective");
    expect(line).not.toContain("Camera angle:");
    expect(hasCoordinateLikeNumber(line)).toBe(false);
  });

  it("compiles the Lighting field's natural-language description for scene-editor lights", () => {
    const light = createSceneLight("sun", []);
    const doc = {
      ...createDocument(),
      generationSettings: { studioLights: [light] },
    };
    const line = artLine(doc, "lighting");
    expect(line).toMatch(/sun|key light/);
    expect(hasCoordinateLikeNumber(line)).toBe(false);
    expect(line).not.toContain(light.id);
    expect(line).not.toContain("azimuth");
  });

  it("keeps compiling a legacy studio rig (no kind/canvas) through the old coordinate text, byte-identically", () => {
    const light = createStudioLight({ name: "Legacy key" });
    const doc = {
      ...createDocument(),
      generationSettings: { studioLights: [light] },
    };
    const line = artLine(doc, "lighting");
    expect(line).toContain(`azimuth ${light.azimuth} degrees`);
    expect(line).toContain("Legacy key");
  });

  it("keeps compiling a legacy cameraAngle through the old labeled line, byte-identically", () => {
    const doc = {
      ...createDocument(),
      generationSettings: { cameraAngle: "Low angle" as const },
    };
    expect(artLine(doc, "scene")).toBe("Scene: Camera angle: Low angle.");
  });
});
