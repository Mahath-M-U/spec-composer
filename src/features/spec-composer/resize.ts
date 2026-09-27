import type { Format, SpecDocument, SpecElement } from "./types";

export type ResizeUnit = "px" | "in" | "cm";

export interface ResizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  platform: NonNullable<Format["platform"]>;
  type: NonNullable<Format["type"]>;
}

export interface ResizePresetGroup {
  label: string;
  presets: readonly ResizePreset[];
}

export const RESIZE_PRESET_GROUPS: readonly ResizePresetGroup[] = [
  {
    label: "Instagram",
    presets: [
      {
        id: "instagram-post",
        label: "Post",
        width: 1080,
        height: 1080,
        platform: "instagram",
        type: "post",
      },
      {
        id: "instagram-story",
        label: "Story",
        width: 1080,
        height: 1920,
        platform: "instagram",
        type: "story",
      },
      {
        id: "instagram-ad",
        label: "Ad",
        width: 1080,
        height: 1080,
        platform: "instagram",
        type: "ad",
      },
    ],
  },
  {
    label: "Facebook",
    presets: [
      {
        id: "facebook-landscape",
        label: "Post (Landscape)",
        width: 1200,
        height: 630,
        platform: "facebook",
        type: "post",
      },
      {
        id: "facebook-square",
        label: "Post (Square)",
        width: 1080,
        height: 1080,
        platform: "facebook",
        type: "post",
      },
      {
        id: "facebook-cover",
        label: "Cover",
        width: 851,
        height: 315,
        platform: "facebook",
        type: "cover",
      },
    ],
  },
  {
    label: "YouTube",
    presets: [
      {
        id: "youtube-thumbnail",
        label: "Thumbnail",
        width: 1280,
        height: 720,
        platform: "youtube",
        type: "thumbnail",
      },
      {
        id: "youtube-channel",
        label: "Channel",
        width: 2560,
        height: 1440,
        platform: "youtube",
        type: "cover",
      },
      {
        id: "youtube-short",
        label: "Short",
        width: 1080,
        height: 1920,
        platform: "youtube",
        type: "video",
      },
    ],
  },
  {
    label: "LinkedIn",
    presets: [
      {
        id: "linkedin-post",
        label: "Post",
        width: 1200,
        height: 627,
        platform: "linkedin",
        type: "post",
      },
      {
        id: "linkedin-banner",
        label: "Banner",
        width: 1584,
        height: 396,
        platform: "linkedin",
        type: "cover",
      },
      {
        id: "linkedin-square",
        label: "Square",
        width: 1080,
        height: 1080,
        platform: "linkedin",
        type: "post",
      },
    ],
  },
  {
    label: "Twitter/X",
    presets: [
      {
        id: "x-post",
        label: "Post",
        width: 1600,
        height: 900,
        platform: "x",
        type: "post",
      },
      {
        id: "x-header",
        label: "Header",
        width: 1500,
        height: 500,
        platform: "x",
        type: "cover",
      },
      {
        id: "x-square",
        label: "Square",
        width: 1080,
        height: 1080,
        platform: "x",
        type: "post",
      },
    ],
  },
  {
    label: "Video",
    presets: [
      {
        id: "video-full-hd",
        label: "Full HD",
        width: 1920,
        height: 1080,
        platform: "generic",
        type: "video",
      },
      {
        id: "video-4k-uhd",
        label: "4K UHD",
        width: 3840,
        height: 2160,
        platform: "generic",
        type: "video",
      },
    ],
  },
];

const PX_PER_UNIT: Record<ResizeUnit, number> = {
  px: 1,
  in: 96,
  cm: 96 / 2.54,
};

export function toPixels(value: string | number, unit: ResizeUnit): number {
  if (String(value).trim() === "") return NaN;
  return Math.round(Number(value) * PX_PER_UNIT[unit]);
}

export function fromPixels(value: number, unit: ResizeUnit): string {
  if (unit === "px") return String(value);
  return String(Number((value / PX_PER_UNIT[unit]).toFixed(3)));
}

export function validateResizeSize(
  width: number,
  height: number,
): string | null {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height))
    return "Enter a valid width and height.";
  if (width < 64 || height < 64 || width > 8192 || height > 8192)
    return "Each side must be between 64 and 8192 px.";
  if (width * height > 32_000_000)
    return "The canvas must be 32 megapixels or less.";
  return null;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function makeResizeFormat(
  width: number,
  height: number,
  preset?: ResizePreset,
): Format {
  const error = validateResizeSize(width, height);
  if (error) throw new RangeError(error);
  const divisor = gcd(width, height);
  const subtitle = `${width / divisor}:${height / divisor}`;
  const groupName = preset
    ? (RESIZE_PRESET_GROUPS.find((group) =>
        group.presets.some((item) => item.id === preset.id),
      )?.label ?? "Custom")
    : "Custom";
  return preset
    ? {
        id: `resize-${preset.id}`,
        label: `${groupName} ${preset.label}`,
        subtitle,
        width,
        height,
        category: groupName,
        platform: preset.platform,
        type: preset.type,
      }
    : {
        id: "custom",
        label: "Custom size",
        subtitle,
        width,
        height,
        category: "Custom",
        platform: "generic",
      };
}

const DIMENSION_DEPENDENT_OVERRIDE =
  /^(format|dominant|el:|skill:(title|overview|type|spacing|components|layout|el:))/;

export function hasResizeTextOverrides(doc: SpecDocument): boolean {
  return !!(
    doc.designEdit != null ||
    doc.visualEdit != null ||
    Object.keys(doc.promptParts ?? {}).some((key) =>
      DIMENSION_DEPENDENT_OVERRIDE.test(key),
    )
  );
}

function clearResizeTextOverrides(doc: SpecDocument): void {
  delete doc.designEdit;
  delete doc.designEditRevision;
  delete doc.visualEdit;
  delete doc.visualEditRevision;
  if (!doc.promptParts) return;
  for (const key of Object.keys(doc.promptParts)) {
    if (DIMENSION_DEPENDENT_OVERRIDE.test(key)) delete doc.promptParts[key];
  }
}

function fullBleed(
  element: SpecElement,
  width: number,
  height: number,
): boolean {
  return (
    element.x <= width * 0.05 &&
    element.y <= height * 0.05 &&
    element.x + element.width >= width * 0.95 &&
    element.y + element.height >= height * 0.95
  );
}

// Local copy of IMAGE_KINDS (types.ts): this module has no value imports, so
// plain Node can load it in tests.
const IMAGE_ELEMENT_KINDS = new Set<string>([
  "heroImage",
  "productImage",
  "humanModelImage",
  "supportingImage",
  "logo",
  "brandMark",
]);

const contains = (outer: SpecElement, inner: SpecElement) =>
  inner.x >= outer.x - 1 &&
  inner.y >= outer.y - 1 &&
  inner.x + inner.width <= outer.x + outer.width + 1 &&
  inner.y + inner.height <= outer.y + outer.height + 1;

/**
 * Photo frames of layered scenes. A "cover" image with rounded corners that is
 * not full-bleed and fully contains two or more higher-z images is a frame; those images are its
 * members, and they must keep their place inside it when the canvas is
 * resized (scaling each about its own centre would let them drift out of the
 * frame's rounded corners). Maps each member's id to its frame.
 */
function findSceneFrames(
  elements: SpecElement[],
  width: number,
  height: number,
): Map<string, SpecElement> {
  const images = elements
    .filter((e) => IMAGE_ELEMENT_KINDS.has(e.kind))
    .sort((a, b) => a.zIndex - b.zIndex);
  const memberOf = new Map<string, SpecElement>();
  for (const frame of images) {
    if (
      frame.style.objectFit !== "cover" ||
      !(frame.style.borderRadius && frame.style.borderRadius > 0) ||
      fullBleed(frame, width, height)
    )
      continue;
    if (memberOf.has(frame.id)) continue;
    const members = images.filter(
      (m) =>
        m.id !== frame.id &&
        m.zIndex > frame.zIndex &&
        !memberOf.has(m.id) &&
        contains(frame, m),
    );
    if (members.length < 2) continue;
    for (const m of members) memberOf.set(m.id, frame);
  }
  return memberOf;
}

export function resizeDocument(
  source: SpecDocument,
  format: Format,
): SpecDocument {
  const error = validateResizeSize(format.width, format.height);
  if (error) throw new RangeError(error);
  const result = structuredClone(source);
  const oldWidth = source.format.width;
  const oldHeight = source.format.height;
  if (oldWidth <= 0 || oldHeight <= 0)
    throw new RangeError("Invalid source size.");
  result.format = { ...format };
  const scaleX = format.width / oldWidth;
  const scaleY = format.height / oldHeight;
  const sizeScale = Math.min(scaleX, scaleY);

  /** The element scaled about its own centre and clamped into the canvas. */
  const scaledBox = (element: SpecElement) => {
    const width = Math.max(1, Math.round(element.width * sizeScale));
    const height = Math.max(1, Math.round(element.height * sizeScale));
    if (width > format.width || height > format.height)
      throw new RangeError(
        `“${element.name}” is too large for the new canvas.`,
      );
    const centerX = ((element.x + element.width / 2) / oldWidth) * format.width;
    const centerY =
      ((element.y + element.height / 2) / oldHeight) * format.height;
    return {
      width,
      height,
      x: Math.min(
        format.width - width,
        Math.max(0, Math.round(centerX - width / 2)),
      ),
      y: Math.min(
        format.height - height,
        Math.max(0, Math.round(centerY - height / 2)),
      ),
    };
  };

  const frames = findSceneFrames(source.elements, oldWidth, oldHeight);
  result.elements = source.elements.map((element) => {
    const next = structuredClone(element);
    const frame = frames.get(element.id);
    if (frame) {
      // A scene layer keeps its place inside its frame: the frame's own
      // transform, applied to the layer's offset within it.
      const box = scaledBox(frame);
      next.x = Math.round(box.x + (element.x - frame.x) * sizeScale);
      next.y = Math.round(box.y + (element.y - frame.y) * sizeScale);
      next.width = Math.max(1, Math.round(element.width * sizeScale));
      next.height = Math.max(1, Math.round(element.height * sizeScale));
    } else if (fullBleed(element, oldWidth, oldHeight)) {
      next.x = 0;
      next.y = 0;
      next.width = format.width;
      next.height = format.height;
    } else Object.assign(next, scaledBox(element));
    for (const key of ["fontSize", "borderWidth", "borderRadius"] as const) {
      const value = element.style[key];
      if (value !== undefined)
        next.style[key] = Math.max(
          key === "fontSize" ? 1 : 0,
          Math.round(value * sizeScale),
        );
    }
    return next;
  });
  clearResizeTextOverrides(result);
  return result;
}

export function replaceDocumentContents(
  target: SpecDocument,
  source: SpecDocument,
): void {
  for (const key of Object.keys(target)) {
    if (!(key in source)) Reflect.deleteProperty(target, key);
  }
  // Object.assign does not remove keys, so stale keys are deleted above first.
  Object.assign(target, source);
}
