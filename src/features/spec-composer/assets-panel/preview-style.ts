import type { CSSProperties } from "react";
import type { AssetItem } from "../asset-catalog/types.ts";
import type { ArtColors } from "../illustrations";

function resolveColor(value: string | undefined, colors: ArtColors) {
  return value
    ?.replaceAll("$primary", colors.ink)
    .replaceAll("$secondary", colors.accent);
}

/** Scale the inserted text treatment into a small specimen without changing its character. */
export function textPreviewStyle(
  item: AssetItem,
  colors: ArtColors,
  baseTextColor = "#18181B",
): CSSProperties {
  const style = item.style ?? {};
  return {
    fontFamily: style.fontFamily,
    fontSize: Math.max(
      11,
      Math.min(24, Math.round((style.fontSize ?? 36) * 0.3)),
    ),
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    lineHeight: style.lineHeight ?? 1.15,
    letterSpacing: style.letterSpacing
      ? Math.min(style.letterSpacing * 0.3, 1.5)
      : undefined,
    textAlign: style.alignment,
    aspectRatio: item.size?.aspect === 1 ? "1" : undefined,
    display: item.size?.aspect === 1 ? "grid" : undefined,
    placeItems: item.size?.aspect === 1 ? "center" : undefined,
    color: resolveColor(style.color, colors) ?? baseTextColor,
    background: resolveColor(style.background, colors),
    borderRadius: style.borderRadius
      ? Math.min(style.borderRadius * 0.4, 999)
      : undefined,
    borderColor: resolveColor(style.borderColor, colors),
    borderWidth: style.borderWidth ? Math.max(1, style.borderWidth * 0.5) : 0,
    borderStyle: style.borderWidth ? "solid" : undefined,
    opacity: style.opacity,
  };
}

/** Reflect an item's aspect ratio and styling instead of stretching every shape into a square. */
export function shapePreviewStyle(
  item: AssetItem,
  colors: ArtColors,
): CSSProperties {
  const style = item.style ?? {};
  const aspect = item.size?.aspect ?? 1;
  const line = item.kind === "divider";
  return {
    width: line ? (aspect < 1 ? 3 : "76%") : aspect < 0.7 ? "34%" : "62%",
    height: line ? (aspect < 1 ? "72%" : 3) : undefined,
    aspectRatio: line ? undefined : String(aspect),
    maxHeight: "72%",
    background: resolveColor(style.background, colors),
    borderRadius:
      style.shapeType === "circle"
        ? "50%"
        : style.borderRadius
          ? Math.min(style.borderRadius * 0.3, 999)
          : undefined,
    borderColor: resolveColor(style.borderColor, colors),
    borderWidth: style.borderWidth ? Math.max(1, style.borderWidth * 0.4) : 0,
    borderStyle: style.borderWidth ? "solid" : undefined,
    opacity: style.opacity,
  };
}
