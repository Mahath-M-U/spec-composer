import { Plus } from "lucide-react";
import type { AssetItem } from "../asset-catalog";
import type { ArtColors } from "../illustrations";
import { AssetPreview } from "./asset-previews";

/**
 * A draggable, clickable catalog tile. Dragging sets both "spec/asset" (the
 * item id, preferred by the canvas) and "spec/kind" (a plain-kind fallback
 * for legacy drop targets). A "+" appears on hover/focus, with an optional
 * usage badge (e.g. "×4") in the corner.
 */
export function AssetTile({
  item,
  colors,
  paper,
  baseTextColor,
  badge,
  onAdd,
}: {
  item: AssetItem;
  colors: ArtColors;
  paper: string;
  baseTextColor: string;
  badge?: string;
  onAdd: (item: AssetItem) => void;
}) {
  return (
    <button
      type="button"
      className="asset-tile"
      data-roving-tile
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("spec/asset", item.id);
        event.dataTransfer.setData("spec/kind", item.kind);
      }}
      onClick={() => onAdd(item)}
      aria-label={`Add ${item.label}; drag to place on canvas`}
    >
      <AssetPreview
        item={item}
        colors={colors}
        paper={paper}
        baseTextColor={baseTextColor}
      />
      <span className="asset-tile-label">{item.label}</span>
      <Plus className="asset-tile-add" aria-hidden="true" />
      {badge && <span className="asset-tile-badge">{badge}</span>}
    </button>
  );
}
