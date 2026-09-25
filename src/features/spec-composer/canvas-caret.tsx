import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import {
  caretFromRect,
  fallbackCaret,
  isInside,
  type CaretGeometry,
} from "./caret-geometry";
import type { SpecElement } from "./types";

const DEFAULT_FONT_SIZE = 16;

/**
 * The inline editor's caret. Uncontrolled and imperative on purpose: it
 * writes straight to the DOM node's style so typing never re-renders the
 * workspace. See `caret-geometry.ts` for the pure math and the plan this
 * implements for why the native caret is unusable (it's `currentColor`, so
 * it disappears on same-color backgrounds — e.g. dark text on a dark brand
 * kit shape).
 */
export function CanvasCaret({
  surface,
  el,
  zoom,
}: {
  surface: RefObject<HTMLDivElement | null>;
  el: SpecElement;
  zoom: number;
}) {
  const caretRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  // The mount effect below registers listeners once; they call through this
  // ref so they always run the latest `update` (current `el`/`zoom`), not
  // whichever closure happened to exist when the effect first ran.
  const updateRef = useRef<() => void>(() => {});

  const update = () => {
    const caretNode = caretRef.current;
    const surfaceNode = surface.current;
    if (!caretNode || !surfaceNode) return;
    const hide = () => {
      caretNode.style.visibility = "hidden";
    };
    const node = surfaceNode.querySelector<HTMLElement>("[data-text-editing]");
    if (!node) return hide();
    if (document.activeElement !== node) return hide();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return hide();
    if (!selection.isCollapsed) return hide();
    if (!node.contains(selection.focusNode)) return hide();

    const range = selection.getRangeAt(0);
    const surfaceRect = surfaceNode.getBoundingClientRect();
    const rotationDeg = el.rotation ?? 0;

    let geometry: CaretGeometry | null = null;
    const rects = range.getClientRects();
    for (let i = rects.length - 1; i >= 0; i--) {
      const rect = rects[i]!;
      if (rect.height > 0) {
        geometry = caretFromRect(rect, surfaceRect, rotationDeg);
        break;
      }
    }

    if (!geometry) {
      geometry = fromEmptyPosition(node, range, surfaceRect, el, zoom);
    }

    const editorRect = node.getBoundingClientRect();
    const clip = {
      left: Math.max(0, editorRect.left - surfaceRect.left),
      top: Math.max(0, editorRect.top - surfaceRect.top),
      width:
        Math.min(editorRect.right, surfaceRect.right) -
        Math.max(editorRect.left, surfaceRect.left),
      height:
        Math.min(editorRect.bottom, surfaceRect.bottom) -
        Math.max(editorRect.top, surfaceRect.top),
    };
    if (
      clip.width <= 0 ||
      clip.height <= 0 ||
      !isInside({ x: geometry.x, y: geometry.y }, clip)
    ) {
      return hide();
    }

    caretNode.style.visibility = "visible";
    caretNode.style.height = `${geometry.length}px`;
    caretNode.style.transform = `translate(${geometry.x}px, ${geometry.y}px) translate(-50%, -50%) rotate(${geometry.angle}deg)`;
    // Restart the blink so the caret stays solid right after it moves.
    caretNode.style.animation = "none";
    void caretNode.offsetWidth;
    caretNode.style.animation = "";
  };
  updateRef.current = update;

  const schedule = () => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateRef.current();
    });
  };

  useLayoutEffect(() => {
    update();
    // Runs after every render: covers zoom, pan, rotation and style edits,
    // which all cause the parent to re-render.
  });

  useEffect(() => {
    // `schedule` only closes over stable refs (it resolves `updateRef` when
    // the animation frame actually fires), so registering this render's
    // instance once, for the whole mount, is safe. The cleanup below resets
    // `rafRef` to null so a StrictMode mount→cleanup→mount cycle doesn't
    // leave a stale, cancelled frame id that makes `schedule` no-op forever.
    schedule();
    const onSelectionChange = () => schedule();
    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("scroll", schedule, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", schedule);

    const editorEvents = [
      "input",
      "compositionupdate",
      "compositionend",
      "focus",
      "blur",
      "scroll",
    ] as const;
    let editorNode: HTMLElement | null = null;
    let editorObserver: ResizeObserver | null = null;
    const attachToEditor = () => {
      const node =
        surface.current?.querySelector<HTMLElement>("[data-text-editing]") ??
        null;
      if (node === editorNode) return;
      if (editorNode) {
        for (const type of editorEvents)
          editorNode.removeEventListener(type, schedule);
        editorObserver?.disconnect();
        editorObserver = null;
      }
      editorNode = node;
      if (editorNode) {
        for (const type of editorEvents)
          editorNode.addEventListener(type, schedule);
        editorObserver = new ResizeObserver(schedule);
        editorObserver.observe(editorNode);
      }
      schedule();
    };
    attachToEditor();
    // In case the editor node mounts just after this effect runs.
    const attachRetry = requestAnimationFrame(attachToEditor);

    const surfaceObserver = surface.current
      ? new ResizeObserver(schedule)
      : null;
    if (surface.current) surfaceObserver?.observe(surface.current);

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.addEventListener("loadingdone", schedule);

    return () => {
      cancelAnimationFrame(attachRetry);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      if (editorNode) {
        for (const type of editorEvents)
          editorNode.removeEventListener(type, schedule);
      }
      editorObserver?.disconnect();
      surfaceObserver?.disconnect();
      fonts?.removeEventListener("loadingdone", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="canvas-caret" aria-hidden="true" ref={caretRef} />;
}

/** Caret geometry for an empty editor or an empty line, where the range has
 * no usable client rect. */
function fromEmptyPosition(
  node: HTMLElement,
  range: Range,
  surfaceRect: DOMRect,
  el: SpecElement,
  zoom: number,
) {
  const container = range.startContainer;
  const offset = range.startOffset;
  const precedingChar =
    container.nodeType === Node.TEXT_NODE && offset > 0
      ? (container.textContent ?? "")[offset - 1]
      : undefined;
  if (precedingChar !== undefined && precedingChar !== "\n") {
    const charRange = document.createRange();
    charRange.setStart(container, offset - 1);
    charRange.setEnd(container, offset);
    const rect = charRange.getBoundingClientRect();
    const fromChar =
      rect.height > 0
        ? caretFromRect(
            { left: rect.right, top: rect.top, width: 0, height: rect.height },
            surfaceRect,
            el.rotation ?? 0,
          )
        : null;
    if (fromChar) return fromChar;
  }
  const editorRect = node.getBoundingClientRect();
  const boxCenter = {
    x: editorRect.left + editorRect.width / 2 - surfaceRect.left,
    y: editorRect.top + editorRect.height / 2 - surfaceRect.top,
  };
  return fallbackCaret({
    boxCenter,
    width: editorRect.width / zoom,
    fontSize: el.style.fontSize ?? DEFAULT_FONT_SIZE,
    lineHeight: el.style.lineHeight,
    alignment: el.style.alignment,
    rotationDeg: el.rotation ?? 0,
    zoom,
    lineOffset: approximateLineOffset(node, container, offset),
  });
}

/** How many lines away from the editor's vertical centre the caret's line
 * sits — an approximation good enough for a caret nudge, not exact
 * line-wrapping (the editor is plain text, so this only looks at `\n`s). */
function approximateLineOffset(
  node: HTMLElement,
  container: Node,
  offset: number,
): number {
  const fullText = node.textContent ?? "";
  const lines = fullText.split("\n");
  if (lines.length <= 1) return 0;
  const preRange = document.createRange();
  preRange.selectNodeContents(node);
  preRange.setEnd(container, offset);
  const lineIndex = preRange.toString().split("\n").length - 1;
  return lineIndex - (lines.length - 1) / 2;
}
