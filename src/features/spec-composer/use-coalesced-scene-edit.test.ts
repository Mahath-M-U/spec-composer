import { createElement, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useCoalescedSceneEdit } from "./use-coalesced-scene-edit";

/** Renders the hook once inside a stateful wrapper so a scripted sequence
 * of actions replays within the SAME render-phase update, sharing the
 * hook's refs across steps (see contextual-editor/scene-toolbar.test.tsx
 * for the same pattern applied to a real component). */
function run(actions: Array<(hook: ReturnType<typeof useCoalescedSceneEdit<number>>) => void>, apply: (patch: number, history: boolean) => void) {
  function Capture() {
    const [step, setStep] = useState(0);
    const hook = useCoalescedSceneEdit<number>(apply);
    if (step < actions.length) {
      actions[step]!(hook);
      setStep(step + 1);
    }
    return null;
  }
  renderToStaticMarkup(createElement(Capture));
}

describe("useCoalescedSceneEdit", () => {
  it("commits the first change in a drag with history=true and every later one with history=false", () => {
    const calls: Array<[number, boolean]> = [];
    run(
      [
        (hook) => hook.onPointerDown(),
        (hook) => hook.onChange(1),
        (hook) => hook.onChange(2),
        (hook) => hook.onChange(3),
      ],
      (patch, history) => calls.push([patch, history]),
    );
    expect(calls).toEqual([
      [1, true],
      [2, false],
      [3, false],
    ]);
  });

  it("commits every change outside a pointer gesture as its own history entry", () => {
    const calls: Array<[number, boolean]> = [];
    run(
      [(hook) => hook.onChange(1), (hook) => hook.onChange(2)],
      (patch, history) => calls.push([patch, history]),
    );
    expect(calls).toEqual([
      [1, true],
      [2, true],
    ]);
  });

  it("starts a fresh gesture (history=true again) after pointerup, and after pointercancel", () => {
    const calls: Array<[number, boolean]> = [];
    run(
      [
        (hook) => hook.onPointerDown(),
        (hook) => hook.onChange(1),
        (hook) => hook.onPointerUp(),
        (hook) => hook.onPointerDown(),
        (hook) => hook.onChange(2),
        (hook) => hook.onPointerCancel(),
        (hook) => hook.onChange(3),
      ],
      (patch, history) => calls.push([patch, history]),
    );
    expect(calls).toEqual([
      [1, true],
      [2, true],
      [3, true],
    ]);
  });

  it("never calls apply on its own (pointerdown/up alone commit nothing)", () => {
    const apply = vi.fn();
    run(
      [(hook) => hook.onPointerDown(), (hook) => hook.onPointerUp()],
      apply,
    );
    expect(apply).not.toHaveBeenCalled();
  });
});
