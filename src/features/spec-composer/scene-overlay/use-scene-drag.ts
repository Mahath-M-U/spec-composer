/** Drag/rotate gesture for one Scene Overlay handle. Keeps the live edit in
 * local state (a 3px move threshold, like canvas-surface.tsx's own drag
 * gestures) and commits exactly once, on pointerup, through
 * `commitSceneTransform` — so a whole drag is a single history entry.
 * Escape or pointercancel discards the preview without committing. */
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEditorStore } from "../store";
import { clampNorm, docToNorm, normToDoc } from "../scene-space";
import type { SceneVec2 } from "../types";

export interface ScenePreview {
  canvas?: SceneVec2;
  rotation?: number;
}

interface DragState {
  pointerId: number;
  mode: "move" | "rotate";
  startClient: { x: number; y: number };
  startCanvas: SceneVec2;
  startRotation: number;
  center: { x: number; y: number };
  moved: boolean;
}

export function useSceneDrag(id: string, canvas: SceneVec2, rotation: number) {
  const dragRef = useRef<DragState | null>(null);
  const [preview, setPreview] = useState<ScenePreview | null>(null);

  const cancel = useCallback(() => {
    dragRef.current = null;
    setPreview(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dragRef.current) {
        event.stopPropagation();
        cancel();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [cancel]);

  const beginDrag = useCallback(
    (
      event: ReactPointerEvent<Element>,
      mode: DragState["mode"],
      center: { x: number; y: number },
    ) => {
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        mode,
        startClient: { x: event.clientX, y: event.clientY },
        startCanvas: canvas,
        startRotation: rotation,
        center,
        moved: false,
      };
      useEditorStore.getState().selectScene(id);
    },
    [canvas, id, rotation],
  );

  const startMove = useCallback(
    (event: ReactPointerEvent<Element>) => beginDrag(event, "move", { x: 0, y: 0 }),
    [beginDrag],
  );

  const startRotate = useCallback(
    (event: ReactPointerEvent<Element>, center: { x: number; y: number }) =>
      beginDrag(event, "rotate", center),
    [beginDrag],
  );

  const move = useCallback(
    (event: ReactPointerEvent<Element>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const format = useEditorStore.getState().doc?.format;
      if (!format) return;
      const dx = event.clientX - drag.startClient.x;
      const dy = event.clientY - drag.startClient.y;
      if (!drag.moved && Math.hypot(dx, dy) < 3) return;
      drag.moved = true;
      if (drag.mode === "move") {
        const zoom = useEditorStore.getState().zoom || 1;
        const startDoc = normToDoc(drag.startCanvas, format);
        const nextDoc = { x: startDoc.x + dx / zoom, y: startDoc.y + dy / zoom };
        setPreview({ canvas: clampNorm(docToNorm(nextDoc, format)) });
      } else {
        const degrees =
          (Math.atan2(
            event.clientY - drag.center.y,
            event.clientX - drag.center.x,
          ) *
            180) /
          Math.PI;
        // Screen y grows downward; scene rotation is CCW with +y up.
        setPreview({ rotation: Math.max(-180, Math.min(180, -degrees)) });
      }
    },
    [],
  );

  const stop = useCallback(
    (event: ReactPointerEvent<Element>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setPreview((current) => {
        if (drag.moved && current)
          useEditorStore.getState().commitSceneTransform(id, current);
        return null;
      });
    },
    [id],
  );

  return { preview, startMove, startRotate, move, stop, cancel };
}
