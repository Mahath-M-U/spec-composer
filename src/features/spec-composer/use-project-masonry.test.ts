import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectMasonry } from "./use-project-masonry";

// Exercise the real observer/ref lifecycle with the existing Node hook-runner pattern.
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
const frames = new Map<number, () => void>();
let nextFrame = 1;
let settings: WeakMap<
  HTMLElement,
  { minWidth: string; maxColumns: string; gap: string }
>;
const cancelFrame = vi.fn((id: number) => frames.delete(id));
function style() {
  const values = new Map<string, string>();
  return {
    getPropertyValue: (name: string) => values.get(name) ?? "",
    setProperty: (name: string, value: string) => values.set(name, value),
    removeProperty: (name: string) => {
      const previous = values.get(name) ?? "";
      values.delete(name);
      return previous;
    },
    get gridRowEnd() {
      return values.get("grid-row-end") ?? "";
    },
    set gridRowEnd(value: string) {
      values.set("grid-row-end", value);
    },
    get height() {
      return values.get("height") ?? "";
    },
  } as unknown as CSSStyleDeclaration;
}
function item(height: number) {
  return {
    offsetHeight: height,
    style: style(),
    classList: { contains: (name: string) => name === "project-masonry-item" },
    getBoundingClientRect: vi.fn(() => {
      throw new Error("Do not measure transformed card bounds");
    }),
  } as unknown as HTMLElement;
}
function container(width: number, items: HTMLElement[], maxColumns = "5") {
  const node = {
    clientWidth: width,
    children: items,
    style: style(),
    dataset: {},
  } as unknown as HTMLDivElement;
  settings.set(node, { minWidth: "210px", maxColumns, gap: "20px" });
  return node;
}
function RenderProjectMasonry(key: string) {
  hooks.cursor = 0;
  return useProjectMasonry(key);
}
function render(key = "initial") {
  let result: ReturnType<typeof useProjectMasonry>;
  do {
    hooks.dirty = false;
    result = RenderProjectMasonry(key);
    hooks.effects.splice(0).forEach((run) => run());
  } while (hooks.dirty);
  return result;
}
function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((run) => run());
}
function unmount() {
  for (const value of hooks.slots) {
    const slot = value as EffectSlot;
    slot.cleanup?.();
    slot.cleanup = undefined;
  }
}
function mount(node: HTMLDivElement, key = "initial") {
  const ref = render(key);
  ref(node);
  expect(render(key)).toBe(ref);
  flushFrames();
  return ref;
}

beforeEach(() => {
  hooks.cursor = 0;
  hooks.slots = [];
  hooks.effects = [];
  hooks.dirty = false;
  observers.length = 0;
  frames.clear();
  nextFrame = 1;
  settings = new WeakMap();
  cancelFrame.mockClear();
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", cancelFrame);
  vi.stubGlobal("getComputedStyle", (node: HTMLElement) => {
    const configuration = settings.get(node);
    return configuration
      ? {
          getPropertyValue: (name: string) =>
            name === "--project-masonry-min-width"
              ? configuration.minWidth
              : name === "--project-masonry-max-columns"
                ? configuration.maxColumns
                : "",
          columnGap: configuration.gap,
        }
      : { marginBottom: "28px" };
  });
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

describe("My designs measured masonry", () => {
  it("fills the first four columns in source order and packs intrinsic heights without changing card height", () => {
    const cards = [item(160), item(260), item(190), item(300)];
    const grid = container(900, cards);
    expect(frames.size).toBe(0);
    mount(grid);
    expect(grid.style.getPropertyValue("--project-masonry-columns")).toBe("4");
    expect(grid.dataset["projectMasonry"]).toBe("ready");
    expect(Array.from(grid.children)).toEqual(cards);
    expect(cards.map((card) => card.style.gridRowEnd)).toEqual([
      "span 188",
      "span 288",
      "span 218",
      "span 328",
    ]);
    for (const card of cards) {
      expect(card.style.height).toBe("");
      expect(card.getBoundingClientRect).not.toHaveBeenCalled();
    }
    expect(observers[0]!.observe.mock.calls.map(([node]) => node)).toEqual([
      grid,
      ...cards,
    ]);
  });

  it("uses four full-width columns for four designs even when five could fit", () => {
    const grid = container(1800, [item(100), item(200), item(300), item(400)]);
    mount(grid);
    expect(grid.style.getPropertyValue("--project-masonry-columns")).toBe("4");
  });

  it("uses responsive CSS capacity and batches width and item resizes into one frame", () => {
    const cards = Array.from({ length: 6 }, () => item(150));
    const grid = container(1800, cards);
    mount(grid);
    expect(grid.style.getPropertyValue("--project-masonry-columns")).toBe("5");
    Object.assign(grid, { clientWidth: 440 });
    Object.assign(cards[0]!, { offsetHeight: 210 });
    observers[0]!.resize();
    observers[0]!.resize();
    observers[0]!.resize();
    expect(frames.size).toBe(1);
    flushFrames();
    expect(grid.style.getPropertyValue("--project-masonry-columns")).toBe("2");
    expect(cards[0]!.style.gridRowEnd).toBe("span 238");
    Object.assign(grid, { clientWidth: 800 });
    settings.get(grid)!.maxColumns = "2";
    observers[0]!.resize();
    flushFrames();
    expect(grid.style.getPropertyValue("--project-masonry-columns")).toBe("2");
    settings.get(grid)!.maxColumns = "1";
    observers[0]!.resize();
    flushFrames();
    expect(grid.style.getPropertyValue("--project-masonry-columns")).toBe("1");
    Object.assign(grid, { clientWidth: 100 });
    settings.get(grid)!.maxColumns = "5";
    observers[0]!.resize();
    flushFrames();
    expect(grid.style.getPropertyValue("--project-masonry-columns")).toBe("1");
  });

  it("rebinds observed wrappers after replacement, filtering and sorting on a reused container", () => {
    const first = item(100),
      second = item(200),
      added = item(300);
    const grid = container(900, [first, second]);
    mount(grid, "loading");
    Object.assign(grid, { children: [added, second] });
    render("added,second");
    flushFrames();
    expect(observers[0]!.disconnect).toHaveBeenCalledTimes(1);
    expect(observers[1]!.observe.mock.calls.map(([node]) => node)).toEqual([
      grid,
      added,
      second,
    ]);
    expect(first.style.gridRowEnd).toBe("");
    expect(grid.style.getPropertyValue("--project-masonry-columns")).toBe("2");
    Object.assign(grid, { children: [second, added] });
    render("second,added");
    flushFrames();
    expect(observers[1]!.disconnect).toHaveBeenCalledTimes(1);
    expect(observers[2]!.observe.mock.calls.map(([node]) => node)).toEqual([
      grid,
      second,
      added,
    ]);
    expect(Array.from(grid.children)).toEqual([second, added]);
    Object.assign(grid, { children: [second] });
    render("second");
    flushFrames();
    expect(observers[2]!.disconnect).toHaveBeenCalledTimes(1);
    expect(observers[3]!.observe.mock.calls.map(([node]) => node)).toEqual([
      grid,
      second,
    ]);
    expect(grid.style.getPropertyValue("--project-masonry-columns")).toBe("1");
  });

  it("disconnects and cancels queued work when the container is replaced or detached", () => {
    const first = container(900, [item(200)]);
    const ref = mount(first);
    observers[0]!.resize();
    const queued = [...frames.keys()][0]!;
    const second = container(900, [item(300), item(400)]);
    ref(second);
    render();
    expect(observers[0]!.disconnect).toHaveBeenCalledTimes(1);
    expect(cancelFrame).toHaveBeenCalledWith(queued);
    expect(first.dataset["projectMasonry"]).toBeUndefined();
    expect(first.style.getPropertyValue("--project-masonry-columns")).toBe("");
    flushFrames();
    expect(second.style.getPropertyValue("--project-masonry-columns")).toBe(
      "2",
    );
    ref(null);
    render();
    expect(observers[1]!.disconnect).toHaveBeenCalledTimes(1);
    expect(second.dataset["projectMasonry"]).toBeUndefined();
  });

  it("cleans up the observer, queued frame and spans on unmount", () => {
    const card = item(200);
    const grid = container(900, [card]);
    mount(grid);
    observers[0]!.resize();
    const queued = [...frames.keys()][0]!;
    unmount();
    expect(observers[0]!.disconnect).toHaveBeenCalledTimes(1);
    expect(cancelFrame).toHaveBeenCalledWith(queued);
    expect(frames.size).toBe(0);
    expect(card.style.gridRowEnd).toBe("");
    observers[0]!.resize();
    expect(frames.size).toBe(0);
  });
});
