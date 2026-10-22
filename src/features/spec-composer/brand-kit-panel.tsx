import { useState } from "react";
import { Gem, Plus, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import {
  BrandKitBuilder,
  BrandKitDeleteDialog,
  type BrandKitBuilderMode,
} from "./brand-kit-builder";
import {
  BRAND_COLOR_ROLES,
  DesignKitCard,
  type DesignKitCardActions,
} from "./design-kit-card";
import {
  matchesBrandKitQuery,
  orderBrandKitsActiveFirst,
} from "./brand-kit-search";
import { resolveImageStyle } from "./image-styles";
import { PanelHeader } from "./panel-header";
import { useEditorStore } from "./store";
import type { BrandKit, BrandKitColor } from "./types";

export {
  BRAND_COLOR_ROLES,
  BRAND_COLOR_SHORT_LABELS,
  BrandKitPreview,
  brandKitPaint,
  copyBrandColorHex,
} from "./design-kit-card";

export const BRAND_COLOR_USECASES: Record<
  BrandKitColor["role"],
  readonly string[]
> = {
  primary: ["Headlines", "Buttons", "Key shapes"],
  secondary: ["Subheadings", "Highlights", "Supporting shapes"],
  background: ["Canvas", "Sections", "Cards"],
  text: ["Headings", "Body text", "Captions"],
  accent: ["Badges", "Icons", "Details"],
};

export function brandColorRoleLabel(role: BrandKitColor["role"]): string {
  return (
    BRAND_COLOR_ROLES.find((candidate) => candidate.value === role)?.label ??
    "Brand color"
  );
}

export function defaultBrandColorUsecase(role: BrandKitColor["role"]): string {
  return BRAND_COLOR_USECASES[role][0] ?? "Headlines";
}

export function selectedBrandColorUsecases(color: BrandKitColor): string[] {
  const options = BRAND_COLOR_USECASES[color.role];
  const selected = color.usecase
    .split(/[,|]/)
    .map((value) => value.trim())
    .filter((value) =>
      options.some((option) => option.toLowerCase() === value.toLowerCase()),
    );

  if (selected.length || !color.usecase.trim()) return selected;

  const legacyUsecase = color.usecase.toLowerCase();
  if (color.role === "primary" && legacyUsecase.includes("action"))
    return ["Buttons"];
  if (color.role === "secondary" && legacyUsecase.includes("accent"))
    return ["Highlights"];
  if (color.role === "background" && legacyUsecase.includes("background"))
    return ["Canvas"];
  if (color.role === "text" && legacyUsecase.includes("text"))
    return ["Body text"];
  return [defaultBrandColorUsecase(color.role)];
}

export function BrandKitPanel({
  standalone = false,
  pageView = false,
}: {
  standalone?: boolean;
  pageView?: boolean;
}) {
  const s = useEditorStore();
  const d = s.doc;
  const [dialogSession, setDialogSession] = useState<{
    mode: BrandKitBuilderMode;
    initialKit?: BrandKit;
  } | null>(null);
  const [kitQuery, setKitQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BrandKit | null>(null);

  if (!standalone && !d) return null;

  // In the editor the toggle switches this poster's kit; on the design kit
  // pages it picks the default kit new posters start with.
  const activeKitId = standalone
    ? s.defaultBrandKitId
    : d?.creativeDirection.brandKitId;

  // Search only exists in the editor panel; standalone pages list every kit.
  const filteredKits = standalone
    ? s.brandKits
    : s.brandKits.filter((kit) => matchesBrandKitQuery(kit, kitQuery));
  const visibleKits = orderBrandKitsActiveFirst(filteredKits, activeKitId);

  // The open document's resolved image style, shown as a chip on the
  // applied card only — never on standalone home/design-kit pages.
  const appliedImageStyle =
    !standalone && d ? resolveImageStyle(d)?.label : undefined;

  return (
    <div
      className={`brandkit-panel${standalone ? " brandkit-home-panel" : ""}${pageView ? " brandkit-page-panel" : ""}`}
    >
      {!standalone && (
        <>
          <PanelHeader
            icon={Gem}
            eyebrow="Library"
            title="Design kit"
            meta={`${s.brandKits.length} kit${s.brandKits.length === 1 ? "" : "s"}`}
          />
          <div className="asset-search-wrap">
            <Search aria-hidden="true" />
            <input
              className="asset-search"
              value={kitQuery}
              onChange={(e) => setKitQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && kitQuery) {
                  e.preventDefault();
                  setKitQuery("");
                }
              }}
              placeholder="Search design kits"
              aria-label="Search design kits"
            />
            {kitQuery && (
              <Hint label="Clear search">
                <button
                  type="button"
                  onClick={() => setKitQuery("")}
                  aria-label="Clear search"
                >
                  <X />
                </button>
              </Hint>
            )}
          </div>
        </>
      )}

      <div className="brandkit-create-toolbar">
        <Button
          size="sm"
          className="brandkit-newkit-button"
          data-tour="kit-new"
          onClick={() => setDialogSession({ mode: "create" })}
        >
          <Plus size={14} />
          Create kit
        </Button>

        <Hint label="Generate a kit from one seed color (Material 3)">
          <Button
            size="sm"
            variant="outline"
            className="brandkit-m3-trigger-button"
            aria-label="Generate kit from a seed color"
            data-tour="kit-generate"
            onClick={() => setDialogSession({ mode: "generate" })}
          >
            <Sparkles size={14} />
          </Button>
        </Hint>
      </div>

      <BrandKitBuilder
        open={dialogSession !== null}
        mode={dialogSession?.mode ?? "create"}
        initialKit={dialogSession?.initialKit}
        onOpenChange={(next) => {
          if (!next) setDialogSession(null);
        }}
        onSaved={() => {
          setDialogSession(null);
          setKitQuery("");
        }}
      />

      <BrandKitDeleteDialog
        kit={deleteTarget ?? undefined}
        open={!!deleteTarget}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        onDeleted={() => setDeleteTarget(null)}
      />

      {!s.brandKits.length && (
        <div className="asset-empty">
          <Gem aria-hidden="true" />
          <b>No design kits yet</b>
          <span>Create one to define reusable colors and brand emotion.</span>
        </div>
      )}

      {s.brandKits.length > 0 && visibleKits.length === 0 && (
        <div className="asset-empty">
          <Search aria-hidden="true" />
          <b>No design kits found</b>
          <span>No results for “{kitQuery}”. Try a different search term.</span>
        </div>
      )}

      <div className="brandkit-list-panel">
        {visibleKits.map((kit) => {
          const active = activeKitId === kit.id;
          const actions: DesignKitCardActions = {
            active,
            applyMode: !standalone,
            onActivate: () =>
              standalone
                ? s.setDefaultBrandKit(kit.id)
                : s.activateBrandKit(kit.id),
            onDeactivate: () =>
              standalone ? s.clearDefaultBrandKit() : s.deactivateBrandKit(),
            onEdit: () =>
              setDialogSession({
                mode: "edit",
                initialKit: structuredClone(kit),
              }),
            onRename: (name) => s.updateBrandKit(kit.id, { name }),
            onDelete: () => setDeleteTarget(kit),
          };
          return (
            <DesignKitCard
              key={kit.id}
              kit={kit}
              actions={actions}
              appliedImageStyle={appliedImageStyle}
            />
          );
        })}
      </div>
    </div>
  );
}
