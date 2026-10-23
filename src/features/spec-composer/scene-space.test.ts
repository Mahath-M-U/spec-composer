import { describe, expect, it } from "vitest";
import {
  canvasToScene,
  clampNorm,
  defaultPlacement,
  describeDirection,
  docToNorm,
  normToDoc,
  normToScreen,
  rotationToVector,
  sceneToCanvas,
} from "./scene-space";

const format = { width: 1000, height: 800 };

describe("scene-space coordinate mapping", () => {
  it("round-trips document <-> normalized points", () => {
    for (const point of [
      { x: 0, y: 0 },
      { x: 1000, y: 800 },
      { x: 250, y: 600 },
    ]) {
      const norm = docToNorm(point, format);
      expect(normToDoc(norm, format).x).toBeCloseTo(point.x, 5);
      expect(normToDoc(norm, format).y).toBeCloseTo(point.y, 5);
    }
    const center = docToNorm({ x: 500, y: 400 }, format);
    expect(center.x).toBeCloseTo(0, 10);
    expect(center.y).toBeCloseTo(0, 10);
    // Document y grows downward; normalized y grows upward.
    expect(docToNorm({ x: 500, y: 0 }, format).y).toBe(1);
    expect(docToNorm({ x: 1000, y: 400 }, format).x).toBe(1);
  });

  it("maps a normalized point to screen space through pan and zoom", () => {
    const pan = { x: 20, y: 30 };
    expect(normToScreen({ x: 0, y: 0 }, format, pan, 2)).toEqual({
      x: 20 + 500 * 2,
      y: 30 + 400 * 2,
    });
  });

  it("clamps normalized points to the +/-1.5 schema bounds", () => {
    expect(clampNorm({ x: 3, y: -3 })).toEqual({ x: 1.5, y: -1.5 });
    expect(clampNorm({ x: 0.2, y: -0.4 })).toEqual({ x: 0.2, y: -0.4 });
  });

  it("round-trips canvas position <-> azimuth/elevation per depth band", () => {
    for (const depth of ["front", "side", "back"] as const) {
      for (const x of [-0.9, -0.4, 0, 0.4, 0.9]) {
        for (const y of [-1, -0.3, 0, 0.3, 1]) {
          const scene = canvasToScene({ x, y }, depth);
          const back = sceneToCanvas(scene);
          expect(back.depth).toBe(depth);
          expect(back.canvas.x).toBeCloseTo(x, 4);
          expect(back.canvas.y).toBeCloseTo(y, 4);
        }
      }
    }
  });

  it("keeps azimuth 0 at front, +90 to the right and +/-180 behind", () => {
    expect(canvasToScene({ x: 0, y: 0 }, "front").azimuth).toBeCloseTo(0, 4);
    expect(canvasToScene({ x: 1, y: 0 }, "side").azimuth).toBeGreaterThan(0);
    expect(canvasToScene({ x: 0, y: 0 }, "back").azimuth).toBeCloseTo(180, 4);
  });

  it("derives depth bands from azimuth magnitude", () => {
    expect(sceneToCanvas({ azimuth: 10, elevation: 0 }).depth).toBe("front");
    expect(sceneToCanvas({ azimuth: 75, elevation: 0 }).depth).toBe("side");
    expect(sceneToCanvas({ azimuth: 150, elevation: 0 }).depth).toBe("back");
  });

  it("returns a unit vector for a 2D aim, 0deg pointing right and CCW positive", () => {
    const right = rotationToVector(0);
    expect(right.x).toBeCloseTo(1, 5);
    expect(right.y).toBeCloseTo(0, 5);
    const up = rotationToVector(90);
    expect(up.x).toBeCloseTo(0, 5);
    expect(up.y).toBeCloseTo(1, 5);
  });

  it("describes bearing in words, never coordinates, and reflects side/elevation", () => {
    expect(describeDirection(0, 0)).toBe("from the front");
    expect(describeDirection(180, 0)).toBe("from behind");
    expect(describeDirection(90, 0)).toContain("right");
    expect(describeDirection(-90, 0)).toContain("left");
    expect(describeDirection(0, 40)).toContain("above");
    expect(describeDirection(0, -40)).toContain("below");
    for (const phrase of [
      describeDirection(45, 60),
      describeDirection(-135, -40),
    ])
      expect(phrase).not.toMatch(/-?\d/);
  });

  it("places each light kind within bounds and spreads repeats apart", () => {
    for (const kind of ["sun", "diffused", "spot", "point", "area"]) {
      const first = defaultPlacement(kind, 0);
      const second = defaultPlacement(kind, 1);
      for (const placement of [first, second]) {
        expect(Math.abs(placement.canvas.x)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(placement.canvas.y)).toBeLessThanOrEqual(1.5);
      }
      expect(second.canvas.x).not.toBe(first.canvas.x);
    }
  });
});
