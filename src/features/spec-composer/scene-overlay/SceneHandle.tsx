import { useRef, type ReactNode } from "react";
import { normToScreen } from "../scene-space";
import { useSceneDrag } from "./use-scene-drag";
import type { SceneVec2 } from "../types";

/** One draggable/rotatable Scene Overlay object: positions `children` (the
 * type-specific guide from SceneGuides.tsx) at the object's screen
 * position, oriented by its 2D aim, and layers a move handle (and, once
 * selected, a rotate handle) on top. Handles stopPropagation on
 * pointerdown so the canvas's own element-drag gesture never starts. */
export function SceneHandle({
  id,
  canvas,
  rotation,
  selected,
  format,
  pan,
  zoom,
  children,
}: {
  id: string;
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
        style={{ pointerEvents: "auto", touchAction: "none" }}
        onPointerDown={startMove}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={cancel}
      />
      {selected && (
        <circle
          className="scene-handle-rotate"
          cx={32}
          cy={0}
          r={6}
          style={{ pointerEvents: "auto", touchAction: "none" }}
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
        />
      )}
    </g>
  );
}
