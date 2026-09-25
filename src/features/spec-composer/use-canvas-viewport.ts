import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useEditorStore } from "./store";
import {
  fitView,
  toDocumentPoint,
  wheelDelta,
  zoomAt,
  type Point,
} from "./canvas-geometry";

export function isCanvasUI(target: EventTarget | null) {
  return (
    target instanceof Element &&
    !!target.closest(
      '[data-canvas-ui], input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="combobox"], [role="slider"]',
    )
  );
}

export function useCanvasViewport(
  surface: RefObject<HTMLDivElement | null>,
  busy: RefObject<boolean>,
  cancel: () => void,
) {
  const doc = useEditorStore((s) => s.doc);
  const spaceHeld = useRef(false);
  const [space, setSpace] = useState(false);
  const fitMode = useRef(true);
  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;
  const fit = useCallback(() => {
    const el = surface.current;
    const state = useEditorStore.getState();
    if (!el || !state.doc) return;
    const view = fitView(el.clientWidth, el.clientHeight, {
      x: 0,
      y: 0,
      ...state.doc.format,
    });
    state.setView(view.zoom, view.pan);
    fitMode.current = true;
  }, [surface]);
  const localPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = surface.current!.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [surface],
  );
  const toDoc = useCallback(
    (clientX: number, clientY: number) =>
      toDocumentPoint(localPoint(clientX, clientY), useEditorStore.getState()),
    [localPoint],
  );
  const zoom = useCallback(
    (factor: number, point?: Point) => {
      if (busy.current) return;
      const el = surface.current;
      if (!el) return;
      const state = useEditorStore.getState();
      const view = zoomAt(
        state,
        point ?? {
          x: Math.max(80, el.clientWidth - 240) / 2,
          y: el.clientHeight / 2,
        },
        state.zoom * factor,
      );
      state.setView(view.zoom, view.pan);
      fitMode.current = false;
    },
    [surface, busy],
  );

  useEffect(() => {
    cancelRef.current();
    fit();
  }, [doc?.id, doc?.format.width, doc?.format.height, fit]);

  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      cancelRef.current();
      if (fitMode.current) fit();
    });
    observer.observe(el);
    const wheel = (e: WheelEvent) => {
      if (isCanvasUI(e.target)) return;
      if (e.cancelable) e.preventDefault();
      if (busy.current || e.deltaY === 0) return;
      zoom(
        Math.exp(-wheelDelta(e.deltaY, e.deltaMode, el.clientHeight) * 0.002),
        localPoint(e.clientX, e.clientY),
      );
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", wheel);
    };
  }, [surface, busy, fit, zoom, localPoint]);

  useEffect(() => {
    const reset = () => {
      spaceHeld.current = false;
      setSpace(false);
      cancelRef.current();
    };
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && busy.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        cancelRef.current();
        return;
      }
      if (
        e.code !== "Space" ||
        isCanvasUI(e.target) ||
        document.querySelector(
          '[role="dialog"][data-state="open"], dialog[open]',
        )
      )
        return;
      e.preventDefault();
      spaceHeld.current = true;
      setSpace(true);
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeld.current = false;
        setSpace(false);
      }
    };
    const visibility = () => {
      if (document.hidden) reset();
    };
    window.addEventListener("keydown", keydown, true);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", keydown, true);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [busy]);
  return {
    space,
    spaceHeld,
    fit,
    zoom,
    toDoc,
    localPoint,
    manual: () => {
      fitMode.current = false;
    },
  };
}
