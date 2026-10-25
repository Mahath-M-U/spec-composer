import { renderToStaticMarkup } from "react-dom/server";
import {
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PresetSection } from "./PresetSection";
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

/** Calls PresetSection directly (not as JSX) so its own buttons — direct
 * children of its own return — show up in `visit`'s walk; render-phase
 * updates let its local dialog state carry across steps, mirroring
 * environment-panel.test.tsx's `interact`. */
function interact(actions: Array<(view: ReactElement<Props>[]) => void>) {
  function Interaction() {
    const [step, setStep] = useState(0);
    const tree = PresetSection();
    const view = visit(tree);
    if (step < actions.length) {
      actions[step]!(view);
      setStep(step + 1);
    }
    return tree;
  }
  return renderToStaticMarkup(<Interaction />);
}

const clickPreset = (view: ReactElement<Props>[], label: string) => {
  const button = view.find(
    (node) => (node.props["preset"] as { label?: string } | undefined)?.label === label,
  );
  (button!.props["onClick"] as () => void)();
};

const dialogOpen = (view: ReactElement<Props>[]) =>
  view.find(
    (node) =>
      "open" in node.props && typeof node.props["onOpenChange"] === "function",
  )?.props["open"] === true;

beforeEach(() => {
  useEditorStore.setState({ doc: createDocument() });
});

describe("PresetSection", () => {
  it("renders a compact 2-col grid with one card per preset", () => {
    const html = renderToStaticMarkup(<PresetSection />);
    expect(html).toContain('class="environment-presets-section"');
    const cards = html.match(/class="environment-preset-card"/g);
    expect(cards).toHaveLength(5);
    for (const label of [
      "Studio",
      "Outdoor",
      "Indoor",
      "Product photography",
      "Abstract",
    ])
      expect(html).toContain(`aria-label="Apply ${label} preset"`);
  });

  it("applies a preset directly, without a confirm dialog, when the scene has no lights yet", () => {
    let openAfterClick = true;
    interact([
      (view) => clickPreset(view, "Studio"),
      (view) => {
        openAfterClick = dialogOpen(view);
      },
    ]);
    expect(useEditorStore.getState().doc?.generationSettings?.scenePreset).toBe(
      "studio",
    );
    expect(openAfterClick).toBe(false);
  });

  it("opens a Replace/Merge confirm dialog when the scene already has lights, applying nothing until confirmed", () => {
    useEditorStore.setState({
      doc: {
        ...createDocument(),
        generationSettings: { studioLights: [createStudioLight()] },
      },
    });
    let openAfterClick = false;
    interact([
      (view) => clickPreset(view, "Studio"),
      (view) => {
        openAfterClick = dialogOpen(view);
      },
    ]);
    expect(openAfterClick).toBe(true);
    expect(
      useEditorStore.getState().doc?.generationSettings?.scenePreset,
    ).toBeUndefined();
  });

  it("applies Replace or Merge from the confirm dialog and closes it", () => {
    const existing = createStudioLight({ name: "Existing" });
    useEditorStore.setState({
      doc: {
        ...createDocument(),
        generationSettings: { studioLights: [existing] },
      },
    });
    interact([
      (view) => clickPreset(view, "Outdoor"),
      (view) => {
        const mergeButton = view.find(
          (node) => node.props["children"] === "Merge",
        );
        (mergeButton!.props["onClick"] as () => void)();
      },
      (view) => {
        expect(dialogOpen(view)).toBe(false);
      },
    ]);
    const lights = useEditorStore.getState().doc?.generationSettings?.studioLights;
    expect(lights?.some((l) => l.id === existing.id)).toBe(true);
    expect(lights!.length).toBeGreaterThan(1);
    expect(
      useEditorStore.getState().doc?.generationSettings?.scenePreset,
    ).toBe("outdoor");
  });
  it.each(["camera", "ambient"])(
    "guards %s-only scenes before replacing anything",
    (kind) => {
      const settings =
        kind === "camera"
          ? { camera: createSceneCamera() }
          : { ambient: { enabled: false, intensity: 25, temperature: 5000 } };
      const doc = { ...createDocument(), generationSettings: settings };
      useEditorStore.setState({ doc });
      interact([
        (view) => clickPreset(view, "Studio"),
        (view) => expect(dialogOpen(view)).toBe(true),
      ]);
      expect(useEditorStore.getState().doc).toBe(doc);
    },
  );

  it("indicates the active preset with aria-pressed", () => {
    useEditorStore.setState({
      doc: {
        ...createDocument(),
        generationSettings: { scenePreset: "studio" },
      },
    });
    const html = renderToStaticMarkup(<PresetSection />);
    expect(html).toContain(
      'aria-label="Apply Studio preset" aria-pressed="true"',
    );
    expect(html.match(/class="environment-preset-preview"/g)).toHaveLength(5);
  });

  it("replaces only after the explicit action, with one undo step", () => {
    const camera = { ...createSceneCamera(), name: "Custom view" };
    useEditorStore.setState({
      doc: { ...createDocument(), generationSettings: { camera } },
      past: [],
      future: [],
    });
    interact([
      (view) => clickPreset(view, "Outdoor"),
      (view) => {
        expect(
          useEditorStore.getState().doc?.generationSettings?.camera?.name,
        ).toBe("Custom view");
        const replace = view.find((node) => node.props.children === "Replace")!;
        (replace.props["onClick"] as () => void)();
      },
    ]);
    expect(
      useEditorStore.getState().doc?.generationSettings?.camera?.name,
    ).toBeUndefined();
    expect(useEditorStore.getState().past).toHaveLength(1);
    useEditorStore.getState().undo();
    expect(
      useEditorStore.getState().doc?.generationSettings?.camera?.name,
    ).toBe("Custom view");
  });

  it("uses the Product Photography title and its distinct product thumbnail", () => {
    const html = renderToStaticMarkup(<PresetSection />);
    expect(html).toContain(">Product Photography</strong>");
    expect(html).toContain('x="36" y="24"');
  });

});
