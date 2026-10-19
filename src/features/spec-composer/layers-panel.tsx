import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Folder,
  GripVertical,
  Group,
  Image,
  Layers3,
  Lock,
  MoreHorizontal,
  Package,
  Shapes,
  SlidersHorizontal,
  Type,
  Ungroup,
  Unlock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PanelHeader } from "./panel-header";
import { backgroundStyle } from "./static-render";
import { useEditorStore } from "./store";
import { isTextKind } from "./types";
import {
  canonicalLayers,
  canGroupLayers,
  flattenLayers,
  layerRange,
  movedLayers,
  nextLayerDropPoint,
  selectedLayerIds,
  toggleLayerSelection,
  type LayerDestination,
  type LayerRow,
} from "./layer-tree";

const layerKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { context },
) => {
  if (
    !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code) ||
    !context.collisionRect
  )
    return;
  event.preventDefault();
  const rect = context.collisionRect;
  const points = context.droppableContainers
    .getEnabled()
    .flatMap((container) => {
      const bounds = context.droppableRects.get(container.id);
      return bounds && container.data.current?.["destination"]
        ? [
            {
              id: String(container.id),
              x: bounds.left + bounds.width / 2,
              y: bounds.top + bounds.height / 2,
            },
          ]
        : [];
    });
  const point = nextLayerDropPoint(
    points,
    context.over ? String(context.over.id) : undefined,
    { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    event.code === "ArrowDown" || event.code === "ArrowRight",
  );
  if (!point) return;
  return { x: point.x - rect.width / 2, y: point.y - rect.height / 2 };
};

function DropZone({
  id,
  position,
  active,
}: {
  id?: string;
  position: LayerDestination["position"];
  active: boolean;
}) {
  const destination: LayerDestination = {
    ...(id ? { targetId: id } : {}),
    position,
  };
  const { setNodeRef, isOver } = useDroppable({
    id: JSON.stringify(["drop", id ?? null, position]),
    data: { destination },
    disabled: !active,
  });
  return (
    <div
      ref={setNodeRef}
      className={`layer-drop-zone layer-drop-${position} ${isOver ? "over" : ""}`}
      aria-hidden="true"
    />
  );
}

function LayerItem({
  row,
  selected,
  collapsed,
  tabIndex,
  activeDrag,
  drop,
  validDrop,
  onSelect,
  onFocus,
  onToggle,
  onKeyDown,
  rename,
  setDraft,
  commitRename,
  cancelRename,
  startRename,
  effectiveIds,
  position,
  size,
  restoreFocus,
  dragBlocked,
  multiSelect,
  onToggleSelection,
}: {
  row: LayerRow;
  selected: boolean;
  collapsed: boolean;
  tabIndex: number;
  activeDrag: boolean;
  drop: LayerDestination | undefined;
  validDrop: boolean;
  onSelect: (event: MouseEvent, id: string) => void;
  onFocus: () => void;
  onToggle: () => void;
  onKeyDown: (event: KeyboardEvent, row: LayerRow) => void;
  rename: { id: string; draft: string } | null;
  setDraft: (draft: string) => void;
  commitRename: (restoreFocus: boolean) => void;
  cancelRename: () => void;
  startRename: (id: string) => void;
  effectiveIds: string[];
  position: number;
  size: number;
  restoreFocus: (id: string) => void;
  dragBlocked: boolean;
  multiSelect: boolean;
  onToggleSelection: (id: string) => void;
}) {
  const s = useEditorStore();
  const doc = s.doc!;
  const [menuOpen, setMenuOpen] = useState(false);
  const locked = row.leaves.some((el) => el.locked);
  const allLocked =
    row.leaves.length > 0 && row.leaves.every((el) => el.locked);
  const hidden = row.leaves.length > 0 && row.leaves.every((el) => !el.visible);
  const mixedVisible = !hidden && row.leaves.some((el) => !el.visible);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({
      id: row.id,
      disabled: multiSelect || locked || dragBlocked || rename?.id === row.id,
    });
  const Icon = !row.element
    ? Folder
    : isTextKind(row.element.kind)
      ? Type
      : row.element.kind === "productImage"
        ? Package
        : row.element.kind === "shape" || row.element.kind === "divider"
          ? Shapes
          : Image;
  const selectedNodes = menuOpen ? canonicalLayers(doc, effectiveIds) : [];
  const siblings = menuOpen
    ? flattenLayers(doc).filter(
        (node) => node.parentId === selectedNodes[0]?.parentId,
      )
    : [];
  const sameParent = selectedNodes.every(
    (node) => node.parentId === selectedNodes[0]?.parentId,
  );
  const first = siblings.findIndex((node) => effectiveIds.includes(node.id));
  const last =
    siblings.length -
    1 -
    [...siblings].reverse().findIndex((node) => effectiveIds.includes(node.id));
  const up =
    menuOpen &&
    sameParent &&
    first > 0 &&
    !!movedLayers(doc, effectiveIds, {
      targetId: siblings[first - 1]!.id,
      position: "before",
    });
  const down =
    menuOpen &&
    sameParent &&
    last < siblings.length - 1 &&
    !!movedLayers(doc, effectiveIds, {
      targetId: siblings[last + 1]!.id,
      position: "after",
    });
  const canUngroup =
    selectedNodes.length === 1 &&
    !selectedNodes[0]!.element &&
    !selectedNodes[0]!.leaves.some((el) => el.locked);
  const isDrop = drop?.targetId === row.id;
  return (
    <div
      ref={setNodeRef}
      role="treeitem"
      aria-level={row.depth + 1}
      aria-posinset={position}
      aria-setsize={size}
      aria-selected={selected}
      aria-expanded={row.element ? undefined : !collapsed}
      aria-label={`${row.name}${hidden ? ", hidden" : mixedVisible ? ", partly hidden" : ""}${locked ? (allLocked ? ", locked" : ", partly locked") : ""}`}
      tabIndex={tabIndex}
      data-layer-id={row.id}
      className={`layer-row ${selected ? "active" : ""} ${hidden ? "is-hidden" : ""} ${locked ? "is-locked" : ""} ${isDragging ? "is-dragging" : ""} ${isDrop ? (validDrop ? `drop-${drop.position}` : "drop-invalid") : ""}`}
      style={{ "--layer-depth": Math.min(row.depth, 5) } as CSSProperties}
      onClick={(event) => onSelect(event, row.id)}
      onDoubleClick={(event) => {
        if (
          !multiSelect &&
          !(event.target as HTMLElement).closest("button,input")
        )
          startRename(row.id);
      }}
      onFocus={onFocus}
      onKeyDown={(event) => onKeyDown(event, row)}
    >
      <DropZone id={row.id} position="before" active={activeDrag} />
      {!row.element && (
        <DropZone id={row.id} position="inside" active={activeDrag} />
      )}
      <DropZone id={row.id} position="after" active={activeDrag} />
      <span className="layer-hierarchy" aria-hidden="true" />
      {multiSelect ? (
        <label
          className="layer-selection-checkbox"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            aria-label={`Select ${row.name}`}
            checked={selected}
            onChange={() => onToggleSelection(row.id)}
          />
        </label>
      ) : (
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="layer-drag layer-control"
          aria-label={`Drag ${row.name}`}
          disabled={locked || dragBlocked}
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical />
        </button>
      )}
      {row.element ? (
        <span className="layer-chevron-space" />
      ) : (
        <button
          type="button"
          className="layer-chevron"
          aria-label={`${collapsed ? "Expand" : "Collapse"} ${row.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          <>{collapsed ? <ChevronRight /> : <ChevronDown />}</>
        </button>
      )}
      <Icon className="layer-type" aria-hidden="true" />
      {rename?.id === row.id ? (
        <input
          autoFocus
          aria-label={`Rename ${row.name}`}
          className="layer-rename"
          value={rename.draft}
          maxLength={200}
          onFocus={(event) => event.target.select()}
          onChange={(event) => setDraft(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onBlur={() => commitRename(false)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              event.preventDefault();
              commitRename(true);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              cancelRename();
            }
          }}
        />
      ) : (
        <span className="layer-name truncate" title={row.name}>
          {row.name}
        </span>
      )}
      {!row.element && (
        <span
          className="layer-group-count"
          aria-label={`${row.leaves.length} children`}
        >
          {row.leaves.length}
        </span>
      )}
      <div
        className="layer-controls"
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={`layer-control ${hidden || mixedVisible ? "persistent" : ""}`}
          aria-label={`${hidden ? "Show" : "Hide"} ${row.name}`}
          aria-pressed={mixedVisible ? "mixed" : hidden}
          onClick={() => s.updateLayers([row.id], { visible: hidden })}
        >
          {hidden ? <EyeOff /> : <Eye />}
          {mixedVisible && <i />}
        </button>
        <button
          type="button"
          className={`layer-control ${locked ? "persistent" : ""}`}
          aria-label={`${allLocked ? "Unlock" : "Lock"} ${row.name}`}
          aria-pressed={locked && !allLocked ? "mixed" : allLocked}
          onClick={() => s.updateLayers([row.id], { locked: !allLocked })}
        >
          {locked ? <Lock /> : <Unlock />}
          {locked && !allLocked && <i />}
        </button>
        <DropdownMenu
          onOpenChange={(open) => {
            setMenuOpen(open);
            if (open && !selected) s.selectLayers([row.id]);
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="layer-control layer-overflow"
              aria-label={`Actions for ${row.name}`}
            >
              <MoreHorizontal />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="layer-menu"
            data-layer-interaction
            align="end"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              restoreFocus(row.id);
            }}
          >
            {effectiveIds.length === 1 && (
              <DropdownMenuItem onSelect={() => startRename(effectiveIds[0]!)}>
                Rename <span>F2</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={s.duplicate}>
              Duplicate <span>Ctrl/Cmd D</span>
            </DropdownMenuItem>
            {up && (
              <DropdownMenuItem onSelect={s.bringForward}>
                Move up <span>Alt+Up</span>
              </DropdownMenuItem>
            )}
            {down && (
              <DropdownMenuItem onSelect={s.sendBackward}>
                Move down <span>Alt+Down</span>
              </DropdownMenuItem>
            )}
            {menuOpen && canGroupLayers(doc, effectiveIds) && (
              <DropdownMenuItem onSelect={s.group}>
                Group <span>Ctrl/Cmd G</span>
              </DropdownMenuItem>
            )}
            {canUngroup && (
              <DropdownMenuItem onSelect={s.ungroup}>
                Ungroup <span>Ctrl/Cmd Shift G</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="layer-delete"
              onSelect={s.deleteSelected}
            >
              Delete <span>Del</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function LayersPanel({ showHeader = true }: { showHeader?: boolean }) {
  const s = useEditorStore(),
    doc = s.doc;
  const panelRef = useRef<HTMLDivElement>(null);
  const multiSelectButton = useRef<HTMLButtonElement>(null);
  const ownsFocus = useRef(false);
  const documentId = useRef(doc?.id);
  const previousRows = useRef<LayerRow[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [focusedId, setFocusedId] = useState<string>();
  const [anchor, setAnchor] = useState<string>();
  const [multiSelect, setMultiSelect] = useState(false);
  const treeId = useId();
  const [rename, setRename] = useState<{ id: string; draft: string } | null>(
    null,
  );
  const renameRef = useRef<typeof rename>(null);
  const [dragIds, setDragIds] = useState<string[]>([]);
  const [drop, setDrop] = useState<LayerDestination>();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: layerKeyboardCoordinates }),
  );
  const rows = useMemo(
    () => (doc ? flattenLayers(doc, collapsed) : []),
    [doc, collapsed],
  );
  const allRows = useMemo(() => (doc ? flattenLayers(doc) : []), [doc]);
  useEffect(() => {
    if (documentId.current !== doc?.id) {
      documentId.current = doc?.id;
      renameRef.current = null;
      ownsFocus.current = false;
      setRename(null);
      setDragIds([]);
      setDrop(undefined);
      setAnchor(undefined);
      setMultiSelect(false);
      setFocusedId(undefined);
      setCollapsed(new Set());
    } else if (
      ownsFocus.current &&
      focusedId &&
      !rows.some((row) => row.id === focusedId)
    ) {
      const previous = previousRows.current;
      let parent = previous.find((row) => row.id === focusedId)?.parentId;
      while (parent && !rows.some((row) => row.id === parent))
        parent = previous.find((row) => row.id === parent)?.parentId;
      const next =
        parent ??
        rows[
          Math.min(
            Math.max(
              0,
              previous.findIndex((row) => row.id === focusedId),
            ),
            rows.length - 1,
          )
        ]?.id;
      setFocusedId(next);
      const target = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>("[data-layer-id]") ??
          [],
      ).find((el) => el.dataset["layerId"] === next);
      (
        target ??
        panelRef.current?.querySelector<HTMLButtonElement>(
          ".layer-row-background",
        )
      )?.focus();
    }
    previousRows.current = rows;
  }, [doc?.id, rows, focusedId]);
  if (!doc) return null;
  const selected = selectedLayerIds(doc, s.selectedIds, s.selectedGroupIds);
  const focusId = rows.some((row) => row.id === focusedId)
    ? focusedId
    : (rows.find((row) => selected.includes(row.id))?.id ?? rows[0]?.id);
  const validDrop = !!drop && !!movedLayers(doc, dragIds, drop);
  const groupable = canGroupLayers(doc, selected);
  const nodes = canonicalLayers(doc, selected);
  const ungroupable =
    nodes.length === 1 &&
    !nodes[0]!.element &&
    !nodes[0]!.leaves.some((el) => el.locked);
  const focus = (id: string) => {
    setFocusedId(id);
    requestAnimationFrame(() => {
      const row = Array.from(
        document.querySelectorAll<HTMLElement>("[data-layer-id]"),
      ).find((el) => el.dataset["layerId"] === id);
      row?.focus();
    });
  };
  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const startRename = (id: string) => {
    const node = flattenLayers(doc).find((row) => row.id === id);
    if (!node) return;
    renameRef.current = { id, draft: node.name };
    setRename(renameRef.current);
  };
  const finishRename = (commit: boolean, restoreFocus = true) => {
    const current = renameRef.current;
    if (!current) return;
    renameRef.current = null;
    setRename(null);
    if (commit) s.renameLayer(current.id, current.draft);
    if (restoreFocus) focus(current.id);
  };
  const openProperties = (event: MouseEvent<HTMLButtonElement>) => {
    const contextPanel = panelRef.current?.closest(".context-panel");
    s.setStyleTab("style");
    s.setPanel("style");
    if (event.detail === 0)
      requestAnimationFrame(() => {
        const target =
          contextPanel?.querySelector<HTMLElement>(
            '.style-panel [role="tab"][aria-selected="true"]',
          ) ??
          contextPanel?.querySelector<HTMLElement>(
            ".style-panel button:not(:disabled), .style-panel input:not(:disabled)",
          );
        target?.focus();
      });
  };
  const selectRow = (
    id: string,
    modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  ) => {
    if (modifiers.shiftKey) {
      const start =
        (rows.some((row) => row.id === anchor) ? anchor : undefined) ??
        rows.find((row) => selected.includes(row.id))?.id ??
        focusId ??
        id;
      setAnchor(start);
      s.selectLayers(layerRange(doc, collapsed, start, id));
    } else if (multiSelect || modifiers.ctrlKey || modifiers.metaKey) {
      s.selectLayers(
        toggleLayerSelection(
          doc,
          selected,
          id,
          multiSelect && !modifiers.ctrlKey && !modifiers.metaKey
            ? "explicit"
            : "modifier",
        ),
      );
      setAnchor(id);
    } else {
      s.selectLayers([id]);
      setAnchor(id);
    }
    setFocusedId(id);
  };
  const keyDown = (event: KeyboardEvent, row: LayerRow) => {
    if (event.target !== event.currentTarget) return;
    const index = rows.findIndex((item) => item.id === row.id),
      mod = event.ctrlKey || event.metaKey;
    let handled = true;
    const next = (id: string | undefined) => {
      if (id) {
        focus(id);
        if (event.shiftKey) selectRow(id, event);
      }
    };
    if (event.altKey && event.key === "ArrowUp") {
      if (!selected.includes(row.id)) s.selectLayers([row.id]);
      s.bringForward();
    } else if (event.altKey && event.key === "ArrowDown") {
      if (!selected.includes(row.id)) s.selectLayers([row.id]);
      s.sendBackward();
    } else if (event.key === "ArrowDown") next(rows[index + 1]?.id);
    else if (event.key === "ArrowUp") next(rows[index - 1]?.id);
    else if (event.key === "Home") next(rows[0]?.id);
    else if (event.key === "End") next(rows[rows.length - 1]?.id);
    else if (event.key === "ArrowRight") {
      if (!row.element && collapsed.has(row.id)) toggle(row.id);
      else next(row.children[0]?.id);
    } else if (event.key === "ArrowLeft") {
      if (!row.element && !collapsed.has(row.id)) toggle(row.id);
      else next(row.parentId);
    } else if (event.key === "Enter" || event.key === " ")
      selectRow(row.id, event);
    else if (event.key === "F2") startRename(row.id);
    else if (event.key === "Delete" || event.key === "Backspace") {
      if (!selected.includes(row.id)) s.selectLayers([row.id]);
      s.deleteSelected();
    } else if (mod && event.key.toLowerCase() === "d") s.duplicate();
    else if (mod && event.key.toLowerCase() === "g") {
      if (event.shiftKey) s.ungroup();
      else s.group();
    } else if (mod && event.key.toLowerCase() === "z") {
      if (event.shiftKey) s.redo();
      else s.undo();
    } else if (event.key === "Escape") {
      if (multiSelect) setMultiSelect(false);
      else s.selectLayers([]);
    } else handled = false;
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  return (
    <div
      ref={panelRef}
      className="layers-panel"
      data-layer-interaction
      onKeyDown={(event) => {
        if (
          multiSelect &&
          event.key === "Escape" &&
          !event.defaultPrevented &&
          !(event.target as HTMLElement).closest(".layer-menu")
        ) {
          event.preventDefault();
          event.stopPropagation();
          setMultiSelect(false);
          requestAnimationFrame(() => multiSelectButton.current?.focus());
        }
      }}
      onFocusCapture={() => {
        ownsFocus.current = true;
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget as Node) &&
          !(event.relatedTarget as HTMLElement).closest?.(".layer-menu")
        )
          ownsFocus.current = false;
      }}
    >
      {showHeader ? (
        <PanelHeader
          icon={Layers3}
          eyebrow="Canvas"
          title="Layers"
          meta={`${doc.elements.length} layer${doc.elements.length === 1 ? "" : "s"}`}
        />
      ) : (
        <div className="layers-compact-header">
          <span>Layers</span>
          <span>{doc.elements.length}</span>
        </div>
      )}
      <div className="layer-selection-mode">
        <button
          type="button"
          ref={multiSelectButton}
          aria-pressed={multiSelect}
          aria-controls={treeId}
          onClick={() => setMultiSelect((current) => !current)}
        >
          {multiSelect ? "Done" : "Select multiple"}
        </button>
        {multiSelect && (
          <span role="status">Select layers, then choose an action.</span>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={(args) =>
          args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)
        }
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Press Space to pick up a layer. Use Down or Right for the next drop position, Up or Left for the previous position, including inside groups. Press Space to drop or Escape to cancel. Locked layers cannot be dragged.",
          },
          announcements: {
            onDragStart: () =>
              "Layer picked up. Use Down or Right for the next destination; Up or Left for the previous destination.",
            onDragOver: ({ over }) => {
              const dest = over?.data.current?.["destination"] as
                LayerDestination | undefined;
              return dest
                ? `${dest.position} ${rows.find((row) => row.id === dest.targetId)?.name ?? "root"}`
                : "No drop target";
            },
            onDragEnd: () =>
              validDrop
                ? "Layer moved."
                : "Move cancelled. Destination is unavailable.",
            onDragCancel: () => "Move cancelled.",
          },
        }}
        onDragStart={({ active }) => {
          const id = String(active.id);
          const ids = selected.includes(id) ? selected : [id];
          if (!selected.includes(id)) s.selectLayers(ids);
          setDragIds(ids);
        }}
        onDragOver={({ over }) =>
          setDrop(
            over?.data.current?.["destination"] as LayerDestination | undefined,
          )
        }
        onDragCancel={() => {
          setDragIds([]);
          setDrop(undefined);
        }}
        onDragEnd={({ over }) => {
          const destination = over?.data.current?.["destination"] as
            LayerDestination | undefined;
          if (destination) s.moveLayers(dragIds, destination);
          setDragIds([]);
          setDrop(undefined);
        }}
      >
        <div
          className="layer-tree"
          id={treeId}
          role="tree"
          aria-label="Layers"
          aria-multiselectable="true"
        >
          {rows.map((row) => (
            <LayerItem
              key={row.id}
              row={row}
              selected={selected.includes(row.id)}
              multiSelect={multiSelect}
              onToggleSelection={(id) => {
                s.selectLayers(
                  toggleLayerSelection(doc, selected, id, "explicit"),
                );
                setAnchor(id);
                setFocusedId(id);
              }}
              collapsed={collapsed.has(row.id)}
              tabIndex={focusId === row.id ? 0 : -1}
              activeDrag={dragIds.length > 0}
              drop={drop}
              validDrop={validDrop}
              dragBlocked={
                selected.includes(row.id) &&
                nodes.some((node) => node.leaves.some((el) => el.locked))
              }
              position={
                allRows
                  .filter((item) => item.parentId === row.parentId)
                  .findIndex((item) => item.id === row.id) + 1
              }
              size={
                allRows.filter((item) => item.parentId === row.parentId).length
              }
              restoreFocus={(id) =>
                requestAnimationFrame(() => {
                  const panel = panelRef.current;
                  const layer = Array.from(
                    panel?.querySelectorAll<HTMLElement>("[data-layer-id]") ??
                      [],
                  ).find((el) => el.dataset["layerId"] === id);
                  const target =
                    panel?.querySelector<HTMLElement>(".layer-rename") ??
                    layer ??
                    panel?.querySelector<HTMLElement>(
                      '[role="treeitem"][aria-selected="true"], [role="treeitem"][tabindex="0"], .layer-row-background',
                    );
                  target?.focus();
                })
              }
              onSelect={(event, id) => selectRow(id, event)}
              onFocus={() => setFocusedId(row.id)}
              onToggle={() => {
                toggle(row.id);
                setFocusedId(row.id);
              }}
              onKeyDown={keyDown}
              rename={rename}
              setDraft={(draft) => {
                renameRef.current = { id: row.id, draft };
                setRename(renameRef.current);
              }}
              commitRename={(restoreFocus) => finishRename(true, restoreFocus)}
              cancelRename={() => finishRename(false)}
              startRename={startRename}
              effectiveIds={selected.includes(row.id) ? selected : [row.id]}
            />
          ))}
          {!rows.length && (
            <p className="layer-empty">Add elements to organize your canvas.</p>
          )}
          <div className={`layer-root-drop ${dragIds.length ? "visible" : ""}`}>
            <DropZone position="after" active={dragIds.length > 0} />
            <span>Move to root</span>
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragIds.length > 0 && (
            <div className="layer-drag-preview">
              <Layers3 size={14} />
              <span>
                {dragIds.length === 1
                  ? allRows.find((row) => row.id === dragIds[0])?.name
                  : `${dragIds.length} layers`}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
      <div className="layers-footer">
        <button
          type="button"
          className={`layer-row-background ${s.backgroundSelected ? "active" : ""}`}
          onClick={() => {
            setMultiSelect(false);
            s.selectBackground();
          }}
          aria-pressed={s.backgroundSelected}
        >
          <span
            className="layer-background-swatch"
            style={backgroundStyle(doc)}
            aria-hidden="true"
          />
          <span>Background</span>
        </button>
        {(nodes.length > 0 || s.backgroundSelected) && (
          <div className="layer-toolbar" aria-label="Selection actions">
            <div className="layer-selection-summary" aria-live="polite">
              <span>Selected</span>
              <strong className="truncate">
                {s.backgroundSelected
                  ? "Background"
                  : nodes.length === 1
                    ? nodes[0]!.name
                    : `${nodes.length} layers`}
              </strong>
            </div>
            <div className="layer-toolbar-actions">
              {groupable && (
                <button type="button" onClick={s.group}>
                  <Group />
                  Group
                </button>
              )}
              {ungroupable && (
                <button type="button" onClick={s.ungroup}>
                  <Ungroup />
                  Ungroup
                </button>
              )}
              <button
                type="button"
                className="layer-properties"
                onClick={openProperties}
              >
                <SlidersHorizontal />
                Properties
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
