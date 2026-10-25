import { renderToStaticMarkup } from "react-dom/server";
import {
  createElement as createReactElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { DndContext, type CollisionDetection } from "@dnd-kit/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LayersPanel } from "./layers-panel";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import { createElement } from "./registry";
// SSR normally reads Zustand's initial empty snapshot. Render the live test
// state while keeping every real store command and hierarchy calculation.
vi.mock("./store", async (importOriginal) => {
  const original = await importOriginal<typeof import("./store")>();
  return {
    ...original,
    useEditorStore: Object.assign(
      () => original.useEditorStore.getState(),
      original.useEditorStore,
    ),
  };
});
const state = () => useEditorStore.getState();
type ElementProps = { children?: ReactNode; [key: string]: unknown };
function inspect(tree: ReactNode) {
  const elements = (node: ReactNode): ReactElement<ElementProps>[] => {
    if (Array.isArray(node)) return node.flatMap(elements);
    return isValidElement<ElementProps>(node)
      ? [node, ...elements(node.props.children)]
      : [];
  };
  const all = elements(tree);
  const find = (
    predicate: (element: ReactElement<ElementProps>) => boolean,
  ) => {
    const result = all.find(predicate);
    expect(result).toBeDefined();
    return result!;
  };
  return { find };
}
function capture(render: () => ReactElement | null) {
  let tree: ReactElement | null;
  function Capture() {
    tree = render();
    return tree;
  }
  const html = renderToStaticMarkup(createReactElement(Capture));
  return { html, ...inspect(tree!) };
}
const capturePanel = () => capture(() => LayersPanel({}));
type View = ReturnType<typeof inspect>;
// Render-phase updates retain the actual component's local state across steps.
// Store selection is real; no hook or selection implementation is mocked here.
function interact(actions: Array<(view: View) => void>) {
  let view: View;
  function Interaction() {
    const [step, setStep] = useState(0);
    const tree = LayersPanel({});
    view = inspect(tree);
    if (step < actions.length) {
      actions[step]!(view);
      setStep(step + 1);
    }
    return tree;
  }
  const html = renderToStaticMarkup(createReactElement(Interaction));
  return { html, ...view! };
}
const modeButton = (view: View) =>
  view.find(
    (node) =>
      node.type === "button" &&
      node.props["className"] === "layer-selection-trigger",
  );
const namedButton = (view: View, label: string) =>
  view.find(
    (node) =>
      node.type === "button" &&
      (node.props["aria-label"] === label || node.props["children"] === label),
  );
const checkboxChange = (view: View, id: string, modifiers = plain) => {
  call(layerItem(view, id), "onToggleSelection", id, modifiers);
};

const layerItem = (view: View, id: string) =>
  view.find(
    (node) => (node.props["row"] as { id?: string } | undefined)?.id === id,
  );
const call = (
  node: ReactElement<ElementProps>,
  handler: string,
  ...args: unknown[]
) => (node.props[handler] as (...values: unknown[]) => void)(...args);
const plain = { shiftKey: false, ctrlKey: false, metaKey: false };
const keyEvent = (key: string) => {
  const target = {};
  return {
    ...plain,
    key,
    target,
    currentTarget: target,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
};
function setup() {
  vi.useFakeTimers();
  const doc = createDocument();
  doc.groups = [{ id: "g", name: "Product details" }];
  doc.elements = ["Title", "Product", "Shape"].map((name, index) => ({
    ...createElement(
      index === 0 ? "title" : index === 1 ? "productImage" : "shape",
      doc.format,
      index,
    ),
    name,
    id: name,
    zIndex: 3 - index,
    ...(index < 2 ? { groupId: "g" } : {}),
  }));
  state().setDocument(doc);
}
afterEach(() => {
  useEditorStore.setState({
    doc: undefined,
    selectedIds: [],
    selectedGroupIds: [],
  });
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Layers panel markup and selection states", () => {
  it("offers modifier-free multi-selection across real local-state renders and keeps the selection after Done", () => {
    setup();
    const before = state().doc;
    const result = interact([
      (view) => {
        expect(modeButton(view).props["aria-label"]).toBe("Select");
        call(modeButton(view), "onClick");
      },
      (view) => {
        expect(modeButton(view).props["aria-pressed"]).toBe(true);
        expect(modeButton(view).props["aria-label"]).toBe("Done");
        const [, label] = modeButton(view).props["children"] as ReactElement<
          ElementProps
        >[];
        expect(label?.props.children).toBe("Done");
        expect(layerItem(view, "Title").props["multiSelect"]).toBe(true);
        call(layerItem(view, "Title"), "onSelect", plain, "Title");
      },
      (view) => {
        expect(state().selectedIds).toEqual(["Title"]);
        call(layerItem(view, "Product"), "onSelect", plain, "Product");
      },
      (view) => {
        expect(state().selectedIds).toEqual(["Title", "Product"]);
        expect(
          view.find(
            (node) =>
              node.type === "button" && node.props["onClick"] === state().group,
          ),
        ).toBeDefined();
        call(layerItem(view, "Title"), "onToggleSelection", "Title");
      },
      (view) => {
        expect(state().selectedIds).toEqual(["Product"]);
        call(modeButton(view), "onClick");
      },
    ]);
    expect(result.html).toContain("Select");
    expect(modeButton(result).props["aria-pressed"]).toBe(false);
    expect(result.html).toContain('aria-label="Drag Product"');
    expect(result.html).not.toContain('type="checkbox"');
    expect(state().selectedIds).toEqual(["Product"]);
    expect(state().doc).toBe(before);
    expect(state().past).toHaveLength(0);
  });
  it("renders labelled native checkboxes for explicit row selection and prevents a click from toggling twice", () => {
    setup();
    state().selectLayers(["Title", "Product"]);
    const result = interact([(view) => call(modeButton(view), "onClick")]);
    expect(result.html).toContain("Select layers, then choose an action.");
    expect(result.html).toContain('type="checkbox"');
    expect(result.html).not.toContain('aria-label="Drag Product"');
    const group = layerItem(result, "g"),
      title = layerItem(result, "Title");
    expect(group.props["selected"]).toBe(false);
    expect(title.props["selected"]).toBe(true);
    const renderRow = title.type as (props: ElementProps) => ReactElement;
    const onToggleSelection = vi.fn(),
      startRename = vi.fn();
    const item = capture(() =>
      renderRow({ ...title.props, onToggleSelection, startRename }),
    );
    const input = item.find(
        (node) => node.type === "input" && node.props["type"] === "checkbox",
      ),
      label = item.find((node) => node.type === "label");
    expect(input.props["aria-label"]).toBe("Select Title");
    expect(input.props["checked"]).toBe(true);
    const stopPropagation = vi.fn();
    call(label, "onClick", { stopPropagation });
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(onToggleSelection).not.toHaveBeenCalled();
    call(input, "onChange", { nativeEvent: plain });
    expect(onToggleSelection).toHaveBeenCalledExactlyOnceWith("Title", plain);
    for (const modifier of ["shiftKey", "ctrlKey", "metaKey"]) {
      const modifiers = { ...plain, [modifier]: true };
      call(input, "onChange", { nativeEvent: modifiers });
      expect(onToggleSelection).toHaveBeenLastCalledWith("Title", modifiers);
    }
    expect(onToggleSelection).toHaveBeenCalledTimes(4);
    const row = item.find((node) => node.props["role"] === "treeitem");
    call(row, "onDoubleClick", { target: { closest: () => null } });
    expect(startRename).not.toHaveBeenCalled();
    const space = { ...keyEvent(" "), target: {} };
    call(row, "onKeyDown", space);
    expect(space.preventDefault).not.toHaveBeenCalled();
  });
  it("keeps explicit group toggles separate from child selection", () => {
    setup();
    interact([
      (view) => call(modeButton(view), "onClick"),
      (view) => call(layerItem(view, "g"), "onToggleSelection", "g"),
      (view) => call(layerItem(view, "Shape"), "onToggleSelection", "Shape"),
      (view) => {
        expect(state().selectedGroupIds).toEqual(["g"]);
        expect(layerItem(view, "Title").props["selected"]).toBe(false);
        call(layerItem(view, "Title"), "onToggleSelection", "Title");
      },
      (view) => {
        expect(state().selectedGroupIds).toEqual([]);
        expect(state().selectedIds).toEqual(["Title", "Shape"]);
        call(layerItem(view, "Title"), "onToggleSelection", "Title");
      },
      (view) => {
        expect(state().selectedIds).toEqual(["Shape"]);
        call(layerItem(view, "Title"), "onSelect", plain, "Title");
      },
      (view) => {
        expect(state().selectedIds).toEqual(["Title", "Shape"]);
        call(layerItem(view, "g"), "onToggleSelection", "g");
      },
    ]);
    expect(state().selectedGroupIds).toEqual(["g"]);
    expect(state().selectedIds).toEqual(["Title", "Product", "Shape"]);
    expect(state().past).toHaveLength(0);
  });
  it("retains Ctrl/Cmd toggles and anchors the first Shift click to canvas selection rather than destination focus", () => {
    setup();
    state().selectMany(["Title"]);
    interact([
      (view) => call(layerItem(view, "Shape"), "onFocus"),
      (view) =>
        call(
          layerItem(view, "Shape"),
          "onSelect",
          { ...plain, shiftKey: true },
          "Shape",
        ),
      (view) => {
        expect(state().selectedIds).toEqual(["Title", "Product", "Shape"]);
        call(
          layerItem(view, "Product"),
          "onSelect",
          { ...plain, ctrlKey: true },
          "Product",
        );
      },
      (view) => {
        expect(state().selectedIds).toEqual(["Title", "Shape"]);
        call(
          layerItem(view, "Title"),
          "onSelect",
          { ...plain, metaKey: true },
          "Title",
        );
      },
    ]);
    expect(state().selectedIds).toEqual(["Shape"]);
    expect(state().past).toHaveLength(0);
  });
  it("preserves Shift precedence in selection mode and ignores an anchor hidden by collapse", () => {
    setup();
    interact([
      (view) => call(modeButton(view), "onClick"),
      (view) => call(layerItem(view, "Title"), "onSelect", plain, "Title"),
      (view) =>
        call(
          layerItem(view, "Shape"),
          "onSelect",
          { ...plain, shiftKey: true },
          "Shape",
        ),
      (view) => {
        expect(state().selectedIds).toEqual(["Title", "Product", "Shape"]);
        call(layerItem(view, "g"), "onToggle");
      },
      (view) =>
        call(
          layerItem(view, "g"),
          "onSelect",
          { ...plain, shiftKey: true },
          "g",
        ),
    ]);
    expect(state().selectedGroupIds).toEqual(["g"]);
    expect(state().selectedIds).toEqual(["Title", "Product", "Shape"]);
  });
  it("exits mode with Escape from a checkbox or mode button before clearing selection, and exits on Background", () => {
    setup();
    const focus = vi.fn(),
      callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return 1;
    });
    state().selectLayers(["Title"]);
    interact([
      (view) => call(modeButton(view), "onClick"),
      (view) => {
        (modeButton(view).props["ref"] as { current: unknown }).current = {
          focus,
        };
        call(
          view.find((node) => node.props["className"] === "layers-panel"),
          "onKeyDown",
          {
            ...keyEvent("Escape"),
            target: { type: "checkbox", closest: () => null },
          },
        );
      },
      (view) => {
        expect(modeButton(view).props["aria-pressed"]).toBe(false);
        expect(state().selectedIds).toEqual(["Title"]);
        call(
          layerItem(view, "Title"),
          "onKeyDown",
          keyEvent("Escape"),
          layerItem(view, "Title").props["row"],
        );
      },
      (view) => {
        expect(state().selectedIds).toEqual([]);
        call(modeButton(view), "onClick");
      },
      (view) =>
        call(
          view.find(
            (node) =>
              typeof node.props["className"] === "string" &&
              node.props["className"].startsWith("layer-row-background"),
          ),
          "onClick",
        ),
      (view) => {
        expect(modeButton(view).props["aria-pressed"]).toBe(false);
        expect(state().backgroundSelected).toBe(true);
      },
    ]);
    expect(focus).not.toHaveBeenCalled();
    expect(callbacks).toHaveLength(1);
    callbacks[0]!(0);
    expect(focus).toHaveBeenCalledOnce();
  });
  it("preserves group disclosure while replacing individual actions with noninteractive status in selection mode", () => {
    setup();
    state().updateLayers(["Title"], { visible: false, locked: true });
    state().selectLayers(["Shape"]);
    const result = interact([(view) => call(modeButton(view), "onClick")]);
    const row = layerItem(result, "g"),
      onSelect = vi.fn(),
      onToggle = vi.fn();
    const renderRow = row.type as (props: ElementProps) => ReactElement;
    const item = capture(() => renderRow({ ...row.props, onSelect, onToggle }));
    expect(item.html).toContain('role="img" aria-label="Partly hidden"');
    expect(item.html).toContain('role="img" aria-label="Partly locked"');
    expect(item.html).not.toContain('aria-label="Hide Product details');
    expect(item.html).not.toContain('aria-label="Lock Product details');
    expect(item.html).not.toContain('aria-label="Actions for');
    call(
      item.find(
        (node) => node.props["aria-label"] === "Collapse Product details",
      ),
      "onClick",
      { stopPropagation: vi.fn() },
    );
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
    expect(state().selectedIds).toEqual(["Shape"]);
  });

  it("renders compact accessible hierarchy and controls, with Background above the layer list and no footer without a selection", () => {
    setup();
    const html = renderToStaticMarkup(<LayersPanel />);
    expect(html).toContain('role="tree"');
    expect(html).toContain('aria-multiselectable="true"');
    expect(html).toContain('aria-level="2"');
    expect(html).toContain('aria-posinset="1"');
    expect(html).toContain('aria-setsize="2"');
    expect(html).toContain('aria-label="Hide Title"');
    expect(html).toContain('aria-label="Lock Product details"');
    expect(html).toContain('aria-label="Actions for Shape"');
    expect(html).toContain('aria-label="Drag Product"');
    expect(html).not.toContain('class="layers-footer"');
    expect(html).toContain("Background");
    expect(html.indexOf('class="layer-row-background')).toBeLessThan(
      html.indexOf('role="tree"'),
    );
    expect(html).not.toContain("Delete selected");
    expect(html).not.toContain("layer-toolbar");
  });
  it("shows real content thumbnails for text, shapes and groups", () => {
    setup();
    const html = renderToStaticMarkup(<LayersPanel />);
    expect(html).not.toContain(">Aa<");
    expect(html).not.toContain("is-icon");
    expect(html).not.toContain("is-text");
    expect(html).toContain("layer-thumb-page");
    expect((html.match(/canvas-text kind-title/g) ?? []).length).toBe(2);
    expect((html.match(/class="layer-thumb-leaf"/g) ?? []).length).toBe(2);
  });
  it("orders ordinary rows as drag, actual preview, name, visibility, lock and more with matching tooltips", () => {
    setup();
    const panel = capturePanel();
    const row = layerItem(panel, "Title");
    const renderRow = row.type as (props: ElementProps) => ReactElement;
    const item = capture(() => renderRow(row.props));
    const controls = [
      "Drag Title",
      "Hide Title",
      "Lock Title",
      "Actions for Title",
    ];
    for (const label of controls) {
      const control = item.find(
        (node) => node.type === "button" && node.props["aria-label"] === label,
      );
      expect(control.props["title"]).toBe(label);
    }
    const ordered = [
      'class="layer-drag ',
      'class="layer-thumb"',
      'class="layer-name ',
      'aria-label="Hide Title"',
      'aria-label="Lock Title"',
      'aria-label="Actions for Title"',
    ];
    ordered
      .slice(1)
      .forEach((part, i) =>
        expect(item.html.indexOf(ordered[i]!)).toBeLessThan(
          item.html.indexOf(part),
        ),
      );
    expect(item.html).not.toContain("layer-chevron-space");
    expect(item.html).not.toContain('class="layer-chevron"');
    expect(item.html).toContain('title="Title"');
    expect(
      item.find((node) => node.props["aria-label"] === "Hide Title").props[
        "aria-pressed"
      ],
    ).toBe(false);
    expect(
      item.find((node) => node.props["aria-label"] === "Lock Title").props[
        "aria-pressed"
      ],
    ).toBe(false);
  });
  it("keeps hidden and locked controls persistent for leaves and mixed groups, preserving disclosure semantics", () => {
    setup();
    state().updateLayers(["Title"], { visible: false, locked: true });
    const panel = capturePanel();
    for (const [id, labels] of [
      ["Title", ["Show Title", "Unlock Title"]],
      [
        "g",
        [
          "Hide Product details (partly hidden)",
          "Lock Product details (partly locked)",
        ],
      ],
    ] as const) {
      const row = layerItem(panel, id);
      const renderRow = row.type as (props: ElementProps) => ReactElement;
      const item = capture(() => renderRow(row.props));
      for (const label of labels) {
        const control = item.find(
          (node) => node.type === "button" && node.props["aria-label"] === label,
        );
        expect(control.props["className"]).toContain("persistent");
        expect(control.props["title"]).toBe(label);
        expect(control.props["aria-pressed"]).toBe(id === "g" ? "mixed" : true);
      }
      if (id === "g") {
        const disclosure = item.find(
          (node) => node.props["className"] === "layer-chevron",
        );
        expect(disclosure.props["title"]).toBe("Collapse Product details");
        expect(item.html).toContain('aria-expanded="true"');
        const collapsed = capture(() =>
          renderRow({ ...row.props, collapsed: true }),
        );
        expect(
          collapsed.find((node) => node.props["className"] === "layer-chevron")
            .props["title"],
        ).toBe("Expand Product details");
        expect(collapsed.html).toContain('aria-expanded="false"');
      }
    }
  });
  it.each([
    { width: 400, height: 100, scale: 0.09 },
    { width: 100, height: 400, scale: 0.05 },
  ])(
    "uniformly fits a sourced $width×$height image using its actual content",
    ({ width, height, scale }) => {
      setup();
      const doc = state().doc!;
      const image = doc.elements.find((element) => element.id === "Product")!;
      const src =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='red'/%3E%3C/svg%3E";
      Object.assign(image, { width, height, src });
      image.style.objectFit = "contain";
      delete image.groupId;
      doc.groups = [];
      doc.elements = [image];
      state().setDocument(doc);
      const html = renderToStaticMarkup(<LayersPanel />);
      expect(html).toContain(
        `width:${width}px;height:${height}px;transform:translate(-50%, -50%) scale(${scale})`,
      );
      expect(html).toContain(`src="${src.replaceAll("'", "&#x27;")}"`);
      expect(html).toContain('class="canvas-image"');
      expect(html).toContain("object-fit:contain");
      expect(html).not.toContain('class="layer-thumb is-guide"');
      expect((html.match(/<img /g) ?? []).length).toBe(1);
    },
  );

  it("swaps a thumbnail's backing when its content would blend into the document background", () => {
    setup();
    const doc = state().doc!;
    doc.background = { type: "solid", value: "#FFFFFF" };
    const title = doc.elements.find((el) => el.id === "Title")!;
    title.style = { ...title.style, color: "#FFFFFF" };
    state().setDocument(doc);
    const html = renderToStaticMarkup(<LayersPanel />);
    expect(html).toContain("background:#1c1c1c");
  });
  it("still composites both leaves in a group thumbnail when they are hidden", () => {
    setup();
    state().updateLayers(["Title", "Product"], { visible: false });
    const html = renderToStaticMarkup(<LayersPanel />);
    expect((html.match(/class="layer-thumb-leaf"/g) ?? []).length).toBe(2);
  });
  it("highlights a group independently from children and shows only applicable contextual toolbar", () => {
    setup();
    state().selectLayers(["g"]);
    let html = renderToStaticMarkup(<LayersPanel />);
    expect((html.match(/aria-selected="true"/g) ?? []).length).toBe(1);
    expect(html).toContain("Selected");
    expect(html).toContain("Product details</strong>");
    expect(html).toContain("Ungroup");
    expect(html).toContain("Properties");
    expect(html).toContain('class="layers-footer"');
    expect(html.indexOf('class="layers-footer"')).toBeGreaterThan(
      html.lastIndexOf('role="treeitem"'),
    );
    state().selectLayers(["Title"]);
    html = renderToStaticMarkup(<LayersPanel />);
    expect((html.match(/aria-selected="true"/g) ?? []).length).toBe(1);
    expect(html).toContain("Title</strong>");
    expect(html).toContain("Properties");
    expect(html).not.toContain(">Ungroup</button>");
    state().selectLayers(["Title", "Product"]);
    html = renderToStaticMarkup(<LayersPanel />);
    expect(html).toContain("2 layers</strong>");
    expect(html).toContain(">Group</button>");
  });
  it("exposes hidden, locked, mixed states and retains a header when embedded", () => {
    setup();
    state().updateLayers(["Title"], { visible: false, locked: true });
    const html = renderToStaticMarkup(<LayersPanel showHeader={false} />);
    expect(html).toContain('aria-label="Show Title"');
    expect(html).toContain('aria-label="Unlock Title"');
    expect(html).toContain('aria-pressed="mixed"');
    expect(html).toContain("Title, hidden, locked");
    expect(html).toContain("layers-compact-header");
    expect(html).toContain(">3</span>");
    const before = state().doc;
    renderToStaticMarkup(<LayersPanel />);
    expect(state().doc).toBe(before);
  });
  it("shows Properties for locked selections and Background, with only valid organizing actions", () => {
    setup();
    state().updateLayers(["g"], { locked: true });
    state().selectLayers(["g"]);
    let html = renderToStaticMarkup(<LayersPanel />);
    expect(html).toContain("Product details</strong>");
    expect(html).toContain("Properties");
    expect(html).not.toContain(">Ungroup</button>");
    state().selectBackground();
    html = renderToStaticMarkup(<LayersPanel />);
    expect(html).toContain("Background</strong>");
    expect(html).toContain("Properties");
    expect(html).not.toContain(">Group</button>");
    expect(html).not.toContain(">Ungroup</button>");
  });
  it("opens Style properties without altering leaf, group, multi or Background selection", () => {
    for (const selection of [["Title"], ["g"], ["Title", "Product"], []]) {
      setup();
      state().setPanel("layers");
      state().setStyleTab("layout");
      if (selection.length) state().selectLayers(selection);
      else state().selectBackground();
      const before = state(),
        { find } = capturePanel();
      const button = find(
        (node) => node.props["className"] === "layer-properties",
      );
      (button.props["onClick"] as (event: { detail: number }) => void)({
        detail: 1,
      });
      expect(state().panel).toBe("style");
      expect(state().styleTab).toBe("style");
      expect(state().selectedIds).toEqual(before.selectedIds);
      expect(state().selectedGroupIds).toEqual(before.selectedGroupIds);
      expect(state().backgroundSelected).toBe(before.backgroundSelected);
      expect(state().doc).toBe(before.doc);
    }
  });
  it("moves keyboard focus to the mounted Style tab after Properties activation", () => {
    setup();
    state().selectLayers(["Title"]);
    const focus = vi.fn(),
      querySelector = vi.fn(() => ({ focus })),
      callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return 1;
    });
    const { find } = capturePanel();
    const root = find((node) => node.props["className"] === "layers-panel");
    const ref = root.props["ref"] as { current: unknown };
    ref.current = { closest: () => ({ querySelector }) };
    const button = find(
      (node) => node.props["className"] === "layer-properties",
    );
    (button.props["onClick"] as (event: { detail: number }) => void)({
      detail: 0,
    });
    ref.current = null;
    expect(focus).not.toHaveBeenCalled();
    callbacks[0]!(0);
    expect(querySelector).toHaveBeenCalledWith(
      '.style-panel [role="tab"][aria-selected="true"]',
    );
    expect(focus).toHaveBeenCalledOnce();
  });
  it("requires a pointer inside a drop zone, while keyboard dragging retains nearest-zone navigation", () => {
    setup();
    const { find } = capturePanel(),
      context = find((node) => node.type === DndContext);
    const collision = context.props["collisionDetection"] as CollisionDetection;
    const rect = {
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
    };
    const before = { ...rect, bottom: 20, height: 20 };
    const after = { ...rect, top: 20, height: 20 };
    const args: Parameters<CollisionDetection>[0] = {
      active: {
        id: "Title",
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      collisionRect: rect,
      droppableRects: new Map([
        ["before", before],
        ["after", after],
      ]),
      droppableContainers: [before, after].map((bounds, index) => ({
        id: index ? "after" : "before",
        key: index ? "after" : "before",
        disabled: false,
        data: { current: {} },
        node: { current: null },
        rect: { current: bounds },
      })),
      pointerCoordinates: { x: 150, y: 100 },
    };
    expect(collision(args)).toEqual([]);
    expect(
      collision({ ...args, pointerCoordinates: { x: 20, y: 19 } })[0]?.id,
    ).toBe("before");
    expect(
      collision({ ...args, pointerCoordinates: { x: 20, y: 21 } })[0]?.id,
    ).toBe("after");
    expect(
      collision({ ...args, pointerCoordinates: { x: 20, y: 20 } }),
    ).not.toHaveLength(0);
    expect(collision({ ...args, pointerCoordinates: null })[0]?.id).toBe(
      "before",
    );
  });
  it("commits rename on blur without restoring row focus, and guards duplicate commits", () => {
    setup();
    vi.stubGlobal("requestAnimationFrame", vi.fn());
    const { find } = capturePanel(),
      row = find(
        (node) =>
          (node.props["row"] as { id?: string } | undefined)?.id === "Title",
      );
    const start = row.props["startRename"] as (id: string) => void,
      draft = row.props["setDraft"] as (value: string) => void,
      commit = row.props["commitRename"] as (restoreFocus: boolean) => void;
    start("Title");
    draft("Renamed");
    commit(false);
    commit(false);
    expect(state().doc!.elements[0]!.name).toBe("Renamed");
    expect(state().past).toHaveLength(1);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    start("Title");
    draft("Keyboard rename");
    commit(true);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
  });
  it("wires rename blur, Enter and Escape to their distinct focus behavior", () => {
    setup();
    const { find } = capturePanel(),
      row = find(
        (node) =>
          (node.props["row"] as { id?: string } | undefined)?.id === "Title",
      );
    const commitRename = vi.fn(),
      cancelRename = vi.fn();
    const renderRow = row.type as (props: ElementProps) => ReactElement;
    const item = capture(() =>
      renderRow({
        ...row.props,
        rename: { id: "Title", draft: "Title" },
        commitRename,
        cancelRename,
      }),
    );
    const input = item.find((node) => node.type === "input");
    (input.props["onBlur"] as () => void)();
    expect(commitRename).toHaveBeenLastCalledWith(false);
    const key = input.props["onKeyDown"] as (event: {
      key: string;
      preventDefault: () => void;
      stopPropagation: () => void;
    }) => void;
    key({ key: "Enter", preventDefault: vi.fn(), stopPropagation: vi.fn() });
    expect(commitRename).toHaveBeenLastCalledWith(true);
    key({ key: "Escape", preventDefault: vi.fn(), stopPropagation: vi.fn() });
    expect(cancelRename).toHaveBeenCalledOnce();
  });
});

describe("Layers contextual selection controls", () => {
  it("returns focus to Select when Escape exits mode from a row without clearing selection", () => {
    setup();
    state().selectLayers(["Title"]);
    const focus = vi.fn();
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return 1;
    });
    const result = interact([
      (view) => call(modeButton(view), "onClick"),
      (view) => {
        (modeButton(view).props["ref"] as { current: unknown }).current = {
          focus,
        };
        const row = layerItem(view, "Title");
        call(row, "onKeyDown", keyEvent("Escape"), row.props["row"]);
      },
    ]);
    expect(modeButton(result).props["aria-label"]).toBe("Select");
    expect(state().selectedIds).toEqual(["Title"]);
    expect(callbacks).toHaveLength(1);
    callbacks[0]!(0);
    expect(focus).toHaveBeenCalledOnce();
    expect(state().past).toHaveLength(0);
  });
  it("counts canonical selections, selects collapsed descendants and clears without changing canvas or history", () => {
    setup();
    const original = state().doc;
    const result = interact([
      (view) => call(layerItem(view, "g"), "onToggle"),
      (view) => call(modeButton(view), "onClick"),
      (view) => call(namedButton(view, "Select all"), "onClick"),
      (view) => {
        expect(state().selectedGroupIds).toEqual(["g"]);
        expect(state().selectedIds).toEqual(["Title", "Product", "Shape"]);
        expect(
          view.find((node) => node.props["role"] === "status").props[
            "children"
          ],
        ).toEqual([2, " selected"]);
        call(namedButton(view, "Clear"), "onClick");
      },
    ]);
    expect(result.html).toContain('data-selection-mode="true"');
    expect(result.html).toContain("0 selected");
    expect(result.html).not.toContain("layer-bulk-actions");
    expect(result.html).not.toContain('data-layer-id="Title"');
    expect(state().selectedIds).toEqual([]);
    expect(state().selectedGroupIds).toEqual([]);
    expect(state().doc).toBe(original);
    expect(state().past).toHaveLength(0);
  });

  it("uses the existing Shift range and Ctrl/Cmd toggles from native checkbox changes exactly once", () => {
    setup();
    const original = state().doc;
    interact([
      (view) => call(modeButton(view), "onClick"),
      (view) => checkboxChange(view, "Title"),
      (view) => {
        expect(state().selectedIds).toEqual(["Title"]);
        checkboxChange(view, "Shape", { ...plain, shiftKey: true });
      },
      (view) => {
        expect(state().selectedIds).toEqual(["Title", "Product", "Shape"]);
        checkboxChange(view, "Product", { ...plain, ctrlKey: true });
      },
      (view) => {
        expect(state().selectedIds).toEqual(["Title", "Shape"]);
        checkboxChange(view, "Title", { ...plain, metaKey: true });
      },
    ]);
    expect(state().selectedIds).toEqual(["Shape"]);
    expect(state().doc).toBe(original);
    expect(state().past).toHaveLength(0);
  });

  it.each([
    {
      action: "Hide",
      reverse: "Show",
      property: "visible" as const,
      initial: false,
      target: false,
    },
    {
      action: "Lock",
      reverse: "Unlock",
      property: "locked" as const,
      initial: true,
      target: true,
    },
  ])(
    "applies bulk $action to mixed group descendants as one reversible command",
    ({ action, reverse, property, initial, target }) => {
      setup();
      state().updateLayers(["Title"], { [property]: initial });
      state().selectLayers(["g"]);
      const original = structuredClone(state().doc!.elements);
      const past = state().past.length;
      const result = interact([
        (view) => call(modeButton(view), "onClick"),
        (view) =>
          call(namedButton(view, `${action} selected layers`), "onClick"),
      ]);
      const changed = structuredClone(state().doc!.elements);
      expect(
        changed.slice(0, 2).every((element) => element[property] === target),
      ).toBe(true);
      expect(changed[2]).toEqual(original[2]);
      expect(changed.map(({ id }) => id)).toEqual(original.map(({ id }) => id));
      expect(state().past).toHaveLength(past + 1);
      state().undo();
      expect(state().doc!.elements).toEqual(original);
      state().redo();
      expect(state().doc!.elements).toEqual(changed);
      call(namedButton(result, `${reverse} selected layers`), "onClick");
      expect(
        state()
          .doc!.elements.slice(0, 2)
          .every((element) => element[property] === !target),
      ).toBe(true);
    },
  );

  it("groups compatible selected leaves with one undo step and preserves element identity", () => {
    setup();
    state().selectLayers(["Title", "Product"]);
    const original = structuredClone(state().doc!);
    const result = interact([
      (view) => call(modeButton(view), "onClick"),
      (view) => {
        expect(
          namedButton(view, "Group selected layers").props["disabled"],
        ).toBe(false);
        call(namedButton(view, "Group selected layers"), "onClick");
      },
    ]);
    const grouped = structuredClone(state().doc!);
    expect(grouped.groups).toHaveLength((original.groups?.length ?? 0) + 1);
    expect(grouped.elements.map(({ id }) => id)).toEqual(
      original.elements.map(({ id }) => id),
    );
    expect(state().past).toHaveLength(1);
    expect(result.html).not.toContain("Properties");
    state().undo();
    expect(state().doc!.elements).toEqual(original.elements);
    expect(state().doc!.groups).toEqual(original.groups);
    state().redo();
    expect(state().doc!.elements).toEqual(grouped.elements);
    expect(state().doc!.groups).toEqual(grouped.groups);
  });

  it("deletes only eligible selected leaves as one reversible command", () => {
    setup();
    state().selectLayers(["Title"]);
    const original = structuredClone(state().doc!.elements);
    interact([
      (view) => call(modeButton(view), "onClick"),
      (view) => call(namedButton(view, "Delete selected layers"), "onClick"),
    ]);
    const deleted = structuredClone(state().doc!.elements);
    expect(deleted.map(({ id }) => id)).toEqual(["Product", "Shape"]);
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(state().doc!.elements).toEqual(original);
    state().redo();
    expect(state().doc!.elements).toEqual(deleted);
  });

  it.each(["Delete", "Backspace"])(
    "guards locked bulk selection from %s and disabled Delete, including locked group descendants",
    (key) => {
      setup();
      state().updateLayers(["Title"], { locked: true });
      state().selectLayers(["g", "Shape"]);
      const original = state().doc;
      const past = state().past.length;
      const result = interact([(view) => call(modeButton(view), "onClick")]);
      const deletion = namedButton(result, "Delete selected layers");
      expect(deletion.props["disabled"]).toBe(true);
      expect(deletion.props["title"]).toBe(
        "Unlock selected layers before deleting",
      );
      expect(
        namedButton(result, "Group selected layers").props["disabled"],
      ).toBe(true);
      call(deletion, "onClick");
      const event = { ...keyEvent(key), target: { closest: () => null } };
      call(
        result.find((node) => node.props["className"] === "layers-panel"),
        "onKeyDownCapture",
        event,
      );
      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(event.stopPropagation).toHaveBeenCalledOnce();
      call(
        layerItem(result, "Shape"),
        "onKeyDown",
        keyEvent(key),
        layerItem(result, "Shape").props["row"],
      );
      expect(state().doc).toBe(original);
      expect(state().past).toHaveLength(past);
    },
  );

  it("captures eligible mode deletion once and leaves input editing and normal mode row deletion unchanged", () => {
    setup();
    state().selectLayers(["Title"]);
    const result = interact([(view) => call(modeButton(view), "onClick")]);
    const panel = result.find(
      (node) => node.props["className"] === "layers-panel",
    );
    const editable = {
      ...keyEvent("Backspace"),
      target: { closest: () => ({}) },
    };
    call(panel, "onKeyDownCapture", editable);
    expect(editable.preventDefault).not.toHaveBeenCalled();
    expect(state().past).toHaveLength(0);
    const deletion = { ...keyEvent("Delete"), target: { closest: () => null } };
    call(panel, "onKeyDownCapture", deletion);
    expect(state().doc!.elements.map(({ id }) => id)).toEqual([
      "Product",
      "Shape",
    ]);
    expect(state().past).toHaveLength(1);
    setup();
    state().selectLayers(["Title"]);
    const normal = capturePanel();
    const ordinary = { ...keyEvent("Delete"), target: { closest: () => null } };
    call(
      normal.find((node) => node.props["className"] === "layers-panel"),
      "onKeyDownCapture",
      ordinary,
    );
    expect(ordinary.preventDefault).not.toHaveBeenCalled();
    call(
      layerItem(normal, "Title"),
      "onKeyDown",
      keyEvent("Delete"),
      layerItem(normal, "Title").props["row"],
    );
    expect(state().doc!.elements.map(({ id }) => id)).toEqual([
      "Product",
      "Shape",
    ]);
    expect(state().past).toHaveLength(1);
  });
});
