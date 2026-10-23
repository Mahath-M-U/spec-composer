import { renderToStaticMarkup } from "react-dom/server";
import type { PointerEvent as ReactPointerEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSceneDrag } from "./use-scene-drag";
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
import { resolveSceneObject } from "../scene-controls-store";
import { compileSceneLighting } from "../scene-prompt";

vi.mock("../store", async (importOriginal) => {
  const original = await importOriginal<typeof import("../store")>();
  type State = ReturnType<typeof original.useEditorStore.getState>;
  return {
    ...original,
    useEditorStore: Object.assign(
      <T = State,>(selector?: (state: State) => T) =>
        selector
          ? selector(original.useEditorStore.getState())
          : original.useEditorStore.getState(),
      original.useEditorStore,
    ),
  };
});
const state = () => useEditorStore.getState();
const pointer = (x: number, y: number, pointerId = 1) =>
  ({
    pointerId,
    clientX: x,
    clientY: y,
    currentTarget: { setPointerCapture: vi.fn() },
    stopPropagation: vi.fn(),
  }) as unknown as ReactPointerEvent<Element>;
function gesture(id: string) {
  let result!: ReturnType<typeof useSceneDrag>;
  function Wrapper() {
    result = useSceneDrag(id, { x: 0, y: 0 }, 0);
    return null;
  }
  renderToStaticMarkup(<Wrapper />);
  return result;
}
beforeEach(() => {
  state().setDocument(createDocument());
  useEditorStore.setState({ zoom: 1, pan: { x: 0, y: 0 } });
});

describe("shared scene gesture preview", () => {
  it("previews movement in inspector data without document/history changes and commits once on release", () => {
    const id = state().addSceneLight("sun", { x: 0, y: 0 })!;
    const original = state().doc!;
    const history = state().past.length;
    const drag = gesture(id);
    drag.startMove(pointer(0, 0));
    drag.move(pointer(1, 1));
    expect(state().scenePreview).toBeNull();
    drag.move(pointer(120, -80));
    const preview = state().scenePreview!;
    const ref = resolveSceneObject(original, id, preview)!;
    expect(ref.type).toBe("light");
    if (ref.type !== "light") throw new Error("Expected a light");
    expect(ref.light.canvas?.x).toBeGreaterThan(0);
    expect(ref.light.elevation).toBeGreaterThan(0);
    expect(state().doc).toBe(original);
    expect(state().past).toHaveLength(history);
    drag.stop(pointer(120, -80));
    expect(state().scenePreview).toBeNull();
    expect(state().past).toHaveLength(history + 1);
    expect(state().doc?.generationSettings?.studioLights?.[0]?.canvas).toEqual(
      preview.canvas,
    );
    state().undo();
    expect(state().doc?.generationSettings?.studioLights?.[0]?.canvas).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("shares rotated direction immediately and updates the compiled specification on release", () => {
    const id = state().addSceneLight("spot", { x: 0, y: 0 })!;
    const drag = gesture(id);
    drag.startRotate(pointer(10, 0), { x: 0, y: 0 });
    drag.move(pointer(0, -30));
    expect(state().scenePreview).toMatchObject({ id, rotation: 90 });
    const previewRef = resolveSceneObject(
      state().doc!,
      id,
      state().scenePreview,
    )!;
    expect(previewRef.type === "light" && previewRef.light.rotation).toBe(90);
    drag.stop(pointer(0, -30));
    expect(
      compileSceneLighting(
        state().doc!.generationSettings!.studioLights!,
        undefined,
      ),
    ).toContain("aimed up");
  });

  it("cancels without mutation and rejects a gesture after the document changes", () => {
    const id = state().addSceneLight("point")!;
    const drag = gesture(id);
    const original = state().doc;
    const history = state().past.length;
    drag.startMove(pointer(0, 0));
    drag.move(pointer(50, 20));
    drag.cancel();
    drag.stop(pointer(50, 20));
    expect(state().scenePreview).toBeNull();
    expect(state().doc).toBe(original);
    expect(state().past).toHaveLength(history);
    drag.startMove(pointer(0, 0));
    drag.move(pointer(50, 20));
    state().setDocument(createDocument());
    const replacement = state().doc;
    drag.stop(pointer(50, 20));
    expect(state().scenePreview).toBeNull();
    expect(state().doc).toBe(replacement);
    expect(state().past).toHaveLength(0);
  });

  it("clears transient state on selection and document mutations", () => {
    const id = state().addSceneLight("point")!;
    state().setScenePreview({ id, rotation: 50 });
    state().selectScene(null);
    expect(state().scenePreview).toBeNull();
    state().setScenePreview({ id, rotation: 50 });
    state().updateSceneLight(id, { intensity: 45 });
    expect(state().scenePreview).toBeNull();
  });
});
