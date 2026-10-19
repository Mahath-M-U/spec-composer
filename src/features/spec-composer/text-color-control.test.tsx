import {
  createElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  TextColorControl,
  TextColorPicker,
  type TextColorControlProps,
} from "./text-color-control";
import { applyTextColorIntent, parseColor } from "./text-color";
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
    nodes,
    find: (predicate: (node: ReactElement<Props>) => boolean) => {
      const result = nodes.find(predicate);
      expect(result).toBeDefined();
      return result!;
    },
  };
}
type View = ReturnType<typeof inspect>;
const call = (node: ReactElement<Props>, handler: string, ...args: unknown[]) =>
  (node.props[handler] as (...values: unknown[]) => void)(...args);
function capture(
  render: () => ReactElement,
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
  const html = renderToStaticMarkup(createElement(Capture));
  return { html, ...view! };
}
const props = (
  patch: Partial<TextColorControlProps> = {},
): TextColorControlProps => ({
  label: "Text color",
  property: "color",
  values: ["#c5545480"],
  presets: ["#18181b", "#ffffff"],
  onChange: vi.fn(),
  ...patch,
});
const input = (view: View, label: string) =>
  view.find(
    (node) => node.type === "input" && node.props["aria-label"] === label,
  );
const plane = (view: View) =>
  view.find((node) => node.props["className"] === "text-color-plane");
const field = (view: View, label: string) =>
  view.find(
    (node) => node.props["label"] === label && typeof node.type === "function",
  );
const key = (value: string) => ({ key: value, preventDefault: vi.fn() });
function pointerTarget() {
  const ids = new Set<number>();
  return {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    setPointerCapture: vi.fn((id: number) => ids.add(id)),
    hasPointerCapture: (id: number) => ids.has(id),
    releasePointerCapture: vi.fn((id: number) => ids.delete(id)),
  };
}
const pointer = (
  target = pointerTarget(),
  pointerId = 1,
  clientX = 50,
  clientY = 50,
) => ({
  pointerId,
  clientX,
  clientY,
  button: 0,
  currentTarget: target,
  preventDefault: vi.fn(),
});

describe("inline text color control", () => {
  it("uses the whole value as one trigger, with value before actual swatch and no native color dialog", () => {
    const config = props();
    const view = capture(() => TextColorControl(config));
    expect(view.html).toContain('aria-label="Text color: #C5545480"');
    expect(view.html.indexOf("text-color-value")).toBeLessThan(
      view.html.indexOf("text-color-swatch"),
    );
    expect(view.html).toContain("background:#c5545480");
    expect(view.html).not.toContain('type="color"');
    expect(config.onChange).not.toHaveBeenCalled();
    capture(
      () => TextColorControl(config),
      [
        (step) =>
          call(
            step.find((node) => "onOpenChange" in node.props),
            "onOpenChange",
            true,
          ),
        (step) =>
          call(
            step.find((node) => "onOpenChange" in node.props),
            "onOpenChange",
            false,
          ),
      ],
    );
    expect(config.onChange).not.toHaveBeenCalled();
  });
  it("shows None/Mixed explicitly, reports mixed alpha, and closes when all targets become locked", () => {
    expect(
      capture(() =>
        TextColorControl(
          props({ property: "background", values: [undefined, "transparent"] }),
        ),
      ).html,
    ).toContain('data-kind="none"');
    const mixed = props({ values: ["#ff000080", "#00ff0040"] });
    expect(capture(() => TextColorControl(mixed)).html).toContain(
      "Text color: Mixed",
    );
    const picker = capture(() => TextColorPicker(mixed));
    expect(input(picker, "Color alpha").props["aria-valuetext"]).toContain(
      "Mixed",
    );
    expect(field(picker, "Alpha percentage").props["value"]).toBeUndefined();
    const config = props();
    const view = capture(
      () => TextColorControl(config),
      [
        (step) =>
          call(
            step.find((node) => "onOpenChange" in node.props),
            "onOpenChange",
            true,
          ),
        () => {
          config.disabled = true;
        },
      ],
    );
    expect(
      view.find((node) => "onOpenChange" in node.props).props["open"],
    ).toBe(false);
    expect(view.html).toContain('disabled=""');
    expect(config.onChange).not.toHaveBeenCalled();
  });
  it("captures and clamps plane drags, ignores other pointers, and stops writes on cancel", () => {
    const config = props({ onGestureStart: vi.fn(), onGestureEnd: vi.fn() });
    const target = pointerTarget();
    capture(
      () => TextColorPicker(config),
      [
        (view) =>
          call(plane(view), "onPointerDown", pointer(target, 1, 100, 0)),
        (view) => call(plane(view), "onPointerDown", pointer(target, 2)),
        (view) => call(plane(view), "onPointerCancel", pointer(target, 2)),
        (view) =>
          call(plane(view), "onPointerMove", pointer(target, 1, -100, 200)),
        (view) => call(plane(view), "onPointerCancel", pointer(target, 1)),
        (view) => call(plane(view), "onPointerMove", pointer(target, 1)),
      ],
    );
    expect(config.onGestureStart).toHaveBeenCalledTimes(1);
    expect(config.onGestureEnd).toHaveBeenCalledTimes(1);
    expect(target.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(config.onChange).toHaveBeenCalledTimes(2);
    expect(config.onChange).toHaveBeenLastCalledWith(
      { type: "rgb", color: { r: 0, g: 0, b: 0 } },
      true,
    );
  });
  it("ends range gestures on release/blur so subsequent keyboard changes are separate edits", () => {
    const config = props({ onGestureStart: vi.fn(), onGestureEnd: vi.fn() });
    const target = pointerTarget();
    capture(
      () => TextColorPicker(config),
      [
        (view) =>
          call(input(view, "Color alpha"), "onPointerDown", pointer(target)),
        (view) =>
          call(input(view, "Color alpha"), "onChange", {
            target: { value: "25" },
          }),
        (view) =>
          call(input(view, "Color alpha"), "onPointerUp", pointer(target)),
        (view) =>
          call(input(view, "Color alpha"), "onChange", {
            target: { value: "30" },
          }),
        (view) => call(input(view, "Hue"), "onPointerDown", pointer(target)),
        (view) => call(input(view, "Hue"), "onBlur"),
      ],
    );
    expect(config.onChange).toHaveBeenNthCalledWith(
      1,
      { type: "alpha", alpha: 0.25 },
      true,
    );
    expect(config.onChange).toHaveBeenNthCalledWith(
      2,
      { type: "alpha", alpha: 0.3 },
      false,
    );
    expect(config.onGestureEnd).toHaveBeenCalledTimes(2);
    expect(target.releasePointerCapture).toHaveBeenCalledTimes(2);
  });
  it("provides precise keyboard-equivalent saturation/brightness and retains hue through black", () => {
    const config = props({ values: ["#000000"] });
    capture(
      () => TextColorPicker(config),
      [
        (view) =>
          call(input(view, "Hue"), "onChange", { target: { value: "240" } }),
        (view) => call(field(view, "Saturation"), "onChange", 70),
        (view) => call(field(view, "Brightness"), "onChange", 60),
      ],
    );
    expect(config.onChange).toHaveBeenLastCalledWith(
      { type: "rgb", color: { r: 46, g: 46, b: 153 } },
      false,
    );
    const view = capture(() => TextColorPicker(config));
    const numeric = field(view, "Saturation");
    const change = vi.fn();
    const render = () =>
      (
        numeric.type as (p: {
          label: string;
          value: number;
          onChange: typeof change;
        }) => ReactElement
      )({ label: "Saturation", value: 70, onChange: change });
    capture(render, [
      (step) =>
        call(input(step, "Saturation"), "onChange", {
          target: { value: "12.375" },
        }),
      (step) => call(input(step, "Saturation"), "onKeyDown", key("Enter")),
    ]);
    expect(change).toHaveBeenCalledWith(12.375);
    change.mockClear();
    call(input(capture(render), "Saturation"), "onChange", {
      target: { value: "" },
    });
    expect(change).not.toHaveBeenCalled();
  });
  it("keeps incomplete HEX local, applies valid RGB/alpha HEX, and discards invalid blur/Escape drafts", () => {
    const config = props();
    capture(
      () => TextColorPicker(config),
      [
        (view) =>
          call(input(view, "Text color HEX"), "onChange", {
            target: { value: "#12" },
          }),
        (view) =>
          call(input(view, "Text color HEX"), "onBlur", {
            target: { value: "#12" },
          }),
      ],
    );
    expect(config.onChange).not.toHaveBeenCalled();
    capture(
      () => TextColorPicker(config),
      [
        (view) =>
          call(input(view, "Text color HEX"), "onChange", {
            target: { value: "#123456" },
          }),
      ],
    );
    expect(config.onChange).toHaveBeenLastCalledWith(
      { type: "rgb", color: { r: 18, g: 52, b: 86, a: 1 } },
      false,
    );
    capture(
      () => TextColorPicker(config),
      [
        (view) =>
          call(input(view, "Text color HEX"), "onChange", {
            target: { value: "#12345680" },
          }),
      ],
    );
    expect(config.onChange).toHaveBeenLastCalledWith(
      { type: "color", value: "#12345680" },
      false,
    );
    const calls = vi.mocked(config.onChange).mock.calls.length;
    const escaped = capture(
      () => TextColorPicker(config),
      [
        (view) =>
          call(input(view, "Text color HEX"), "onChange", {
            target: { value: "bad draft" },
          }),
        (view) =>
          call(input(view, "Text color HEX"), "onKeyDown", key("Escape")),
      ],
    );
    expect(input(escaped, "Text color HEX").props["value"]).toBe("#C5545480");
    expect(config.onChange).toHaveBeenCalledTimes(calls);
  });
  it("cancels pending short HEX before an immediate stale blur handler can commit it", () => {
    const config = props();
    capture(
      () => TextColorPicker(config),
      [
        (view) =>
          call(input(view, "Text color HEX"), "onChange", {
            target: { value: "#abc" },
          }),
        (view) => {
          const old = input(view, "Text color HEX");
          call(old, "onKeyDown", key("Escape"));
          call(old, "onBlur", { target: { value: "#abc" } });
        },
      ],
    );
    expect(config.onChange).not.toHaveBeenCalled();
  });
  it("preserves transparent members when changing RGB in a mixed None/solid background selection", () => {
    const config = props({
      property: "background",
      values: [undefined, "#ff000080"],
    });
    const view = capture(() => TextColorPicker(config));
    call(input(view, "Hue"), "onChange", { target: { value: "120" } });
    const intent = vi.mocked(config.onChange).mock.calls[0]![0];
    expect(intent.type).toBe("rgb");
    expect(
      config.values.map(
        (value) =>
          parseColor(applyTextColorIntent(value, "background", intent))!.a,
      ),
    ).toEqual([0, 128 / 255]);
  });
  it.each([undefined, "transparent", "#12345600"])(
    "establishes visible fill only after explicit color choice from None (%s)",
    (value) => {
      const config = props({ property: "background", values: [value] });
      const view = capture(() => TextColorPicker(config));
      expect(config.onChange).not.toHaveBeenCalled();
      call(input(view, "Hue"), "onChange", { target: { value: "120" } });
      expect(vi.mocked(config.onChange).mock.calls[0]![0]).toMatchObject({
        type: "color",
      });
      const intent = vi.mocked(config.onChange).mock.calls[0]![0];
      if (intent.type === "color") expect(intent.value).toHaveLength(7);
    },
  );
  it("uses complete-color presets and background-only removal without implicit unsupported-color writes", () => {
    const config = props({
      property: "background",
      values: ["var(--surface)"],
    });
    const view = capture(() => TextColorPicker(config));
    expect(view.html).toContain("Alpha edits preserve unsupported colors");
    expect(config.onChange).not.toHaveBeenCalled();
    call(
      view.find((node) => node.props["aria-label"] === "Use #FFFFFF"),
      "onClick",
    );
    expect(config.onChange).toHaveBeenLastCalledWith(
      { type: "color", value: "#ffffff" },
      false,
    );
    call(
      view.find((node) => node.props["className"] === "text-color-remove"),
      "onClick",
    );
    expect(config.onChange).toHaveBeenLastCalledWith({ type: "remove" }, false);
    expect(capture(() => TextColorPicker(props())).html).not.toContain(
      "Remove background",
    );
    const disabled = props({ disabled: true });
    const locked = capture(() => TextColorPicker(disabled));
    call(plane(locked), "onPointerDown", pointer());
    expect(disabled.onChange).not.toHaveBeenCalled();
  });
});
