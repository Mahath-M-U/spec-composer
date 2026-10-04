import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  Hand,
  Lock,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Scan,
  Undo2,
} from "lucide-react";
import { useEditorStore, boundsOf, type Box } from "./store";
import {
  ArtColorsProvider,
  backgroundStyle,
  ElementContent,
} from "./static-render";
import { CanvasTextEditor } from "./canvas-text-editor";
import { CanvasCaret } from "./canvas-caret";
import { findAssetItem } from "./asset-catalog";
import { addCatalogAsset } from "./assets-panel/add-asset";
import {
  ELEMENT_KINDS,
  isTextKind,
  type ElementKind,
  type SpecDocument,
  type SpecElement,
} from "./types";
import { computeSnap } from "./snapping";
import {
  constrainMove,
  constrainResize,
  resizeBox,
  RESIZE_HANDLES,
  toDocumentPoint,
  transformBoxes,
  type Point,
  type ResizeHandle,
} from "./canvas-geometry";
import { useCanvasViewport } from "./use-canvas-viewport";
import { Sep, Tool } from "./toolbar-controls";

type Gesture = {
  pointerId: number;
  start: Point;
  current: Point;
  initialPan: Point;
  zoom: number;
  document: SpecDocument;
  kind: "pan" | "marquee" | "drag" | "resize";
  additive: boolean;
  elements: SpecElement[];
  bounds: Box;
  handle?: ResizeHandle;
  moved: boolean;
};

export function CanvasWorkspace({
  children,
  onCanvasSelect,
}: {
  children: ReactNode;
  onCanvasSelect?: () => void;
}) {
  const s = useEditorStore();
  const doc = s.doc;
  const surface = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const busy = useRef(false);
  const previewRef = useRef<Record<string, Box>>({});
  const [preview, setPreview] = useState<Record<string, Box>>({});
  const [marquee, setMarquee] = useState<Box | null>(null);
  const [activeKind, setActiveKind] = useState<Gesture["kind"] | null>(null);
  const [editing, setEditing] = useState<{
    id: string;
    caret?: { x: number; y: number } | undefined;
  } | null>(null);
  const cancel = useCallback(() => {
    const pointer = gesture.current?.pointerId;
    gesture.current = null;
    busy.current = false;
    previewRef.current = {};
    setPreview({});
    setMarquee(null);
    setActiveKind(null);
    if (useEditorStore.getState().guides.length)
      useEditorStore.getState().setGuides([]);
    if (pointer !== undefined && surface.current?.hasPointerCapture(pointer))
      surface.current.releasePointerCapture(pointer);
  }, []);
  const viewport = useCanvasViewport(surface, busy, cancel);
  useEffect(() => {
    if (gesture.current && gesture.current.document !== doc) cancel();
  }, [doc, cancel]);
  // Text editing ends when its layer is deleted, locked, hidden, or the
  // open document no longer has it (e.g. a different project loaded).
  useEffect(() => {
    if (!editing) return;
    const el = doc?.elements.find((e) => e.id === editing.id);
    if (!el || el.locked || !el.visible) setEditing(null);
  }, [doc, editing]);
  // Keep a capture owner on the stable surface even when selection changes its children.
  const start = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !e.isPrimary || gesture.current || !doc) return;
    const target = e.target as Element;
    // Inside the active editor: let the browser handle caret/selection, not a canvas gesture.
    if (target.closest("[data-text-editing]")) return;
    if (editing) {
      // Our own preventDefault below would otherwise suppress the native
      // blur that commits the edit, so commit it explicitly first.
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest("[data-text-editing]")) active.blur();
    }
    e.preventDefault();
    surface.current?.focus({ preventScroll: true });
    const state = useEditorStore.getState();
    const point = viewport.localPoint(e.clientX, e.clientY);
    const handle = target.closest<HTMLElement>("[data-resize-handle]")?.dataset[
      "resizeHandle"
    ] as ResizeHandle | undefined;
    const id =
      target.closest<HTMLElement>("[data-element-id]")?.dataset["elementId"];
    let kind: Gesture["kind"] = "marquee";
    let elements: SpecElement[] = [];
    if (state.tool === "hand" || viewport.spaceHeld.current) {
      kind = "pan";
      viewport.manual();
    } else if (id || handle || target.closest("[data-selection-body]")) {
      if (id && !handle) {
        if (e.shiftKey) {
          state.select(id, true);
          if (useEditorStore.getState().selectedIds.length > 0)
            onCanvasSelect?.();
          return;
        }
        if (!state.selectedIds.includes(id)) state.select(id);
      }
      const ids = useEditorStore.getState().selectedIds;
      elements = doc.elements.filter((el) => ids.includes(el.id));
      if (!elements.length || elements.some((el) => el.locked || !el.visible))
        return;
      kind = handle ? "resize" : "drag";
    }
    gesture.current = {
      pointerId: e.pointerId,
      start: point,
      current: point,
      initialPan: { ...state.pan },
      zoom: state.zoom,
      document: doc,
      kind,
      additive: e.shiftKey,
      elements,
      bounds: boundsOf(elements),
      ...(handle ? { handle } : {}),
      moved: false,
    };
    busy.current = true;
    setActiveKind(kind);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    if (useEditorStore.getState().doc !== g.document) {
      cancel();
      return;
    }
    const point = viewport.localPoint(e.clientX, e.clientY);
    g.current = point;
    const dx = point.x - g.start.x,
      dy = point.y - g.start.y;
    if (!g.moved && Math.hypot(dx, dy) < 3) return;
    g.moved = true;
    if (g.kind === "pan") {
      s.setView(g.zoom, { x: g.initialPan.x + dx, y: g.initialPan.y + dy });
      return;
    }
    if (g.kind === "marquee") {
      setMarquee({
        x: Math.min(g.start.x, point.x),
        y: Math.min(g.start.y, point.y),
        width: Math.abs(dx),
        height: Math.abs(dy),
      });
      return;
    }
    let next: Box;
    if (g.kind === "resize" && g.handle) {
      const minimum = {
        width: g.bounds.width / Math.min(...g.elements.map((el) => el.width)),
        height:
          g.bounds.height / Math.min(...g.elements.map((el) => el.height)),
      };
      next = constrainResize(
        resizeBox(
          g.bounds,
          g.handle,
          { x: dx / g.zoom, y: dy / g.zoom },
          e.shiftKey,
          minimum,
        ),
        g.bounds,
        g.document.format.width,
        g.document.format.height,
      );
    } else {
      const snapped = computeSnap(
        {
          ...g.bounds,
          x: g.bounds.x + dx / g.zoom,
          y: g.bounds.y + dy / g.zoom,
        },
        g.document,
        g.elements.map((el) => el.id),
        g.zoom,
        e.ctrlKey || e.metaKey,
      );
      next = constrainMove(
        snapped.box,
        g.bounds,
        g.document.format.width,
        g.document.format.height,
      );
      s.setGuides(
        snapped.guides.filter((guide) =>
          guide.axis === "x"
            ? next.x === snapped.box.x
            : next.y === snapped.box.y,
        ),
      );
    }
    const boxes = transformBoxes(g.elements, g.bounds, next);
    previewRef.current = boxes;
    setPreview(boxes);
  };
  const stop = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    move(e);
    if (gesture.current !== g) return;
    const state = useEditorStore.getState();
    let canvasSelected = g.kind === "drag" || g.kind === "resize";
    if (g.kind === "marquee") {
      const view = { zoom: g.zoom, pan: g.initialPan };
      const a = toDocumentPoint(g.start, view),
        b = toDocumentPoint(g.current, view);
      if (g.moved) {
        state.selectMany(
          g.document.elements
            .filter(
              (el) =>
                el.visible &&
                !el.locked &&
                el.x < Math.max(a.x, b.x) &&
                el.x + el.width > Math.min(a.x, b.x) &&
                el.y < Math.max(a.y, b.y) &&
                el.y + el.height > Math.min(a.y, b.y),
            )
            .map((el) => el.id),
          g.additive,
        );
        canvasSelected = useEditorStore.getState().selectedIds.length > 0;
      } else if (!g.additive) {
        if (
          a.x >= 0 &&
          a.x <= g.document.format.width &&
          a.y >= 0 &&
          a.y <= g.document.format.height
        ) {
          state.selectBackground();
          canvasSelected = true;
        } else state.select();
      }
    }
    const patches = previewRef.current;
    cancel();
    if (g.moved && (g.kind === "drag" || g.kind === "resize"))
      state.commitCanvasTransform(g.document, patches);
    if (canvasSelected) onCanvasSelect?.();
  };
  const editable = (el: SpecElement | undefined): el is SpecElement =>
    !!el && el.visible && !el.locked && isTextKind(el.kind);
  const doubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!doc || busy.current) return;
    const state = useEditorStore.getState();
    if (state.tool === "hand") return;
    const target = e.target as Element;
    if (target.closest("[data-text-editing]")) return;
    const hit = document
      .elementsFromPoint(e.clientX, e.clientY)
      .find(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && !!node.closest("[data-element-id]"),
      );
    const id =
      hit?.closest<HTMLElement>("[data-element-id]")?.dataset["elementId"];
    const el = id ? doc.elements.find((e) => e.id === id) : undefined;
    if (!editable(el)) return;
    state.select(el.id);
    setEditing({ id: el.id, caret: { x: e.clientX, y: e.clientY } });
  };
  const keyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (editing || e.key !== "Enter" || !doc) return;
    const state = useEditorStore.getState();
    if (state.selectedIds.length !== 1) return;
    const el = doc.elements.find((v) => v.id === state.selectedIds[0]);
    if (!editable(el)) return;
    e.preventDefault();
    setEditing({ id: el.id });
  };
  if (!doc) return null;
  const elements = doc.elements.map((el) =>
    preview[el.id] ? { ...el, ...preview[el.id] } : el,
  );
  const selected = elements.filter(
    (el) => el.visible && s.selectedIds.includes(el.id),
  );
  const selectedBox = boundsOf(selected);
  const locked = doc.elements.some(
    (el) => s.selectedIds.includes(el.id) && (el.locked || !el.visible),
  );
  const isEditingSelection =
    !!editing && selected.length === 1 && selected[0]?.id === editing.id;
  const editingEl = editing
    ? elements.find((el) => el.id === editing.id)
    : undefined;
  const screenBox = {
    left: s.pan.x + selectedBox.x * s.zoom,
    top: s.pan.y + selectedBox.y * s.zoom,
    width: selectedBox.width * s.zoom,
    height: selectedBox.height * s.zoom,
  };
  let spacing = 24 * s.zoom;
  while (spacing < 16) spacing *= 2;
  while (spacing > 32) spacing /= 2;
  const panning =
    activeKind === "pan" ||
    (!activeKind && (s.tool === "hand" || viewport.space));
  return (
    <main className="workspace" data-tour="canvas">
      <div
        ref={surface}
        className={`canvas-surface${panning ? " panning" : ""}${activeKind === "pan" ? " grabbing" : ""}${activeKind === "drag" ? " moving" : ""}${activeKind === "marquee" ? " selecting" : ""}`}
        tabIndex={0}
        role="region"
        aria-label="Design canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onDoubleClick={doubleClick}
        onKeyDown={keyDown}
        onDragOver={(e) => {
          if (
            e.dataTransfer.types.includes("spec/asset") ||
            e.dataTransfer.types.includes("spec/kind")
          ) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          const point = viewport.toDoc(e.clientX, e.clientY);
          const assetId = e.dataTransfer.getData("spec/asset");
          const item = assetId ? findAssetItem(assetId) : undefined;
          if (item) {
            addCatalogAsset(item, point);
            return;
          }
          const kind = e.dataTransfer.getData("spec/kind") as ElementKind;
          if (!ELEMENT_KINDS.includes(kind)) return;
          s.addElement(kind, point.x, point.y);
        }}
      >
        <div
          className="canvas-dots"
          aria-hidden="true"
          style={{
            backgroundSize: `${spacing}px ${spacing}px`,
            backgroundPosition: `${s.pan.x}px ${s.pan.y}px`,
          }}
        />
        <div
          className="canvas-stage"
          style={{
            width: doc.format.width,
            height: doc.format.height,
            transform: `translate(${s.pan.x}px, ${s.pan.y}px) scale(${s.zoom})`,
          }}
        >
          <div
            id="spec-artboard"
            className={`artboard${s.backgroundSelected ? " background-selected" : ""}`}
            style={backgroundStyle(doc)}
          >
            <ArtColorsProvider doc={doc}>
              {[...elements]
                .filter((el) => el.visible)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((el) => (
                  <div
                    key={el.id}
                    data-element-id={el.id}
                    aria-label={el.name}
                    className={`canvas-object${el.locked ? " is-locked" : ""}${editable(el) ? " is-text" : ""}`}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      zIndex: el.zIndex,
                      transform: `rotate(${el.rotation}deg)`,
                    }}
                  >
                    {editing?.id === el.id ? (
                      <CanvasTextEditor
                        el={el}
                        caret={editing.caret}
                        onDone={(reason) => {
                          setEditing(null);
                          if (reason === "keyboard")
                            surface.current?.focus({ preventScroll: true });
                        }}
                      />
                    ) : (
                      <ElementContent el={el} />
                    )}
                  </div>
                ))}
            </ArtColorsProvider>
            {s.guides.map((guide, i) => (
              <div
                key={i}
                className={`guide-line guide-line-${guide.axis}`}
                style={
                  guide.axis === "x" ? { left: guide.pos } : { top: guide.pos }
                }
              />
            ))}
          </div>
        </div>
        {selected.length > 0 && (
          <div
            className={`canvas-selection${locked ? " is-locked" : ""}${isEditingSelection ? " is-editing" : ""}`}
            style={screenBox}
          >
            {selected.length > 1 && (
              <div data-selection-body className="canvas-selection-body" />
            )}
            {!isEditingSelection && (
              <span className="canvas-selection-size">
                {locked && <Lock size={10} />}
                {Math.round(selectedBox.width)} ×{" "}
                {Math.round(selectedBox.height)}
              </span>
            )}
            {!locked && !panning && !isEditingSelection && (
              <div
                className="canvas-handle-ring"
                style={{
                  width: Math.max(32, screenBox.width),
                  height: Math.max(32, screenBox.height),
                }}
              >
                {RESIZE_HANDLES.map((handle) => (
                  <div
                    key={handle}
                    data-resize-handle={handle}
                    className={`canvas-resize-handle handle-${handle}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {editingEl && (
          <CanvasCaret
            key={editingEl.id}
            surface={surface}
            el={editingEl}
            zoom={s.zoom}
          />
        )}
        {marquee && (
          <div
            className="marquee-box"
            style={{
              left: marquee.x,
              top: marquee.y,
              width: marquee.width,
              height: marquee.height,
            }}
          />
        )}
        <div
          className="canvas-document-info"
          style={{
            left: s.pan.x,
            top: s.pan.y - 8,
          }}
        >
          {doc.format.label} · {doc.format.width} × {doc.format.height} px
        </div>
      </div>
      {children}
      <div
        className="zoom-controls"
        data-canvas-ui
        data-tour="canvas-tools"
        role="toolbar"
        aria-label="Canvas tools"
      >
        <Tool
          active={s.tool === "select"}
          label="Select"
          shortcut="V"
          side="top"
          icon={<MousePointer2 />}
          onClick={() => s.setTool("select")}
        />
        <Tool
          active={s.tool === "hand"}
          label="Hand"
          shortcut="H"
          side="top"
          icon={<Hand />}
          onClick={() => s.setTool("hand")}
        />
        <Sep />
        <Tool
          label="Zoom out"
          side="top"
          icon={<Minus />}
          onClick={() => viewport.zoom(1 / 1.2)}
        />
        <span className="zoom-controls-value" aria-label="Canvas zoom">
          {Math.round(s.zoom * 100)}%
        </span>
        <Tool
          label="Zoom in"
          side="top"
          icon={<Plus />}
          onClick={() => viewport.zoom(1.2)}
        />
        <Tool
          label="Fit to screen"
          side="top"
          icon={<Scan />}
          onClick={() => {
            cancel();
            viewport.fit();
          }}
        />
        <Sep />
        <Tool
          disabled={!s.past.length}
          label="Undo"
          shortcut="Ctrl+Z"
          side="top"
          icon={<Undo2 />}
          onClick={s.undo}
        />
        <Tool
          disabled={!s.future.length}
          label="Redo"
          shortcut="Ctrl+Shift+Z"
          side="top"
          icon={<Redo2 />}
          onClick={s.redo}
        />
      </div>
    </main>
  );
}
