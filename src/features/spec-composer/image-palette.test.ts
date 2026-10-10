import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assignBrandRoles,
  extractPalette,
  extractWeightedPalette,
  kitNameFromFile,
  paletteFromFile,
  paletteWithSharesFromFile,
} from "./image-palette";

const pixels = (...blocks: Array<[number, number, number, number, number]>) =>
  new Uint8ClampedArray(
    blocks.flatMap(([r, g, b, alpha, count]) =>
      Array.from({ length: count }, () => [r, g, b, alpha]).flat(),
    ),
  );
const usecase = (role: string) => `${role} use`;
function contrast(left: string, right: string) {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((start) => {
      const value = parseInt(hex.slice(start, start + 2), 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return (
      channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
    );
  };
  const a = luminance(left);
  const b = luminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("image palette extraction", () => {
  it("retains exact solids and their 60/30/10 frequency order", () => {
    const input = pixels(
      [255, 0, 0, 255, 60],
      [0, 0, 255, 255, 30],
      [0, 255, 0, 255, 10],
    );
    expect(extractWeightedPalette(input)).toEqual([
      { hex: "#FF0000", share: 0.6 },
      { hex: "#0000FF", share: 0.3 },
      { hex: "#00FF00", share: 0.1 },
    ]);
    expect(extractPalette(input)).toEqual(["#FF0000", "#0000FF", "#00FF00"]);
  });

  it("ignores alpha below 128 and includes alpha 128", () => {
    expect(
      extractPalette(pixels([0, 0, 0, 127, 99], [27, 83, 149, 128, 1])),
    ).toEqual(["#1B5395"]);
  });

  it("rejects empty, transparent and under-one-percent opaque samples", () => {
    for (const input of [
      new Uint8ClampedArray(),
      pixels([0, 0, 0, 0, 100]),
      pixels([0, 0, 0, 0, 100], [255, 0, 0, 255, 1]),
    ]) {
      expect(() => extractPalette(input)).toThrow(
        "This image is mostly transparent.",
      );
    }
    expect(
      extractPalette(pixels([0, 0, 0, 0, 99], [255, 0, 0, 255, 1])),
    ).toEqual(["#FF0000"]);
  });

  it("is deterministic, unique, uppercase and bounded to five with normalized shares", () => {
    const input = new Uint8ClampedArray(
      Array.from({ length: 400 }, (_, i) => [
        (i * 37) % 256,
        (i * 73) % 256,
        (i * 113) % 256,
        255,
      ]).flat(),
    );
    const palette = extractWeightedPalette(input);
    expect(extractWeightedPalette(input)).toEqual(palette);
    expect(palette.length).toBeLessThanOrEqual(5);
    expect(palette.length).toBeGreaterThan(1);
    expect(new Set(palette.map((color) => color.hex)).size).toBe(
      palette.length,
    );
    palette.forEach((color) => expect(color.hex).toMatch(/^#[0-9A-F]{6}$/));
    expect(palette.reduce((sum, color) => sum + color.share, 0)).toBeCloseTo(1);
    expect(extractPalette(input, 3).length).toBeLessThanOrEqual(3);
    expect(extractPalette(input, 20).length).toBeLessThanOrEqual(5);
  });

  it("merges perceptually near shades across different histogram bins", () => {
    expect(
      extractPalette(pixels([255, 0, 0, 255, 60], [249, 0, 0, 255, 40])),
    ).toHaveLength(1);
  });
});

describe("image palette roles", () => {
  it("uses real shares to select primary while keeping unique roles and solid metadata", () => {
    const roles = assignBrandRoles(
      ["#F7F7F7", "#D15B5B", "#141413", "#0000FF", "#00FF00"],
      usecase,
      [0.5, 0.4, 0.08, 0.01, 0.01],
    );
    expect(roles.find((color) => color.role === "primary")?.hex).toBe(
      "#D15B5B",
    );
    expect(roles.map((color) => color.role)).toEqual([
      "primary",
      "secondary",
      "background",
      "text",
      "accent",
    ]);
    expect(new Set(roles.map((color) => color.role)).size).toBe(roles.length);
    expect(roles.length).toBeLessThanOrEqual(5);
    roles.forEach((color) => {
      expect(color).toMatchObject({
        type: "solid",
        angle: 135,
        secondaryHex: color.hex,
        usecase: `${color.role} use`,
      });
      expect(color.id).toHaveLength(8);
    });
    expect(new Set(roles.map((color) => color.id)).size).toBe(roles.length);
  });

  it("chooses a dark background for a primarily dark image, weighted by share", () => {
    const roles = assignBrandRoles(
      ["#111111", "#222233", "#EEEEEE"],
      usecase,
      [0.8, 0.15, 0.05],
    );
    expect(roles.find((color) => color.role === "background")?.hex).toBe(
      "#111111",
    );
    expect(roles.find((color) => color.role === "text")?.hex).toBe("#EEEEEE");
  });

  it("uses the most common remaining gray as primary and keeps fallback-replaced candidates", () => {
    const roles = assignBrandRoles(
      ["#FFFFFF", "#AAAAAA", "#BBBBBB"],
      usecase,
      [0.6, 0.3, 0.1],
    );
    expect(roles.find((color) => color.role === "primary")?.hex).toBe(
      "#AAAAAA",
    );
    expect(roles.find((color) => color.role === "text")?.hex).toBe("#141413");
    expect(roles.some((color) => color.hex === "#BBBBBB")).toBe(true);
  });

  it.each(["#FF0000", "#FFFFFF", "#000000", "#808080", "#787878", "#FFD700"])(
    "makes a one-color %s image readable without inventing primary",
    (hex) => {
      const roles = assignBrandRoles([hex], usecase);
      expect(roles.map((color) => color.role)).toEqual(["background", "text"]);
      expect(roles[0]?.hex).toBe(hex);
      expect(contrast(roles[0]!.hex, roles[1]!.hex)).toBeGreaterThanOrEqual(
        4.5,
      );
      if (hex === "#787878") expect(roles[1]?.hex).toBe("#000000");
    },
  );

  it("picks the highest-contrast extracted text and avoids duplicate role assignments", () => {
    const roles = assignBrandRoles(
      ["#EFEFEF", "#777777", "#111111", "#E06060", "#B9C9EB"],
      usecase,
    );
    const background = roles.find((color) => color.role === "background")!;
    const text = roles.find((color) => color.role === "text")!;
    expect(text.hex).toBe("#111111");
    expect(contrast(text.hex, background.hex)).toBeGreaterThanOrEqual(4.5);
    expect(roles.filter((color) => color.hex === "#111111")).toHaveLength(1);
  });

  it("does not reuse primary as secondary when remaining colors are too similar", () => {
    const roles = assignBrandRoles(["#FFFFFF", "#D15B5B", "#CF5D5D"], usecase);
    expect(roles.some((color) => color.role === "secondary")).toBe(false);
  });
});

describe("image palette names", () => {
  it("strips only the final extension and collapses whitespace", () => {
    expect(kitNameFromFile("  Summer   coast.v2.PNG")).toBe(
      "Palette from Summer coast.v2",
    );
    expect(kitNameFromFile("plain name")).toBe("Palette from plain name");
    expect(kitNameFromFile("   .png")).toBe("Image palette");
  });
  it("caps the entire kit name to forty characters", () => {
    expect(kitNameFromFile(`${"long".repeat(20)}.webp`)).toHaveLength(40);
    expect(kitNameFromFile("")).toBe("Image palette");
  });
});

function pngFile() {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([73, 72, 68, 82], 12);
  new DataView(bytes.buffer).setUint32(16, 256);
  new DataView(bytes.buffer).setUint32(20, 128);
  return new File([bytes], "sample.png", { type: "image/png" });
}

afterEach(() => vi.unstubAllGlobals());
describe("browser image sampling", () => {
  function stubBitmap() {
    const close = vi.fn();
    const decode = vi
      .fn()
      .mockResolvedValue({ width: 256, height: 128, close });
    vi.stubGlobal("createImageBitmap", decode);
    return { close, decode };
  }

  it("uses a DOM canvas fallback at the capped aspect ratio and closes both bitmaps", async () => {
    const { close, decode } = stubBitmap();
    const drawImage = vi.fn();
    const getContext = vi.fn().mockReturnValue({
      drawImage,
      getImageData: () => ({ data: pixels([255, 0, 0, 255, 1]) }),
    });
    const canvas = { width: 0, height: 0, getContext };
    const createElement = vi.fn().mockReturnValue(canvas);
    vi.stubGlobal("OffscreenCanvas", undefined);
    vi.stubGlobal("document", { createElement });
    const file = pngFile();
    expect(await paletteFromFile(file)).toEqual(["#FF0000"]);
    expect(createElement).toHaveBeenCalledWith("canvas");
    expect(canvas).toMatchObject({ width: 128, height: 64 });
    expect(getContext).toHaveBeenCalledWith("2d", { willReadFrequently: true });
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 128, 64);
    expect(decode).toHaveBeenNthCalledWith(2, file, {
      imageOrientation: "from-image",
    });
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("uses OffscreenCanvas when available and releases the bitmap on null context", async () => {
    const { close } = stubBitmap();
    const getContext = vi.fn().mockReturnValue(null);
    const constructor = vi.fn();
    vi.stubGlobal(
      "OffscreenCanvas",
      class {
        width: number;
        height: number;
        getContext = getContext;
        constructor(width: number, height: number) {
          this.width = width;
          this.height = height;
          constructor(width, height);
        }
      },
    );
    await expect(paletteWithSharesFromFile(pngFile())).rejects.toThrow(
      "Your browser can't read image colors.",
    );
    expect(constructor).toHaveBeenCalledWith(128, 64);
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("releases the sampled bitmap when extraction rejects transparency", async () => {
    const { close } = stubBitmap();
    vi.stubGlobal("OffscreenCanvas", undefined);
    vi.stubGlobal("document", {
      createElement: () => ({
        getContext: () => ({
          drawImage: vi.fn(),
          getImageData: () => ({ data: pixels([0, 0, 0, 0, 1]) }),
        }),
      }),
    });
    await expect(paletteFromFile(pngFile())).rejects.toThrow(
      "This image is mostly transparent.",
    );
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("reports a friendly orientation-aware decode failure after validator cleanup", async () => {
    const { close, decode } = stubBitmap();
    decode
      .mockResolvedValueOnce({ width: 256, height: 128, close })
      .mockRejectedValueOnce(new Error("decoder"));
    await expect(paletteFromFile(pngFile())).rejects.toThrow(
      "This image could not be decoded.",
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported uploads before creating a bitmap", async () => {
    const { decode } = stubBitmap();
    await expect(
      paletteFromFile(
        new File(["<svg/>"], "sample.svg", { type: "image/svg+xml" }),
      ),
    ).rejects.toThrow("Choose a PNG, JPEG or WebP image.");
    expect(decode).not.toHaveBeenCalled();
  });
});
