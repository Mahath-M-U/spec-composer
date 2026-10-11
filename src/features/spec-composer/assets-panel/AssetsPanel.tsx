import { useMemo, useState, type KeyboardEvent } from "react";
import {
  BadgeCheck,
  BadgePercent,
  Heading1,
  History,
  Image as ImageIcon,
  Layers,
  MousePointerClick,
  Search,
  Shapes,
  Star,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import { PanelHeader } from "../panel-header";
import { useEditorStore } from "../store";
import {
  ASSET_CATALOG,
  ASSET_ROLES,
  CATEGORIES,
  roleOf,
  searchAssets,
  type AssetCategory,
  type AssetCategoryId,
  type AssetItem,
  type AssetRole,
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
import { UploadTile } from "./UploadTile";

/** Keep home rows short; "See all" opens the role's own tab. */
const ROW_PREVIEW_COUNT = 10;

const byId = new Map(ASSET_CATALOG.map((item) => [item.id, item]));

/** One lucide icon per role, used in role tabs and the "All" tab's rows. */
const ROLE_ICONS: Record<AssetRole, LucideIcon> = {
  background: Layers,
  subject: UserRound,
  headline: Heading1,
  offer: BadgePercent,
  cta: MousePointerClick,
  brand: BadgeCheck,
  decor: Shapes,
};

export function AssetsPanel() {
  const doc = useEditorStore((s) => s.doc);
  const activeKit = useEditorStore((s) =>
    s.brandKits.find((kit) => kit.id === s.doc?.creativeDirection.brandKitId),
  );
  const usage = useAssetUsage();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | AssetRole>("all");
  const [chip, setChip] = useState<AssetCategoryId | null>(null);

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

  const selectTab = (next: "all" | AssetRole) => {
    setActiveTab(next);
    setChip(null);
  };

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

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const filter =
      activeTab === "all"
        ? undefined
        : (item: AssetItem) => roleOf(item) === activeTab;
    return searchAssets(trimmedQuery, filter);
  }, [isSearching, trimmedQuery, activeTab]);
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

  const roleItems = useMemo(() => {
    if (activeTab === "all") return [];
    return ASSET_CATALOG.filter(
      (item) =>
        roleOf(item) === activeTab && (!chip || item.category === chip),
    );
  }, [activeTab, chip]);
  const roleCategories: AssetCategory[] = useMemo(() => {
    if (activeTab === "all") return [];
    const present = new Set(
      ASSET_CATALOG.filter((item) => roleOf(item) === activeTab).map(
        (item) => item.category,
      ),
    );
    return CATEGORIES.filter((category) => present.has(category.id));
  }, [activeTab]);
  const activeRoleLabel =
    activeTab === "all"
      ? ""
      : (ASSET_ROLES.find((role) => role.id === activeTab)?.label ??
        activeTab);
  // "Use your photo / your logo" leads the Subject and Brand tab grids and
  // auto-slots, same as a catalog click.
  const uploadLeading =
    activeTab === "subject" || activeTab === "brand" ? (
      <UploadTile role={activeTab} />
    ) : undefined;

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    if (query) {
      event.preventDefault();
      setQuery("");
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
          onChange={(event) => setQuery(event.target.value)}
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

      <div className="asset-role-tabs" role="tablist" aria-label="Asset role">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "all"}
          className={activeTab === "all" ? "active" : ""}
          onClick={() => selectTab("all")}
        >
          All
        </button>
        {ASSET_ROLES.map((role) => {
          const Icon = ROLE_ICONS[role.id];
          return (
            <button
              key={role.id}
              type="button"
              role="tab"
              aria-selected={activeTab === role.id}
              className={activeTab === role.id ? "active" : ""}
              onClick={() => selectTab(role.id)}
            >
              <Icon aria-hidden="true" />
              {role.label}
            </button>
          );
        })}
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
      ) : activeTab === "all" ? (
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
          {ASSET_ROLES.map((role) => {
            const items = ASSET_CATALOG.filter(
              (item) => roleOf(item) === role.id,
            );
            if (!items.length) return null;
            return (
              <AssetSection
                key={role.id}
                icon={ROLE_ICONS[role.id]}
                label={role.label}
                count={items.length}
                items={items.slice(0, ROW_PREVIEW_COUNT)}
                colors={colors}
                paper={paper}
                baseTextColor={baseTextColor}
                onAdd={handleAdd}
                mode="row"
                onSeeAll={() => selectTab(role.id)}
              />
            );
          })}
        </div>
      ) : (
        <>
          <div className="asset-filter-chips" role="list">
            <button
              type="button"
              className={chip === null ? "active" : ""}
              onClick={() => setChip(null)}
            >
              All
            </button>
            {roleCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={chip === category.id ? "active" : ""}
                onClick={() => setChip(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
          {roleItems.length || uploadLeading ? (
            <AssetSection
              icon={ROLE_ICONS[activeTab]}
              label={activeRoleLabel}
              count={roleItems.length}
              items={roleItems}
              colors={colors}
              paper={paper}
              baseTextColor={baseTextColor}
              onAdd={handleAdd}
              mode="grid"
              columns={3}
              leading={uploadLeading}
            />
          ) : (
            <div className="asset-empty">
              <Search aria-hidden="true" />
              <b>No assets found</b>
              <span>Try a different filter.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
