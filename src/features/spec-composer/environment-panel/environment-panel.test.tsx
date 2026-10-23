import { renderToStaticMarkup } from "react-dom/server";
import {
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentPanel } from "./EnvironmentPanel";
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
import { createSceneCamera } from "../scene-objects";
import { createStudioLight } from "../studio-lighting";

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

/** Render-phase updates let the panel's own tab state carry across steps. */
function interact(actions: Array<(view: ReactElement<Props>[]) => void>) {
  function Interaction() {
    const [step, setStep] = useState(0);
    const tree = EnvironmentPanel();
    const view = visit(tree);
    if (step < actions.length) {
      actions[step]!(view);
      setStep(step + 1);
    }
    return tree;
  }
  return renderToStaticMarkup(<Interaction />);
}

const openScene = (view: ReactElement<Props>[]) => {
  const tab = view.find((node) => node.props["id"]?.toString().endsWith("scene-tab"));
  (tab!.props["onClick"] as () => void)();
};

beforeEach(() => {
  useEditorStore.setState({ doc: createDocument() });
});

describe("EnvironmentPanel", () => {
  it("renders an Add-tab card for Camera, Set from View, every light kind and Rim", () => {
    const html = renderToStaticMarkup(<EnvironmentPanel />);
    for (const label of [
      "Camera",
      "Set from View",
      "Sunlight",
      "Diffused",
      "Spotlight",
      "Point",
      "Area",
      "Rim",
    ])
      expect(html).toContain(label);
    expect(html.match(/class="contextual-element-card"/g)).toHaveLength(8);
  });

  it("shows Added and disables the Camera card once a camera exists", () => {
    let html = renderToStaticMarkup(<EnvironmentPanel />);
    expect(html).not.toContain('data-added="true"');
    const doc = createDocument();
    doc.generationSettings = { camera: createSceneCamera() };
    useEditorStore.setState({ doc });
    html = renderToStaticMarkup(<EnvironmentPanel />);
    expect(html).toContain('data-added="true"');
  });

  it("disables light cards at the shared cap", () => {
    const doc = createDocument();
    doc.generationSettings = {
      studioLights: Array.from({ length: 6 }, () => createStudioLight()),
    };
    useEditorStore.setState({ doc });
    const html = renderToStaticMarkup(<EnvironmentPanel />);
    expect(html.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("lists Camera, lights and an always-present Ambient row on the Scene tab", () => {
    const doc = createDocument();
    doc.generationSettings = {
      camera: createSceneCamera(),
      studioLights: [createStudioLight({ name: "Key light" })],
    };
    useEditorStore.setState({ doc });
    const html = interact([openScene]);
    expect(html).toContain("scene-list");
    expect(html).toContain("Camera");
    expect(html).toContain("Ambient");
  });

  it("switches between the Add and Scene tabs", () => {
    let seenScene = false;
    interact([
      (view) => {
        expect(
          view.some((node) => node.props["id"]?.toString().endsWith("add-panel")),
        ).toBe(true);
      },
      (view) => {
        openScene(view);
      },
      (view) => {
        seenScene = view.some(
          (node) =>
            node.props["id"]?.toString().endsWith("scene-tab") &&
            node.props["selected"] === true,
        );
      },
    ]);
    expect(seenScene).toBe(true);
  });
});
