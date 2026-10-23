import { describe, expect, it } from "vitest";
import {
  MAX_SCENE_LIGHTS,
  SCENE_ASSETS,
  canAddCamera,
  canAddLight,
  createSceneCamera,
  createSceneLight,
  kindFromLegacy,
  sceneObjectList,
} from "./scene-objects";
import { createStudioLight } from "./studio-lighting";
import type { SpecDocument, StudioLight } from "./types";

const doc = (generationSettings?: SpecDocument["generationSettings"]) =>
  ({ generationSettings }) as Pick<SpecDocument, "generationSettings">;

describe("scene-objects catalog and derived views", () => {
  it("lists Camera, Set from View and one card per light kind, with Rim as a spot variant", () => {
    expect(SCENE_ASSETS.map((asset) => asset.id)).toEqual([
      "camera",
      "camera-from-view",
      "sun",
      "diffused",
      "spot",
      "point",
      "area",
      "rim",
    ]);
    const rim = SCENE_ASSETS.find((asset) => asset.id === "rim")!;
    expect(rim.kind).toBe("spot");
    expect(rim.roleOverride).toBe("Rim");
    expect(rim.depthOverride).toBe("back");
  });

  it("derives a kind for legacy lights without inventing a studio shape", () => {
    expect(
      kindFromLegacy({ shape: "Rectangle", modifier: "Diffusion panel", width: 2, diffusion: 50 }),
    ).toBe("diffused");
    expect(kindFromLegacy({ shape: "Disk", modifier: "Bare", width: 0.2, diffusion: 10 })).toBe(
      "point",
    );
    expect(kindFromLegacy({ shape: "Disk", modifier: "Bare", width: 1, diffusion: 10 })).toBe(
      "spot",
    );
    expect(
      kindFromLegacy({ shape: "Rectangle", modifier: "Softbox", width: 2, diffusion: 95 }),
    ).toBe("diffused");
    expect(
      kindFromLegacy({ shape: "Rectangle", modifier: "Softbox", width: 2, diffusion: 40 }),
    ).toBe("area");
  });

  it("creates scene lights with a derived azimuth/elevation and an auto-numbered name", () => {
    const first = createSceneLight("sun", []);
    expect(first.kind).toBe("sun");
    expect(first.name).toBe("Sunlight 1");
    expect(first.canvas).toBeDefined();
    expect(typeof first.azimuth).toBe("number");
    expect(typeof first.elevation).toBe("number");
    const second = createSceneLight("sun", [first]);
    expect(second.name).toBe("Sunlight 2");
    const placed = createSceneLight("point", [], { x: 0.3, y: -0.2 });
    expect(placed.canvas).toEqual({ x: 0.3, y: -0.2 });
  });

  it("creates a Rim card as a spot light with the Rim role and back depth", () => {
    const rim = createSceneLight("spot", [], undefined, {
      role: "Rim",
      depth: "back",
    });
    expect(rim.name).toBe("Rim 1");
    expect(rim.role).toBe("Rim");
    expect(rim.depth).toBe("back");
    expect(rim.kind).toBe("spot");
  });

  it("creates a camera at a default position looking at the artboard centre", () => {
    const camera = createSceneCamera();
    expect(camera.enabled).toBe(true);
    expect(camera.target).toEqual({ x: 0, y: 0 });
    expect(camera.angle).toBe("eye-level");
    const placed = createSceneCamera({ x: 0.1, y: 0.2 });
    expect(placed.position).toEqual({ x: 0.1, y: 0.2 });
  });

  it("caps light and camera additions at the shared scene limit", () => {
    const lights: StudioLight[] = Array.from({ length: MAX_SCENE_LIGHTS }, () =>
      createStudioLight(),
    );
    expect(canAddLight(doc({ studioLights: lights.slice(0, -1) }))).toBe(true);
    expect(canAddLight(doc({ studioLights: lights }))).toBe(false);
    expect(canAddLight(doc())).toBe(true);
    expect(canAddCamera(doc())).toBe(true);
    expect(
      canAddCamera(doc({ camera: createSceneCamera() })),
    ).toBe(false);
  });

  it("lists camera, lights and an always-present Ambient row", () => {
    expect(sceneObjectList(doc())).toEqual([
      { id: "ambient", type: "ambient", label: "Ambient", enabled: false, guideHidden: true },
    ]);
    const camera = createSceneCamera();
    const sun = createSceneLight("sun", []);
    const list = sceneObjectList(
      doc({ camera, studioLights: [sun], ambient: { enabled: true, intensity: 40, temperature: 4000 } }),
    );
    expect(list).toEqual([
      { id: "camera", type: "camera", label: "Camera", enabled: true, guideHidden: false },
      { id: sun.id, type: "light", label: "Sunlight 1", enabled: true, guideHidden: false },
      { id: "ambient", type: "ambient", label: "Ambient", enabled: true, guideHidden: true },
    ]);
  });
});
