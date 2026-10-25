import { describe, expect, it } from "vitest";
import { fitPreview } from "./preview-fit";

const stages = [
  { name: "phone portrait", width: 296, height: 496 },
  { name: "phone landscape", width: 544, height: 248 },
  { name: "tablet", width: 744, height: 952 },
  { name: "desktop", width: 1416, height: 828 },
  { name: "short viewport", width: 1256, height: 168 },
];
const formats = [
  { name: "square", width: 1080, height: 1080 },
  { name: "portrait", width: 1080, height: 1920 },
  { name: "landscape", width: 1920, height: 1080 },
  { name: "very wide", width: 20000, height: 1200 },
  { name: "very tall", width: 1200, height: 20000 },
];
describe("fullscreen preview fit", () => {
  for (const stage of stages)
    it.each(formats)(
      `fits $name artboards inside ${stage.name} without changing aspect ratio`,
      (format) => {
        const fit = fitPreview(format, stage)!;
        expect(fit.width).toBeGreaterThan(0);
        expect(fit.height).toBeGreaterThan(0);
        expect(fit.width).toBeLessThanOrEqual(stage.width + 1e-8);
        expect(fit.height).toBeLessThanOrEqual(stage.height + 1e-8);
        expect(fit.width / fit.height).toBeCloseTo(
          format.width / format.height,
          10,
        );
        expect(
          Math.min(
            Math.abs(fit.width - stage.width),
            Math.abs(fit.height - stage.height),
          ),
        ).toBeLessThan(1e-8);
      },
    );
  it("allows tiny scales for oversized documents and updates for both stage and format changes", () => {
    const huge = { width: 100000, height: 200000 };
    const small = fitPreview(huge, { width: 296, height: 120 })!;
    expect(small.scale).toBeLessThan(0.001);
    expect(small.height).toBeCloseTo(120, 10);
    const larger = fitPreview(huge, { width: 1416, height: 828 })!;
    expect(larger.scale).toBeGreaterThan(small.scale);
    expect(
      fitPreview({ width: 1080, height: 1080 }, { width: 1416, height: 828 })!
        .height,
    ).toBe(828);
  });
  it("hides unmeasured, invalid and zero-size stages/formats", () => {
    for (const value of [0, -1, NaN, Infinity]) {
      expect(
        fitPreview(
          { width: 1080, height: 1080 },
          { width: value, height: 500 },
        ),
      ).toBeNull();
      expect(
        fitPreview({ width: 1080, height: value }, { width: 500, height: 500 }),
      ).toBeNull();
    }
    expect(
      fitPreview({ width: 1080, height: 1080 }, { width: 0, height: 0 }),
    ).toBeNull();
  });
});
