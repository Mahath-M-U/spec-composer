import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCanvasViewport } from "./use-canvas-viewport";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";

// A small effect/ref runner exercises the real hook and ResizeObserver callback
// in this project's Node test environment, without adding a DOM dependency.
const hooks = vi.hoisted(() => ({
  cursor: 0,
  slots: [] as unknown[],
  layout: [] as (() => void)[],
  effects: [] as (() => void)[],
  cleanups: [] as (() => void)[],
}));
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  function memo<T>(value: T, deps: readonly unknown[]) {
    const index = hooks.cursor++;
    const previous = hooks.slots[index] as
      { value: T; deps: readonly unknown[] } | undefined;
    if (
      previous &&
      previous.deps.length === deps.length &&
      deps.every((dep, i) => Object.is(dep, previous.deps[i]))
    )
      return previous.value;
    hooks.slots[index] = { value, deps };
    return value;
  }
  function effect(
    callback: () => void | (() => void),
    deps: readonly unknown[],
    queue: (() => void)[],
  ) {
    const marker = {};
    if (memo(marker, deps) === marker)
      queue.push(() => {
        const cleanup = callback();
        if (cleanup) hooks.cleanups.push(cleanup);
      });
  }
  return {
    ...original,
    useRef: (initial: unknown) => {
      const index = hooks.cursor++;
      return hooks.slots[index] ?? (hooks.slots[index] = { current: initial });
    },
    useState: (initial: unknown) => {
      hooks.cursor++;
      return [initial, vi.fn()];
    },
    useCallback: memo,
    useEffect: (callback: () => void, deps: readonly unknown[]) =>
      effect(callback, deps, hooks.effects),
    useLayoutEffect: (callback: () => void, deps: readonly unknown[]) =>
      effect(callback, deps, hooks.layout),
  };
});
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
let resize: () => void;
const cancel = vi.fn();
const surface = {
  current: {
    clientWidth: 900,
    clientHeight: 700,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
  } as unknown as HTMLDivElement,
};
const busy = { current: false };
function RenderViewport(key = "compact") {
  hooks.cursor = 0;
  const result = useCanvasViewport(surface, busy, cancel, key);
  hooks.layout.splice(0).forEach((run) => run());
  hooks.effects.splice(0).forEach((run) => run());
  return result;
}
const view = () => ({
  zoom: useEditorStore.getState().zoom,
  pan: useEditorStore.getState().pan,
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
  hooks.cursor = 0;
  hooks.slots = [];
  hooks.layout = [];
  hooks.effects = [];
  hooks.cleanups = [];
  cancel.mockClear();
  // Keep the same ref and surface throughout a transition.
  Object.defineProperty(surface.current, "clientWidth", {
    value: 900,
    writable: true,
    configurable: true,
  });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("document", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  useEditorStore.setState({
    doc: createDocument(),
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
});
afterEach(() => {
  hooks.cleanups.forEach((cleanup) => cleanup());
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("navigation layout viewport preservation", () => {
  it("fits on initial mount and ordinary observer resize", () => {
    RenderViewport();
    const fitted = view();
    expect(fitted.zoom).not.toBe(1);
    Object.defineProperty(surface.current, "clientWidth", { value: 600 });
    resize();
    expect(view()).not.toEqual(fitted);
  });
  it.each(["expanded", "compact", "phone"])(
    "preserves zoom/pan throughout a %s transition while retaining fit mode",
    (key) => {
      RenderViewport(key === "compact" ? "expanded" : "compact");
      const before = view();
      RenderViewport(key);
      Object.defineProperty(surface.current, "clientWidth", { value: 600 });
      for (const elapsed of [0, 100, 220, 319]) {
        vi.setSystemTime(1000 + elapsed);
        resize();
        expect(view()).toEqual(before);
      }
      expect(cancel).toHaveBeenCalled();
      vi.setSystemTime(1320);
      resize();
      expect(view()).not.toEqual(before);
    },
  );
  it("restarts the guard on rapid toggles", () => {
    RenderViewport();
    const before = view();
    RenderViewport("expanded");
    vi.setSystemTime(1200);
    RenderViewport("compact");
    Object.defineProperty(surface.current, "clientWidth", { value: 600 });
    vi.setSystemTime(1400);
    resize();
    expect(view()).toEqual(before);
    vi.setSystemTime(1520);
    resize();
    expect(view()).not.toEqual(before);
  });
  it("keeps manually positioned view out of automatic fit mode", () => {
    const viewport = RenderViewport();
    viewport.manual();
    useEditorStore.getState().setView(0.63, { x: 12, y: 34 });
    const manual = view();
    RenderViewport("expanded");
    vi.setSystemTime(2000);
    Object.defineProperty(surface.current, "clientWidth", { value: 600 });
    resize();
    expect(view()).toEqual(manual);
  });
  it("allows explicit Fit and document format changes immediately inside the guard", () => {
    RenderViewport();
    const viewport = RenderViewport("expanded");
    Object.defineProperty(surface.current, "clientWidth", { value: 600 });
    const before = view();
    viewport.fit();
    expect(view()).not.toEqual(before);
    const fitted = view();
    const doc = useEditorStore.getState().doc!;
    useEditorStore.setState({
      doc: { ...doc, format: { ...doc.format, width: 500, height: 500 } },
    });
    RenderViewport("expanded");
    expect(view()).not.toEqual(fitted);
  });
});
