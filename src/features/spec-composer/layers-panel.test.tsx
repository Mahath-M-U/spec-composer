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
  view.find((node) => node.type === "button" && !!node.props["aria-controls"]);
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
        expect(modeButton(view).props["children"]).toBe("Select multiple");
        call(modeButton(view), "onClick");
      },
      (view) => {
        expect(modeButton(view).props["aria-pressed"]).toBe(true);
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
    expect(result.html).toContain("Select multiple");
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
    call(input, "onChange");
    expect(onToggleSelection).toHaveBeenCalledExactlyOnceWith("Title");
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
  it("keeps eye, lock and group expansion independent from selection mode", () => {
    setup();
    state().selectLayers(["Shape"]);
    const result = interact([(view) => call(modeButton(view), "onClick")]);
    const row = layerItem(result, "g"),
      onSelect = vi.fn(),
      onToggle = vi.fn();
    const renderRow = row.type as (props: ElementProps) => ReactElement;
    const item = capture(() => renderRow({ ...row.props, onSelect, onToggle }));
    call(
      item.find((node) => node.props["aria-label"] === "Hide Product details"),
      "onClick",
    );
    call(
      item.find((node) => node.props["aria-label"] === "Lock Product details"),
      "onClick",
    );
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
