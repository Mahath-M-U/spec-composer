import { describe, expect, it } from "vitest";
import { artLine } from "./art-direction";
import { buildJsonExport, compileVisualPrompt } from "./compiler";
import { compileDesignSkill } from "./design-md";
import { compileCopyText } from "./copy-output";
import { imageStyleLine } from "./image-styles";
import { createDocument } from "./templates";
import {
  generationSettingsSchema,
  parseSpecDocument,
  studioLightSchema,
  type StudioLight,
} from "./types";
import {
  compileStudioLighting,
  createStudioLight,
  createStudioPreset,
  hasExplicitLighting,
  MAX_STUDIO_LIGHTS,
} from "./studio-lighting";

describe("studio light schema and factories", () => {
  it.each([
    ["azimuth", -180, 180],
    ["elevation", -90, 90],
    ["width", 0.1, 5],
    ["height", 0.1, 5],
    ["intensity", 0, 100],
    ["diffusion", 0, 100],
    ["temperature", 2000, 10000],
  ] as const)(
    "validates finite %s and its inclusive bounds",
    (key, min, max) => {
      const light = createStudioLight();
      for (const value of [min, max])
        expect(
          studioLightSchema.safeParse({ ...light, [key]: value }).success,
        ).toBe(true);
      for (const value of [min - 0.01, max + 0.01, NaN, Infinity, -Infinity])
        expect(
          studioLightSchema.safeParse({ ...light, [key]: value }).success,
        ).toBe(false);
    },
  );

  it("trims names, rejects blank/oversized names and invalid options", () => {
    const light = createStudioLight();
    expect(
      studioLightSchema.parse({ ...light, name: "  Main light  " }).name,
    ).toBe("Main light");
    for (const patch of [
      { name: "   " },
      { name: "x".repeat(61) },
      { role: "Subject" },
      { shape: "Point" },
      { modifier: "Laser" },
      { shadows: "Heavy" },
    ])
      expect(studioLightSchema.safeParse({ ...light, ...patch }).success).toBe(
        false,
      );
  });

  it("enforces unique IDs and at most six sources while preserving an explicit empty rig", () => {
    const light = createStudioLight();
    expect(
      generationSettingsSchema.safeParse({ studioLights: [light, light] })
        .success,
    ).toBe(false);
    expect(
      generationSettingsSchema.safeParse({
        studioLights: Array.from({ length: MAX_STUDIO_LIGHTS + 1 }, () =>
          createStudioLight(),
        ),
      }).success,
    ).toBe(false);
    expect(
      generationSettingsSchema.parse({ studioLights: [] }).studioLights,
    ).toEqual([]);
    expect(generationSettingsSchema.parse({}).studioLights).toBeUndefined();
  });

  it("creates valid default sources and fresh independent portrait/product rigs", () => {
    const light = createStudioLight();
    expect(light).toMatchObject({
      name: "Key light",
      enabled: true,
      role: "Key",
      shape: "Rectangle",
      modifier: "Softbox",
      azimuth: -45,
      elevation: 35,
      width: 1.5,
      height: 2,
      intensity: 100,
      diffusion: 80,
      temperature: 5600,
      shadows: "Soft",
    });
    const portrait = createStudioPreset("portrait");
    const product = createStudioPreset("product");
    expect(portrait.map((source) => source.intensity)).toEqual([100, 45, 60]);
    expect(product.map((source) => source.intensity)).toEqual([
      100, 50, 70, 45,
    ]);
    expect(product[2]).toMatchObject({
      role: "Rim",
      shape: "Rectangle",
      modifier: "Softbox",
    });
    expect(product[3]).toMatchObject({
      modifier: "Diffusion panel",
      elevation: 90,
    });
    const all = [
      light,
      ...portrait,
      ...product,
      ...createStudioPreset("portrait"),
      ...createStudioPreset("product"),
    ];
    expect(new Set(all.map((source) => source.id)).size).toBe(all.length);
    expect(
      all.every((source) => studioLightSchema.safeParse(source).success),
    ).toBe(true);
  });
});

describe("studio lighting compilation", () => {
  it("compiles enabled sources in stored order with all meaningful fields and explicit units", () => {
    const disk = createStudioLight({
      name: "Disk fill",
      role: "Fill",
      shape: "Disk",
      modifier: "Umbrella",
      width: 2,
      intensity: 0,
      diffusion: 95,
      temperature: 3200,
      shadows: "None",
    });
    const rim = createStudioLight({
      name: "Rear strip",
      role: "Rim",
      azimuth: 135,
      elevation: 25,
      width: 0.2,
      height: 2,
      modifier: "Bare",
      diffusion: 0,
      shadows: "Hard",
    });
    const disabled = createStudioLight({
      name: "Disabled source",
      enabled: false,
    });
    const text = compileStudioLighting([disk, disabled, rim]);
    expect(text.indexOf("Disk fill")).toBeLessThan(text.indexOf("Rear strip"));
    expect(text).not.toContain("Disabled source");
    for (const phrase of [
      "azimuth 0 degrees is front",
      "-90 left",
      "+90 right",
      "+/-180 behind",
      "+90 overhead",
      "multiples of subject width",
      "not watts or exposure",
      "diffusion is a creative instruction",
      "Disk source with Umbrella",
      "diameter 2",
      "relative intensity 0/100",
      "diffusion 95/100",
      "temperature 3200 K",
      "shadows None",
      "width 0.2, height 2",
      "azimuth 135 degrees, elevation 25 degrees",
      "shadows Hard",
    ])
      expect(text).toContain(phrase);
    expect(compileStudioLighting([disk, disabled, rim])).toBe(text);
    expect(
      compileStudioLighting([{ ...disk, id: "new-id" }, disabled, rim]),
    ).toBe(text);
  });

  it.each([
    { lights: [] as StudioLight[] },
    { lights: [createStudioLight({ enabled: false })] },
  ])(
    "uses ambient/environment illumination for a rig without active sources",
    ({ lights }) => {
      expect(compileStudioLighting(lights)).toBe(
        "No active studio sources; use environment/ambient illumination only",
      );
    },
  );

  it("makes an empty rig explicit only while lighting output is enabled", () => {
    const doc = createDocument();
    doc.generationSettings = { studioLights: [] };
    expect(hasExplicitLighting(doc)).toBe(false);
    doc.promptOptions.lighting = true;
    expect(hasExplicitLighting(doc)).toBe(true);
    expect(imageStyleLine(doc)).toContain(
      "Explicit Scene and Lighting settings take precedence",
    );
    doc.generationSettings = { lightIntensity: 0 };
    expect(hasExplicitLighting(doc)).toBe(true);
    doc.generationSettings = {};
    expect(hasExplicitLighting(doc)).toBe(false);
  });

  it("replaces legacy light fields, retains notes, and synchronizes prompt/spec/copy/JSON", () => {
    const doc = createDocument();
    doc.promptOptions.lighting = true;
    doc.imageStyle = "3d-render";
    doc.lighting = "Preserve subtle skin texture";
    const disabled = createStudioLight({
      name: "Hidden background",
      role: "Background",
      enabled: false,
    });
    doc.generationSettings = {
      lightType: "Ambient",
      lightDirection: "Back",
      lightIntensity: 15,
      shadows: "Hard",
      studioLights: [
        createStudioLight({ name: "Main softbox", diffusion: 100 }),
        disabled,
      ],
    };
    const prompt = compileVisualPrompt(doc),
      design = compileDesignSkill(doc);
    for (const text of [prompt, design]) {
      expect(text).toContain("Main softbox");
      expect(text).toContain("Preserve subtle skin texture");
      expect(text).not.toContain("Light type: Ambient");
      expect(text).not.toContain("Direction: Back");
      expect(text).not.toContain("Intensity: 15%");
      expect(text).not.toContain("Shadows: Hard");
      expect(text).not.toContain("Hidden background");
    }
    expect(design).not.toContain("**All slots:** flat, no shadow");
    expect(compileCopyText(doc, undefined, "design")).toBe(design);
    expect(buildJsonExport(doc).prompt).toBe(
      compileCopyText(doc, undefined, "prompt"),
    );
    expect(
      buildJsonExport(doc).spec.generationSettings?.studioLights?.[1],
    ).toEqual(disabled);
    expect(
      parseSpecDocument(JSON.parse(JSON.stringify(doc)))?.generationSettings
        ?.studioLights,
    ).toEqual(doc.generationSettings.studioLights);
  });

  it("preserves legacy prose when no rig is supplied and suppresses it when an explicit empty rig exists", () => {
    const doc = createDocument();
    doc.generationSettings = {
      lightType: "Studio",
      lightDirection: "Left",
      lightIntensity: 0,
      shadows: "Soft",
    };
    expect(artLine(doc, "lighting")).toBe(
      "Lighting: Light type: Studio; Direction: Left; Intensity: 0%; Shadows: Soft.",
    );
    doc.generationSettings.studioLights = [];
    expect(artLine(doc, "lighting")).toBe(
      "Lighting: No active studio sources; use environment/ambient illumination only.",
    );
  });
});
