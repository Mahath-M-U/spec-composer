import {
  createElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ColorControl, ColorPicker, OpaqueColorControl } from "./color-control";
import {
  SeedSwatchPicker,
  PaletteSwatchTiles,
  PaletteDetailsField,
} from "./brand-profile-inputs";
import { SectionEditor } from "./section-editors";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import type { BrandKit, BrandKitColor } from "./types";
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
    nodes,
    find: (test: (node: ReactElement<Props>) => boolean) => {
      const result = nodes.find(test);
      expect(result).toBeDefined();
      return result!;
    },
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
  const html = renderToStaticMarkup(createElement(Capture));
  return { html, ...view! };
}
const renderNode = (node: ReactElement<Props>) =>
  capture(() => (node.type as (props: Props) => ReactElement)(node.props));
const input = (view: View, label: string) =>
  view.find(
    (node) => node.type === "input" && node.props["aria-label"] === label,
  );
const colors: BrandKitColor[] = [
  {
    id: "first",
    hex: "#112233",
    secondaryHex: "#abcdef",
    angle: 42,
    type: "gradient",
    role: "primary",
    usecase: "Existing use",
  },
  {
    id: "second",
    hex: "#445566",
    angle: 135,
    type: "solid",
    role: "text",
    usecase: "Copy",
  },
];
beforeEach(() => {
  vi.useFakeTimers();
  useEditorStore.setState({
    doc: createDocument(),
    brandKits: [],
    past: [],
    future: [],
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("shared opaque color controls", () => {
  it("enables an opaque Remove action only when supplied and keeps alpha edits rejected", () => {
    const remove = vi.fn(),
      change = vi.fn();
    const adapter = OpaqueColorControl({
      label: "Border color",
      value: "#112233",
      onChange: change,
      onRemove: remove,
      removalLabel: "Remove border",
    });
    const core = inspect(adapter).find((node) => node.type === ColorControl);
    expect(core.props["allowRemove"]).toBe(true);
    const picker = capture(() =>
      ColorPicker(core.props as unknown as Parameters<typeof ColorPicker>[0]),
    );
    expect(picker.html).toContain("Remove border");
    expect(picker.html).not.toContain("Alpha");
    call(
      picker.find((node) => node.props["className"] === "text-color-remove"),
      "onClick",
    );
    expect(remove).toHaveBeenCalledTimes(1);
    expect(change).not.toHaveBeenCalled();
    call(core, "onChange", { type: "alpha", alpha: 0.5 });
    call(core, "onChange", { type: "color", value: "#11223380" });
    expect(change).not.toHaveBeenCalled();
    expect(
      capture(() =>
        OpaqueColorControl({
          label: "Border color",
          value: undefined,
          onChange: change,
          onRemove: remove,
        }),
      ).html,
    ).toContain("Border color: None");
    const normal = inspect(
      OpaqueColorControl({ label: "Fill", value: "#112233", onChange: change }),
    ).find((node) => node.type === ColorControl);
    expect(normal.props["allowRemove"]).toBe(false);
    call(normal, "onChange", { type: "remove" });
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("omits alpha/Remove, rejects translucent HEX and presets, and emits canonical RGB", () => {
    const change = vi.fn();
    const props = {
      label: "Fill",
      property: "background" as const,
      values: ["#112233"],
      presets: ["#fff", "#12345680"],
      allowAlpha: false,
      allowRemove: false,
      onChange: change,
    };
    let view = capture(() => ColorPicker(props));
    expect(view.html).not.toContain("Alpha");
    expect(view.html).not.toContain("Remove background");
    expect(view.html).not.toContain("Use #12345680");
    expect(view.html).not.toContain('type="color"');
    capture(
      () => ColorPicker(props),
      [
        (step) =>
          call(input(step, "Fill HEX"), "onChange", {
            target: { value: "#aabbcc80" },
          }),
        (step) =>
          call(input(step, "Fill HEX"), "onBlur", {
            target: { value: "#aabbcc80" },
          }),
      ],
    );
    expect(change).not.toHaveBeenCalled();
    view = capture(
      () => ColorPicker(props),
      [
        (step) =>
          call(input(step, "Fill HEX"), "onChange", {
            target: { value: "#ABCDEF" },
          }),
      ],
    );
    expect(change).toHaveBeenLastCalledWith(
      { type: "color", value: "#abcdef" },
      false,
    );
    call(
      view.find((node) => node.props["aria-label"] === "Use #FFF"),
      "onClick",
    );
    expect(change).toHaveBeenLastCalledWith(
      { type: "color", value: "#ffffff" },
      false,
    );
  });
  it("enforces opaque/no-op guards at the adapter boundary and never writes on open", () => {
    const change = vi.fn();
    const adapter = OpaqueColorControl({
      label: "Fill",
      values: ["#FFF", "rgb(255 255 255)"],
      onChange: change,
    });
    const view = inspect(adapter);
    const core = view.find((node) => node.type === ColorControl);
    call(core, "onChange", { type: "color", value: "#ffffff" });
    call(core, "onChange", { type: "alpha", alpha: 0.5 });
    call(core, "onChange", { type: "color", value: "#12345680" });
    call(core, "onChange", { type: "remove" });
    expect(change).not.toHaveBeenCalled();
    const config = core.props as unknown as Parameters<typeof ColorControl>[0];
    capture(
      () => ColorControl(config),
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
    expect(change).not.toHaveBeenCalled();
    call(core, "onChange", { type: "rgb", color: { r: 12, g: 34, b: 56 } });
    expect(change).toHaveBeenLastCalledWith("#0c2238");
    expect(
      capture(() =>
        OpaqueColorControl({
          label: "Fill",
          values: [undefined, "#ffffff"],
          onChange: change,
        }),
      ).html,
    ).toContain("Fill: Mixed");
    expect(
      capture(() =>
        OpaqueColorControl({
          label: "Border",
          value: undefined,
          onChange: change,
        }),
      ).html,
    ).toContain("Border: Not set");
  });
  it("keeps seed presets, free HEX validation, and role preview while sharing the inline picker", () => {
    const change = vi.fn();
    const view = capture(() =>
      SeedSwatchPicker({ seed: "#6750A4", onChange: change }),
    );
    expect(view.html).not.toContain('type="color"');
    expect(view.html).toContain('aria-label="Seed color hex"');
    expect(view.html).toContain("bk-swatch-row-strip");
    const picker = view.find((node) => node.type === OpaqueColorControl);
    const adapter = renderNode(picker).find(
      (node) => node.type === ColorControl,
    );
    call(adapter, "onChange", { type: "color", value: "#abcdef" });
    expect(change).toHaveBeenLastCalledWith("#abcdef");
    call(input(view, "Seed color hex"), "onChange", {
      target: { value: "#bad draft" },
    });
    expect(change).toHaveBeenLastCalledWith("#bad draft");
    const invalid = capture(() =>
      SeedSwatchPicker({ seed: "#bad draft", onChange: change }),
    );
    const invalidAdapter = renderNode(
      invalid.find((node) => node.type === OpaqueColorControl),
    ).find((node) => node.type === ColorControl);
    call(invalidAdapter, "onChange", { type: "color", value: "#6750a4" });
    expect(change).toHaveBeenLastCalledWith("#6750a4");
  });
  it("makes each editable palette tile one button and keeps copying separate without changing other fields", () => {
    const change = vi.fn(),
      copy = vi.fn();
    const view = capture(() =>
      PaletteSwatchTiles({ colors, onChange: change, onCopy: copy }),
    );
    expect(view.html.match(/<button/g)).toHaveLength(4);
    expect(view.html).not.toContain('type="color"');
    const edit = view.nodes.find((node) => node.type === OpaqueColorControl)!;
    const custom = edit.props["trigger"] as ReactElement<Props>;
    expect(custom.type).toBe("button");
    expect(
      inspect(custom).nodes.filter((node) => node.type === "button"),
    ).toHaveLength(1);
    const adapter = renderNode(edit).find((node) => node.type === ColorControl);
    call(adapter, "onChange", { type: "color", value: "#778899" });
    expect(change).toHaveBeenLastCalledWith([
      { ...colors[0], hex: "#778899" },
      colors[1],
    ]);
    const before = change.mock.calls.length;
    call(
      view.find(
        (node) => node.props["aria-label"] === "Copy primary color #112233",
      ),
      "onClick",
    );
    expect(copy).toHaveBeenCalledWith("#112233");
    expect(change).toHaveBeenCalledTimes(before);
    const readonly = capture(() => PaletteSwatchTiles({ colors }));
    expect(
      readonly.nodes.some((node) => node.type === OpaqueColorControl),
    ).toBe(false);
    expect(readonly.html).not.toContain("<button");
  });
  it("preserves palette gradient stop/type/angle/use cases in shared detail controls", () => {
    const change = vi.fn();
    const view = capture(() =>
      PaletteDetailsField({
        colors,
        onChange: change,
        roles: [{ value: "primary", label: "Primary" }],
        usecases: {
          primary: [],
          secondary: [],
          background: [],
          text: [],
          accent: [],
        },
        defaultUsecase: () => "Use",
        selectedUsecases: () => [],
      }),
    );
    const from = view.find(
      (node) =>
        node.type === OpaqueColorControl && node.props["label"] === "From",
    );
    const to = view.find(
      (node) =>
        node.type === OpaqueColorControl && node.props["label"] === "To",
    );
    call(from, "onChange", "#778899");
    expect(change).toHaveBeenLastCalledWith([
      { ...colors[0], hex: "#778899" },
      colors[1],
    ]);
    call(to, "onChange", "#aabbcc");
    expect(change).toHaveBeenLastCalledWith([
      { ...colors[0], secondaryHex: "#aabbcc" },
      colors[1],
    ]);
    expect(view.html).toContain('aria-label="Color fill type"');
    expect(view.html).toContain('aria-label="Gradient angle"');
    expect(view.html).not.toContain('type="color"');
  });
  it("retains section color preview/debounce and linked design-kit writes", () => {
    const kit: BrandKit = {
      id: "kit",
      name: "Kit",
      colors: [{ ...colors[0]!, role: "background", type: "solid" }],
      style: "Minimal",
      emotions: [],
      typography: "Manrope",
      createdAt: "2026-10-19",
      updatedAt: "2026-10-19",
    };
    const doc = createDocument();
    doc.creativeDirection.brandKitId = kit.id;
    useEditorStore.setState({ doc, brandKits: [kit] });
    const section = capture(() =>
      SectionEditor({
        lineKey: "skill:theme",
        baseText: "",
        onEditText: vi.fn(),
      }),
    );
    const background = renderNode(
      section.find(
        (node) => typeof node.type === "function" && !!node.props["b"],
      ),
    );
    const control = background.find((node) => node.props["label"] === "Canvas");
    const field = renderNode(control);
    expect(field.html).toContain('aria-label="Design kit"');
    const picker = field.find((node) => node.type === OpaqueColorControl);
    call(picker, "onChange", "#445566");
    call(picker, "onChange", "#778899");
    expect(useEditorStore.getState().brandKits[0]!.colors[0]!.hex).toBe(
      "#112233",
    );
    vi.advanceTimersByTime(149);
    expect(useEditorStore.getState().brandKits[0]!.colors[0]!.hex).toBe(
      "#112233",
    );
    vi.advanceTimersByTime(1);
    expect(useEditorStore.getState().brandKits[0]!.colors[0]!.hex).toBe(
      "#778899",
    );
    expect(useEditorStore.getState().doc!.background.value).toBe("#778899");
    expect(useEditorStore.getState().brandKits[0]!.colors[0]!.usecase).toBe(
      "Existing use",
    );
  });
});
