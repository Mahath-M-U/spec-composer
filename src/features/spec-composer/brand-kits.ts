import { notifyStorageChange } from "@/lib/storage/events";
import { readRaw, removeKey, writeRaw } from "@/lib/storage/local";
import { getStorage, KV_KEYS, LS_KEYS } from "./storage";
import { normalizeBrandProfile } from "./brand-profile";
import { recolorScrimGradient } from "./gradient-recolor";
import {
  isTextKind,
  type BrandKit,
  type BrandKitColor,
  type SpecDocument,
  type SpecElement,
} from "./types";

/**
 * Last kits loaded or saved in this tab, so document creation can apply the
 * default kit synchronously.
 */
let cachedKits: BrandKit[] = [];

/** Validates and back-fills stored brand kits; drops entries without an id. */
export function normalizeBrandKits(value: unknown): BrandKit[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (kit): kit is BrandKit =>
        !!kit && typeof kit === "object" && typeof kit.id === "string",
    )
    .map(({ profile, ...kit }) => {
      const normalizedProfile = normalizeBrandProfile(profile);
      return {
        ...kit,
        emotions: Array.isArray(kit.emotions) ? kit.emotions : [],
        ...(normalizedProfile ? { profile: normalizedProfile } : {}),
        colors: Array.isArray(kit.colors)
          ? kit.colors.map((color, index) => ({
              ...color,
              type: color.type === "gradient" ? "gradient" : "solid",
              role: normalizeColorRole(color, index),
              secondaryHex: color.secondaryHex ?? color.hex,
              angle: Number.isFinite(color.angle) ? color.angle : 135,
              usecase:
                color.usecase ??
                (index === 0 ? "Primary brand color" : "Brand color"),
            }))
          : [],
      };
    });
}

export async function loadBrandKits(): Promise<BrandKit[]> {
  if (typeof window === "undefined") return [];
  const storage = await getStorage();
  cachedKits = normalizeBrandKits(await storage.getKv(KV_KEYS.brandKits));
  return cachedKits;
}

function normalizeColorRole(
  color: Partial<BrandKitColor> & { role?: string },
  index: number,
): BrandKitColor["role"] {
  if (
    color.role === "primary" ||
    color.role === "secondary" ||
    color.role === "background" ||
    color.role === "text" ||
    color.role === "accent"
  )
    return color.role;

  const usecase = color.usecase?.toLowerCase() ?? "";
  if (usecase.includes("background") || usecase.includes("canvas"))
    return "background";
  if (usecase.includes("text") || usecase.includes("font")) return "text";
  if (usecase.includes("secondary")) return "secondary";
  return index === 0 ? "primary" : index === 1 ? "secondary" : "accent";
}

export function getBrandKitColor(kit: BrandKit, role: BrandKitColor["role"]) {
  return kit.colors.find((color) => color.role === role);
}

export async function saveBrandKits(kits: BrandKit[]) {
  if (typeof window === "undefined") return;
  cachedKits = kits;
  await (await getStorage()).setKv(KV_KEYS.brandKits, kits);
  notifyStorageChange("brandKits");
}

// The default kit id is a tiny pointer, so it stays in localStorage.
export function loadDefaultBrandKitId(): string | undefined {
  return readRaw(LS_KEYS.defaultBrandKit) ?? undefined;
}

export function saveDefaultBrandKitId(id: string | undefined) {
  if (id) writeRaw(LS_KEYS.defaultBrandKit, id);
  else removeKey(LS_KEYS.defaultBrandKit);
}

/** Applies the element-level parts of a brand kit to one design element. */
export function applyBrandKitToElement(element: SpecElement, kit: BrandKit) {
  const primaryColor =
    getBrandKitColor(kit, "primary") ??
    kit.colors.find(
      (color) => color.role !== "background" && color.role !== "text",
    );
  const textColor = getBrandKitColor(kit, "text") ?? primaryColor;

  if (isTextKind(element.kind)) {
    if (kit.typography) element.style.fontFamily = kit.typography;
    if (textColor) element.style.color = textColor.hex;
    return;
  }

  if (
    primaryColor &&
    (element.kind === "shape" || element.kind === "divider")
  ) {
    // A scrim such as `linear-gradient(transparent, #18201E)` keeps its
    // transparent stops; only its opaque stops take the kit colour.
    const scrim = recolorScrimGradient(
      element.style.background,
      primaryColor.hex,
    );
    if (scrim) {
      element.style.background = scrim;
      return;
    }
    element.style.background =
      primaryColor.type === "gradient"
        ? `linear-gradient(${primaryColor.angle}deg, ${primaryColor.hex}, ${primaryColor.secondaryHex ?? primaryColor.hex})`
        : primaryColor.hex;
  }
}

/** Applies a brand kit's colors, typography, style, and mood onto a document in place. */
export function applyBrandKitToDocument(doc: SpecDocument, kit: BrandKit) {
  doc.creativeDirection.brandKitId = kit.id;
  const primaryColor =
    getBrandKitColor(kit, "primary") ??
    kit.colors.find(
      (color) => color.role !== "background" && color.role !== "text",
    );
  const secondaryColor =
    getBrandKitColor(kit, "secondary") ?? getBrandKitColor(kit, "accent");
  if (primaryColor) doc.creativeDirection.primaryColor = primaryColor.hex;
  if (secondaryColor) doc.creativeDirection.secondaryColor = secondaryColor.hex;
  else if (primaryColor?.type === "gradient" && primaryColor.secondaryHex)
    doc.creativeDirection.secondaryColor = primaryColor.secondaryHex;
  if (kit.emotions.length) doc.creativeDirection.mood = [...kit.emotions];
  const backgroundColor = getBrandKitColor(kit, "background");
  if (backgroundColor) {
    doc.background.type = backgroundColor.type;
    doc.background.value = backgroundColor.hex;
    if (backgroundColor.type === "gradient")
      Object.assign(doc.background, {
        secondaryValue: backgroundColor.secondaryHex ?? backgroundColor.hex,
        angle: backgroundColor.angle,
      });
    else {
      delete doc.background.secondaryValue;
      delete doc.background.angle;
    }
  }
  if (kit.style) doc.creativeDirection.style = kit.style;
  if (kit.typography) {
    doc.creativeDirection.typography = kit.typography;
  }
  const profile = normalizeBrandProfile(kit.profile);
  if (profile) doc.creativeDirection.brandProfile = structuredClone(profile);
  else delete doc.creativeDirection.brandProfile;
  doc.elements.forEach((element) => applyBrandKitToElement(element, kit));
}

/**
 * Applies the saved default brand kit (if any) to a freshly created document.
 * Uses the in-tab cache, which the storage bootstrap fills on startup.
 */
export function applyDefaultBrandKit(doc: SpecDocument) {
  const defaultId = loadDefaultBrandKitId();
  if (!defaultId) return;
  const kit = cachedKits.find((candidate) => candidate.id === defaultId);
  if (kit) applyBrandKitToDocument(doc, kit);
}
