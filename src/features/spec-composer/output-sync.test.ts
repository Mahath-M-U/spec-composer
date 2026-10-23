import { describe, expect, it } from "vitest";
import { synchronizeStructuredOutput } from "./output-sync";
import { createDocument } from "./templates";
import { createSceneCamera, createSceneLight } from "./scene-objects";

/** Step C: the environment editor's new generationSettings fields (camera,
 * ambient, scenePreset, and any scene-editor field on a light) must
 * invalidate stale prompt/design overrides exactly like the legacy fields
 * already did (scene-lighting.test.ts covers those). */
describe("synchronizeStructuredOutput (environment editor fields)", () => {
  const withOverrides = () => ({
    ...createDocument(),
    promptOptions: { ...createDocument().promptOptions, scene: true, lighting: true },
    promptParts: {
      scene: "OLD",
      "skill:scene": "OLD",
      lighting: "OLD",
      "skill:lighting": "OLD",
      imageStyle: "OLD",
      "skill:imageStyle": "OLD",
      "skill:elevation": "OLD",
      colors: "KEEP",
    },
  });

  const sceneKeysCleared = { lighting: "OLD", "skill:lighting": "OLD", colors: "KEEP" };
  const lightingKeysCleared = { scene: "OLD", "skill:scene": "OLD", colors: "KEEP" };

  it("invalidates the Scene override when a camera is added, changed or removed", () => {
    const before = withOverrides();
    const added = structuredClone(before);
    added.generationSettings = { camera: createSceneCamera() };
    synchronizeStructuredOutput(before, added);
    expect(added.promptParts).toEqual(sceneKeysCleared);

    const changed = structuredClone(added);
    changed.generationSettings = {
      camera: { ...createSceneCamera(), focalLength: 85 },
    };
    const beforeChange = structuredClone(added);
    beforeChange.promptParts = { ...before.promptParts };
    synchronizeStructuredOutput(beforeChange, changed);
    expect(changed.promptParts).toEqual(sceneKeysCleared);
  });

  it("invalidates the Lighting override when ambient or a scene-editor light field changes", () => {
    const before = withOverrides();
    const ambientAdded = structuredClone(before);
    ambientAdded.generationSettings = {
      ambient: { enabled: true, intensity: 50, temperature: 5600 },
    };
    synchronizeStructuredOutput(before, ambientAdded);
    expect(ambientAdded.promptParts).toEqual(lightingKeysCleared);

    const lightAdded = structuredClone(before);
    lightAdded.generationSettings = {
      studioLights: [createSceneLight("sun", [])],
    };
    synchronizeStructuredOutput(before, lightAdded);
    expect(lightAdded.promptParts).toEqual(lightingKeysCleared);
  });

  it("invalidates the Scene override when scenePreset changes", () => {
    const before = withOverrides();
    before.generationSettings = { scenePreset: "studio" };
    const next = structuredClone(before);
    next.generationSettings = { scenePreset: "outdoor" };
    const beforeWithParts = structuredClone(before);
    beforeWithParts.promptParts = { ...before.promptParts };
    synchronizeStructuredOutput(beforeWithParts, next);
    expect(next.promptParts).toEqual(sceneKeysCleared);
  });

  it("leaves overrides untouched when nothing structured changes", () => {
    const before = withOverrides();
    before.generationSettings = { camera: createSceneCamera() };
    const same = structuredClone(before);
    synchronizeStructuredOutput(before, same);
    expect(same.promptParts).toEqual(before.promptParts);
  });
});
