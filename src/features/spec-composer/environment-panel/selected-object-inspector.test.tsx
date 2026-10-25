import { renderToStaticMarkup } from "react-dom/server";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
import { createSceneCamera, createSceneLight } from "../scene-objects";
import { resolveSceneObject } from "../scene-controls-store";
import {
  controlsForSceneObject,
  type SceneControlDescriptor,
  type SceneObjectRef,
} from "../scene-controls";
import { SelectedObjectInspector } from "./SelectedObjectInspector";
import { ScenePropertyControl } from "./ScenePropertyControl";
import { SceneRow } from "./SceneRow";
import { sceneObjectList } from "../scene-objects";

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

type Props = { children?: ReactNode; [key: string]: unknown };
const visit = (node: ReactNode): ReactElement<Props>[] =>
  Array.isArray(node)
    ? node.flatMap(visit)
    : isValidElement<Props>(node)
      ? [node, ...visit(node.props.children)]
      : [];
function renderControl(id: string, descriptor: SceneControlDescriptor) {
  let view: ReactElement<Props>[] = [];
  function Wrapper() {
    const objectRef = resolveSceneObject(useEditorStore.getState().doc!, id)!;
    const tree = ScenePropertyControl({ id, descriptor, objectRef });
    view = visit(tree);
    return tree;
  }
  renderToStaticMarkup(<Wrapper />);
  return view;
}
const change = (node: ReactElement<Props>, value: string) =>
  (node.props["onChange"] as (event: unknown) => void)({ target: { value } });
beforeEach(() =>
  useEditorStore.setState({
    doc: createDocument(),
    past: [],
    future: [],
    scenePreview: null,
    selectedSceneId: null,
  }),
);

describe("Environment selected object inspector", () => {
  it.each(["sun", "spot", "diffused", "area", "point"] as const)(
    "shows bounded contextual controls for %s",
    (kind) => {
      const light = createSceneLight(kind, []);
      useEditorStore.setState({
        doc: {
          ...createDocument(),
          generationSettings: { studioLights: [light] },
        },
        selectedSceneId: light.id,
      });
      const html = renderToStaticMarkup(<SelectedObjectInspector />);
      expect(html).toContain(`${light.name} properties`);
      expect(html).toContain('aria-label="Color HEX"');
      expect(html).toContain('aria-label="Intensity"');
      expect(html).toContain('aria-label="Shadows"');
      expect(html).toContain(">Off</button>");
      expect(html).toContain(">Position</span>");
      expect(html.match(/aria-label="Softness(?: \/ spread)?"/g)).toHaveLength(
        1,
      );
      if (kind === "spot") expect(html).toContain('aria-label="Cone angle"');
      if (kind === "point")
        expect(html).toContain('aria-label="Influence radius"');
    },
  );

  it("shows camera-specific controls, Set from View and transient positions", () => {
    const camera = { ...createSceneCamera(), name: "Hero view" };
    useEditorStore.setState({
      doc: { ...createDocument(), generationSettings: { camera } },
      selectedSceneId: "camera",
      scenePreview: {
        id: "camera",
        canvas: { x: 0.42, y: -0.2 },
        rotation: 35,
      },
    });
    const html = renderToStaticMarkup(<SelectedObjectInspector />);
    for (const label of [
      "Hero view",
      "Focal length",
      "Perspective",
      "Rotation",
      "Target X",
      "Set from View",
    ])
      expect(html).toContain(label);
    expect(html).toContain('value="0.42"');
    expect(html).toContain('value="35"');
    expect(html).not.toContain('aria-label="Intensity"');
    expect(
      useEditorStore.getState().doc?.generationSettings?.camera?.position,
    ).toEqual(camera.position);
  });

  it("coalesces a slider gesture, validates HEX, and maps Off to None", () => {
    const light = createSceneLight("spot", []);
    useEditorStore.setState({
      doc: {
        ...createDocument(),
        generationSettings: { studioLights: [light] },
      },
    });
    const descriptor = {
      type: "slider" as const,
      key: "intensity",
      label: "Intensity",
      min: 0,
      max: 100,
      step: 1,
    };
    const slider = renderControl(light.id, descriptor).find(
      (node) => node.props["type"] === "range",
    )!;
    (slider.props["onPointerDown"] as (event: unknown) => void)({
      currentTarget: { setPointerCapture: vi.fn() },
      pointerId: 1,
    });
    change(slider, "40");
    change(slider, "25");
    (slider.props["onPointerUp"] as () => void)();
    expect(useEditorStore.getState().past).toHaveLength(1);
    expect(
      useEditorStore.getState().doc?.generationSettings?.studioLights?.[0]
        ?.intensity,
    ).toBe(25);
    const hex = renderControl(light.id, {
      type: "color",
      key: "color",
      label: "Color",
    }).find((node) => node.props["aria-label"] === "Color HEX")!;
    change(hex, "#zzzzzz");
    expect(
      useEditorStore.getState().doc?.generationSettings?.studioLights?.[0]
        ?.color,
    ).toBeUndefined();
    change(hex, "#FFD8A6");
    expect(
      useEditorStore.getState().doc?.generationSettings?.studioLights?.[0]
        ?.color,
    ).toBe("#FFD8A6");
    const ref: SceneObjectRef = { type: "light", light };
    const shadows = controlsForSceneObject(ref).find(
      (control) => control.key === "shadows",
    )!;
    const off = renderControl(light.id, shadows).find(
      (node) => node.props.children === "Off",
    )!;
    (off.props["onClick"] as () => void)();
    expect(
      useEditorStore.getState().doc?.generationSettings?.studioLights?.[0]
        ?.shadows,
    ).toBe("None");
  });

  it("allows camera names to be edited and keeps secondary row actions in a menu", () => {
    const doc = {
      ...createDocument(),
      generationSettings: {
        camera: { ...createSceneCamera(), name: "Hero view" },
      },
    };
    useEditorStore.setState({ doc });
    const html = renderToStaticMarkup(
      <SceneRow row={sceneObjectList(doc)[0]!} />,
    );
    expect(html).toContain('value="Hero view"');
    expect(html).toContain("Rename Hero view");
    expect(html).toContain('aria-label="Actions for Hero view"');
    expect(html).not.toContain(">Duplicate");
  });
});
