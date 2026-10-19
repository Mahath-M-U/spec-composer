import {
  studioLightSchema,
  type GenerationSettings,
  type SpecDocument,
  type StudioLight,
} from "./types";

export const LIGHT_SOURCE_PRESETS = [
  {
    id: "diffused",
    label: "Diffused light",
    description: "Broad, soft illumination with gentle shadows.",
    settings: {
      lightType: "Diffused light",
      lightDirection: "Front",
      lightIntensity: 65,
      shadows: "Soft",
    },
  },
  {
    id: "sunlight",
    label: "Sunlight",
    description: "Directional sunlight with crisp, hard shadows.",
    settings: {
      lightType: "Sunlight",
      lightDirection: "Above",
      lightIntensity: 90,
      shadows: "Hard",
    },
  },
] as const satisfies readonly {
  id: string;
  label: string;
  description: string;
  settings: Partial<GenerationSettings>;
}[];

export {
  MAX_STUDIO_LIGHTS,
  STUDIO_LIGHT_ROLES,
  STUDIO_LIGHT_SHAPES,
  STUDIO_LIGHT_MODIFIERS,
} from "./types";

export const STUDIO_PRESETS = [
  {
    id: "portrait",
    label: "Portrait studio",
    description: "A large soft key, gentle fill and rear rim for models.",
  },
  {
    id: "product",
    label: "Product studio",
    description:
      "Broad diffused key and fill, a rear strip and overhead diffusion.",
  },
] as const;
export type StudioPresetId = (typeof STUDIO_PRESETS)[number]["id"];

export function createStudioLight(
  overrides: Partial<Omit<StudioLight, "id">> = {},
): StudioLight {
  return studioLightSchema.parse({
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
    ...overrides,
    id: crypto.randomUUID(),
  });
}

export function createStudioPreset(id: StudioPresetId): StudioLight[] {
  if (id === "portrait")
    return [
      createStudioLight({
        name: "Portrait key",
        width: 2,
        height: 2.5,
        diffusion: 90,
      }),
      createStudioLight({
        name: "Portrait fill",
        role: "Fill",
        azimuth: 45,
        elevation: 20,
        width: 2,
        height: 2,
        intensity: 45,
        diffusion: 90,
      }),
      createStudioLight({
        name: "Portrait rim",
        role: "Rim",
        azimuth: 135,
        elevation: 25,
        width: 0.4,
        height: 1.8,
        intensity: 60,
        diffusion: 60,
        temperature: 6000,
      }),
    ];
  return [
    createStudioLight({
      name: "Product key",
      elevation: 45,
      width: 2.5,
      height: 3,
      diffusion: 95,
    }),
    createStudioLight({
      name: "Product fill",
      role: "Fill",
      azimuth: 55,
      elevation: 25,
      width: 2.5,
      height: 3,
      intensity: 50,
      diffusion: 95,
    }),
    createStudioLight({
      name: "Rear strip",
      role: "Rim",
      azimuth: 150,
      elevation: 15,
      width: 0.25,
      height: 2,
      intensity: 70,
    }),
    createStudioLight({
      name: "Overhead diffusion",
      role: "Fill",
      modifier: "Diffusion panel",
      azimuth: 0,
      elevation: 90,
      width: 2,
      height: 2,
      intensity: 45,
      diffusion: 100,
    }),
  ];
}

export function compileStudioLighting(lights: StudioLight[]): string {
  const active = lights.filter((light) => light.enabled);
  if (!active.length)
    return "No active studio sources; use environment/ambient illumination only";
  const sources = active.map((light) => {
    const size =
      light.shape === "Disk"
        ? `diameter ${light.width}`
        : `width ${light.width}, height ${light.height}`;
    return `${light.name} (${light.role}): ${light.shape} source with ${light.modifier}; azimuth ${light.azimuth} degrees, elevation ${light.elevation} degrees; ${size} in subject-width units; relative intensity ${light.intensity}/100; diffusion ${light.diffusion}/100; temperature ${light.temperature} K; shadows ${light.shadows}`;
  });
  return `Studio lighting rig. Positions are camera-relative: azimuth 0 degrees is front, -90 left, +90 right, +/-180 behind; elevation 0 is subject level and +90 overhead. Source sizes are multiples of subject width. Intensity uses relative units, not watts or exposure; diffusion is a creative instruction. Treat source positions as illumination instructions; keep lighting equipment and schematic diagrams out of the image unless the brief explicitly requests them. ${sources.join(". ")}`;
}

export function hasExplicitLighting(
  doc: Pick<SpecDocument, "generationSettings" | "promptOptions">,
): boolean {
  if (!doc.promptOptions.lighting) return false;
  const settings = doc.generationSettings;
  return (
    !!settings &&
    (settings.studioLights !== undefined ||
      settings.lightType !== undefined ||
      settings.lightDirection !== undefined ||
      settings.lightIntensity !== undefined ||
      settings.shadows !== undefined)
  );
}
