import {
  createElement as reactElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DockNumberField, StylePanel } from "./Editor";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import { createElement } from "./registry";
import { compileVisualPrompt } from "./compiler";
import { SceneLightingControls } from "./scene-lighting-controls";
import type { ElementKind } from "./types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TextColorControl } from "./text-color-control";
import { OpaqueColorControl } from "./color-control";
import { COMPOSE_LAYOUTS } from "./compose-layouts";
import { SegmentedTab, SegmentedTabs } from "./segmented-tabs";
import { createSceneCamera, createSceneLight } from "./scene-objects";

vi.mock("./store", async (importOriginal) => {
  const original = await importOriginal<typeof import("./store")>();
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
function inspect(tree: ReactNode) {
  const visit = (node: ReactNode): ReactElement<Props>[] =>
    Array.isArray(node)
      ? node.flatMap(visit)
      : isValidElement<Props>(node)
        ? [node, ...visit(node.props.children)]
        : [];
  const nodes = visit(tree);
  return {
    find: (predicate: (node: ReactElement<Props>) => boolean) => {
      const node = nodes.find(predicate);
      expect(node).toBeDefined();
      return node!;
    },
    nodes,
  };
}
type View = ReturnType<typeof inspect>;
const call = (node: ReactElement<Props>, handler: string, ...args: unknown[]) =>
  (node.props[handler] as (...values: unknown[]) => void)(...args);
function capture(
  render: () => ReactElement | null,
  actions: Array<(view: View) => void> = [],
) {
  let view: View;
  function Capture() {
    const [step, setStep] = useState(0);
    const tree = render();
    view = inspect(tree);
    if (step < actions.length) {
      actions[step]!(view);
      setStep(step + 1);
    }
    return tree;
  }
  const html = renderToStaticMarkup(
    reactElement(TooltipProvider, null, reactElement(Capture)),
  );
  return { html, ...view! };
}
const state = () => useEditorStore.getState();
const doc = () => state().doc!;
function setup(kinds: ElementKind[] = ["productImage"]) {
  const document = createDocument();
  document.elements = kinds.map((kind, i) => ({
    ...createElement(kind, document.format, i),
    id: String(i),
    name: `${kind} ${i}`,
    x: 10 + i * 100,
    y: 20,
    width: 50,
    height: 50,
  }));
  useEditorStore.setState({
    doc: document,
    selectedIds: document.elements.map((el) => el.id),
    selectedGroupIds: [],
    backgroundSelected: false,
    styleTab: "style",
    past: [],
    future: [],
    composeOrigin: undefined,
  });
}
const input = (view: View, label: string) =>
  view.find(
    (node) => node.type === "input" && node.props["aria-label"] === label,
  );
const button = (view: View, label: string) =>
  view.find(
    (node) =>
      node.type === "button" &&
      (node.props["aria-label"] === label || node.props.children === label),
  );
const material = (view: View) =>
  view.find(
    (node) =>
      node.type === "textarea" &&
      node.props["aria-labelledby"] === "style-panel-material-title",
  );
const keyEvent = (key: string, extra = {}) => ({
  key,
  shiftKey: false,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  currentTarget: { blur: vi.fn(), value: "" },
  ...extra,
});
beforeEach(() => {
  vi.useFakeTimers();
  setup();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("Style inspector contextual rendering", () => {
  it("keeps selection identity and linked tabs without global scene settings", () => {
    const { html } = capture(StylePanel);
    expect(html).toContain("Design Inspector");
    expect(html).toContain("1 selected");
    expect(html).toContain("productImage 0");
    expect(html).toContain("product Image");
    expect(html).toContain('aria-controls="inspector-style"');
    expect(html).toContain('aria-labelledby="inspector-tab-style"');
    expect(html).toContain(
      'id="inspector-layout" role="tabpanel" aria-labelledby="inspector-tab-layout" hidden=""',
    );
    expect(html).toContain(
      'id="inspector-style" role="tabpanel" aria-labelledby="inspector-tab-style" class="inspector-sections"',
    );
    expect(html).not.toContain('class="scene-lighting-controls"');
    expect(html).not.toContain("Scene &amp; Lighting");
    expect(html).not.toContain("Camera angle");
    expect(html).not.toContain("Studio lighting");
    expect(html.indexOf("Transform")).toBeLessThan(html.indexOf("Appearance"));
    expect(html.indexOf("Appearance")).toBeLessThan(
      html.indexOf("Material &amp; Texture"),
    );
  });
  it("shows Layout Presets when nothing is selected and preserves background gradient editing", () => {
    useEditorStore.setState({ selectedIds: [] });
    let html = capture(StylePanel).html;
    expect(html).toContain("Nothing selected");
    expect(html).toContain(
      'id="inspector-layout" role="tabpanel" aria-labelledby="inspector-tab-layout">',
    );
    expect(html).toContain('class="inspector-sections" hidden=""');
    expect(html).toContain("Layout Presets");
    expect(html).not.toContain('aria-label="Width"');
    useEditorStore.setState({ backgroundSelected: true });
    doc().background = {
      type: "gradient",
      value: "#ffffff",
      secondaryValue: "#000000",
      angle: 12.5,
    };
    html = capture(StylePanel).html;
    expect(html).toContain("Gradient angle");
    expect(html).toContain('value="12.5"');
    expect(html).not.toContain("Material &amp; Texture");
  });
  it("shows compatible controls and honest Mixed values for homogeneous selections", () => {
    setup(["title", "body"]);
    doc().elements[0]!.style = {
      fontSize: 12.125,
      color: "#ffffff",
      background: "#ffffff",
    };
    doc().elements[1]!.style = { fontSize: 30, color: "#000000" };
    const { html } = capture(StylePanel);
    expect(html).toContain("2 selected");
    expect(html).toContain("Selection bounds");
    expect(html).toContain("Mixed");
    expect(html).toContain('aria-label="Font size"');
    expect(html).toContain('aria-label="Text alignment"');
    expect(html).toContain('aria-label="Line height"');
    expect(html).toContain('data-kind="mixed"');
    expect(html).not.toContain("Image fit");
    expect(html).not.toContain("Element details");
    expect(html).not.toContain('aria-label="Content"');
  });
  it("hides incompatible controls for heterogeneous selections and unsupported focal points", () => {
    setup(["shape", "title", "humanModelImage"]);
    let html = capture(StylePanel).html;
    expect(html).not.toContain("Appearance");
    expect(html).not.toContain("Font size");
    expect(html).not.toContain("Image fit");
    expect(html).not.toContain("Border width");
    setup(["productImage", "heroImage"]);
    delete doc().elements[0]!.style.objectFit;
    delete doc().elements[1]!.style.objectFit;
    doc().elements[0]!.src = "data:image/png;base64,test";
    html = capture(StylePanel).html;
    expect(html).toContain('<option value="" selected="">Mixed</option>');
    expect(html).not.toContain("Focal point X");
    doc().elements[1]!.src = "data:image/png;base64,test";
    html = capture(StylePanel).html;
    expect(html).toContain("Focal point X");
    expect(html).not.toContain("Font size");
  });
  it("preserves shape type, semantic role, template and supported radius workflow", () => {
    setup(["shape"]);
    Object.assign(doc().elements[0]!, {
      semanticRole: "product",
      style: { shapeType: "rounded rectangle", borderRadius: 10 },
    });
    const { html } = capture(StylePanel);
    expect(html).toContain("Border width");
    expect(html).toContain("Corner radius");
    expect(html).toContain(
      '<option value="product" selected="">Product</option>',
    );
    expect(html).toContain("Description");
    expect(html).not.toContain("Image fit");
  });
  it("disables geometry for hidden/locked selections and marks shared editable count", () => {
    setup(["title", "body"]);
    doc().elements[1]!.locked = true;
    const view = capture(StylePanel);
    expect(view.html).toContain("1 of 2 editable");
    expect(
      view.find(
        (node) =>
          node.type === DockNumberField && node.props["label"] === "Width",
      ).props["disabled"],
    ).toBe(true);
    doc().elements[0]!.locked = true;
    expect(capture(StylePanel).html).toMatch(/aria-label="Font" disabled=""/);
  });
});

describe("Layout Presets inspector", () => {
  const cards = (html: string) =>
    html.match(
      /<button\b[^>]*class="compose-item\b[^"]*"[^>]*>[\s\S]*?<\/button>/g,
    ) ?? [];
  const renderLayout = () => {
    useEditorStore.setState({ styleTab: "layout" });
    return capture(StylePanel).html;
  };

  it("keeps every preset and category in order, with actual zero, one and multiple selection scope", () => {
    setup(["heroImage", "title", "body"]);
    for (const selectedIds of [[], ["0"], ["0", "1", "2"]]) {
      useEditorStore.setState({ selectedIds });
      const html = renderLayout();
      expect(html).toContain(
        selectedIds.length
          ? `Applies to ${selectedIds.length} selected`
          : "Applies to all visible layers",
      );
      const items = cards(html);
      expect(items).toHaveLength(COMPOSE_LAYOUTS.length + 1);
      expect(items[0]).toContain('class="compose-item compose-original"');
      expect(items[0]).toContain('aria-label="Original"');
      COMPOSE_LAYOUTS.forEach((layout, i) => {
        expect(items[i + 1]).toContain(`aria-label="${layout.label}"`);
        expect(items[i + 1]).toContain(`title="${layout.hint}`);
      });
      const categories = ["Split", "Overlay", "Centered", "Editorial"];
      categories
        .slice(1)
        .forEach((category, i) =>
          expect(html.indexOf(`>${categories[i]}</h4>`)).toBeLessThan(
            html.indexOf(`>${category}</h4>`),
          ),
        );
      expect(html.indexOf("compose-original")).toBeLessThan(
        html.indexOf("compose-group"),
      );
      expect(html.indexOf("Tidy up spacing")).toBeGreaterThan(
        html.indexOf(">Editorial</h4>"),
      );
    }
  });

  it("explains unavailable actions while keeping their full hints and illustrative thumbnails", () => {
    setup(["title", "body"]);
    let items = cards(renderLayout());
    expect(items[0]).toContain('disabled=""');
    expect(items[0]).toContain(
      "Apply a layout first to save the original positions",
    );
    for (const [i, layout] of COMPOSE_LAYOUTS.entries()) {
      expect(items[i + 1]!.includes('disabled=""')).toBe(!!layout.requires);
      expect(items[i + 1]).toContain('viewBox="0 0 100 100"');
    }
    expect(items[1]).toContain("Add an image to use this layout");
    expect(items[8]).toContain("Needs 2+ images");
    setup(["heroImage", "productImage", "title"]);
    items = cards(renderLayout());
    expect(items.slice(1).every((item) => !item.includes('disabled=""'))).toBe(
      true,
    );
  });

  it("derives a single active preset from canvas geometry through compose, undo, redo and Original", () => {
    setup(["heroImage", "title", "body"]);
    useEditorStore.setState({ selectedIds: [] });
    const original = structuredClone(doc().elements);
    state().compose("copy-right");
    const composed = structuredClone(doc().elements);
    let html = renderLayout();
    expect(
      cards(html).filter((item) => item.includes('aria-pressed="true"')),
    ).toHaveLength(1);
    expect(
      cards(html).find((item) => item.includes('aria-label="Copy right"')),
    ).toContain('aria-pressed="true"');
    expect(cards(html)[0]).not.toContain('disabled=""');
    expect(html).not.toContain("compose-selected");
    state().undo();
    expect(doc().elements).toEqual(original);
    expect(
      cards(renderLayout()).filter((item) =>
        item.includes('aria-pressed="true"'),
      ).length,
    ).toBeLessThanOrEqual(1);
    state().redo();
    expect(doc().elements).toEqual(composed);
    html = renderLayout();
    expect(
      cards(html).find((item) => item.includes('aria-label="Copy right"')),
    ).toContain('aria-pressed="true"');
    state().resetCompose();
    expect(doc().elements).toEqual(original);
    expect(
      cards(renderLayout()).filter((item) =>
        item.includes('aria-pressed="true"'),
      ).length,
    ).toBeLessThanOrEqual(1);
  });
});

describe("inspector field and selection interactions", () => {
  const borderColor = (view: View) =>
    view.find(
      (node) =>
        node.type === OpaqueColorControl &&
        node.props["label"] === "Border color",
    );
  it("removes border width and color in one undo transaction, preserves unrelated values and skips repeated removal", () => {
    setup(["shape"]);
    Object.assign(doc().elements[0]!, {
      rotation: 12.375,
      style: {
        shapeType: "triangle",
        background: "#abcdef",
        borderWidth: 4,
        borderColor: "#112233",
        borderRadius: 12,
        opacity: 0.35,
      },
    });
    const original = structuredClone(doc().elements);
    call(borderColor(capture(StylePanel)), "onRemove");
    const expected = {
      ...original[0]!,
      style: { ...original[0]!.style, borderWidth: 0 },
    };
    delete expected.style.borderColor;
    expect(doc().elements[0]).toEqual(expected);
    expect(state().past).toHaveLength(1);
    const cleared = capture(StylePanel);
    expect(cleared.html).toContain("Border color: None");
    expect(borderColor(cleared).props["removalLabel"]).toBe("Remove border");
    call(borderColor(cleared), "onRemove");
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().elements).toEqual(original);
    state().redo();
    expect(doc().elements[0]).toEqual(expected);
  });
  it("removes only editable compatible borders in mixed selections and preserves locked members", () => {
    setup(["shape", "divider", "shape"]);
    Object.assign(doc().elements[0]!.style, {
      borderWidth: 2,
      borderColor: "#123456",
      opacity: 0.4,
    });
    Object.assign(doc().elements[1]!.style, {
      borderWidth: 6,
      borderColor: "#abcdef",
    });
    doc().elements[1]!.locked = true;
    delete doc().elements[2]!.style.borderWidth;
    delete doc().elements[2]!.style.borderColor;
    const original = structuredClone(doc().elements);
    call(borderColor(capture(StylePanel)), "onRemove");
    expect(doc().elements[0]!.style).toMatchObject({
      borderWidth: 0,
      opacity: 0.4,
    });
    expect(doc().elements[0]!.style.borderColor).toBeUndefined();
    expect(doc().elements[1]).toEqual(original[1]);
    expect(doc().elements[2]).toEqual(original[2]);
    expect(state().past).toHaveLength(1);
    expect(capture(StylePanel).html).toContain("Border color: Mixed");
    call(borderColor(capture(StylePanel)), "onRemove");
    expect(state().past).toHaveLength(1);
  });
  it("rejects stale border removal and incompatible current layers without adding no-op history", () => {
    setup(["shape", "shape"]);
    doc().elements.forEach((el) => {
      el.style.borderWidth = 5;
      el.style.borderColor = "#123456";
    });
    const old = borderColor(capture(StylePanel));
    const original = structuredClone(doc().elements);
    useEditorStore.setState({ selectedIds: ["1"] });
    call(old, "onRemove");
    expect(doc().elements).toEqual(original);
    expect(state().past).toHaveLength(0);
    const current = borderColor(capture(StylePanel));
    doc().elements[1]!.kind = "title";
    call(current, "onRemove");
    expect(doc().elements[1]!.style.borderWidth).toBe(5);
    expect(state().past).toHaveLength(0);
    setup(["shape"]);
    delete doc().elements[0]!.style.borderWidth;
    delete doc().elements[0]!.style.borderColor;
    call(borderColor(capture(StylePanel)), "onRemove");
    expect(state().past).toHaveLength(0);
    expect(doc().elements[0]!.style.borderWidth).toBeUndefined();
  });

  const textColor = (view: View, property = "color") =>
    view.find(
      (node) =>
        node.type === TextColorControl && node.props["property"] === property,
    );
  it("applies inline text color intents immediately, preserves per-layer alpha/RGB and removes background only", () => {
    setup(["title", "body"]);
    doc().elements[0]!.style = {
      color: "#ff000080",
      background: "#11223340",
      opacity: 0.375,
      fontSize: 32,
    };
    doc().elements[1]!.style = {
      color: "#00ff0040",
      background: "transparent",
      opacity: 0.8,
      fontSize: 16,
    };
    const original = structuredClone(doc().elements);
    let view = capture(StylePanel);
    expect(view.html).not.toContain('type="color"');
    call(textColor(view), "onChange", {
      type: "rgb",
      color: { r: 20, g: 40, b: 60 },
    });
    expect(doc().elements.map((el) => el.style.color)).toEqual([
      "#14283c80",
      "#14283c40",
    ]);
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().elements).toEqual(original);
    state().redo();
    useEditorStore.setState({ selectedIds: ["0", "1"] });
    view = capture(StylePanel);
    call(textColor(view), "onChange", { type: "alpha", alpha: 0.25 });
    expect(doc().elements.map((el) => el.style.color)).toEqual([
      "#14283c40",
      "#14283c40",
    ]);
    call(textColor(capture(StylePanel), "background"), "onChange", {
      type: "remove",
    });
    expect(doc().elements.every((el) => !("background" in el.style))).toBe(true);
    expect(doc().elements.map((el) => el.style.opacity)).toEqual([0.375, 0.8]);
    expect(
      doc().elements.map((el) => [
        el.x,
        el.y,
        el.width,
        el.height,
        el.style.fontSize,
      ]),
    ).toEqual(
      original.map((el) => [el.x, el.y, el.width, el.height, el.style.fontSize]),
    );
  });
  it("uses shared opaque shape colors and hides text controls for heterogeneous selections", () => {
    setup(["shape"]);
    const shape = capture(StylePanel);
    expect(shape.html).not.toContain('type="color"');
    expect(shape.nodes.filter((node) => node.type === OpaqueColorControl)).toHaveLength(2);
    expect(shape.nodes.some((node) => node.type === TextColorControl)).toBe(
      false,
    );
    setup(["title", "shape"]);
    expect(
      capture(StylePanel).nodes.some((node) => node.type === TextColorControl),
    ).toBe(false);
  });
  it("uses actual mixed shape colors and preserves other style/geometry fields on a fill edit", () => {
    setup(["shape", "shape"]);
    doc().elements[0]!.style = { background: "#fff", borderColor: "#112233", borderWidth: 3, opacity: 0.35 };
    doc().elements[1]!.style = { borderColor: "#112233", borderWidth: 5, opacity: 0.8 };
    const original = structuredClone(doc().elements);
    const view = capture(StylePanel);
    expect(view.html).toContain("Fill: Mixed");
    const fill = view.find((node) => node.type === OpaqueColorControl && node.props["label"] === "Fill");
    call(fill, "onChange", "#445566");
    expect(doc().elements.map((el) => el.style.background)).toEqual(["#445566", "#445566"]);
    doc().elements.forEach((el, i) => expect(el).toEqual({ ...original[i], style: { ...original[i]!.style, background: "#445566" } }));
    expect(state().past).toHaveLength(1);
  });
  it("edits each canvas gradient stop through the shared picker without changing fill type or angle", () => {
    useEditorStore.setState({ selectedIds: [], backgroundSelected: true });
    doc().background = { type: "gradient", value: "#112233", secondaryValue: "#abcdef", angle: 42 };
    const view = capture(StylePanel);
    const stop = (label: string) => view.find((node) => node.type === OpaqueColorControl && node.props["label"] === label);
    call(stop("From"), "onChange", "#445566");
    call(stop("To"), "onChange", "#778899");
    expect(doc().background).toEqual({ type: "gradient", value: "#445566", secondaryValue: "#778899", angle: 42 });
    expect(view.html).not.toContain('type="color"');
  });
  it("preserves locked text, rejects stale selection handlers, and applies partial edits against current member values", () => {
    setup(["title", "body"]);
    doc().elements[0]!.style.color = "#ff000080";
    doc().elements[1]!.style.color = "#00ff0040";
    doc().elements[1]!.locked = true;
    const picker = textColor(capture(StylePanel));
    call(picker, "onChange", { type: "color", value: "#12345680" });
    expect(doc().elements[0]!.style.color).toBe("#12345680");
    expect(doc().elements[1]!.style.color).toBe("#00ff0040");
    state().mutate((next) => {
      next.elements[0]!.style.color = "#aabbcc80";
    });
    call(picker, "onChange", { type: "alpha", alpha: 0.25 });
    expect(doc().elements[0]!.style.color).toBe("#aabbcc40");
    const past = state().past.length;
    call(picker, "onChange", { type: "alpha", alpha: 0.25 });
    expect(state().past).toHaveLength(past);
    useEditorStore.setState({ selectedIds: ["1"] });
    call(picker, "onChange", { type: "color", value: "#ffffff" });
    expect(state().past).toHaveLength(past);
  });
  it("groups a continuous color gesture into one undo step without consuming the initial snapshot on a no-op", () => {
    setup(["title"]);
    doc().elements[0]!.style.color = "#000000";
    const original = structuredClone(doc().elements);
    capture(StylePanel, [
      (view) => call(textColor(view), "onGestureStart"),
      (view) =>
        call(
          textColor(view),
          "onChange",
          { type: "rgb", color: { r: 0, g: 0, b: 0 } },
          true,
        ),
      (view) => {
        expect(state().past).toHaveLength(0);
        for (let r = 1; r <= 40; r++)
          call(
            textColor(view),
            "onChange",
            { type: "rgb", color: { r, g: 0, b: 0 } },
            true,
          );
      },
      (view) => call(textColor(view), "onGestureEnd"),
      (view) =>
        call(
          textColor(view),
          "onChange",
          { type: "rgb", color: { r: 99, g: 0, b: 0 } },
          true,
        ),
    ]);
    expect(state().past).toHaveLength(1);
    expect(doc().elements[0]!.style.color).toBe("#280000");
    state().undo();
    expect(doc().elements).toEqual(original);
    state().redo();
    expect(doc().elements[0]!.style.color).toBe("#280000");
    useEditorStore.setState({ selectedIds: ["0"] });
    capture(StylePanel, [
      (view) => call(textColor(view), "onGestureStart"),
      (view) =>
        call(textColor(view), "onChange", { type: "alpha", alpha: 0.5 }, true),
      (view) => call(textColor(view), "onGestureEnd"),
    ]);
    expect(state().past).toHaveLength(2);
  });
  it.each(["external", "undo", "selection"])(
    "invalidates trailing gesture writes after %s changes",
    (mode) => {
      setup(["title", "body"]);
      doc().elements.forEach((el) => {
        el.style.color = "#000000";
      });
      let saved: ReactElement<Props>;
      capture(StylePanel, [
        (view) => {
          saved = textColor(view);
          call(saved, "onGestureStart");
        },
        (view) =>
          call(textColor(view), "onChange", { type: "alpha", alpha: 0.5 }, true),
        () => {
          if (mode === "external")
            state().mutate((next) => {
              next.creativeDirection.notes = "Unrelated edit";
            });
          else if (mode === "undo") {
            state().undo();
            useEditorStore.setState({ selectedIds: ["0", "1"] });
          } else useEditorStore.setState({ selectedIds: ["0"] });
        },
        () => {
          const before = structuredClone(doc());
          const past = state().past.length;
          call(saved!, "onChange", { type: "alpha", alpha: 0.2 }, true);
          expect(doc()).toEqual(before);
          expect(state().past).toHaveLength(past);
        },
      ]);
    },
  );
  it("formats only Transform position and size fields to exactly two decimals", () => {
    setup(["shape"]);
    Object.assign(doc().elements[0]!, {
      x: 12.125,
      y: -3.4567,
      width: 50,
      height: 80.12345,
      rotation: 15.125,
    });
    const view = capture(StylePanel);
    for (const [label, value] of [
      ["X position", "12.13"],
      ["Y position", "-3.46"],
      ["Width", "50.00"],
      ["Height", "80.12"],
    ]) {
      const field = view.find(
        (node) => node.type === DockNumberField && node.props["label"] === label,
      );
      expect(field.props["displayDecimals"]).toBe(2);
      const rendered = capture(() =>
        DockNumberField(field.props as Parameters<typeof DockNumberField>[0]),
      );
      expect(input(rendered, label!).props["value"]).toBe(value);
    }
    const rotation = view.find(
      (node) => node.type === DockNumberField && node.props["label"] === "Rotation",
    );
    expect(rotation.props["displayDecimals"]).toBeUndefined();
    expect(doc().elements[0]!.x).toBe(12.125);
    expect(state().past).toHaveLength(0);
  });
  it("preserves precise Transform values on untouched blur, typed commits and nudges", () => {
    setup(["shape"]);
    doc().elements[0]!.x = 12.125;
    const render = () => {
      const field = inspect(StylePanel()).find(
        (node) =>
          node.type === DockNumberField && node.props["label"] === "X position",
      );
      return DockNumberField(
        field.props as Parameters<typeof DockNumberField>[0],
      );
    };
    capture(render, [
      (view) => {
        expect(input(view, "X position").props["value"]).toBe("12.13");
        call(input(view, "X position"), "onBlur", {
          target: { value: "12.13" },
        });
      },
    ]);
    expect(doc().elements[0]!.x).toBe(12.125);
    expect(state().past).toHaveLength(0);
    capture(render, [
      (view) =>
        call(input(view, "X position"), "onChange", {
          target: { value: "16.123456" },
        }),
      (view) => {
        expect(input(view, "X position").props["value"]).toBe("16.123456");
        call(input(view, "X position"), "onKeyDown", keyEvent("Enter"));
      },
    ]);
    expect(doc().elements[0]!.x).toBe(16.123456);
    expect(state().past).toHaveLength(1);
    call(
      input(capture(render), "X position"),
      "onKeyDown",
      keyEvent("ArrowUp"),
    );
    expect(doc().elements[0]!.x).toBe(17.123456);
    expect(state().past).toHaveLength(2);
  });
  it("retains decimal precision, commits on Enter/blur, and ignores empty/invalid drafts", () => {
    const change = vi.fn();
    const render = () =>
      DockNumberField({
        prefix: "W",
        label: "Width",
        value: 12.125,
        min: 1,
        onChange: change,
      });
    expect(capture(render).html).toContain('value="12.125"');
    for (const value of ["", "nope", "-1"])
      capture(render, [
        (view) => call(input(view, "Width"), "onChange", { target: { value } }),
        (view) => call(input(view, "Width"), "onBlur", { target: { value } }),
      ]);
    expect(change).not.toHaveBeenCalled();
    capture(render, [
      (view) =>
        call(input(view, "Width"), "onChange", { target: { value: "13.375" } }),
      (view) => call(input(view, "Width"), "onKeyDown", keyEvent("Enter")),
    ]);
    expect(change).toHaveBeenLastCalledWith(13.375);
    capture(render, [
      (view) =>
        call(input(view, "Width"), "onChange", { target: { value: "16.625" } }),
      (view) =>
        call(input(view, "Width"), "onBlur", { target: { value: "16.625" } }),
    ]);
    expect(change).toHaveBeenLastCalledWith(16.625);
  });
  it("cancels on Escape, nudges with arrows/Shift and does not invent a mixed starting value", () => {
    const change = vi.fn();
    const render = () =>
      DockNumberField({
        prefix: "X",
        label: "Position",
        value: 12.125,
        onChange: change,
      });
    const escape = keyEvent("Escape");
    capture(render, [
      (view) =>
        call(input(view, "Position"), "onChange", { target: { value: "99" } }),
      (view) => call(input(view, "Position"), "onKeyDown", escape),
    ]);
    expect(change).not.toHaveBeenCalled();
    expect(escape.stopPropagation).toHaveBeenCalled();
    call(
      input(capture(render), "Position"),
      "onKeyDown",
      keyEvent("ArrowUp", { shiftKey: true }),
    );
    expect(change).toHaveBeenLastCalledWith(22.125);
    call(
      input(capture(render), "Position"),
      "onKeyDown",
      keyEvent("ArrowDown"),
    );
    expect(change).toHaveBeenLastCalledWith(11.125);
    change.mockClear();
    const mixed = capture(() =>
      DockNumberField({
        prefix: "R",
        label: "Rotation",
        value: undefined,
        onChange: change,
      }),
    );
    expect(mixed.html).toContain('placeholder="Mixed"');
    call(input(mixed, "Rotation"), "onKeyDown", keyEvent("ArrowUp"));
    expect(change).not.toHaveBeenCalled();
  });
  it("applies collective ratio resizing, opacity and canonical alignment/distribution through history", () => {
    setup(["shape", "shape", "shape"]);
    capture(StylePanel, [
      (view) => call(button(view, "Lock aspect ratio"), "onClick"),
      (view) =>
        call(
          view.find(
            (node) =>
              node.type === DockNumberField && node.props["label"] === "Width",
          ),
          "onChange",
          500,
        ),
    ]);
    expect(doc().elements[0]!.width).toBe(100);
    expect(doc().elements[0]!.height).toBe(100);
    expect(state().past).toHaveLength(1);
    let view = capture(StylePanel);
    call(input(view, "Opacity slider"), "onChange", {
      target: { value: "37" },
    });
    expect(doc().elements.every((el) => el.style.opacity === 0.37)).toBe(true);
    expect(state().past).toHaveLength(2);
    state().undo();
    expect(doc().elements[0]!.style.opacity).not.toBe(0.37);
    state().redo();
    useEditorStore.setState({ selectedIds: ["0", "1", "2"] });
    view = capture(StylePanel);
    call(button(view, "Align top"), "onClick");
    expect(doc().elements.every((el) => el.y === doc().elements[0]!.y)).toBe(
      true,
    );
    expect(button(view, "Distribute horizontal")).toBeDefined();
    doc().elements[1]!.x += 20;
    call(button(capture(StylePanel), "Distribute horizontal"), "onClick");
    expect(doc().elements[1]!.x - doc().elements[0]!.x).toBe(
      doc().elements[2]!.x - doc().elements[1]!.x,
    );
  });
  it("toggles material chips independently, expands suggestions, preserves mixed drafts and compiles prompt edits", () => {
    setup(["productImage", "productImage"]);
    doc().elements[0]!.material = "Custom grain, Clear glass";
    doc().elements[1]!.material = "Paper stock";
    let view = capture(StylePanel);
    expect(button(view, "Clear glass").props["aria-pressed"]).toBe("mixed");
    expect(
      view.nodes.filter(
        (node) =>
          node.type === "button" && node.props["aria-pressed"] !== undefined,
      ).length,
    ).toBe(5);
    call(material(view), "onKeyDown", keyEvent("Enter"));
    expect(state().past).toHaveLength(0);
    call(button(view, "Clear glass"), "onClick");
    expect(doc().elements.map((el) => el.material)).toEqual([
      "Custom grain, Clear glass",
      "Paper stock, Clear glass",
    ]);
    expect(state().past).toHaveLength(1);
    view = capture(StylePanel, [
      (step) => call(button(step, "More"), "onClick"),
    ]);
    expect(view.html).toContain("Stainless steel");
    expect(button(view, "Less").props["aria-expanded"]).toBe(true);
    const escape = keyEvent("Escape");
    capture(StylePanel, [
      (step) =>
        call(material(step), "onChange", { target: { value: "Discard me" } }),
      (step) => call(material(step), "onKeyDown", escape),
      (step) =>
        call(material(step), "onBlur", { target: { value: "Discard me" } }),
    ]);
    expect(doc().elements[0]!.material).toBe("Custom grain, Clear glass");
    expect(escape.stopPropagation).toHaveBeenCalled();
    capture(StylePanel, [
      (step) =>
        call(material(step), "onChange", {
          target: { value: "Brushed bronze" },
        }),
      (step) =>
        call(material(step), "onBlur", { target: { value: "Brushed bronze" } }),
    ]);
    const scene = capture(() =>
      SceneLightingControls({ presentation: "inline" }),
    );
    call(button(scene, "Marble countertop"), "onClick");
    const prompt = compileVisualPrompt(doc());
    expect(prompt).toContain("Brushed bronze");
    expect(prompt).toContain("Marble countertop");
  });
  it("supports tab Arrow/Home/End navigation with roving focus", () => {
    let focused = "";
    const event = (key: string) => ({
      ...keyEvent(key),
      currentTarget: {
        querySelector: (selector: string) => ({
          focus: () => {
            focused = selector;
          },
        }),
      },
    });
    const tabs = (view: View) =>
      view.find((node) => node.type === SegmentedTabs && node.props["label"] === "Design inspector");
    capture(StylePanel, [
      (view) => call(tabs(view), "onKeyDown", event("End")),
    ]);
    expect(state().styleTab).toBe("layout");
    expect(focused).toBe("#inspector-tab-layout");
    capture(StylePanel, [
      (view) => call(tabs(view), "onKeyDown", event("Home")),
    ]);
    expect(state().styleTab).toBe("style");
    expect(focused).toBe("#inspector-tab-style");
    capture(StylePanel, [
      (view) => call(tabs(view), "onKeyDown", event("ArrowRight")),
    ]);
    expect(state().styleTab).toBe("layout");
  });
  it("keeps disabled Style tooltip and routes every navigation key to Layout Presets without a selection", () => {
    useEditorStore.setState({ selectedIds: [] });
    const focused: string[] = [];
    const view = capture(StylePanel);
    const style = view.find(
      (node) =>
        node.type === SegmentedTab && node.props["id"] === "inspector-tab-style",
    );
    expect(style.props["disabled"]).toBe(true);
    expect(style.props["selected"]).toBe(false);
    expect(
      view.find(
        (node) => node.props["label"] === "Select an element to edit its style",
      ),
    ).toBeDefined();
    expect(view.html).toContain(
      'id="inspector-tab-style" aria-selected="false" aria-controls="inspector-style" tabindex="-1"',
    );
    for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
      const event = {
        ...keyEvent(key),
        currentTarget: {
          querySelector: (selector: string) => ({
            focus: () => focused.push(selector),
          }),
        },
      };
      const tabs = capture(StylePanel).find(
        (node) =>
          node.type === SegmentedTabs &&
          node.props["label"] === "Design inspector",
      );
      call(tabs, "onKeyDown", event);
      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(state().styleTab).toBe("layout");
    }
    expect(focused).toEqual(Array(4).fill("#inspector-tab-layout"));
  });

  it("does not remove an editable member's material when a mixed chip differs only on locked members", () => {
    setup(["productImage", "productImage"]);
    doc().elements[0]!.material = "Clear glass";
    doc().elements[1]!.locked = true;
    const view = capture(StylePanel);
    expect(button(view, "Clear glass").props["aria-pressed"]).toBe("mixed");
    call(button(view, "Clear glass"), "onClick");
    expect(doc().elements[0]!.material).toBe("Clear glass");
    expect(doc().elements[1]!.material).toBeUndefined();
    expect(state().past).toHaveLength(0);
  });
});

describe("Scene object inspector section", () => {
  function setupScene() {
    setup([]);
    const light = createSceneLight("sun", []);
    doc().generationSettings = { studioLights: [light] };
    useEditorStore.setState({
      selectedIds: [],
      backgroundSelected: false,
      selectedSceneId: light.id,
      styleTab: "style",
    });
    return light;
  }
  it("shows the scene section only when a scene object is selected, hiding element sections", () => {
    setupScene();
    const { html } = capture(StylePanel);
    expect(html).toContain("Sunlight selected");
    for (const label of ["Type", "Intensity", "Temperature", "Direction", "Shadows", "Elevation", "Softness"])
      expect(html).toContain(`<span>${label}</span>`);
    expect(html).not.toContain("Element details");
    expect(html).not.toContain("Nothing selected");
    useEditorStore.setState({ selectedSceneId: null });
    expect(capture(StylePanel).html).not.toContain("Sunlight");
  });

  it("enables the Style tab for a scene selection but does not auto-switch away from Layout", () => {
    setupScene();
    useEditorStore.setState({ styleTab: "layout" });
    const view = capture(StylePanel);
    const style = view.find(
      (node) =>
        node.type === SegmentedTab && node.props["id"] === "inspector-tab-style",
    );
    expect(style.props["disabled"]).toBe(false);
    expect(state().styleTab).toBe("layout");
    expect(view.html).toContain('id="inspector-style" role="tabpanel" aria-labelledby="inspector-tab-style" class="inspector-sections" hidden=""');
  });

  it("commits a scene edit through the shared descriptor and makes it undoable", () => {
    const light = setupScene();
    const view = capture(StylePanel);
    const shadows = view.find(
      (node) => node.type === "select" && node.props["value"] === light.shadows,
    );
    call(shadows, "onChange", { target: { value: "Soft" } });
    expect(doc().generationSettings?.studioLights?.[0]?.shadows).toBe("Soft");
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(doc().generationSettings?.studioLights?.[0]?.shadows).toBe(light.shadows);
  });

  it("shows the camera's shared controls plus its advanced target fields", () => {
    setup([]);
    const camera = createSceneCamera();
    doc().generationSettings = { camera };
    useEditorStore.setState({
      selectedIds: [],
      backgroundSelected: false,
      selectedSceneId: "camera",
      styleTab: "style",
    });
    const { html } = capture(StylePanel);
    expect(html).toContain("Camera selected");
    for (const label of ["Focal length", "Angle", "Perspective", "Rotation"])
      expect(html).toContain(`<span>${label}</span>`);
    expect(html).toContain("Target X");
    expect(html).toContain("Target Y");
  });
});
