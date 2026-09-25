import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  ChevronLeft,
  History,
  Image as ImageIcon,
  Search,
  Star,
  X,
} from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import { PanelHeader } from "../panel-header";
import { useEditorStore } from "../store";
import {
  ASSET_CATALOG,
  CATEGORIES,
  itemsInCategory,
  searchAssets,
  type AssetCategory,
  type AssetCategoryId,
  type AssetItem,
} from "../asset-catalog";
import { rankPopular, recentIds } from "../asset-catalog/usage";
import { clearAssetUsage, useAssetUsage } from "../asset-usage-store";
import { getBrandKitColor } from "../brand-kits";
import type { ArtColors } from "../illustrations";
import { backgroundStyle } from "../static-render";
import { addCatalogAsset } from "./add-asset";
import { AssetSection } from "./AssetSection";
import { AssetTile } from "./AssetTile";
import { CATEGORY_ICONS } from "./category-icons";

/** Keep home rows short; "See all" opens the full category grid. */
const ROW_PREVIEW_COUNT = 10;

const byId = new Map(ASSET_CATALOG.map((item) => [item.id, item]));

export function AssetsPanel() {
  const doc = useEditorStore((s) => s.doc);
  const activeKit = useEditorStore((s) =>
    s.brandKits.find((kit) => kit.id === s.doc?.creativeDirection.brandKitId),
  );
  const usage = useAssetUsage();
  const [query, setQuery] = useState("");
  const [drillCategory, setDrillCategory] = useState<AssetCategoryId | null>(
    null,
  );
  const seeAllRefs = useRef<
    Partial<Record<AssetCategoryId, HTMLButtonElement | null>>
  >({});

  const colors: ArtColors = {
    ink: doc?.creativeDirection.primaryColor ?? "#18181B",
    accent: doc?.creativeDirection.secondaryColor ?? "#A78BFA",
  };
  const paper = doc ? String(backgroundStyle(doc).background) : "#f9f5ee";
  const baseTextColor = activeKit
    ? ((
        getBrandKitColor(activeKit, "text") ??
        getBrandKitColor(activeKit, "primary") ??
        activeKit.colors.find(
          (color) => color.role !== "background" && color.role !== "text",
        )
      )?.hex ?? "#18181B")
    : "#18181B";

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const handleAdd = (item: AssetItem) => addCatalogAsset(item);

  const popular = useMemo(
    () => rankPopular(ASSET_CATALOG, usage).slice(0, 12),
    [usage],
  );
  const recentItems = useMemo(
    () =>
      recentIds(usage)
        .map((id) => byId.get(id))
        .filter((item): item is AssetItem => !!item),
    [usage],
  );

  const searchResults = useMemo(
    () => (isSearching ? searchAssets(trimmedQuery) : []),
    [isSearching, trimmedQuery],
  );
  const searchGroups = useMemo(() => {
    const byCategory = new Map<AssetCategoryId, AssetItem[]>();
    for (const item of searchResults) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return CATEGORIES.filter((category) => byCategory.has(category.id)).map(
      (category) => ({ category, items: byCategory.get(category.id) ?? [] }),
    );
  }, [searchResults]);

  const sectionCategories: AssetCategory[] = [
    ...CATEGORIES.filter((category) => category.id === "backgrounds"),
    ...CATEGORIES.filter((category) => category.id !== "backgrounds"),
  ];
  const drillCategoryMeta = drillCategory
    ? CATEGORIES.find((category) => category.id === drillCategory)
    : undefined;

  const openDrill = (categoryId: AssetCategoryId) =>
    setDrillCategory(categoryId);
  const closeDrill = () => {
    const trigger = drillCategory
      ? seeAllRefs.current[drillCategory]
      : undefined;
    setDrillCategory(null);
    requestAnimationFrame(() => trigger?.focus());
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    if (query) {
      event.preventDefault();
      setQuery("");
      return;
    }
    if (drillCategory) {
      event.preventDefault();
      closeDrill();
    }
  };

  return (
    <div className="assets-panel">
      <PanelHeader
        icon={ImageIcon}
        eyebrow="Library"
        title="Assets"
        meta={`${ASSET_CATALOG.length} assets`}
      />

      <div className="asset-search-wrap">
        <Search aria-hidden="true" />
        <input
          className="asset-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value) setDrillCategory(null);
          }}
          onKeyDown={onSearchKeyDown}
          placeholder="Search assets"
          aria-label="Search assets"
        />
        {query && (
          <Hint label="Clear search">
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X />
            </button>
          </Hint>
        )}
      </div>

      {isSearching ? (
        <div className="asset-search-results">
          <p aria-live="polite" className="asset-search-count">
            {searchResults.length
              ? `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`
              : "No results"}
          </p>
          {!searchResults.length ? (
            <div className="asset-empty">
              <Search aria-hidden="true" />
              <b>No assets found</b>
              <span>Try a different search term.</span>
            </div>
          ) : (
            searchGroups.map(({ category, items }) => (
              <AssetSection
                key={category.id}
                icon={CATEGORY_ICONS[category.id]}
                label={category.label}
                count={items.length}
                items={items}
                colors={colors}
                paper={paper}
                baseTextColor={baseTextColor}
                onAdd={handleAdd}
                mode="grid"
                columns={3}
              />
            ))
          )}
        </div>
      ) : drillCategoryMeta ? (
        <>
          <div className="asset-drill-head">
            <button
              type="button"
              className="asset-back"
              onClick={closeDrill}
              aria-label="Back to library"
            >
              <ChevronLeft aria-hidden="true" />
              Back
            </button>
            <h3>
              <CategoryIcon id={drillCategoryMeta.id} />
              {drillCategoryMeta.label}
            </h3>
            <span>{itemsInCategory(drillCategoryMeta.id).length}</span>
          </div>
          <div className="asset-tile-grid asset-drill-grid" role="list">
            {itemsInCategory(drillCategoryMeta.id).map((item) => (
              <AssetTile
                key={item.id}
                item={item}
                colors={colors}
                paper={paper}
                baseTextColor={baseTextColor}
                onAdd={handleAdd}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="asset-groups">
            {popular.length > 0 && (
              <AssetSection
                icon={Star}
                label="Popular"
                count={popular.length}
                items={popular}
                colors={colors}
                paper={paper}
                baseTextColor={baseTextColor}
                onAdd={handleAdd}
                mode="row"
                badgeFor={(item) => {
                  const entry = usage.entries[item.id];
                  return entry && entry.count > 1
                    ? `×${entry.count}`
                    : undefined;
                }}
              />
            )}
            {recentItems.length > 0 && (
              <AssetSection
                icon={History}
                label="Recently used"
                count={recentItems.length}
                items={recentItems}
                colors={colors}
                paper={paper}
                baseTextColor={baseTextColor}
                onAdd={handleAdd}
                mode="row"
                headExtra={
                  <button
                    type="button"
                    className="asset-clear-recent"
                    onClick={() => clearAssetUsage()}
                  >
                    Clear
                  </button>
                }
              />
            )}
            {sectionCategories.map((category) => {
              const items = itemsInCategory(category.id);
              return (
                <AssetSection
                  key={category.id}
                  ref={(node) => {
                    seeAllRefs.current[category.id] = node;
                  }}
                  icon={CATEGORY_ICONS[category.id]}
                  label={category.label}
                  count={items.length}
                  items={items.slice(0, ROW_PREVIEW_COUNT)}
                  colors={colors}
                  paper={paper}
                  baseTextColor={baseTextColor}
                  onAdd={handleAdd}
                  mode="row"
                  onSeeAll={() => openDrill(category.id)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CategoryIcon({ id }: { id: AssetCategoryId }) {
  const Icon = CATEGORY_ICONS[id];
  return <Icon aria-hidden="true" />;
}
