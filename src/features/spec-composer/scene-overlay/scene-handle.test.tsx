import { renderToStaticMarkup } from "react-dom/server";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SceneHandle } from "./SceneHandle";
import { useEditorStore } from "../store";

vi.mock("../store", async (importOriginal) => {
  const original = await importOriginal<typeof import("../store")>();
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
const visit = (node: ReactNode): ReactElement<Props>[] =>
  Array.isArray(node)
    ? node.flatMap(visit)
    : isValidElement<Props>(node)
      ? [node, ...visit(node.props.children)]
      : [];

/** Calls SceneHandle directly (not as JSX), inside a real React render pass
 * (an <svg> wrapper rendered via renderToStaticMarkup), so hooks work and
 * its own circles — direct children of its return — are reachable via
 * `visit`, mirroring environment-panel.test.tsx's `interact`. */
function renderHandle(props: Parameters<typeof SceneHandle>[0]) {
  let view: ReactElement<Props>[] = [];
  function Wrapper() {
    const tree = SceneHandle(props);
    view = visit(tree);
    return <svg>{tree}</svg>;
  }
  renderToStaticMarkup(<Wrapper />);
  return view;
}

const baseProps = {
  id: "sun-1",
  label: "Sunlight 1",
  canvas: { x: 0.2, y: 0.4 },
  rotation: 0,
  selected: false,
  format: { width: 1000, height: 1000 },
  pan: { x: 0, y: 0 },
  zoom: 1,
};

describe("SceneHandle keyboard operability", () => {
  it("exposes a focusable, labeled move handle with a >= 32px hit area", () => {
    const view = renderHandle(baseProps);
    const moveHandle = view.find((n) => n.props["className"] === "scene-handle-hit");
    expect(moveHandle).toBeDefined();
    expect(moveHandle!.props["tabIndex"]).toBe(0);
    expect(moveHandle!.props["role"]).toBe("button");
    expect(moveHandle!.props["aria-label"]).toBe("Sunlight 1");
    expect(moveHandle!.props["r"]).toBeGreaterThanOrEqual(16); // diameter >= 32px
  });

  it("nudges the canvas position on arrow keys, with a larger step when Shift is held", () => {
    const view = renderHandle(baseProps);
    const moveHandle = view.find((n) => n.props["className"] === "scene-handle-hit");
    const onKeyDown = moveHandle!.props["onKeyDown"] as (e: unknown) => void;

    let lastPatch: unknown;
    useEditorStore.setState({
      commitSceneTransform: (_id: string, patch: unknown) => {
        lastPatch = patch;
      },
    } as never);

    onKeyDown({ key: "ArrowRight", shiftKey: false, preventDefault: () => {} });
    expect(lastPatch).toEqual({ canvas: { x: 0.22, y: 0.4 } });

    onKeyDown({ key: "ArrowUp", shiftKey: true, preventDefault: () => {} });
    expect(lastPatch).toEqual({ canvas: { x: 0.2, y: 0.5 } });
  });

  it("selects the object on Enter or Space", () => {
    const view = renderHandle(baseProps);
    const moveHandle = view.find((n) => n.props["className"] === "scene-handle-hit");
    const onKeyDown = moveHandle!.props["onKeyDown"] as (e: unknown) => void;

    let selectedId: string | null = null;
    useEditorStore.setState({
      selectScene: (id: string | null) => {
        selectedId = id;
      },
    } as never);

    onKeyDown({ key: "Enter", preventDefault: () => {} });
    expect(selectedId).toBe("sun-1");
  });

  it("gives the rotate handle its own focusable, labeled, >= 32px hit area once selected", () => {
    const view = renderHandle({ ...baseProps, selected: true });
    const rotateHandle = view.find(
      (n) => n.props["className"] === "scene-handle-rotate-hit",
    );
    expect(rotateHandle).toBeDefined();
    expect(rotateHandle!.props["tabIndex"]).toBe(0);
    expect(rotateHandle!.props["role"]).toBe("button");
    expect(rotateHandle!.props["aria-label"]).toBe("Rotate Sunlight 1");
    expect(rotateHandle!.props["r"]).toBeGreaterThanOrEqual(16);
  });

  it("does not render a rotate handle when unselected", () => {
    const view = renderHandle(baseProps);
    expect(
      view.some((n) => n.props["className"] === "scene-handle-rotate-hit"),
    ).toBe(false);
  });
});
