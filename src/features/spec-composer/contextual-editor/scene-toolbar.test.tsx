import {
  createElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SceneControlInput, SceneObjectToolbar } from "./SceneObjectToolbar";
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
import { createSceneCamera, createSceneLight } from "../scene-objects";
import { controlsForSceneObject } from "../scene-controls";
import { resolveSceneObject } from "../scene-controls-store";
import type { StudioLight } from "../types";

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

const state = () => useEditorStore.getState();
const doc = () => state().doc!;

function setup(lights: StudioLight[] = []) {
  const document = createDocument();
  document.generationSettings = {
    camera: createSceneCamera(),
    ambient: { enabled: true, intensity: 40, temperature: 4800 },
    ...(lights.length ? { studioLights: lights } : {}),
  };
  useEditorStore.setState({
    doc: document,
    pan: { x: 0, y: 0 },
    zoom: 1,
    past: [],
    future: [],
    selectedSceneId: null,
  });
  return document;
}

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
/** Mirrors style-panel.test.tsx's `capture`: renders once inside a stateful
 * wrapper so the SAME hook state (e.g. useCoalescedSceneEdit's refs) is
 * reused across a scripted sequence of actions, each a step of a
 * render-phase update rather than a full remount. */
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
const control = (view: View) =>
  view.find((node) => node.type === "input" || node.type === "select" || node.type === "button");

describe("SceneObjectToolbar", () => {
  it("renders nothing when the id does not resolve to a scene object", () => {
    setup();
    const html = renderToStaticMarkup(
      createElement(SceneObjectToolbar, { id: "missing-light", format: doc().format, pan: { x: 0, y: 0 }, zoom: 1 }),
    );
    expect(html).toBe("");
  });

  it("shows the camera's framing, angle, perspective and rotation controls", () => {
    setup();
    const html = renderToStaticMarkup(
      createElement(SceneObjectToolbar, { id: "camera", format: doc().format, pan: { x: 0, y: 0 }, zoom: 1 }),
    );
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Camera controls"');
    expect(html).toContain('class="floating-contextual-toolbar ui-toolbar"');
    for (const label of ["Focal length", "Angle", "Perspective", "Rotation"])
      expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain("Open Design Inspector");
  });

  it("shows ambient's enabled toggle, intensity and temperature", () => {
    setup();
    const html = renderToStaticMarkup(
      createElement(SceneObjectToolbar, { id: "ambient", format: doc().format, pan: { x: 0, y: 0 }, zoom: 1 }),
    );
    expect(html).toContain('aria-label="Ambient controls"');
    for (const label of ["Enabled", "Intensity", "Temperature"])
      expect(html).toContain(`aria-label="${label}"`);
  });

  it.each([
    ["sun", ["Elevation", "Softness"]],
    ["spot", ["Cone angle", "Softness"]],
    ["point", ["Influence radius"]],
    ["area", ["Width", "Height", "Spread"]],
    ["diffused", ["Width", "Height", "Spread"]],
  ] as const)("shows %s's kind-specific controls plus the shared light set", (kind, extra) => {
    const light = createSceneLight(kind, []);
    setup([light]);
    const html = renderToStaticMarkup(
      createElement(SceneObjectToolbar, { id: light.id, format: doc().format, pan: { x: 0, y: 0 }, zoom: 1 }),
    );
    for (const label of ["Type", "Intensity", "Temperature", "Color", "Direction", "Shadows", "Duplicate", "Delete", ...extra])
      expect(html).toContain(`aria-label="${label}"`);
  });

  it("labels a Rim light's intensity as edge intensity", () => {
    const light = createSceneLight("spot", [], undefined, { role: "Rim", depth: "back" });
    setup([light]);
    const html = renderToStaticMarkup(
      createElement(SceneObjectToolbar, { id: light.id, format: doc().format, pan: { x: 0, y: 0 }, zoom: 1 }),
    );
    expect(html).toContain('aria-label="Edge intensity"');
    expect(html).not.toContain('aria-label="Intensity"');
    expect(html).toContain('aria-label="Rim controls"');
  });

  it("the Inspector button sets panel and style tab", () => {
    setup();
    useEditorStore.setState({ panel: "environment", styleTab: "layout" });
    const onOpenInspector = vi.fn();
    const { html, ...view } = capture(() =>
      SceneObjectToolbar({ id: "camera", format: doc().format, pan: { x: 0, y: 0 }, zoom: 1, onOpenInspector }),
    );
    expect(html).toContain("Open Design Inspector");
    const button = view.find((node) => node.props["aria-label"] === "Open Design Inspector");
    call(button, "onClick");
    expect(state().panel).toBe("style");
    expect(state().styleTab).toBe("style");
    expect(onOpenInspector).toHaveBeenCalledOnce();
  });
});

/** Exercises SceneControlInput directly (the toolbar's per-descriptor row)
 * so a pointer-bracketed sequence of events shares the SAME
 * useCoalescedSceneEdit ref state across steps — see `capture` above. */
describe("SceneControlInput edit history", () => {
  let light: StudioLight;
  beforeEach(() => {
    light = createSceneLight("sun", []);
    setup([light]);
  });
  // Recomputes the live ref on every render-phase replay (see `capture`);
  // returns null once a deleting action makes the light stop resolving, so
  // a late replay (after `step` already exhausted the actions) doesn't
  // crash on a stale/missing object.
  const render = (key: string) => () => {
    const current = resolveSceneObject(doc(), light.id);
    if (!current) return null;
    const descriptor = controlsForSceneObject(current).find((d) => d.key === key)!;
    return SceneControlInput({ id: light.id, objectRef: current, descriptor });
  };

  it("coalesces a slider drag into a single history entry and undoes it in one step", () => {
    const original = light.intensity;
    const historyBefore = state().past.length;
    capture(render("intensity"), [
      (view) => call(control(view), "onPointerDown"),
      (view) => call(control(view), "onChange", { target: { value: "10" } }),
      (view) => {
        expect(state().past.length).toBe(historyBefore + 1);
        call(control(view), "onChange", { target: { value: "20" } });
      },
      (view) => {
        expect(state().past.length).toBe(historyBefore + 1);
        call(control(view), "onChange", { target: { value: "30" } });
      },
      (view) => call(control(view), "onPointerUp"),
    ]);
    expect(state().past.length).toBe(historyBefore + 1);
    expect(doc().generationSettings!.studioLights![0]!.intensity).toBe(30);
    state().undo();
    expect(doc().generationSettings!.studioLights![0]!.intensity).toBe(original);
  });

  it("treats changes outside a pointer gesture as discrete, one history entry each", () => {
    const historyBefore = state().past.length;
    capture(render("intensity"), [
      (view) => call(control(view), "onChange", { target: { value: "15" } }),
    ]);
    expect(state().past.length).toBe(historyBefore + 1);
    expect(doc().generationSettings!.studioLights![0]!.intensity).toBe(15);
    capture(render("intensity"), [
      (view) => call(control(view), "onChange", { target: { value: "25" } }),
    ]);
    expect(state().past.length).toBe(historyBefore + 2);
    expect(doc().generationSettings!.studioLights![0]!.intensity).toBe(25);
  });

  it("commits each discrete select change as its own history entry", () => {
    const historyBefore = state().past.length;
    capture(render("shadows"), [
      (view) => call(control(view), "onChange", { target: { value: "Soft" } }),
    ]);
    expect(state().past.length).toBe(historyBefore + 1);
    expect(doc().generationSettings!.studioLights![0]!.shadows).toBe("Soft");
    capture(render("shadows"), [
      (view) => call(control(view), "onChange", { target: { value: "None" } }),
    ]);
    expect(state().past.length).toBe(historyBefore + 2);
    expect(doc().generationSettings!.studioLights![0]!.shadows).toBe("None");
  });

  it("the duplicate button commits once and selects the copy", () => {
    const historyBefore = state().past.length;
    capture(render("duplicate"), [(view) => call(control(view), "onClick")]);
    expect(doc().generationSettings!.studioLights).toHaveLength(2);
    expect(state().past.length).toBe(historyBefore + 1);
    expect(state().selectedSceneId).not.toBe(light.id);
  });

  it("the delete button commits once and clears the selection", () => {
    useEditorStore.setState({ selectedSceneId: light.id });
    const historyBefore = state().past.length;
    capture(render("delete"), [(view) => call(control(view), "onClick")]);
    expect(doc().generationSettings?.studioLights?.some((l) => l.id === light.id)).toBe(false);
    expect(state().past.length).toBe(historyBefore + 1);
    expect(state().selectedSceneId).toBeNull();
  });
});
