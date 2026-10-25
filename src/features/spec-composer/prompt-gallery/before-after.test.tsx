import {
  createElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaFallback, MediaSkeleton } from "@/components/media-skeleton";
import { BeforeAfter } from "./before-after";
import { galleryPrompts } from "./catalog";

const mocks = vi.hoisted(() => ({ status: new Map<string, string>() }));
vi.mock("@/hooks/use-image-status", () => ({
  useImageStatus: (src: string) => ({
    status: mocks.status.get(src) ?? "loaded",
    ref: null,
    onLoad: vi.fn(),
    onError: vi.fn(),
  }),
}));
const prompt = galleryPrompts[0]!;
type Props = { children?: ReactNode; [key: string]: unknown };
function inspect(tree: ReactNode) {
  const visit = (node: ReactNode): ReactElement<Props>[] =>
    Array.isArray(node)
      ? node.flatMap(visit)
      : isValidElement<Props>(node)
        ? [node, ...visit(node.props["children"])]
        : [];
  const nodes = visit(tree);
  return {
    nodes,
    find: (predicate: (node: ReactElement<Props>) => boolean) => {
      const node = nodes.find(predicate);
      expect(node).toBeDefined();
      return node!;
    },
  };
}
type View = ReturnType<typeof inspect>;
const range = (view: View) => view.find((node) => node.type === "input");
const call = (node: ReactElement<Props>, handler: string, ...args: unknown[]) =>
  (node.props[handler] as (...values: unknown[]) => void)(...args);
function capture(actions: Array<(view: View) => void> = []) {
  let view: View;
  function Capture() {
    const [step, setStep] = useState(0);
    const tree = BeforeAfter({ prompt });
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
function pointerTarget(width = 200) {
  const ids = new Set<number>();
  return {
    focus: vi.fn(),
    getBoundingClientRect: () => ({ left: 100, width }),
    setPointerCapture: vi.fn((id: number) => ids.add(id)),
    hasPointerCapture: (id: number) => ids.has(id),
    releasePointerCapture: vi.fn((id: number) => ids.delete(id)),
  };
}
const pointer = (
  target: ReturnType<typeof pointerTarget>,
  clientX = 200,
  patch = {},
) => ({
  currentTarget: target,
  clientX,
  pointerId: 1,
  button: 0,
  isPrimary: true,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  ...patch,
});
beforeEach(() => mocks.status.clear());

describe("before/after comparison", () => {
  it("starts at 50% with aligned image geometry and native accessible range semantics", () => {
    const view = capture();
    expect(range(view).props).toMatchObject({
      type: "range",
      min: 0,
      max: 100,
      value: 50,
      "aria-label": `Compare before and after: ${prompt.title}`,
      "aria-valuetext": "50% before image visible",
    });
    expect(view.html).toContain("--split:50%");
    const images = view.nodes.filter((node) => node.type === "img");
    expect(images).toHaveLength(2);
    expect(images.map((node) => node.props["src"])).toEqual([
      prompt.afterImage,
      prompt.beforeImage,
    ]);
    for (const image of images) {
      expect(image.props["width"]).toBeUndefined();
      expect(image.props["height"]).toBeUndefined();
    }
    expect(images[0]!.props["className"]).toBe(
      "prompt-gallery-image prompt-gallery-image--after",
    );
    expect(images[1]!.props["className"]).toBe("prompt-gallery-image");
    const beforeLayer = view.find(
      (node) => node.props["className"] === "prompt-gallery-before-layer",
    );
    const clippedNodes = inspect(beforeLayer.props.children).nodes;
    expect(clippedNodes).toContain(images[1]);
    expect(clippedNodes).not.toContain(images[0]);
    expect(clippedNodes).not.toContain(range(view));
    expect(
      clippedNodes.some(
        (node) => node.props["className"] === "prompt-gallery-divider",
      ),
    ).toBe(false);
    expect(view.html).toContain("Before</span>");
    expect(view.html).toContain("After</span>");
  });

  it("retains native range changes for keyboard input", () => {
    const view = capture([
      (step) => call(range(step), "onChange", { target: { value: "51" } }),
    ]);
    expect(range(view).props["value"]).toBe(51);
    expect(range(view).props["aria-valuetext"]).toBe(
      "51% before image visible",
    );
    expect(range(view).props["onKeyDown"]).toBeUndefined();
  });

  it.each(["mouse", "touch", "pen"])(
    "maps a %s tap anywhere across the preview and captures the pointer",
    (pointerType) => {
      const target = pointerTarget();
      const event = pointer(target, 150, { pointerType });
      const view = capture([
        (step) => call(range(step), "onPointerDown", event),
      ]);
      expect(range(view).props["value"]).toBe(25);
      expect(target.focus).toHaveBeenCalledOnce();
      expect(target.setPointerCapture).toHaveBeenCalledExactlyOnceWith(1);
      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(event.stopPropagation).toHaveBeenCalledOnce();
    },
  );

  it("drags with the captured pointer and clamps to both image edges", () => {
    const target = pointerTarget();
    const view = capture([
      (step) => call(range(step), "onPointerDown", pointer(target, 150)),
      (step) => call(range(step), "onPointerMove", pointer(target, 400)),
      (step) => {
        expect(range(step).props["value"]).toBe(100);
        call(range(step), "onPointerMove", pointer(target, 0));
      },
    ]);
    expect(range(view).props["value"]).toBe(0);
  });

  it.each(["onPointerUp", "onPointerCancel", "onLostPointerCapture"])(
    "stops dragging after %s",
    (handler) => {
      const target = pointerTarget();
      const view = capture([
        (step) => call(range(step), "onPointerDown", pointer(target, 150)),
        (step) => call(range(step), handler, pointer(target)),
        (step) => call(range(step), "onPointerMove", pointer(target, 300)),
      ]);
      expect(range(view).props["value"]).toBe(25);
      if (handler !== "onLostPointerCapture")
        expect(target.releasePointerCapture).toHaveBeenCalledExactlyOnceWith(1);
    },
  );

  it("ignores secondary buttons and extra pointers without ending the active drag", () => {
    const target = pointerTarget();
    const view = capture([
      (step) => {
        call(range(step), "onPointerDown", pointer(target, 300, { button: 2 }));
        call(
          range(step),
          "onPointerDown",
          pointer(target, 300, { isPrimary: false }),
        );
      },
      (step) => {
        expect(range(step).props["value"]).toBe(50);
        call(range(step), "onPointerDown", pointer(target, 150));
      },
      (step) => {
        call(
          range(step),
          "onPointerDown",
          pointer(target, 300, { pointerId: 2 }),
        );
        call(
          range(step),
          "onPointerMove",
          pointer(target, 300, { pointerId: 2 }),
        );
        call(
          range(step),
          "onPointerCancel",
          pointer(target, 300, { pointerId: 2 }),
        );
      },
      (step) => {
        expect(range(step).props["value"]).toBe(25);
        call(range(step), "onPointerMove", pointer(target, 250));
      },
    ]);
    expect(range(view).props["value"]).toBe(75);
    expect(target.setPointerCapture).toHaveBeenCalledTimes(1);
  });

  it("isolates clicks and avoids invalid split values for zero-width previews", () => {
    const event = pointer(pointerTarget(0), 300);
    const view = capture([(step) => call(range(step), "onPointerDown", event)]);
    expect(range(view).props["value"]).toBe(50);
    const click = { stopPropagation: vi.fn() };
    call(range(view), "onClick", click);
    expect(click.stopPropagation).toHaveBeenCalledOnce();
  });

  it("keeps the loading skeleton until both images load", () => {
    mocks.status.set(prompt.beforeImage, "loading");
    const view = capture();
    expect(view.nodes.some((node) => node.type === MediaSkeleton)).toBe(true);
    expect(view.nodes.filter((node) => node.type === "img")).toHaveLength(2);
  });

  it.each([prompt.beforeImage, prompt.afterImage])(
    "shows a fallback when %s fails",
    (src) => {
      mocks.status.set(src, "error");
      const view = capture();
      expect(
        view.nodes.some(
          (node) =>
            node.type === MediaFallback &&
            node.props["label"] === "Preview unavailable",
        ),
      ).toBe(true);
      expect(view.nodes.some((node) => node.type === "input")).toBe(false);
      expect(view.nodes[0]!.props["className"]).toBe(
        "prompt-gallery-comparison prompt-gallery-comparison--unavailable",
      );
    },
  );
});
