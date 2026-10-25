import { describe, expect, it } from "vitest";
import { artLine } from "./art-direction";
import { compileVisualPrompt } from "./compiler";
import { compileDesignSkill } from "./design-md";
import { synchronizeStructuredOutput } from "./output-sync";
import { createDocument } from "./templates";
import { generationSettingsSchema } from "./types";
import { createStudioLight, LIGHT_SOURCE_PRESETS } from "./studio-lighting";

describe("Scene & Lighting generation settings", () => {
  it("invalidates lighting/style/elevation overrides for every rig mutation while keeping unrelated sections", () => {
    const before = createDocument();
    const light = createStudioLight();
    before.generationSettings = { studioLights: [light] };
    before.visualEdit = "Saved prompt";
    before.designEdit = "Saved design";
    before.promptParts = {
      lighting: "OLD",
      "skill:lighting": "OLD",
      imageStyle: "OLD",
      "skill:imageStyle": "OLD",
      "skill:elevation": "OLD",
      scene: "KEEP",
    };
    for (const studioLights of [
      [],
      [light, createStudioLight()],
      [{ ...light, enabled: false }],
      [{ ...light, name: "Renamed" }],
      [{ ...light, azimuth: 20 }],
      [{ ...light, id: "new-id" }],
    ]) {
      const next = structuredClone(before);
      next.generationSettings!.studioLights = studioLights;
      synchronizeStructuredOutput(before, next);
      expect(next.promptParts).toEqual({ scene: "KEEP" });
      expect(next.savedCustomText).toEqual({
        visual: "Saved prompt",
        design: "Saved design",
      });
      expect(next.visualEdit).toBeUndefined();
      expect(next.designEdit).toBeUndefined();
    }
    const same = structuredClone(before);
    synchronizeStructuredOutput(before, same);
    expect(same.visualEdit).toBe(before.visualEdit);
    expect(same.savedCustomText).toBeUndefined();
  });

  it("retains a disabled lighting rig in JSON without compiling its sources", () => {
    const doc = createDocument();
    doc.generationSettings = {
      studioLights: [createStudioLight({ name: "Omitted rig source" })],
    };
    expect(compileVisualPrompt(doc)).not.toContain("Omitted rig source");
    expect(compileDesignSkill(doc)).not.toContain("Omitted rig source");
    expect(JSON.stringify(doc)).toContain("Omitted rig source");
  });
  const configured = () => {
    const doc = createDocument();
    return {
      ...doc,
      scene: "Marble counter",
      lighting: "Warm reflections",
      imageStyle: "3d-render",
      promptOptions: { ...doc.promptOptions, scene: true, lighting: true },
      generationSettings: {
        cameraAngle: "Overhead" as const,
        lightType: "Studio" as const,
        lightDirection: "Left" as const,
        lightIntensity: 0,
        shadows: "Hard" as const,
      },
    };
  };

  it("compiles structured values in stable order, preserving zero intensity and explicit precedence", () => {
    const doc = configured();
    expect(artLine(doc, "scene")).toBe(
      "Scene: Marble counter; Camera angle: Overhead.",
    );
    expect(artLine(doc, "lighting")).toBe(
      "Lighting: Warm reflections; Light type: Studio; Direction: Left; Intensity: 0%; Shadows: Hard.",
    );
    for (const text of [compileVisualPrompt(doc), compileDesignSkill(doc)]) {
      expect(text).toContain("polished 3D scene");
      expect(text).toContain(
        "Explicit Scene and Lighting settings take precedence",
      );
      expect(text).toContain("Intensity: 0%");
      expect(text).toContain("Shadows: Hard");
      expect(text).toContain("Camera angle: Overhead");
    }
    expect(compileDesignSkill(doc)).not.toContain(
      "**All slots:** flat, no shadow",
    );
  });

  it("omits disabled sections while retaining their stored values", () => {
    const doc = configured();
    doc.promptOptions.scene = false;
    doc.promptOptions.lighting = false;
    for (const text of [compileVisualPrompt(doc), compileDesignSkill(doc)]) {
      expect(text).not.toContain("Marble counter");
      expect(text).not.toContain("Camera angle: Overhead");
      expect(text).not.toContain("Intensity: 0%");
      expect(text).not.toContain("Warm reflections");
    }
    expect(doc.generationSettings.lightIntensity).toBe(0);
  });

  it("preserves legacy DESIGN.md without inventing an explicit render-style section", () => {
    const doc = createDocument();
    expect(compileDesignSkill(doc)).not.toContain("## Render Style");
    expect(compileDesignSkill({ ...doc, imageStyle: "3d-render" })).toContain(
      "## Render Style",
    );
  });

  it("validates both named light sources and includes them in both generated formats", () => {
    for (const preset of LIGHT_SOURCE_PRESETS) {
      expect(generationSettingsSchema.safeParse(preset.settings).success).toBe(
        true,
      );
      const doc = createDocument();
      doc.generationSettings = { ...preset.settings };
      doc.promptOptions.lighting = true;
      for (const output of [
        compileVisualPrompt(doc),
        compileDesignSkill(doc),
      ]) {
        expect(output).toContain(`Light type: ${preset.label}`);
        expect(output).toContain(`Shadows: ${preset.settings.shadows}`);
      }
    }
  });

  it("validates enumerations and rejects invalid numeric values", () => {
    expect(
      generationSettingsSchema.safeParse({ cameraAngle: "sideways" }).success,
    ).toBe(false);
    expect(
      generationSettingsSchema.safeParse({ shadows: "large" }).success,
    ).toBe(false);
    expect(
      generationSettingsSchema.safeParse({ lightIntensity: 0 }).success,
    ).toBe(true);
  });

  it("invalidates both scene/style overrides and snapshots active text when generation settings change", () => {
    const previous = configured();
    const before = {
      ...previous,
      visualEdit: "Custom prompt",
      designEdit: "Custom design",
      promptParts: {
        scene: "OLD",
        "skill:scene": "OLD",
        imageStyle: "OLD",
        "skill:imageStyle": "OLD",
        "skill:elevation": "OLD NO SHADOW",
      },
    };
    const next = structuredClone(before);
    next.generationSettings.cameraAngle =
      "Low angle" as typeof next.generationSettings.cameraAngle;
    synchronizeStructuredOutput(before, next);
    expect(next.savedCustomText).toEqual({
      visual: "Custom prompt",
      design: "Custom design",
    });
    expect(next.promptParts).toEqual({});
    expect(next.visualEdit).toBeUndefined();
  });
});
