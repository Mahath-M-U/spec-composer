import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Group,
  Layers3,
  Lock,
  MoveDown,
  MoveUp,
  Trash2,
  Ungroup,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { PanelHeader } from "./panel-header";
import { backgroundStyle } from "./static-render";
import { useEditorStore } from "./store";
import type { SpecElement } from "./types";

export function LayersPanel({ showHeader = true }: { showHeader?: boolean }) {
  const s = useEditorStore();
  const d = s.doc;
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  if (!d) return null;
  const layers = [...d.elements].sort((a, b) => b.zIndex - a.zIndex);
  const groups = new Map<string, SpecElement[]>();
  layers.forEach((element) => {
    if (!element.groupId) return;
    const members = groups.get(element.groupId) ?? [];
    members.push(element);
    groups.set(element.groupId, members);
  });

  const seenGroups = new Set<string>();
  const layerItems: Array<
    | { type: "layer"; element: SpecElement }
    | { type: "group"; id: string; elements: SpecElement[] }
  > = [];
  layers.forEach((element) => {
    if (!element.groupId) {
      layerItems.push({ type: "layer", element });
      return;
    }
    if (seenGroups.has(element.groupId)) return;
    seenGroups.add(element.groupId);
    layerItems.push({
      type: "group",
      id: element.groupId,
      elements: groups.get(element.groupId) ?? [],
    });
  });

  const moveLayerUp = (id: string) => {
    const index = layers.findIndex((element) => element.id === id);
    if (index <= 0) return;
    const ids = layers.map((element) => element.id);
    [ids[index - 1], ids[index]] = [ids[index]!, ids[index - 1]!];
    s.reorder(ids.reverse());
  };

  const moveLayerDown = (id: string) => {
    const index = layers.findIndex((element) => element.id === id);
    if (index < 0 || index >= layers.length - 1) return;
    const ids = layers.map((element) => element.id);
    [ids[index], ids[index + 1]] = [ids[index + 1]!, ids[index]!];
    s.reorder(ids.reverse());
  };

  const renderLayer = (element: SpecElement, nested = false) => {
    const index = layers.findIndex((layer) => layer.id === element.id);
    return (
      <div
        key={element.id}
        className={`layer-row ${nested ? "layer-row-child" : ""} ${s.selectedIds.includes(element.id) ? "active" : ""}`}
        onClick={(event) => s.select(element.id, event.shiftKey)}
      >
        <span className="truncate">{element.name}</span>
        <Hint label={element.locked ? "Unlock" : "Lock"}>
          <button
            type="button"
            aria-label={
              element.locked ? `Unlock ${element.name}` : `Lock ${element.name}`
            }
            onClick={(event) => {
              event.stopPropagation();
              s.updateElement(element.id, { locked: !element.locked });
            }}
          >
            {element.locked ? <Lock /> : <Unlock />}
          </button>
        </Hint>
        <Hint label="Move up">
          <button
            type="button"
            aria-label={`Move ${element.name} up`}
            disabled={index === 0}
            onClick={(event) => {
              event.stopPropagation();
              moveLayerUp(element.id);
            }}
          >
            <MoveUp />
          </button>
        </Hint>
        <Hint label="Move down">
          <button
            type="button"
            aria-label={`Move ${element.name} down`}
            disabled={index === layers.length - 1}
            onClick={(event) => {
              event.stopPropagation();
              moveLayerDown(element.id);
            }}
          >
            <MoveDown />
          </button>
        </Hint>
        <Hint label="Delete">
          <button
            type="button"
            className="layer-delete"
            aria-label={`Delete ${element.name}`}
            onClick={(event) => {
              event.stopPropagation();
              s.deleteElements([element.id]);
            }}
          >
            <Trash2 />
          </button>
        </Hint>
      </div>
    );
  };

  return (
    <>
      {showHeader && (
        <PanelHeader
          icon={Layers3}
          eyebrow="Canvas"
          title="Layers"
          meta={`${d.elements.length} layer${d.elements.length === 1 ? "" : "s"}`}
        />
      )}
      <div className="layer-list px-2">
        {layerItems.map((item, itemIndex) => {
          if (item.type === "layer") return renderLayer(item.element);

          const isCollapsed = collapsedGroups.has(item.id);
          const memberIds = item.elements.map((element) => element.id);
          const isSelected = memberIds.some((id) => s.selectedIds.includes(id));
          const groupNumber = layerItems
            .slice(0, itemIndex + 1)
            .filter((candidate) => candidate.type === "group").length;
          const groupLabel = `Group ${groupNumber}`;

          return (
            <div className="layer-group" key={item.id}>
              <div
                className={`layer-group-row ${isSelected ? "active" : ""}`}
                onClick={(event) => s.selectMany(memberIds, event.shiftKey)}
              >
                <Hint label={isCollapsed ? "Expand" : "Collapse"}>
                  <button
                    type="button"
                    className="layer-group-toggle"
                    aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${groupLabel}`}
                    aria-expanded={!isCollapsed}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCollapsedGroups((current) => {
                        const next = new Set(current);
                        if (next.has(item.id)) next.delete(item.id);
                        else next.add(item.id);
                        return next;
                      });
                    }}
                  >
                    {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                  </button>
                </Hint>
                <Folder className="layer-group-folder" aria-hidden="true" />
                <span className="truncate">{groupLabel}</span>
                <span className="layer-group-count">
                  {item.elements.length}
                </span>
                <Hint label="Delete group">
                  <button
                    type="button"
                    className="layer-delete"
                    aria-label={`Delete ${groupLabel} and its layers`}
                    onClick={(event) => {
                      event.stopPropagation();
                      s.deleteElements(memberIds);
                    }}
                  >
                    <Trash2 />
                  </button>
                </Hint>
              </div>
              {!isCollapsed && (
                <div className="layer-group-children">
                  {item.elements.map((element) => renderLayer(element, true))}
                </div>
              )}
            </div>
          );
        })}
        <div
          className={`layer-row-background ${s.backgroundSelected ? "active" : ""}`}
          onClick={() => s.selectBackground()}
        >
          <span
            className="layer-background-swatch"
            style={backgroundStyle(d)}
            aria-hidden="true"
          />
          <span className="truncate">Background</span>
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={s.selectedIds.length < 2}
          onClick={s.group}
        >
          <Group size={14} />
          Group
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={
            !d.elements.some(
              (element) =>
                s.selectedIds.includes(element.id) && Boolean(element.groupId),
            )
          }
          onClick={s.ungroup}
        >
          <Ungroup size={14} />
          Ungroup
        </Button>
        <Button
          className="col-span-2"
          size="sm"
          variant="outline"
          disabled={!s.selectedIds.length}
          onClick={s.deleteSelected}
        >
          <Trash2 size={14} />
          Delete selected
        </Button>
      </div>
    </>
  );
}
