import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolRail, type ToolRailProps } from "./tool-rail";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import type { BrandKit } from "./types";

vi.mock("./store", async (importOriginal) => {
  const original = await importOriginal<typeof import("./store")>();
  return {
    ...original,
    useEditorStore: Object.assign(
      (
        selector: (
          state: ReturnType<typeof original.useEditorStore.getState>,
        ) => unknown,
      ) => selector(original.useEditorStore.getState()),
      original.useEditorStore,
    ),
  };
});
vi.mock("./user-settings", () => ({
  UserSettings: () => (
    <button type="button" aria-label="User settings">
      Settings
    </button>
  ),
}));
vi.mock("./quick-guide-lazy", () => ({ QuickGuide: () => null }));
vi.mock("./coming-soon-lazy", () => ({ McpComingSoonSplash: () => null }));

type Props = {
  children?: ReactNode;
  id?: string;
  onClick?: () => void;
  name?: string;
  description?: string;
  [key: string]: unknown;
};
function capture(overrides: Partial<ToolRailProps> = {}) {
  const props: ToolRailProps = {
    expanded: false,
    onExpandedChange: vi.fn(),
    sidebars: {
      overlay: false,
      leftOpen: true,
      rightOpen: true,
      setOpen: vi.fn(),
      toggle: vi.fn(),
      closeDrawers: vi.fn(),
    },
    onSelectPanel: vi.fn(),
    onTour: vi.fn(),
    ...overrides,
  };
  let nodes: ReactElement<Props>[] = [];
  function visit(node: ReactNode): ReactElement<Props>[] {
    return Array.isArray(node)
      ? node.flatMap(visit)
      : isValidElement<Props>(node)
        ? [node, ...visit(node.props.children)]
        : [];
  }
  function Capture() {
    const tree = ToolRail(props);
    nodes = visit(tree);
    return tree;
  }
  const html = renderToStaticMarkup(<Capture />);
  const find = (name: string, value: unknown) =>
    nodes.find((node) => node.props[name] === value)!;
  return { html, nodes, find, props };
}
beforeEach(() =>
  useEditorStore.setState({
    doc: createDocument(),
    panel: "style",
    brandKits: [],
    past: [],
    future: [],
    zoom: 0.7,
    pan: { x: 12, y: 30 },
    selectedIds: ["selected"],
    styleTab: "layout",
  }),
);

describe("shared Tool Rail", () => {
  it.each([false, true])(
    "keeps the six destinations and exclusive active state (expanded=%s)",
    (expanded) => {
      const { html, nodes, props } = capture({ expanded });
      expect(html).not.toContain('aria-label="Home"');
      expect(html).not.toContain("tool-rail-home");
      const tools = nodes.filter(
        (node) =>
          typeof node.props.id === "string" &&
          node.props.id.startsWith("editor-rail-"),
      );
      expect(tools.map((node) => node.props.id)).toEqual([
        "editor-rail-assets",
        "editor-rail-style",
        "editor-rail-layers",
        "editor-rail-templates",
        "editor-rail-brandKit",
        "editor-rail-resize",
      ]);
      expect(tools.filter((node) => node.props["aria-pressed"])).toHaveLength(
        1,
      );
      expect(tools[1]!.props["aria-pressed"]).toBe(true);
      for (const tool of tools) {
        expect(tool.props["data-tour"]).toBe(
          String(tool.props.id).replace("editor-", ""),
        );
        (tool.props.onClick as () => void)();
      }
      expect(props.onSelectPanel).toHaveBeenCalledTimes(6);
    },
  );
  it("does not mark a closed inspector active", () => {
    const { nodes } = capture({
      sidebars: {
        overlay: true,
        leftOpen: false,
        rightOpen: false,
        setOpen: vi.fn(),
        toggle: vi.fn(),
        closeDrawers: vi.fn(),
      },
    });
    expect(nodes.some((node) => node.props["aria-pressed"] === true)).toBe(
      false,
    );
  });
  it.each([false, true])(
    "expansion only calls the controlled display callback (expanded=%s)",
    (expanded) => {
      const before = useEditorStore.getState();
      const { find, props } = capture({ expanded });
      const toggle = find("aria-controls", "editor-tool-navigation");
      expect(toggle.props["aria-expanded"]).toBe(expanded);
      (toggle.props.onClick as () => void)();
      expect(props.onExpandedChange).toHaveBeenCalledExactlyOnceWith(!expanded);
      expect(props.onSelectPanel).not.toHaveBeenCalled();
      expect(props.sidebars.setOpen).not.toHaveBeenCalled();
      expect(useEditorStore.getState()).toBe(before);
    },
  );
  it("shows only the document's resolved applied kit and actual colors", () => {
    const kit: BrandKit = {
      id: "applied",
      name: "Studio Fern",
      colors: ["#123456", "#abcdef"].map((hex, i) => ({
        id: String(i),
        hex,
        angle: 0,
        type: "solid",
        role: "primary",
        usecase: "",
      })),
      emotions: [],
      style: "",
      typography: "",
      createdAt: "",
      updatedAt: "",
    };
    const doc = createDocument();
    doc.creativeDirection.brandKitId = kit.id;
    useEditorStore.setState({ doc, brandKits: [kit] });
    const { html, find, props } = capture({ expanded: true });
    expect(html).toContain("Studio Fern");
    expect(html).toContain("Applied Design Kit");
    expect(html).toContain("background:#123456");
    expect(html).toContain("background:#abcdef");
    const before = useEditorStore.getState().doc;
    (
      find("aria-label", "Open applied Design Kit: Studio Fern").props
        .onClick as () => void
    )();
    expect(props.onSelectPanel).toHaveBeenCalledExactlyOnceWith("brandKit");
    expect(useEditorStore.getState().doc).toBe(before);
    delete doc.creativeDirection.brandKitId;
    expect(capture({ expanded: true }).html).not.toContain("Studio Fern");
    doc.creativeDirection.brandKitId = "missing";
    expect(capture({ expanded: true }).html).not.toContain(
      "Applied Design Kit",
    );
  });
  it("preserves utilities and accessible labels without rail tooltips", () => {
    const { html, find, props } = capture();
    expect(html).toContain('aria-label="User settings"');
    expect(html).toContain("Coming soon");
    expect(find("data-tour", "connect").props["aria-haspopup"]).toBe("dialog");
    expect(find("id", "editor-rail-style").props["aria-label"]).toBe("Style");
    expect(html).toContain("Edit visual styling");
    expect(html).not.toContain("tool-rail-tooltip");
    (find("aria-label", "Quick tour").props.onClick as () => void)();
    expect(props.onTour).toHaveBeenCalledOnce();
    expect(useEditorStore.getState().panel).toBe("assets");
  });
});
