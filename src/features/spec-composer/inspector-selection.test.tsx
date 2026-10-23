import {
  createElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { openStyleEditor } from "./inspector-navigation";
import { CanvasWorkspace } from "./canvas-surface";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import { createElement as createSpecElement } from "./registry";
import type { PanelMode } from "./types";
import type { SidebarLayout } from "./use-sidebar-layout";

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
const canvas = vi.hoisted(() => {
  const captured = new Set<number>();
  return {
    captured,
    owner: {
      focus: vi.fn(),
      setPointerCapture: vi.fn((id: number) => captured.add(id)),
      hasPointerCapture: (id: number) => captured.has(id),
      releasePointerCapture: vi.fn((id: number) => captured.delete(id)),
    },
    busy: undefined as { current: boolean } | undefined,
    spaceHeld: { current: false },
    manual: vi.fn(),
  };
});
vi.mock("./use-canvas-viewport", () => ({
  useCanvasViewport: (
    surface: { current: unknown },
    busy: { current: boolean },
  ) => {
    surface.current = canvas.owner;
    canvas.busy = busy;
    return {
      space: canvas.spaceHeld.current,
      spaceHeld: canvas.spaceHeld,
      manual: canvas.manual,
      fit: vi.fn(),
      zoom: vi.fn(),
      localPoint: (x: number, y: number) => ({ x, y }),
      toDoc: (x: number, y: number) => ({ x, y }),
    };
  },
}));
const state = () => useEditorStore.getState();
const doc = () => state().doc!;
const sidebar = (overlay = false, leftOpen = false): SidebarLayout => ({
  overlay,
  leftOpen,
  rightOpen: true,
  setOpen: vi.fn(),
  toggle: vi.fn(),
  closeDrawers: vi.fn(),
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  canvas.captured.clear();
  canvas.spaceHeld.current = false;
  const document = createDocument();
  document.elements = [0, 1].map((i) => ({
    ...createSpecElement("shape", document.format, i),
    id: String(i),
    x: 20 + i * 200,
    y: 20,
    width: 100,
    height: 80,
  }));
  useEditorStore.setState({
    doc: document,
    selectedIds: ["0"],
    selectedGroupIds: [],
    backgroundSelected: false,
    panel: "assets",
    styleTab: "layout",
    tool: "select",
    zoom: 1,
    pan: { x: 0, y: 0 },
    guides: [],
    past: [],
    future: [],
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("intentional inspector navigation", () => {
  const panels: PanelMode[] = [
    "assets",
    "environment",
    "layers",
    "templates",
    "brandKit",
    "resize",
    "style",
  ];
  for (const overlay of [false, true])
    for (const leftOpen of [false, true])
      it.each(panels)(
        `reveals from %s (overlay=${overlay}, open=${leftOpen})`,
        (panel) => {
          useEditorStore.setState({ panel });
          const layout = sidebar(overlay, leftOpen);
          const original = doc();
          openStyleEditor(layout, { preserveActiveTab: true });
          expect(state().panel).toBe("style");
          expect(state().styleTab).toBe(panel === "style" ? "layout" : "style");
          expect(state().doc).toBe(original);
          if (leftOpen) expect(layout.setOpen).not.toHaveBeenCalled();
          else
            expect(layout.setOpen).toHaveBeenCalledExactlyOnceWith(
              "left",
              true,
            );
        },
      );
  it("preserves both inspector tabs for canvas reselection/reopening while explicit prompt navigation selects Style", () => {
    for (const tab of ["style", "layout"] as const) {
      useEditorStore.setState({ panel: "style", styleTab: tab });
      openStyleEditor(sidebar(true), { preserveActiveTab: true });
      expect(state().styleTab).toBe(tab);
    }
    openStyleEditor(sidebar(true));
    expect(state().styleTab).toBe("style");
  });
  it("reveals background selection but ignores missing documents and empty/invalid selections", () => {
    useEditorStore.setState({ selectedIds: [], backgroundSelected: true });
    const layout = sidebar(true);
    openStyleEditor(layout, { preserveActiveTab: true });
    expect(layout.setOpen).toHaveBeenCalledWith("left", true);
    expect(state().panel).toBe("style");
    for (const selectedIds of [[], ["missing"]]) {
      useEditorStore.setState({
        selectedIds,
        backgroundSelected: false,
        panel: "assets",
        styleTab: "layout",
      });
      const empty = sidebar();
      openStyleEditor(empty);
      expect(empty.setOpen).not.toHaveBeenCalled();
      expect(state().panel).toBe("assets");
      expect(state().styleTab).toBe("layout");
    }
    useEditorStore.setState({
      doc: undefined,
      selectedIds: ["0"],
      backgroundSelected: true,
    });
    const missing = sidebar();
    openStyleEditor(missing);
    expect(missing.setOpen).not.toHaveBeenCalled();
  });
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
    find: (test: (node: ReactElement<Props>) => boolean) => {
      const result = nodes.find(test);
      expect(result).toBeDefined();
      return result!;
    },
  };
}
type View = ReturnType<typeof inspect>;
const surface = (view: View) =>
  view.find((node) => node.props["aria-label"] === "Design canvas");
const call = (view: View, handler: string, event: unknown) =>
  (surface(view).props[handler] as (event: unknown) => void)(event);
function interact(notify: () => void, actions: Array<(view: View) => void>) {
  function Capture() {
    const [step, setStep] = useState(0);
    const tree = CanvasWorkspace({ children: null, onCanvasSelect: notify });
    const view = inspect(tree);
    if (step < actions.length) {
      actions[step]!(view);
      setStep(step + 1);
    }
    return tree;
  }
  return renderToStaticMarkup(
    createElement(TooltipProvider, null, createElement(Capture)),
  );
}
function pointer({
  id,
  handle,
  selection = false,
  editing = false,
  x = 30,
  y = 30,
  ...extra
}: {
  id?: string;
  handle?: string;
  selection?: boolean;
  editing?: boolean;
  x?: number;
  y?: number;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
} = {}) {
  return {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    clientX: x,
    clientY: y,
    currentTarget: canvas.owner,
    preventDefault: vi.fn(),
    target: {
      closest: (selector: string) =>
        selector === "[data-element-id]" && id
          ? { dataset: { elementId: id } }
          : selector === "[data-resize-handle]" && handle
            ? { dataset: { resizeHandle: handle } }
            : (selector === "[data-selection-body]" && selection) ||
                (selector === "[data-text-editing]" && editing)
              ? {}
              : null,
    },
    ...extra,
  };
}
describe("canvas selection intent", () => {
  it.each([false, true])(
    "notifies once after cleanup for a %s reselected layer and opens the inspector from Assets",
    (reselected) => {
      useEditorStore.setState({ selectedIds: reselected ? ["0"] : [] });
      const layout = sidebar(true);
      const notify = vi.fn(() => {
        expect(canvas.busy?.current).toBe(false);
        expect(canvas.captured.size).toBe(0);
        openStyleEditor(layout, { preserveActiveTab: true });
      });
      interact(notify, [
        (view) => {
          call(view, "onPointerDown", pointer({ id: "0" }));
          expect(notify).not.toHaveBeenCalled();
        },
        (view) => call(view, "onPointerUp", pointer({ id: "0" })),
        (view) => call(view, "onPointerUp", pointer({ id: "0" })),
      ]);
      expect(notify).toHaveBeenCalledTimes(1);
      expect(state().panel).toBe("style");
      expect(layout.setOpen).toHaveBeenCalledWith("left", true);
      expect(state().past).toHaveLength(0);
    },
  );
  it.each(["drag", "resize"])(
    "notifies only after %s geometry commit and pointer cleanup",
    (kind) => {
      const notify = vi.fn(() => {
        expect(canvas.captured.size).toBe(0);
        expect(canvas.busy?.current).toBe(false);
        expect(state().past).toHaveLength(1);
      });
      const event =
        kind === "resize" ? { handle: "se", selection: true } : { id: "0" };
      interact(notify, [
        (view) => call(view, "onPointerDown", pointer(event)),
        (view) => {
          call(view, "onPointerMove", pointer({ ...event, x: 70, y: 70 }));
          expect(notify).not.toHaveBeenCalled();
        },
        (view) =>
          call(view, "onPointerUp", pointer({ ...event, x: 70, y: 70 })),
      ]);
      expect(notify).toHaveBeenCalledTimes(1);
    },
  );
  it.each(["locked", "hidden"])(
    "reveals %s selected members without capture, transform, or document mutation",
    (mode) => {
      const original = doc();
      if (mode === "locked") {
        doc().elements[0]!.locked = true;
        useEditorStore.setState({ selectedIds: [] });
      } else {
        doc().elements[1]!.visible = false;
        useEditorStore.setState({ selectedIds: ["0", "1"] });
      }
      const notify = vi.fn(() => {
        expect(canvas.busy?.current).toBe(false);
        expect(canvas.captured.size).toBe(0);
      });
      const event = pointer({ id: "0" });
      interact(notify, [
        (view) => call(view, "onPointerDown", event),
        (view) => call(view, "onPointerUp", event),
      ]);
      expect(notify).toHaveBeenCalledTimes(1);
      expect(canvas.owner.setPointerCapture).not.toHaveBeenCalled();
      expect(state().doc).toBe(original);
      expect(state().past).toHaveLength(0);
    },
  );
  it("notifies modifier additions immediately, but not final removal to empty", () => {
    const notify = vi.fn();
    interact(notify, [
      (view) => {
        call(view, "onPointerDown", pointer({ id: "1", shiftKey: true }));
        expect(notify).toHaveBeenCalledTimes(1);
        expect(state().selectedIds).toEqual(["0", "1"]);
      },
      () => state().selectMany(["0"]),
      (view) =>
        call(view, "onPointerDown", pointer({ id: "0", ctrlKey: true })),
    ]);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(state().selectedIds).toEqual([]);
    expect(canvas.owner.setPointerCapture).not.toHaveBeenCalled();
  });
  it("reveals a nonempty marquee or clicked background only after cleanup", () => {
    const notify = vi.fn(() => {
      expect(canvas.captured.size).toBe(0);
    });
    interact(notify, [
      (view) => call(view, "onPointerDown", pointer({ x: 0, y: 0 })),
      (view) => call(view, "onPointerMove", pointer({ x: 150, y: 150 })),
      (view) => call(view, "onPointerUp", pointer({ x: 150, y: 150 })),
      (view) => call(view, "onPointerDown", pointer({ x: 500, y: 500 })),
      (view) => call(view, "onPointerUp", pointer({ x: 500, y: 500 })),
    ]);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(state().backgroundSelected).toBe(true);
  });
  it.each(["empty marquee", "outside click", "pan", "space pan", "cancel"])(
    "does not reveal for %s",
    (mode) => {
      const notify = vi.fn();
      if (mode === "pan") state().setTool("hand");
      if (mode === "space pan") canvas.spaceHeld.current = true;
      const start =
        mode === "outside click"
          ? pointer({ x: -50, y: -50 })
          : mode === "cancel"
            ? pointer({ id: "0" })
            : pointer({ x: 700, y: 700 });
      interact(notify, [
        (view) => call(view, "onPointerDown", start),
        (view) => {
          if (mode !== "outside click")
            call(view, "onPointerMove", pointer({ x: 850, y: 850 }));
        },
        (view) =>
          call(
            view,
            mode === "cancel" ? "onPointerCancel" : "onPointerUp",
            mode === "outside click" ? start : pointer({ x: 850, y: 850 }),
          ),
      ]);
      expect(notify).not.toHaveBeenCalled();
      expect(canvas.captured.size).toBe(0);
    },
  );
  it("keeps direct text editing, caret clicks and typing from reopening the inspector", () => {
    doc().elements[0]!.kind = "title";
    doc().elements[0]!.content = "Editable text";
    const notify = vi.fn(),
      event = pointer({ id: "0", editing: true });
    const html = interact(notify, [
      (view) =>
        call(view, "onKeyDown", { key: "Enter", preventDefault: vi.fn() }),
      (view) => call(view, "onPointerDown", event),
      (view) => call(view, "onKeyDown", { key: "a", preventDefault: vi.fn() }),
    ]);
    expect(html).toContain("data-text-editing");
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
    expect(canvas.owner.setPointerCapture).not.toHaveBeenCalled();
    expect(doc().elements[0]!.content).toBe("Editable text");
  });
});
