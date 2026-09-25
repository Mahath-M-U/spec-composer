import { forwardRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { AssetItem } from "../asset-catalog";
import type { ArtColors } from "../illustrations";
import { AssetTile } from "./AssetTile";
import { useRovingGrid } from "./use-roving-grid";

/**
 * A header (icon, label, count, optional "See all ›") over either a
 * horizontally scrolling row or a wrapping grid of tiles.
 */
export const AssetSection = forwardRef<
  HTMLButtonElement,
  {
    icon: LucideIcon;
    label: string;
    count: number;
    items: AssetItem[];
    colors: ArtColors;
    paper: string;
    baseTextColor: string;
    onAdd: (item: AssetItem) => void;
    mode?: "row" | "grid";
    columns?: number;
    onSeeAll?: () => void;
    badgeFor?: (item: AssetItem) => string | undefined;
    headExtra?: ReactNode;
  }
>(function AssetSection(
  {
    icon: Icon,
    label,
    count,
    items,
    colors,
    paper,
    baseTextColor,
    onAdd,
    mode = "row",
    columns = 3,
    onSeeAll,
    badgeFor,
    headExtra,
  },
  seeAllRef,
) {
  const { containerRef, onKeyDown } = useRovingGrid(
    mode === "row" ? "row" : columns,
  );
  return (
    <section className="asset-section" aria-label={label}>
      <div className="asset-section-head">
        <h3>
          <Icon aria-hidden="true" />
          {label}
          <span>{count}</span>
        </h3>
        {headExtra}
        {onSeeAll && (
          <button
            type="button"
            className="asset-see-all"
            ref={seeAllRef}
            onClick={onSeeAll}
          >
            See all ›
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        onKeyDown={onKeyDown}
        className={mode === "row" ? "asset-row" : "asset-tile-grid"}
        role="list"
      >
        {items.map((item) => {
          const badge = badgeFor?.(item);
          return (
            <AssetTile
              key={item.id}
              item={item}
              colors={colors}
              paper={paper}
              baseTextColor={baseTextColor}
              onAdd={onAdd}
              {...(badge ? { badge } : {})}
            />
          );
        })}
      </div>
    </section>
  );
});
