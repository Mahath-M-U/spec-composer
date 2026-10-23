import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SceneOverlay } from "./SceneOverlay";
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
import { createSceneCamera, createSceneLight } from "../scene-objects";

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

beforeEach(() => {
  const doc = createDocument();
  doc.generationSettings = {
    camera: createSceneCamera(),
    studioLights: [createSceneLight("sun", []), createSceneLight("point", [createSceneLight("sun", [])])],
  };
  useEditorStore.setState({
    doc,
    pan: { x: 0, y: 0 },
    zoom: 1,
    sceneGuidesVisible: true,
    selectedSceneId: null,
  });
});

const render = () => renderToStaticMarkup(<SceneOverlay />);

describe("SceneOverlay", () => {
  it("renders nothing when guides are globally hidden", () => {
    useEditorStore.setState({ sceneGuidesVisible: false });
    expect(render()).toBe("");
  });

  it("renders nothing when there is no open document", () => {
    useEditorStore.setState({ doc: undefined });
    expect(render()).toBe("");
  });

  it("is a pointer-events:none root with data-canvas-ui, keeping handles interactive", () => {
    const html = render();
    expect(html).toContain('data-canvas-ui="true"');
    expect(html).toMatch(/<svg[^>]*style="[^"]*pointer-events:none/);
    expect(html).toContain("pointer-events:auto");
  });

  it("gives only the selected object a detailed guide; others get a plain marker", () => {
    useEditorStore.setState({ selectedSceneId: "camera" });
    const html = render();
    const markerCount = html.match(/class="scene-guide-marker"/g)?.length ?? 0;
    const detailedCount = html.match(/class="scene-guide /g)?.length ?? 0;
    // Camera (selected) + 2 lights (unselected markers).
    expect(markerCount).toBe(2);
    expect(detailedCount).toBe(1);
    expect(html).toContain("scene-guide-camera");
  });

  it("does not render a guide for a hidden object", () => {
    const doc = createDocument();
    const hidden = createSceneLight("area", []);
    hidden.guideHidden = true;
    doc.generationSettings = { studioLights: [hidden] };
    useEditorStore.setState({ doc });
    const html = render();
    expect(html).not.toContain(`data-scene-object="${hidden.id}"`);
  });

  it("draws a dashed target line only when the camera is selected", () => {
    let html = render();
    expect(html).not.toContain("scene-guide-target-line");
    useEditorStore.setState({ selectedSceneId: "camera" });
    html = render();
    expect(html).toContain("scene-guide-target-line");
  });

  it("announces the selected object through an aria-live status, empty when nothing is selected", () => {
    let html = render();
    expect(html).toMatch(/<span[^>]*aria-live="polite"[^>]*><\/span>/);
    useEditorStore.setState({ selectedSceneId: "camera" });
    html = render();
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Camera selected</span>");
  });

  it("is not aria-hidden now that handles are real focusable, labeled controls", () => {
    const html = render();
    expect(html).not.toContain('aria-hidden="true"');
  });
  it("updates selected guide color, intensity, softness and dimensions from inspector values", () => {
    const light = { ...createSceneLight("area", []), color: "#FFD8A6", intensity: 20, diffusion: 90, width: 4, height: 2 };
    const doc = { ...createDocument(), generationSettings: { studioLights: [light] } };
    useEditorStore.setState({ doc, selectedSceneId: light.id });
    const html = render();
    expect(html).toContain("stroke:#FFD8A6");
    expect(html).toContain("opacity:0.48");
    expect(html).toContain('width="56"');
    expect(html).toContain('height="28"');
    expect(html).toContain("stroke-dasharray:3 2");
  });

  it("updates point radius and camera target lines while shared preview is active", () => {
    const light = { ...createSceneLight("point", []), radius: 2 };
    const camera = createSceneCamera();
    const doc = { ...createDocument(), generationSettings: { camera, studioLights: [light] } };
    useEditorStore.setState({ doc, selectedSceneId: light.id });
    expect(render()).toContain('r="24"');
    useEditorStore.setState({ selectedSceneId: "camera", scenePreview: { id: "camera", canvas: { x: 0.5, y: 0.5 } } });
    const html = render();
    expect(html).toContain("scene-guide-target-line");
    useEditorStore.setState({ scenePreview: null });
    expect(render()).not.toBe(html);
  });

});
