import {
  createElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssetsPanel } from "./assets-panel/AssetsPanel";
import { SceneLightingControls } from "./scene-lighting-controls";
import { useEditorStore } from "./store";
import { createStudioLight } from "./studio-lighting";
import { createDocument } from "./templates";
import { SectionEditor } from "./section-editors";
import { sectionTarget } from "./section-target";

// Server rendering normally uses Zustand's initial snapshot. Read the current
// test document instead, retaining actual store actions and document defaults.
vi.mock("./store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./store")>();
  type State = ReturnType<typeof actual.useEditorStore.getState>;
  const hook = <T = State>(selector?: (state: State) => T) => {
    const state = actual.useEditorStore.getState();
    return selector ? selector(state) : state;
  };
  return {
    ...actual,
    useEditorStore: Object.assign(hook, actual.useEditorStore),
  };
});

beforeEach(() => {
  useEditorStore.setState({ doc: createDocument() });
});

const renderSettings = (field: "scene" | "lighting") =>
  renderToStaticMarkup(
    createElement(SceneLightingControls, { field, presentation: "inline" }),
  );

function renderEnvironment() {
  function Environment() {
    const [opened, setOpened] = useState(false);
    const tree = AssetsPanel();
    if (!opened) {
      type Props = { children?: ReactNode; id?: string; onClick?: () => void };
      const visit = (node: ReactNode): ReactElement<Props>[] =>
        Array.isArray(node)
          ? node.flatMap(visit)
          : isValidElement<Props>(node)
            ? [node, ...visit(node.props.children)]
            : [];
      const tab = visit(tree).find((node) =>
        node.props.id?.endsWith("environment-tab"),
      );
      expect(tab).toBeDefined();
      tab!.props.onClick!();
      setOpened(true);
    }
    return tree;
  }
  return renderToStaticMarkup(createElement(Environment));
}

describe("asset scene and studio controls", () => {
  it.each(["scene", "lighting", "skill:scene", "skill:lighting"])(
    "keeps %s output on the plain-text editing path",
    (lineKey) => {
      const doc = useEditorStore.getState().doc!;
      expect(sectionTarget(lineKey, doc)).toBeNull();
      const html = renderToStaticMarkup(
        createElement(SectionEditor, {
          lineKey,
          baseText: "Generated scene or lighting description",
          onEditText: vi.fn(),
        }),
      );
      expect(html).toBe("");
    },
  );
  it("exposes linked tabs, compact library actions and unchanged Environment controls", () => {
    const html = renderToStaticMarkup(createElement(AssetsPanel));
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Composition settings"');
    const environment = renderEnvironment();
    for (const setting of ["Environment", "Camera angle", "Studio lighting"])
      expect(environment).toContain(setting);
    for (const tab of ["add", "environment"]) {
      expect(html).toContain(`${tab}-tab`);
      expect(html).toContain(`${tab}-panel`);
    }
    expect(html).not.toContain("layers-tab");
    expect(html).not.toContain("layers-panel");
    for (const action of [
      "Creative Purpose",
      "Search elements",
      "Recommended",
      "All Elements",
      "Upload image",
    ])
      expect(html).toContain(`aria-label="${action}"`);
    expect(html).not.toContain("Build your scene");
    expect(html).not.toContain("Shape, text &amp; scene presets");
    expect(html).not.toContain('data-shape="');
    expect(html).not.toContain('class="asset-text-preview"');
    expect(html).not.toContain('aria-label="Selected element"');
    expect(html).not.toContain("Your images");
  });

  it("offers clearly named sources with pressed state only outside a studio rig", () => {
    let html = renderSettings("lighting");
    expect(html).toContain('aria-label="Light source"');
    expect(html).toContain("Diffused light");
    expect(html).toContain("Sunlight");
    expect(html).toContain(
      "Choosing a source replaces the studio setup. Undo restores it.",
    );
    useEditorStore.setState({
      doc: {
        ...createDocument(),
        generationSettings: { lightType: "Sunlight" },
      },
    });
    html = renderSettings("lighting");
    expect(html).toContain('aria-pressed="true"><strong>Sunlight</strong>');
    useEditorStore.setState({
      doc: {
        ...createDocument(),
        generationSettings: { lightType: "Sunlight", studioLights: [] },
      },
    });
    html = renderSettings("lighting");
    expect(html).not.toContain('aria-pressed="true"><strong>Sunlight</strong>');
  });

  it("shows environment and camera without duplicating image style in the inline Scene view", () => {
    const html = renderSettings("scene");
    for (const label of [
      "Environment",
      "Camera angle",
      "Include scene in output",
      "Prompt only",
    ])
      expect(html).toContain(label);
    expect(html).not.toContain("Render style");
    expect(html).not.toContain('class="scene-lighting-controls"');
    expect(html).not.toContain("Studio lighting");
  });

  it("omits the duplicate render style from the shared collapsible controls", () => {
    const html = renderToStaticMarkup(createElement(SceneLightingControls));
    expect(html).toContain('class="scene-lighting-controls"');
    expect(html).toContain("Environment");
    expect(html).toContain("Camera angle");
    expect(html).not.toContain("Render style");
  });

  it("offers studio presets alongside legacy simple settings until a rig is selected", () => {
    const html = renderSettings("lighting");
    for (const label of [
      "Portrait studio",
      "Product studio",
      "Add light",
      "Simple lighting",
      "Light type",
      "Lighting notes",
    ])
      expect(html).toContain(label);
    expect(html).not.toContain("Rig schematic");
  });

  it("renders selected disabled light controls with bounded signed coordinates and retained recovery text", () => {
    const doc = createDocument();
    doc.generationSettings = {
      studioLights: [
        createStudioLight({
          name: "Disabled fill",
          enabled: false,
          role: "Fill",
          azimuth: -90,
          elevation: -20,
          intensity: 0,
        }),
      ],
    };
    doc.savedCustomText = { visual: "Recoverable custom prompt" };
    useEditorStore.setState({ doc });
    const html = renderSettings("lighting");
    for (const label of [
      "Disabled fill",
      "Disabled in output",
      "Selected light",
      "ambient illumination only",
      "Use simple lighting",
      "Saved custom text",
      "Recoverable custom prompt",
    ])
      expect(html).toContain(label);
    expect(html).toContain(
      'aria-label="Select Disabled fill (disabled)" aria-pressed="true"',
    );
    expect(html).toContain('min="-180" max="180"');
    expect(html).toContain('value="-90"');
    expect(html).not.toContain(">Light type<");
  });

  it("keeps an empty rig distinct from simple lighting", () => {
    const doc = createDocument();
    doc.generationSettings = { studioLights: [] };
    useEditorStore.setState({ doc });
    const html = renderSettings("lighting");
    expect(html).toContain("No sources yet");
    expect(html).toContain("ambient illumination only");
    expect(html).toContain("Use simple lighting");
    expect(html).not.toContain("Selected light");
    expect(html).not.toContain(">Light type<");
  });

  it("keeps six coincident source markers separately selectable and disables Add at the limit", () => {
    const doc = createDocument();
    doc.generationSettings = {
      studioLights: Array.from({ length: 6 }, (_, index) =>
        createStudioLight({ name: `Source ${index + 1}` }),
      ),
    };
    useEditorStore.setState({ doc });
    const html = renderSettings("lighting");
    const positions = Array.from(
      html.matchAll(/class="studio-light-marker" style="([^"]+)"/g),
      (match) => match[1],
    );
    expect(positions).toHaveLength(6);
    expect(new Set(positions).size).toBe(6);
    expect(html).toContain('class="studio-add-light" disabled=""');
    expect(html).toContain("Six-source limit reached");
    expect(html).toContain("Dotted leaders separate crowded labels");
  });
});
