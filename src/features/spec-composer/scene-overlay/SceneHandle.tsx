import { useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { clampNorm, normToScreen } from "../scene-space";
import { useEditorStore } from "../store";
import { useSceneDrag } from "./use-scene-drag";
import type { SceneVec2 } from "../types";

/** Keyboard arrow-key nudge step, in the same normalized (-1.5..1.5) units
 * as `canvas`; Shift takes a larger step. One commit per keystroke (see
 * commitSceneTransform) — simpler than coalescing a drag, and acceptable
 * per-keystroke history per the plan's a11y notes. */
const NUDGE_STEP = 0.02;
const NUDGE_STEP_LARGE = 0.1;
const NUDGE_DELTAS: Record<string, SceneVec2> = {
  ArrowUp: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: -1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

/** One draggable/rotatable Scene Overlay object: positions `children` (the
 * type-specific guide from SceneGuides.tsx) at the object's screen
 * position, oriented by its 2D aim, and layers a move handle (and, once
 * selected, a rotate handle) on top. Handles stopPropagation on
 * pointerdown so the canvas's own element-drag gesture never starts. Both
 * handles are also focusable, keyboard-operable targets: Enter/Space
 * selects, and the move handle nudges with the arrow keys (Shift = a
 * larger step). */
export function SceneHandle({
  id,
  label,
  canvas,
  rotation,
  selected,
  format,
  pan,
  zoom,
  children,
}: {
  id: string;
  label: string;
  canvas: SceneVec2;
  rotation: number;
  selected: boolean;
  format: { width: number; height: number };
  pan: { x: number; y: number };
  zoom: number;
  children?: ReactNode;
}) {
  const anchor = useRef<SVGCircleElement>(null);
  const { preview, startMove, startRotate, move, stop, cancel } = useSceneDrag(
    id,
    canvas,
    rotation,
  );
  const effectiveCanvas = preview?.canvas ?? canvas;
  const effectiveRotation = preview?.rotation ?? rotation;
  const screen = normToScreen(effectiveCanvas, format, pan, zoom);
  // Scene rotation is CCW with +y up; screen rotate() is CW with +y down.
  const screenRotation = -effectiveRotation;

  const selectOnActivate = (event: ReactKeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return false;
    event.preventDefault();
    useEditorStore.getState().selectScene(id);
    return true;
  };

  const onMoveKeyDown = (event: ReactKeyboardEvent<SVGCircleElement>) => {
    if (selectOnActivate(event)) return;
    const delta = NUDGE_DELTAS[event.key];
    if (!delta) return;
    event.preventDefault();
    const step = event.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
    useEditorStore.getState().commitSceneTransform(id, {
      canvas: clampNorm({
        x: canvas.x + delta.x * step,
        y: canvas.y + delta.y * step,
      }),
    });
  };

  return (
    <g
      className={`scene-handle${selected ? " is-selected" : ""}`}
      data-scene-object={id}
      transform={`translate(${screen.x} ${screen.y}) rotate(${screenRotation})`}
    >
      {children}
      <circle ref={anchor} cx={0} cy={0} r={0.5} className="scene-handle-anchor" />
      <circle
        className="scene-handle-hit"
        r={16}
        tabIndex={0}
        role="button"
        aria-label={label}
        aria-pressed={selected}
        style={{ pointerEvents: "auto", touchAction: "none" }}
        onPointerDown={startMove}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={cancel}
        onKeyDown={onMoveKeyDown}
      />
      {selected && (
        <g className="scene-handle-rotate-group">
          {/* A larger transparent hit area keeps the rotate handle's touch
           * target >= 32px while its own visual dot stays small. */}
          <circle
            className="scene-handle-rotate-hit"
            cx={32}
            cy={0}
            r={16}
            tabIndex={0}
            role="button"
            aria-label={`Rotate ${label}`}
            style={{ pointerEvents: "auto", touchAction: "none", fill: "transparent" }}
            onPointerDown={(event) => {
              const rect = anchor.current?.getBoundingClientRect();
              const center = rect
                ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
                : { x: screen.x, y: screen.y };
              startRotate(event, center);
            }}
            onPointerMove={move}
            onPointerUp={stop}
            onPointerCancel={cancel}
            onKeyDown={selectOnActivate}
          />
          <circle className="scene-handle-rotate" cx={32} cy={0} r={6} style={{ pointerEvents: "none" }} />
        </g>
      )}
    </g>
  );
}
