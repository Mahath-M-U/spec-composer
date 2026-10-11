import { Plus } from "lucide-react";
import {
  ASSET_ROLES,
  promptSnippet,
  roleOf,
  type AssetItem,
} from "../asset-catalog";
import type { ArtColors } from "../illustrations";
import { AssetPreview } from "./asset-previews";

const ROLE_LABELS = new Map(ASSET_ROLES.map((role) => [role.id, role.label]));

/**
 * A draggable, clickable catalog tile. Preview-first: the rendered asset
 * fills the tile, with its role and prompt snippet exposed via aria-label
 * and title rather than shown as text. Dragging sets both "spec/asset" (the
 * item id, preferred by the canvas) and "spec/kind" (a plain-kind fallback
 * for legacy drop targets). A "+" appears on hover/focus, with an optional
 * usage badge (e.g. "×4") in the top-left corner.
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
  const roleLabel = ROLE_LABELS.get(roleOf(item)) ?? roleOf(item);
  const snippet = promptSnippet(item);

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
      title={`${item.label} (${roleLabel})\n${snippet}`}
      aria-label={`Add ${item.label} (${roleLabel}): ${snippet}`}
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
