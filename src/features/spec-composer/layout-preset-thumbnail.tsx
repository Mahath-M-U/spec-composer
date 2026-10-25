import type { Box, ComposeLayout } from "./compose-layouts";
import type { SpecDocument } from "./types";

type Rect = readonly [x: number, y: number, width: number, height: number];
type ThumbnailSpec = { images?: readonly Rect[]; text: readonly Rect[] };
type Props =
  | { presetId: ComposeLayout }
  | {
      presetId: "original";
      document: SpecDocument;
      origin?: Record<string, Box> | undefined;
    };

// Illustrations of the existing engine, independent of the current selection.
// In particular, Layered card positions copy directly over the full-bleed image.
const THUMBNAILS = {
  "copy-left": {
    images: [[52, 12, 42, 72]],
    text: [
      [7, 16, 36, 7],
      [7, 28, 31, 3],
      [7, 35, 36, 3],
      [7, 42, 27, 3],
    ],
  },
  "copy-right": {
    images: [[7, 15, 48, 70]],
    text: [
      [58, 16, 35, 7],
      [58, 28, 30, 3],
      [58, 35, 35, 3],
      [58, 42, 25, 3],
    ],
  },
  "grid-2up": {
    images: [[0, 0, 50, 100]],
    text: [
      [58, 18, 35, 7],
      [58, 30, 29, 3],
      [58, 37, 35, 3],
      [58, 44, 25, 3],
    ],
  },
  "split-top": {
    images: [[0, 0, 100, 55]],
    text: [
      [7, 62, 70, 7],
      [7, 75, 86, 3],
      [7, 82, 63, 3],
    ],
  },
  "split-bottom": {
    images: [[0, 45, 100, 55]],
    text: [
      [7, 8, 70, 7],
      [7, 21, 86, 3],
      [7, 28, 63, 3],
    ],
  },
  "sidebar-left": {
    images: [[38, 0, 62, 100]],
    text: [
      [7, 14, 28, 7],
      [7, 26, 24, 3],
      [7, 33, 28, 3],
      [7, 40, 20, 3],
    ],
  },
  framed: {
    images: [[7, 7, 86, 55]],
    text: [
      [7, 65, 70, 7],
      [7, 78, 86, 3],
      [7, 85, 63, 3],
    ],
  },
  collage: {
    images: [
      [0, 0, 48, 28],
      [52, 0, 48, 28],
      [0, 32, 48, 28],
      [52, 32, 48, 28],
    ],
    text: [
      [7, 65, 70, 7],
      [7, 78, 86, 3],
      [7, 85, 63, 3],
    ],
  },
  "layered-card": {
    images: [[0, 0, 100, 100]],
    text: [
      [14, 32, 72, 7],
      [14, 45, 66, 3],
      [14, 52, 72, 3],
      [14, 59, 54, 3],
    ],
  },
  "full-bleed-overlay": {
    images: [[0, 0, 100, 100]],
    text: [
      [7, 68, 70, 7],
      [7, 81, 86, 3],
      [7, 88, 63, 3],
    ],
  },
  "overlay-top": {
    images: [[0, 0, 100, 100]],
    text: [
      [7, 8, 70, 7],
      [7, 21, 86, 3],
      [7, 28, 63, 3],
    ],
  },
  "stack-center": {
    images: [[22, 12, 56, 42]],
    text: [
      [19, 61, 62, 7],
      [15, 74, 70, 3],
      [25, 81, 50, 3],
    ],
  },
  "corner-badge": {
    text: [
      [7, 7, 22, 8],
      [15, 38, 70, 7],
      [15, 51, 63, 3],
      [15, 58, 70, 3],
      [69, 85, 24, 8],
    ],
  },
  spotlight: {
    images: [[25, 26, 50, 50]],
    text: [
      [15, 7, 70, 7],
      [15, 81, 70, 3],
      [25, 88, 50, 3],
    ],
  },
  diagonal: {
    images: [[13, 27, 55, 38]],
    text: [
      [7, 10, 52, 7],
      [19, 70, 62, 3],
      [25, 82, 53, 3],
    ],
  },
  "visual-band": {
    images: [[0, 30, 100, 38]],
    text: [
      [7, 7, 70, 7],
      [7, 72, 86, 3],
      [7, 79, 70, 3],
      [7, 86, 63, 3],
    ],
  },
  zigzag: {
    images: [[42, 30, 51, 40]],
    text: [
      [7, 7, 60, 7],
      [7, 74, 50, 3],
      [7, 81, 42, 3],
      [69, 85, 24, 8],
    ],
  },
} satisfies Record<ComposeLayout, ThumbnailSpec>;

function regions(spec: ThumbnailSpec) {
  return (
    <>
      {spec.images?.map(([x, y, width, height], i) => (
        <rect
          key={`image-${i}`}
          data-thumbnail-region="image"
          x={x}
          y={y}
          width={width}
          height={height}
          fill={i % 2 ? "#D07870" : "#C55454"}
        />
      ))}
      {spec.text.map(([x, y, width, height], i) => (
        <rect
          key={`text-${i}`}
          data-thumbnail-region="text"
          x={x}
          y={y}
          width={width}
          height={height}
          rx="1"
          fill="#A8A8A8"
        />
      ))}
    </>
  );
}

// Hoist static SVG content so store updates don't rebuild the preset sketches.
const PRESET_REGIONS = Object.fromEntries(
  Object.entries(THUMBNAILS).map(([id, spec]) => [id, regions(spec)]),
) as Record<ComposeLayout, ReturnType<typeof regions>>;

function originalRegions(document: SpecDocument, origin?: Record<string, Box>) {
  const { width, height } = document.format;
  const scale = Math.min(100 / width, 100 / height);
  const xOffset = (100 - width * scale) / 2;
  const yOffset = (100 - height * scale) / 2;
  const images: Rect[] = [];
  const text: Rect[] = [];
  for (const element of document.elements) {
    if (
      !element.visible ||
      element.kind === "shape" ||
      element.kind === "divider"
    )
      continue;
    const box = origin?.[element.id] ?? element;
    const rect: Rect = [
      xOffset + box.x * scale,
      yOffset + box.y * scale,
      box.width * scale,
      box.height * scale,
    ];
    (element.kind.toLowerCase().includes("image") ? images : text).push(rect);
  }
  return regions({ images, text });
}

export function LayoutPresetThumbnail(props: Props) {
  return (
    <svg
      className="compose-thumb"
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="100" height="100" rx="10" fill="#EFE9DE" />
      {props.presetId === "original"
        ? originalRegions(props.document, props.origin)
        : PRESET_REGIONS[props.presetId]}
    </svg>
  );
}
