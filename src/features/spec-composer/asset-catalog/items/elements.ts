import type { AssetItem } from "../types.ts";

/** Shapes, lines, frames, icons, backgrounds, abstract motifs and brand
 * marks: the "Elements" collection. Only existing shapeType values are used
 * (rectangle, rounded rectangle, circle, line), so there is no schema
 * change. */
export const elementsItems: AssetItem[] = [
  // Shapes (9) — existing shapeType values only.
  {
    id: "shapes-square",
    label: "Square",
    category: "shapes",
    kind: "shape",
    tags: ["shape", "square", "block", "geometric"],
    prompt:
      "Flat solid square block, crisp square corners, primary brand color fill, sits as a clean geometric accent behind or beside other elements",
    style: { shapeType: "rectangle", background: "$primary", borderRadius: 0 },
    size: { w: 0.3, aspect: 1 },
  },
  {
    id: "shapes-rectangle",
    label: "Rectangle",
    category: "shapes",
    kind: "shape",
    tags: ["shape", "rectangle", "block", "geometric"],
    prompt:
      "Flat solid rectangle block, crisp square corners, primary brand color fill, wide proportions that read as a simple color panel",
    style: { shapeType: "rectangle", background: "$primary", borderRadius: 0 },
    size: { w: 0.4, aspect: 1.6 },
  },
  {
    id: "shapes-rounded-card",
    label: "Rounded card",
    category: "shapes",
    kind: "shape",
    tags: ["shape", "card", "rounded", "panel"],
    prompt:
      "Flat rounded rectangle card, generously rounded corners, secondary brand color fill, reads as a soft content panel or button background",
    style: {
      shapeType: "rounded rectangle",
      background: "$secondary",
      borderRadius: 20,
    },
    size: { w: 0.4, aspect: 1.4 },
    popularRank: 11,
  },
  {
    id: "shapes-pill",
    label: "Pill",
    category: "shapes",
    kind: "shape",
    tags: ["shape", "pill", "capsule", "rounded"],
    prompt:
      "Flat fully rounded pill shape, capsule proportions, primary brand color fill, reads as a soft tag or button background",
    style: {
      shapeType: "rounded rectangle",
      background: "$primary",
      borderRadius: 999,
    },
    size: { w: 0.35, aspect: 2.6 },
  },
  {
    id: "shapes-circle",
    label: "Circle",
    category: "shapes",
    kind: "shape",
    tags: ["shape", "circle", "round", "geometric"],
    prompt:
      "Flat solid circle, perfectly round, secondary brand color fill, reads as a clean geometric accent or avatar frame",
    style: { shapeType: "circle", background: "$secondary" },
    size: { w: 0.3, aspect: 1 },
  },
  {
    id: "shapes-ellipse",
    label: "Ellipse",
    category: "shapes",
    kind: "shape",
    tags: ["shape", "ellipse", "oval", "geometric"],
    prompt:
      "Flat solid ellipse, wide oval proportions, primary brand color fill, reads as a soft organic accent shape",
    style: { shapeType: "circle", background: "$primary" },
    size: { w: 0.4, aspect: 1.6 },
  },
  {
    id: "shapes-outline-box",
    label: "Outline box",
    category: "shapes",
    kind: "shape",
    tags: ["shape", "outline", "box", "border"],
    prompt:
      "Thin-outline rectangle with a transparent center, crisp square corners, primary brand color border, reads as a light frame or content boundary",
    style: {
      shapeType: "rectangle",
      background: "transparent",
      borderWidth: 3,
      borderColor: "$primary",
    },
    size: { w: 0.35, aspect: 1.2 },
  },
  {
    id: "shapes-outline-circle",
    label: "Outline circle",
    category: "shapes",
    kind: "shape",
    tags: ["shape", "outline", "circle", "border"],
    prompt:
      "Thin-outline circle with a transparent center, perfectly round, secondary brand color border, reads as a light ring accent",
    style: {
      shapeType: "circle",
      background: "transparent",
      borderWidth: 3,
      borderColor: "$secondary",
    },
    size: { w: 0.3, aspect: 1 },
  },
  {
    id: "shapes-gradient-circle",
    label: "Gradient circle",
    category: "shapes",
    kind: "shape",
    tags: ["shape", "gradient", "circle", "geometric"],
    prompt:
      "Flat solid circle filled with a diagonal gradient, perfectly round, blends from the primary to the secondary brand color, reads as a bold decorative accent",
    style: {
      shapeType: "circle",
      background: "linear-gradient(135deg,$primary,$secondary)",
    },
    size: { w: 0.3, aspect: 1 },
  },

  // Lines (6)
  {
    id: "lines-hairline",
    label: "Hairline",
    category: "lines",
    kind: "divider",
    tags: ["line", "divider", "hairline", "rule"],
    prompt:
      "Thin hairline divider rule, crisp flat edges, secondary brand color fill, sits quietly between two sections without competing for attention",
    style: { background: "$secondary" },
    size: { w: 0.5, aspect: 270 },
    popularRank: 15,
  },
  {
    id: "lines-thick-bar",
    label: "Thick bar",
    category: "lines",
    kind: "divider",
    tags: ["line", "divider", "bar", "thick"],
    prompt:
      "Bold thick divider bar, flat rectangular block, primary brand color fill, reads as a strong structural break between sections",
    style: { background: "$primary" },
    size: { w: 0.3, aspect: 20 },
  },
  {
    id: "lines-accent-underline",
    label: "Accent underline",
    category: "lines",
    kind: "divider",
    tags: ["line", "divider", "underline", "accent"],
    prompt:
      "Short accent underline rule beneath a headline, flat rectangular block, primary brand color fill, reinforces the headline without adding clutter",
    style: { background: "$primary" },
    size: { w: 0.18, aspect: 32 },
  },
  {
    id: "lines-vertical-rule",
    label: "Vertical rule",
    category: "lines",
    kind: "divider",
    tags: ["line", "divider", "vertical", "rule"],
    prompt:
      "Slim vertical divider rule, flat rectangular block running top to bottom, secondary brand color fill, separates two columns of content cleanly",
    style: { background: "$secondary" },
    size: { h: 0.3, aspect: 0.02 },
  },
  {
    id: "lines-gradient-bar",
    label: "Gradient bar",
    category: "lines",
    kind: "divider",
    tags: ["line", "divider", "gradient", "bar"],
    prompt:
      "Divider bar filled with a horizontal gradient, flat rectangular block, blends from the primary to the secondary brand color, adds a colorful structural break",
    style: { background: "linear-gradient(90deg,$primary,$secondary)" },
    size: { w: 0.4, aspect: 36 },
  },
  {
    id: "lines-rounded-bar",
    label: "Rounded bar",
    category: "lines",
    kind: "divider",
    tags: ["line", "divider", "rounded", "bar"],
    prompt:
      "Divider bar with fully rounded ends, flat capsule-shaped block, primary brand color fill, reads as a soft modern section break",
    style: { background: "$primary", borderRadius: 999 },
    size: { w: 0.3, aspect: 18 },
  },

  // Frames (6)
  {
    id: "frames-photo",
    label: "Photo frame",
    category: "frames",
    kind: "supportingImage",
    tags: ["frame", "photo", "border", "decorative"],
    prompt:
      "Simple rectangular photo frame outline with a thin even border and rounded corners, flat vector illustration style, primary brand color border around an empty light center",
    art: "photo-frame",
    size: { w: 0.5, aspect: 1 },
  },
  {
    id: "frames-gold",
    label: "Gold frame",
    category: "frames",
    kind: "supportingImage",
    tags: ["frame", "gold", "ornate", "decorative"],
    prompt:
      "Ornate decorative frame with layered classical border details, flat vector illustration style, secondary brand color linework around an empty center",
    art: "gold-frame",
    size: { w: 0.5, aspect: 1 },
  },
  {
    id: "frames-floral",
    label: "Floral frame",
    category: "frames",
    kind: "supportingImage",
    tags: ["frame", "floral", "botanical", "decorative"],
    prompt:
      "Decorative frame bordered by small stylized floral sprigs at the corners, flat vector illustration style, primary brand color florals around an empty center",
    art: "floral-frame",
    size: { w: 0.5, aspect: 1 },
  },
  {
    id: "frames-laurel",
    label: "Laurel wreath",
    category: "frames",
    kind: "supportingImage",
    tags: ["frame", "laurel", "wreath", "decorative"],
    prompt:
      "Symmetrical laurel wreath frame with two curved branches meeting at the top and bottom, flat vector illustration style, secondary brand color leaves around an empty center",
    art: "laurel",
    size: { w: 0.45, aspect: 1 },
  },
  {
    id: "frames-outline",
    label: "Outline frame",
    category: "frames",
    kind: "shape",
    tags: ["frame", "outline", "border", "simple"],
    prompt:
      "Simple outline frame rectangle with a transparent center and rounded corners, thin crisp border, primary brand color border, reads as a light content boundary",
    style: {
      shapeType: "rectangle",
      background: "transparent",
      borderWidth: 3,
      borderColor: "$primary",
      borderRadius: 12,
    },
    size: { w: 0.5, aspect: 1 },
  },
  {
    id: "frames-polaroid",
    label: "Polaroid frame",
    category: "frames",
    kind: "supportingImage",
    tags: ["frame", "polaroid", "photo", "instant"],
    prompt:
      "Instant-photo polaroid frame with a thin even border and a thick bottom strip, flat vector illustration style, secondary brand color tint over an empty photo area",
    art: "polaroid",
    size: { w: 0.5, aspect: 1 },
  },

  // Icons (8) — sticker glyphs.
  {
    id: "icons-sticker-star",
    label: "Star sticker",
    category: "icons",
    kind: "supportingImage",
    tags: ["icon", "sticker", "star", "favorite"],
    prompt:
      "Bold five-point star sticker with a thick white outline, flat vector illustration style, primary brand color fill, punchy and legible at small sizes",
    art: "sticker-star",
    size: { w: 0.18, aspect: 1 },
  },
  {
    id: "icons-sticker-heart",
    label: "Heart sticker",
    category: "icons",
    kind: "supportingImage",
    tags: ["icon", "sticker", "heart", "like"],
    prompt:
      "Bold heart sticker with a thick white outline, flat vector illustration style, primary brand color fill, punchy and legible at small sizes",
    art: "sticker-heart",
    size: { w: 0.18, aspect: 1 },
  },
  {
    id: "icons-sticker-check",
    label: "Check sticker",
    category: "icons",
    kind: "supportingImage",
    tags: ["icon", "sticker", "check", "done"],
    prompt:
      "Bold checkmark sticker inside a filled circle with a thick white outline, flat vector illustration style, primary brand color fill, punchy and legible at small sizes",
    art: "sticker-check",
    size: { w: 0.18, aspect: 1 },
  },
  {
    id: "icons-sticker-arrow",
    label: "Arrow sticker",
    category: "icons",
    kind: "supportingImage",
    tags: ["icon", "sticker", "arrow", "next"],
    prompt:
      "Bold forward-arrow sticker inside a filled circle with a thick white outline, flat vector illustration style, secondary brand color fill, punchy and legible at small sizes",
    art: "sticker-arrow",
    size: { w: 0.18, aspect: 1 },
  },
  {
    id: "icons-sticker-bolt",
    label: "Bolt sticker",
    category: "icons",
    kind: "supportingImage",
    tags: ["icon", "sticker", "bolt", "energy"],
    prompt:
      "Bold lightning-bolt sticker with a thick white outline, flat vector illustration style, primary brand color fill, punchy and legible at small sizes",
    art: "sticker-bolt",
    size: { w: 0.18, aspect: 1 },
  },
  {
    id: "icons-sticker-fire",
    label: "Fire sticker",
    category: "icons",
    kind: "supportingImage",
    tags: ["icon", "sticker", "fire", "trending"],
    prompt:
      "Bold flame sticker with a thick white outline, flat vector illustration style, secondary brand color fill, punchy and legible at small sizes",
    art: "sticker-fire",
    size: { w: 0.18, aspect: 1 },
  },
  {
    id: "icons-sticker-crown",
    label: "Crown sticker",
    category: "icons",
    kind: "supportingImage",
    tags: ["icon", "sticker", "crown", "premium"],
    prompt:
      "Bold crown sticker with a thick white outline, flat vector illustration style, primary brand color fill, punchy and legible at small sizes",
    art: "sticker-crown",
    size: { w: 0.18, aspect: 1 },
  },
  {
    id: "icons-sticker-thumbs-up",
    label: "Thumbs-up sticker",
    category: "icons",
    kind: "supportingImage",
    tags: ["icon", "sticker", "thumbs up", "approve"],
    prompt:
      "Bold thumbs-up sticker with a thick white outline, flat vector illustration style, secondary brand color fill, punchy and legible at small sizes",
    art: "sticker-thumbs-up",
    size: { w: 0.18, aspect: 1 },
  },

  // Backgrounds (8)
  {
    id: "backgrounds-abstract",
    label: "Abstract",
    category: "backgrounds",
    kind: "heroImage",
    tags: ["background", "abstract", "fill", "blob"],
    prompt:
      "Full-bleed abstract background with a large soft blob shape and a thin ring outline, flat vector illustration style, gentle organic composition, primary and secondary brand color shapes on a light neutral field",
    art: "abstract",
    placement: "fill",
  },
  {
    id: "backgrounds-landscape",
    label: "Landscape",
    category: "backgrounds",
    kind: "heroImage",
    tags: ["background", "landscape", "fill", "scenic"],
    prompt:
      "Full-bleed landscape background with soft rolling hill silhouettes and a simple sky, flat vector illustration style, calm horizontal composition, secondary brand color hills against a light sky",
    art: "landscape",
    placement: "fill",
  },
  {
    id: "backgrounds-abstract-blobs",
    label: "Abstract blobs",
    category: "backgrounds",
    kind: "heroImage",
    tags: ["background", "abstract", "blobs", "fill"],
    prompt:
      "Full-bleed background of two overlapping soft organic blob shapes, flat vector illustration style, gentle floating composition, primary and secondary brand color blobs on a light neutral field",
    art: "abstract-blobs",
    placement: "fill",
  },
  {
    id: "backgrounds-pattern-dots",
    label: "Pattern dots",
    category: "backgrounds",
    kind: "heroImage",
    tags: ["background", "pattern", "dots", "fill"],
    prompt:
      "Full-bleed background of an even grid of small polka dots, flat vector illustration style, alternating primary and secondary brand color dots on a light neutral field",
    art: "pattern-dots",
    placement: "fill",
  },
  {
    id: "backgrounds-duotone",
    label: "Duotone",
    category: "backgrounds",
    kind: "shape",
    tags: ["background", "duotone", "gradient", "fill"],
    prompt:
      "Full-bleed duotone gradient background, soft diagonal blend from the secondary brand color into white, flat smooth color field with no texture or pattern",
    style: { background: "linear-gradient(160deg,$secondary,#FFFFFF)" },
    placement: "fill",
    popularRank: 16,
  },
  {
    id: "backgrounds-gradient",
    label: "Gradient",
    category: "backgrounds",
    kind: "shape",
    tags: ["background", "gradient", "fill", "color"],
    prompt:
      "Full-bleed diagonal gradient background, smooth blend from the primary to the secondary brand color, flat color field with no texture or pattern",
    style: { background: "linear-gradient(135deg,$primary,$secondary)" },
    placement: "fill",
  },
  {
    id: "backgrounds-radial-glow",
    label: "Radial glow",
    category: "backgrounds",
    kind: "shape",
    tags: ["background", "radial", "glow", "fill"],
    prompt:
      "Full-bleed radial glow background, soft circular light bloom in the upper-left fading to transparent, flat color field with no texture or pattern, secondary brand color glow",
    style: {
      background:
        "radial-gradient(circle at 30% 30%,$secondary,transparent 70%)",
    },
    placement: "fill",
  },
  {
    id: "backgrounds-solid",
    label: "Solid color",
    category: "backgrounds",
    kind: "shape",
    tags: ["background", "solid", "color", "fill"],
    prompt:
      "Full-bleed solid color background, flat single-color field with no texture, gradient or pattern, primary brand color fill",
    style: { background: "$primary" },
    placement: "fill",
  },

  // Abstract (5)
  {
    id: "abstract-freeform",
    label: "Abstract shapes",
    category: "abstract",
    kind: "supportingImage",
    tags: ["abstract", "shapes", "decorative", "geometric"],
    prompt:
      "Flat vector illustration of a large soft blob shape paired with a thin ring outline, calm decorative composition, primary and secondary brand color shapes",
    art: "abstract",
    size: { w: 0.45, aspect: 1 },
  },
  {
    id: "abstract-spheres",
    label: "3D spheres",
    category: "abstract",
    kind: "supportingImage",
    tags: ["abstract", "3d", "spheres", "decorative"],
    prompt:
      "Flat vector illustration of two overlapping shaded spheres with a small highlight, soft dimensional decorative composition, primary and secondary brand color spheres",
    art: "spheres-3d",
    size: { w: 0.45, aspect: 1 },
  },
  {
    id: "abstract-torus",
    label: "3D torus",
    category: "abstract",
    kind: "supportingImage",
    tags: ["abstract", "3d", "torus", "ring"],
    prompt:
      "Flat vector illustration of a thick ring torus shape with a soft inner highlight, decorative dimensional composition, primary brand color ring",
    art: "torus-3d",
    size: { w: 0.4, aspect: 1 },
  },
  {
    id: "abstract-glass-cards",
    label: "Glass cards",
    category: "abstract",
    kind: "supportingImage",
    tags: ["abstract", "glass", "cards", "layered"],
    prompt:
      "Flat vector illustration of two overlapping translucent rounded cards at a slight tilt, soft layered decorative composition, primary and secondary brand color cards",
    art: "glass-cards",
    size: { w: 0.45, aspect: 1 },
  },
  {
    id: "abstract-sparkle-cluster",
    label: "Sparkle cluster",
    category: "abstract",
    kind: "supportingImage",
    tags: ["abstract", "sparkle", "cluster", "decorative"],
    prompt:
      "Flat vector illustration of a cluster of four-point sparkle glyphs at varying sizes, playful decorative composition, primary and secondary brand color sparkles",
    art: "sparkle-cluster",
    size: { w: 0.4, aspect: 1 },
  },

  // Brand (4)
  {
    id: "brand-logo",
    label: "Logo",
    category: "brand",
    kind: "logo",
    tags: ["brand", "logo", "mark", "identity"],
    prompt:
      "Custom logo mark treatment: bold simple geometric glyph, sits inside generous clear space, primary brand color fill, clean and legible at both large and small sizes",
    art: "logo-mark",
  },
  {
    id: "brand-wordmark",
    label: "Wordmark",
    category: "brand",
    kind: "logo",
    tags: ["brand", "wordmark", "logotype", "identity"],
    prompt:
      "Wordmark logotype treatment: bold sans-serif brand name set in a single confident line, tight letter spacing, primary brand color ink, clean and legible at both large and small sizes",
    art: "brand-wordmark",
    content: "BRAND",
    style: {
      fontFamily: "Manrope",
      fontSize: 72,
      fontWeight: 800,
      alignment: "center",
      color: "$primary",
    },
    size: { w: 0.34, aspect: 3 },
  },
  {
    id: "brand-mark",
    label: "Brand mark",
    category: "brand",
    kind: "brandMark",
    tags: ["brand", "mark", "monogram", "identity"],
    prompt:
      "Brand mark treatment: bold simple monogram glyph inside a rounded container, secondary brand color fill, clean and legible even at very small sizes",
    art: "brand-mark",
  },
  {
    id: "brand-app-icon",
    label: "App icon",
    category: "brand",
    kind: "brandMark",
    tags: ["brand", "app icon", "tile", "identity"],
    prompt:
      "App icon treatment: bold simple glyph centered inside a rounded-square tile, primary brand color fill with a light high-contrast mark, clean and legible at small sizes",
    art: "brand-app-icon",
  },
];
