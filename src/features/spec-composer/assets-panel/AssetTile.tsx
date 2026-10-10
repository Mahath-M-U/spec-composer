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
 * A draggable, clickable catalog tile. Leads with the asset's role and the
 * prompt words it contributes (a sentence fragment, not a picture) so the
 * library reads as prompt vocabulary; the rendered preview is now a small
 * secondary icon. Dragging sets both "spec/asset" (the item id, preferred by
 * the canvas) and "spec/kind" (a plain-kind fallback for legacy drop
 * targets). A "+" appears on hover/focus, with an optional usage badge (e.g.
 * "×4") in the corner.
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
      title={item.label}
      aria-label={`Add ${item.label} (${roleLabel}): ${snippet}`}
    >
      <span className="asset-tile-head">
        <span className="asset-role-badge">{roleLabel}</span>
        <AssetPreview
          item={item}
          colors={colors}
          paper={paper}
          baseTextColor={baseTextColor}
        />
      </span>
      <span className="asset-tile-snippet">{snippet}</span>
      <span className="asset-tile-label">{item.label}</span>
      <Plus className="asset-tile-add" aria-hidden="true" />
      {badge && <span className="asset-tile-badge">{badge}</span>}
    </button>
  );
}
