import type { SpecDocument } from "./types.ts";

export type ImageStyleGroup =
  "Photographic & 3D" | "Illustration" | "UI surfaces" | "Mood & era";

export type ImageStyle = {
  id: string;
  label: string;
  group: ImageStyleGroup;
  prompt: string;
};

export const IMAGE_STYLE_NONE = "none";

/** The image style a document gets when `imageStyle` is missing (older
 * documents and brand-new ones alike). */
export const DEFAULT_IMAGE_STYLE = "photorealistic";

export const IMAGE_STYLE_GROUPS: readonly ImageStyleGroup[] = [
  "Photographic & 3D",
  "Illustration",
  "UI surfaces",
  "Mood & era",
];

export const IMAGE_STYLES: readonly ImageStyle[] = [
  {
    id: "photorealistic",
    label: "Photorealistic",
    group: "Photographic & 3D",
    prompt:
      "Render as a photorealistic image: true-to-life materials and textures, natural lighting with accurate shadows and reflections, realistic depth of field, as if shot on a professional camera.",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    group: "Photographic & 3D",
    prompt:
      "Render as a cinematic film still: dramatic key lighting, rich film-like color grading, atmospheric depth, shallow depth of field.",
  },
  {
    id: "3d-render",
    label: "3D render",
    group: "Photographic & 3D",
    prompt:
      "Render as a polished 3D scene: clean modeled forms, physically based materials, soft studio lighting with global illumination and subtle ambient occlusion.",
  },
  {
    id: "claymorphism",
    label: "Claymorphism",
    group: "Photographic & 3D",
    prompt:
      "Render in a claymorphism style: soft, rounded, inflated 3D shapes that look like matte modeling clay, pastel tones, gentle inner and drop shadows, soft diffuse lighting.",
  },
  {
    id: "isometric",
    label: "Isometric",
    group: "Photographic & 3D",
    prompt:
      "Render in isometric perspective: a 30° axonometric projection with no vanishing point, parallel edges, clean geometric forms and even lighting.",
  },
  {
    id: "low-poly",
    label: "Low poly",
    group: "Photographic & 3D",
    prompt:
      "Render in a low-poly style: faceted geometric polygons with flat-shaded faces and a visible triangular mesh.",
  },
  {
    id: "vector",
    label: "Vector",
    group: "Illustration",
    prompt:
      "Render as a clean vector illustration: crisp geometric shapes, flat solid color fills, smooth precise edges, no photographic texture or noise.",
  },
  {
    id: "flat-illustration",
    label: "Flat illustration",
    group: "Illustration",
    prompt:
      "Render as a modern flat editorial illustration: simplified shapes and characters, a limited harmonious palette, minimal shading.",
  },
  {
    id: "line-art",
    label: "Minimal line art",
    group: "Illustration",
    prompt:
      "Render as minimalist line art: thin continuous monoline strokes, generous empty space, no shading, at most one accent color.",
  },
  {
    id: "hand-drawn",
    label: "Hand-drawn sketch",
    group: "Illustration",
    prompt:
      "Render as a hand-drawn sketch: pencil or ink linework with visible hatching, loose expressive strokes and a subtle sketchbook paper texture.",
  },
  {
    id: "watercolor",
    label: "Watercolor",
    group: "Illustration",
    prompt:
      "Render as a watercolor painting: soft translucent washes, organic color bleeds and blooms, loose hand-painted edges and visible paper texture.",
  },
  {
    id: "anime",
    label: "Anime",
    group: "Illustration",
    prompt:
      "Render in a Japanese anime style: clean cel shading, bold confident outlines, expressive characters, vibrant saturated color and painterly backgrounds.",
  },
  {
    id: "pixel-art",
    label: "Pixel art",
    group: "Illustration",
    prompt:
      "Render as pixel art: crisp visible square pixels with no anti-aliasing or blur, a limited retro palette and a 16-bit game aesthetic.",
  },
  {
    id: "paper-cut",
    label: "Paper cut",
    group: "Illustration",
    prompt:
      "Render in a layered paper-cut style: stacked cut-paper shapes with visible depth, soft shadows between layers and matte paper texture.",
  },
  {
    id: "glassmorphism",
    label: "Glassmorphism",
    group: "UI surfaces",
    prompt:
      "Render in a glassmorphism style: frosted translucent glass panels with background blur, thin light edges, soft gradients showing through and gentle highlights.",
  },
  {
    id: "neumorphism",
    label: "Neumorphism",
    group: "UI surfaces",
    prompt:
      "Render in a neumorphism style: soft extruded shapes emerging from a same-color background, paired light and dark shadows, low contrast and a restrained palette.",
  },
  {
    id: "cyberpunk-neon",
    label: "Cyberpunk neon",
    group: "Mood & era",
    prompt:
      "Render in a cyberpunk style: a dark futuristic night setting, glowing neon light accents, reflective wet surfaces and high contrast.",
  },
  {
    id: "retro-vintage",
    label: "Retro vintage",
    group: "Mood & era",
    prompt:
      "Render with a retro vintage print look: a faded print finish, halftone dots and film grain, mid-century poster styling and slightly worn paper.",
  },
];

export function findImageStyle(id: string | undefined): ImageStyle | undefined {
  if (!id) return undefined;
  return IMAGE_STYLES.find((s) => s.id === id);
}

/** The id a document's image style resolves to: a missing `imageStyle`
 * means the default, while "none" or an unknown id resolves to
 * `IMAGE_STYLE_NONE`. */
export function resolveImageStyleId(
  doc: Pick<SpecDocument, "imageStyle">,
): string {
  const id = doc.imageStyle ?? DEFAULT_IMAGE_STYLE;
  return findImageStyle(id) ? id : IMAGE_STYLE_NONE;
}

export function resolveImageStyle(
  doc: Pick<SpecDocument, "imageStyle">,
): ImageStyle | undefined {
  return findImageStyle(resolveImageStyleId(doc));
}

/** The image-style line, e.g. "Image style: Render as a clean vector
 * illustration: … Apply it to the whole image without changing the
 * specified text, colors or layout." A missing id means the default
 * (Photorealistic); "none" or an unknown id yields "". */
export function imageStyleLine(doc: Pick<SpecDocument, "imageStyle">): string {
  const style = resolveImageStyle(doc);
  if (!style) return "";
  return `Image style: ${style.prompt} Apply it to the whole image without changing the specified text, colors or layout.`;
}

/** Sets the document's image style, clearing a stale text override so it
 * can't hide the new choice. A known id is stored as-is; "none" or an
 * unknown id is stored as "none" (the field is never deleted, so a
 * document can explicitly opt out of the default). */
export function setImageStyle(doc: SpecDocument, id: string): void {
  doc.imageStyle = findImageStyle(id) ? id : IMAGE_STYLE_NONE;
  if (doc.promptParts) delete doc.promptParts["imageStyle"];
}
