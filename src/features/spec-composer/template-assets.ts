import { findAssetItem, resolveAssetPatch } from "./asset-catalog";
import { isImageKind, type Format, type SpecElement } from "./types";
import type { Palette, Visual } from "./template-layouts";

/** Explicit catalog references keep template elements editable and swappable in Library. */
export function libraryVisual(
  assetId: string,
  ai: string,
  options: Pick<Visual, "fit" | "focal"> = {},
): Visual {
  const item = findAssetItem(assetId);
  if (!item || !isImageKind(item.kind) || !item.art)
    throw new Error(`Invalid template image asset: ${assetId}`);
  return { assetId, kind: item.kind, art: item.art, ai, ...options };
}

export function templateAssetPatch(
  assetId: string | undefined,
  kind: SpecElement["kind"],
  format: Format,
  colors: Palette,
): Partial<SpecElement> {
  if (!assetId) return {};
  const item = findAssetItem(assetId);
  if (!item || item.kind !== kind)
    throw new Error(`Template asset ${assetId} does not match ${kind}`);
  return resolveAssetPatch(item, {
    format,
    colors: { primary: colors.ink, secondary: colors.accent },
  }).patch;
}
