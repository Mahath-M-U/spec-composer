import type { CSSProperties } from "react";
import { isConstraint } from "./contextual-editor/catalog";
import { isEditableModel } from "./contextual-editor/model-preview";
import { relativeLuminance } from "./color-names";
import { hasPlaceholderArt } from "./illustrations";
import { backgroundStyle } from "./static-render";
import { parseColor, serializeColor } from "./text-color";
import { isImageKind, type SpecDocument, type SpecElement } from "./types";

/** Layers-panel thumbnails must never let same-tone content vanish into a
 * same-tone document background, so they swap to a fixed neutral backing
 * when contrast runs out. */
export const THUMB_MIN_CONTRAST = 2;
export const THUMB_DARK = "#1c1c1c";
export const THUMB_LIGHT = "#f2f2f2";

/** Normalizes a readable CSS color to a 6-digit opaque hex, or undefined for
 * anything a thumbnail can't cheaply reason about (css vars, hsl, named
 * colors, or low alpha). */
export function opaqueHex(css?: string): string | undefined {
  const color = parseColor(css);
  if (!color || color.a < 0.5) return undefined;
  return serializeColor({ ...color, a: 1 });
}

/** The single color that best represents an element's silhouette inside a
 * thumbnail, or undefined when the element isn't a readable flat color
 * (images, models, placeholder art, constraints). */
function contentHex(el: SpecElement, doc: SpecDocument): string | undefined {
  if (isConstraint(el) || isEditableModel(el)) return undefined;
  const st = el.style;
  if (isImageKind(el.kind)) {
    if (!el.src && el.placeholderArt === "brand-wordmark")
      return opaqueHex(st.color ?? doc.creativeDirection.primaryColor);
    return undefined;
  }
  if (el.kind === "shape" || el.kind === "divider") {
    if (hasPlaceholderArt(el.placeholderArt)) return undefined;
    const background = opaqueHex(st.background);
    if (background) return background;
    return (st.borderWidth ?? 0) > 0 ? opaqueHex(st.borderColor) : undefined;
  }
  return st.background ? opaqueHex(st.background) : opaqueHex(st.color);
}

const contrastRatio = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Background for a layer thumbnail frame: the document background when it
 * reads clearly against the thumbnail's content, otherwise a fixed neutral
 * backing chosen for maximum contrast against that content. */
export function layerThumbBackground(
  doc: SpecDocument,
  leaves: SpecElement[],
): CSSProperties {
  const backdropHexes = [
    opaqueHex(doc.background.value),
    ...(doc.background.type === "gradient"
      ? [opaqueHex(doc.background.secondaryValue ?? doc.background.value)]
      : []),
  ];
  if (backdropHexes.some((hex) => hex === undefined))
    return backgroundStyle(doc);
  const backdropLuminances = (backdropHexes as string[]).map(
    relativeLuminance,
  );

  const samples = leaves.flatMap((leaf) => {
    const hex = contentHex(leaf, doc);
    return hex
      ? [
          {
            L: relativeLuminance(hex),
            w: Math.max(1, leaf.width * leaf.height),
          },
        ]
      : [];
  });
  if (!samples.length) return backgroundStyle(doc);
  const totalWeight = samples.reduce((sum, sample) => sum + sample.w, 0);
  const contentL =
    samples.reduce((sum, sample) => sum + sample.L * sample.w, 0) /
    totalWeight;

  const worstContrast = Math.min(
    ...backdropLuminances.map((L) => contrastRatio(contentL, L)),
  );
  if (worstContrast >= THUMB_MIN_CONTRAST) return backgroundStyle(doc);

  const darkContrast = contrastRatio(contentL, relativeLuminance(THUMB_DARK));
  const lightContrast = contrastRatio(
    contentL,
    relativeLuminance(THUMB_LIGHT),
  );
  return {
    background: darkContrast >= lightContrast ? THUMB_DARK : THUMB_LIGHT,
  };
}
