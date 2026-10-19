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
    expect(html).toContain('data-mixed="true"');
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

describe("inspector field and selection interactions", () => {
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
      view.find((node) => node.props["role"] === "tablist");
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
