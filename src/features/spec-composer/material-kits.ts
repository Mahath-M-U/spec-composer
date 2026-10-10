import { notifyStorageChange } from "@/lib/storage/events";
import { getStorage, KV_KEYS } from "./storage";
import type {
  BrandKit,
  BrandKitColor,
  MaterialColorKit,
  StyleKit,
} from "./types";

/**
 * HSL approximation of Material 3 tonal palettes, kept dependency-free instead
 * of pulling in the CAM16/HCT-based `@material/material-color-utilities`.
 * Same M3 roles and tone stops, but lightness ramps in HSL rather than
 * perceptual L*, so output won't match Google's published baseline exactly.
 */
export const M3_TONE_STOPS = [
  0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100,
] as const;

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16,
  );
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h * 60, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(1, Math.max(0, s));
  const light = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function buildTonalScale(
  hue: number,
  saturation: number,
): Record<string, string> {
  const scale: Record<string, string> = {};
  for (const stop of M3_TONE_STOPS) {
    scale[String(stop)] = hslToHex(hue, saturation, stop / 100);
  }
  return scale;
}

/** Reads one tone from a generated scale; every scale is built from M3_TONE_STOPS
 * so this always hits, but TS can't see that through the Record<string, string> type. */
export function tone(scale: Record<string, string>, stop: number): string {
  return scale[String(stop)] ?? "#808080";
}

/** Builds M3-role tonal palettes (primary/secondary/tertiary/neutral/neutralVariant/error) from one seed color. */
export function generateMaterialColorKit(seedHex: string): MaterialColorKit {
  const { h } = hexToHsl(seedHex);
  return {
    seedHex,
    primary: buildTonalScale(h, 0.55),
    secondary: buildTonalScale(h, 0.22),
    tertiary: buildTonalScale(h + 60, 0.35),
    neutral: buildTonalScale(h, 0.06),
    neutralVariant: buildTonalScale(h, 0.1),
    error: buildTonalScale(5, 0.75),
  };
}

export function createStyleKit(name: string, seedHex: string): StyleKit {
  const now = new Date().toISOString();
  return {
    id: `stylekit_${crypto.randomUUID().slice(0, 8)}`,
    kind: "material3",
    name,
    materialColors: generateMaterialColorKit(seedHex),
    createdAt: now,
    updatedAt: now,
  };
}

/** The five role colors (primary/secondary/background/text/accent) a
 * Material 3 seed resolves to. Shared by the generated brand kit and the
 * builder's live preview so they always match. */
export function materialRoleColors(seedHex: string): BrandKitColor[] {
  const c = generateMaterialColorKit(seedHex);
  return [
    {
      id: "m3-primary",
      hex: tone(c.primary, 40),
      angle: 135,
      type: "solid",
      role: "primary",
      usecase: "Headlines, Buttons",
    },
    {
      id: "m3-secondary",
      hex: tone(c.secondary, 50),
      angle: 135,
      type: "solid",
      role: "secondary",
      usecase: "Subheadings, Highlights",
    },
    {
      id: "m3-background",
      hex: tone(c.neutral, 95),
      angle: 135,
      type: "solid",
      role: "background",
      usecase: "Canvas",
    },
    {
      id: "m3-text",
      hex: tone(c.neutral, 10),
      angle: 135,
      type: "solid",
      role: "text",
      usecase: "Headings, Body text",
    },
    {
      id: "m3-accent",
      hex: tone(c.tertiary, 60),
      angle: 135,
      type: "solid",
      role: "accent",
      usecase: "Accents",
    },
  ];
}

/** Converts a generated Material 3 style kit into the existing BrandKit shape
 * so it flows through the same apply-to-document/apply-to-element code path
 * as a hand-authored brand kit. `overrides` lets the one-screen generate
 * builder carry its emotions/style/typography/profile picks through. */
export function brandKitFromMaterialKit(
  kit: StyleKit,
  overrides?: Partial<Pick<BrandKit, "colors" | "emotions" | "style" | "typography" | "profile">>,
): BrandKit {
  const colors = materialRoleColors(kit.materialColors.seedHex).map(
    (color) => ({ ...color, id: crypto.randomUUID().slice(0, 8) }),
  );
  const now = new Date().toISOString();
  return {
    id: `brandkit_${crypto.randomUUID().slice(0, 8)}`,
    name: kit.name,
    colors,
    emotions: [],
    style: "Material 3",
    typography: "Manrope",
    createdAt: now,
    updatedAt: now,
    sourceKind: "material3",
    styleKitId: kit.id,
    ...overrides,
  };
}

/** Drops stored style kits that are not objects with a string id. */
export function normalizeStyleKits(value: unknown): StyleKit[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (kit): kit is StyleKit =>
      !!kit && typeof kit === "object" && typeof kit.id === "string",
  );
}

export async function loadMaterialStyleKits(): Promise<StyleKit[]> {
  if (typeof window === "undefined") return [];
  const storage = await getStorage();
  return normalizeStyleKits(await storage.getKv(KV_KEYS.materialKits));
}

export async function saveMaterialStyleKits(kits: StyleKit[]) {
  if (typeof window === "undefined") return;
  await (await getStorage()).setKv(KV_KEYS.materialKits, kits);
  notifyStorageChange("materialKits");
}
