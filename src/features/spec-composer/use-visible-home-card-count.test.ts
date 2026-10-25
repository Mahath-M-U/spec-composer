import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVisibleHomeCardCount } from "./use-visible-home-card-count";

// Exercise callback-ref attachment and effect cleanup in the existing Node environment.
const hooks = vi.hoisted(() => ({
  cursor: 0,
  slots: [] as unknown[],
  effects: [] as (() => void)[],
  dirty: false,
}));
type EffectSlot = {
  deps: readonly unknown[];
  cleanup?: (() => void) | undefined;
};
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  const sameDeps = (before: readonly unknown[], after: readonly unknown[]) =>
    before.length === after.length &&
    after.every((dep, index) => Object.is(dep, before[index]));
  return {
    ...original,
    useState: (initial: unknown) => {
      const index = hooks.cursor++;
      type StateSlot = { value: unknown; set: (next: unknown) => void };
      let slot = hooks.slots[index] as StateSlot | undefined;
      if (!slot) {
        slot = {
          value: initial,
          set: (next) => {
            const state = hooks.slots[index] as StateSlot;
            const value = typeof next === "function" ? next(state.value) : next;
            if (!Object.is(value, state.value)) {
              state.value = value;
              hooks.dirty = true;
            }
          },
        };
        hooks.slots[index] = slot;
      }
      return [slot.value, slot.set];
    },
    useCallback: <T>(value: T, deps: readonly unknown[]) => {
      const index = hooks.cursor++;
      const previous = hooks.slots[index] as
        { value: T; deps: readonly unknown[] } | undefined;
      if (previous && sameDeps(previous.deps, deps)) return previous.value;
      hooks.slots[index] = { value, deps };
      return value;
    },
    useEffect: (
      callback: () => void | (() => void),
      deps: readonly unknown[],
    ) => {
      const index = hooks.cursor++;
      const previous = hooks.slots[index] as EffectSlot | undefined;
      if (previous && sameDeps(previous.deps, deps)) return;
      const slot: EffectSlot = { deps, cleanup: previous?.cleanup };
      hooks.slots[index] = slot;
      hooks.effects.push(() => {
        slot.cleanup?.();
        slot.cleanup = callback() || undefined;
      });
    },
  };
});

const observers: {
  resize: () => void;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}[] = [];
let settings: WeakMap<HTMLDivElement, { minWidth: string; gap: string }>;
function container(width: number, minWidth = "210px", gap = "20px") {
  const node = { clientWidth: width } as HTMLDivElement;
  settings.set(node, { minWidth, gap });
  return node;
}
function RenderHomeCardCount() {
  hooks.cursor = 0;
  return useVisibleHomeCardCount();
}
function render() {
  let result: ReturnType<typeof useVisibleHomeCardCount>;
  do {
    hooks.dirty = false;
    result = RenderHomeCardCount();
    hooks.effects.splice(0).forEach((run) => run());
  } while (hooks.dirty);
  return result;
}
function unmount() {
  for (const value of hooks.slots) {
    const slot = value as EffectSlot;
    slot.cleanup?.();
    slot.cleanup = undefined;
  }
}

beforeEach(() => {
  hooks.cursor = 0;
  hooks.slots = [];
  hooks.effects = [];
  hooks.dirty = false;
  observers.length = 0;
  settings = new WeakMap();
  vi.stubGlobal("getComputedStyle", (node: HTMLDivElement) => ({
    getPropertyValue: (property: string) =>
      property === "--home-card-min-width" ? settings.get(node)!.minWidth : "",
    columnGap: settings.get(node)!.gap,
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(public resize: () => void) {
        observers.push(this);
      }
    },
  );
});
afterEach(() => {
  unmount();
  vi.unstubAllGlobals();
});

describe("one-row home card capacity", () => {
  it("measures a strip that attaches after an initially absent empty state, then follows resize", () => {
    const initial = render();
    expect(initial.visibleCount).toBe(1);
    expect(observers).toHaveLength(0);
    const node = container(900);
    initial.containerRef(node);
    const attached = render();
    expect(attached.containerRef).toBe(initial.containerRef);
    expect(attached.visibleCount).toBe(4);
    expect(observers).toHaveLength(1);
    expect(observers[0]!.observe).toHaveBeenCalledWith(node);
    Object.assign(node, { clientWidth: 440 });
    observers[0]!.resize();
    expect(render().visibleCount).toBe(2);
    Object.assign(node, { clientWidth: 100 });
    observers[0]!.resize();
    expect(render().visibleCount).toBe(1);
    expect(observers).toHaveLength(1);
  });

  it("disconnects the replaced strip, measures its replacement, and cleans up on detach", () => {
    const hook = render();
    hook.containerRef(container(900));
    expect(render().visibleCount).toBe(4);
    const replacement = container(440);
    hook.containerRef(replacement);
    expect(render().visibleCount).toBe(2);
    expect(observers[0]!.disconnect).toHaveBeenCalledTimes(1);
    expect(observers[1]!.observe).toHaveBeenCalledWith(replacement);
    hook.containerRef(null);
    render();
    expect(observers[1]!.disconnect).toHaveBeenCalledTimes(1);
    expect(observers).toHaveLength(2);
  });

  it("disconnects the attached strip observer on unmount", () => {
    const hook = render();
    hook.containerRef(container(900));
    render();
    unmount();
    expect(observers[0]!.disconnect).toHaveBeenCalledTimes(1);
  });

  it.each([
    { minWidth: "250px", gap: "30px", expected: 3 },
    { minWidth: "200px", gap: "40px", expected: 3 },
    { minWidth: "", gap: "normal", expected: 4 },
  ])(
    "uses computed width $minWidth and gap $gap",
    ({ minWidth, gap, expected }) => {
      const hook = render();
      hook.containerRef(container(900, minWidth, gap));
      expect(render().visibleCount).toBe(expected);
    },
  );
});
