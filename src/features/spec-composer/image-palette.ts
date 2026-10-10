import { validateImageUpload } from "./image-validation";
import type { BrandKitColor } from "./types";

export interface PaletteColor {
  hex: string;
  share: number;
}

type Lab = [number, number, number];
interface Cluster {
  lab: Lab;
  count: number;
}

const linearChannel = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const srgbChannel = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

function rgbToLab(red: number, green: number, blue: number): Lab {
  const r = linearChannel(red / 255);
  const g = linearChannel(green / 255);
  const b = linearChannel(blue / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function labToHex([lightness, a, b]: Lab): string {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${channels
    .map((channel) =>
      Math.round(Math.min(1, Math.max(0, srgbChannel(channel))) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

const distanceSquared = (left: Lab, right: Lab) =>
  (left[0] - right[0]) ** 2 +
  (left[1] - right[1]) ** 2 +
  (left[2] - right[2]) ** 2;

function combine(left: Cluster, right: Cluster): Cluster {
  const count = left.count + right.count;
  return {
    count,
    lab: [
      (left.lab[0] * left.count + right.lab[0] * right.count) / count,
      (left.lab[1] * left.count + right.lab[1] * right.count) / count,
      (left.lab[2] * left.count + right.lab[2] * right.count) / count,
    ],
  };
}

/** Deterministic, pixel-weighted OKLab clustering over 5-bit RGB buckets. */
export function extractWeightedPalette(
  pixels: Uint8ClampedArray,
  max = 5,
): PaletteColor[] {
  const pixelCount = Math.floor(pixels.length / 4);
  const histogram = new Map<
    number,
    { r: number; g: number; b: number; count: number }
  >();
  let opaque = 0;
  for (let index = 0; index < pixelCount * 4; index += 4) {
    if (pixels[index + 3]! < 128) continue;
    opaque++;
    const r = pixels[index]!;
    const g = pixels[index + 1]!;
    const b = pixels[index + 2]!;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = histogram.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count++;
    histogram.set(key, bucket);
  }
  if (!pixelCount || opaque / pixelCount < 0.01)
    throw new Error("This image is mostly transparent.");

  const buckets: Cluster[] = [...histogram.entries()]
    .sort((left, right) => right[1].count - left[1].count || left[0] - right[0])
    .map(([, bucket]) => ({
      lab: rgbToLab(
        bucket.r / bucket.count,
        bucket.g / bucket.count,
        bucket.b / bucket.count,
      ),
      count: bucket.count,
    }));
  let centroids: Lab[] = [buckets[0]!.lab];
  while (centroids.length < Math.min(8, buckets.length)) {
    let farthest = buckets[0]!;
    let greatest = 0;
    for (const bucket of buckets) {
      const distance = Math.min(
        ...centroids.map((lab) => distanceSquared(bucket.lab, lab)),
      );
      if (distance > greatest) {
        greatest = distance;
        farthest = bucket;
      }
    }
    if (greatest < 1e-12) break;
    centroids.push(farthest.lab);
  }

  let clusters: Cluster[] = [];
  for (let iteration = 0; iteration < 10; iteration++) {
    const sums = centroids.map(() => ({ lab: [0, 0, 0] as Lab, count: 0 }));
    for (const bucket of buckets) {
      let closest = 0;
      let nearest = Infinity;
      centroids.forEach((lab, index) => {
        const distance = distanceSquared(bucket.lab, lab);
        if (distance < nearest) {
          closest = index;
          nearest = distance;
        }
      });
      const sum = sums[closest]!;
      sum.count += bucket.count;
      for (const channel of [0, 1, 2] as const)
        sum.lab[channel] += bucket.lab[channel] * bucket.count;
    }
    const next = sums.map((sum, index) =>
      sum.count
        ? (sum.lab.map((value) => value / sum.count) as Lab)
        : centroids[index]!,
    );
    clusters = sums
      .filter((sum) => sum.count > 0)
      .map((sum) => ({
        count: sum.count,
        lab: sum.lab.map((value) => value / sum.count) as Lab,
      }));
    const settled = next.every(
      (lab, index) => distanceSquared(lab, centroids[index]!) < 1e-10,
    );
    centroids = next;
    if (settled) break;
  }

  while (clusters.length > 1) {
    let nearest = 0.08 ** 2;
    let pair: [number, number] | undefined;
    for (let left = 0; left < clusters.length; left++) {
      for (let right = left + 1; right < clusters.length; right++) {
        const distance = distanceSquared(
          clusters[left]!.lab,
          clusters[right]!.lab,
        );
        if (distance < nearest) {
          nearest = distance;
          pair = [left, right];
        }
      }
    }
    if (!pair) break;
    clusters[pair[0]] = combine(clusters[pair[0]]!, clusters[pair[1]]!);
    clusters.splice(pair[1], 1);
  }

  const colors = new Map<string, number>();
  for (const cluster of clusters) {
    const hex = labToHex(cluster.lab);
    colors.set(hex, (colors.get(hex) ?? 0) + cluster.count);
  }
  const limit = Number.isFinite(max)
    ? Math.min(5, Math.max(1, Math.floor(max)))
    : 5;
  const selected = [...colors.entries()]
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, limit);
  const total = selected.reduce((sum, [, count]) => sum + count, 0);
  return selected.map(([hex, count]) => ({ hex, share: count / total }));
}

export function extractPalette(pixels: Uint8ClampedArray, max = 5): string[] {
  return extractWeightedPalette(pixels, max).map((color) => color.hex);
}

/** Reads only a small local sample; no image data leaves the browser or is retained. */
export async function paletteWithSharesFromFile(
  file: File,
): Promise<PaletteColor[]> {
  await validateImageUpload(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image could not be decoded.");
  }
  try {
    const scale = Math.min(1, 128 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    let pixels: Uint8ClampedArray;
    try {
      const canvas =
        typeof OffscreenCanvas !== "undefined"
          ? new OffscreenCanvas(width, height)
          : document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true }) as
        CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
      if (!context) throw new Error("Your browser can't read image colors.");
      context.drawImage(bitmap, 0, 0, width, height);
      pixels = context.getImageData(0, 0, width, height).data;
    } catch {
      throw new Error("Your browser can't read image colors.");
    }
    return extractWeightedPalette(pixels);
  } finally {
    bitmap.close();
  }
}

export async function paletteFromFile(file: File): Promise<string[]> {
  return (await paletteWithSharesFromFile(file)).map((color) => color.hex);
}

const hexChannels = (hex: string) =>
  [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ] as const;
const hexLab = (hex: string) => rgbToLab(...hexChannels(hex));
function luminance(hex: string): number {
  const [r, g, b] = hexChannels(hex).map((channel) =>
    linearChannel(channel / 255),
  );
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const contrast = (left: string, right: string) => {
  const a = luminance(left);
  const b = luminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

/** Assigns independent solid roles, using pixel shares for background and primary. */
export function assignBrandRoles(
  hexes: string[],
  usecaseForRole: (role: BrandKitColor["role"]) => string,
  shares?: number[],
): BrandKitColor[] {
  const candidates = hexes
    .map((hex, index) => ({
      hex: hex.toUpperCase(),
      share: shares?.[index] ?? 1,
      lab: hexLab(hex),
    }))
    .filter(
      (candidate, index, all) =>
        /^#[0-9A-F]{6}$/.test(candidate.hex) &&
        all.findIndex((color) => color.hex === candidate.hex) === index,
    )
    .slice(0, 5);
  if (!candidates.length)
    throw new Error("Couldn't read colors from this image.");
  const total = candidates.reduce((sum, color) => sum + color.share, 0);
  const dark =
    candidates.reduce((sum, color) => sum + color.lab[0] * color.share, 0) /
      total <
    0.5;
  const background = candidates
    .slice(0, 3)
    .reduce((best, color) =>
      (dark ? color.lab[0] < best.lab[0] : color.lab[0] > best.lab[0])
        ? color
        : best,
    );
  let remaining = candidates.filter((color) => color !== background);
  const extractedText = remaining.reduce<typeof background | undefined>(
    (best, color) =>
      !best ||
      contrast(color.hex, background.hex) > contrast(best.hex, background.hex)
        ? color
        : best,
    undefined,
  );
  let textHex: string;
  if (extractedText && contrast(extractedText.hex, background.hex) >= 4.5) {
    textHex = extractedText.hex;
    remaining = remaining.filter((color) => color !== extractedText);
  } else {
    textHex =
      contrast("#141413", background.hex) >= contrast("#FFFFFF", background.hex)
        ? "#141413"
        : "#FFFFFF";
    if (contrast(textHex, background.hex) < 4.5) textHex = "#000000";
  }
  const chroma = (color: typeof background) =>
    Math.hypot(color.lab[1], color.lab[2]);
  const colorful = remaining.some((color) => chroma(color) >= 0.03);
  const primary = remaining.reduce<typeof background | undefined>(
    (best, color) => {
      const score = (candidate: typeof background) =>
        colorful
          ? chroma(candidate) * Math.sqrt(candidate.share)
          : candidate.share;
      return !best || score(color) > score(best) ? color : best;
    },
    undefined,
  );
  remaining = remaining.filter((color) => color !== primary);
  const secondary = primary
    ? remaining.find(
        (color) => distanceSquared(color.lab, primary.lab) >= 0.1 ** 2,
      )
    : undefined;
  remaining = remaining.filter((color) => color !== secondary);
  const accent = remaining.reduce<typeof background | undefined>(
    (best, color) => (!best || chroma(color) > chroma(best) ? color : best),
    undefined,
  );
  const roles: Array<[BrandKitColor["role"], string | undefined]> = [
    ["primary", primary?.hex],
    ["secondary", secondary?.hex],
    ["background", background.hex],
    ["text", textHex],
    ["accent", accent?.hex],
  ];
  return roles.flatMap(([role, hex]) =>
    hex
      ? [
          {
            id: crypto.randomUUID().slice(0, 8),
            hex,
            secondaryHex: hex,
            angle: 135,
            type: "solid" as const,
            role,
            usecase: usecaseForRole(role),
          },
        ]
      : [],
  );
}

export function kitNameFromFile(filename: string): string {
  const name = filename
    .replace(/\.[^.]*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return name ? `Palette from ${name}`.slice(0, 40).trim() : "Image palette";
}
