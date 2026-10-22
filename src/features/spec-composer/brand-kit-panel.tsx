import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Check,
  Gem,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BrandKitBuilder,
  BrandKitDeleteDialog,
  type BrandKitBuilderMode,
} from "./brand-kit-builder";
import { getBrandKitColor } from "./brand-kits";
import {
  matchesBrandKitQuery,
  orderBrandKitsActiveFirst,
} from "./brand-kit-search";
import {
  brandKitTileForeground,
  contrastRatio,
  readableTextOn,
} from "./color-names";
import { DesignSettingsArt } from "./design-settings-art";
import { resolveImageStyle } from "./image-styles";
import { PanelHeader } from "./panel-header";
import { useEditorStore } from "./store";
import type { BrandKit, BrandKitColor } from "./types";

export function brandKitPaint(color: BrandKitColor): string {
  return color.type === "gradient"
    ? `linear-gradient(${color.angle}deg, ${color.hex}, ${color.secondaryHex ?? color.hex})`
    : color.hex;
}

/** The roles used to render a design kit's showcase preview, with fallbacks
 * so kits that only define a couple of colors still render something. */
function brandKitPreviewColors(kit: BrandKit) {
  const primary =
    getBrandKitColor(kit, "primary") ??
    kit.colors.find(
      (color) => color.role !== "background" && color.role !== "text",
    );
  const secondary = getBrandKitColor(kit, "secondary");
  const accent = getBrandKitColor(kit, "accent") ?? secondary;
  const background = getBrandKitColor(kit, "background");
  const text = getBrandKitColor(kit, "text");
  return { primary, secondary, accent, background, text };
}

export async function copyBrandColorHex(hex: string) {
  try {
    await navigator.clipboard.writeText(hex.toUpperCase());
    toast.success(`Copied ${hex.toUpperCase()}`);
  } catch {
    toast.error("Couldn't copy color");
  }
}

/** A small sample poster showing a kit's colors and typography in use. */
export function BrandKitPreview({
  kit,
  variant = "card",
  actions,
  title,
  imageStyle,
}: {
  kit: BrandKit;
  variant?: "card" | "builder";
  actions?: ReactNode;
  title?: ReactNode;
  /** The open document's resolved image style label, shown as a chip on the
   * applied card only (card variant); omitted when unset. */
  imageStyle?: string | undefined;
}) {
  const { primary, secondary, accent, background, text } =
    brandKitPreviewColors(kit);

  const backgroundPaint = background
    ? brandKitPaint(background)
    : "var(--color-editor)";
  const headlineColor = background
    ? readableTextOn(background.hex, text?.hex)
    : (text?.hex ?? "var(--color-editor-foreground)");
  const ctaPaint = primary
    ? brandKitPaint(primary)
    : "var(--color-editor-muted)";
  const ctaForeground = primary
    ? brandKitTileForeground(primary.hex)
    : "#FFFFFF";
  const accentColor = accent ?? secondary;

  if (variant === "builder") {
    return (
      <div
        className="bk-preview bk-preview--builder"
        style={{
          background: backgroundPaint,
          fontFamily: kit.typography || undefined,
          color: headlineColor,
        }}
      >
        {kit.style && <span className="bk-preview-style">{kit.style}</span>}
        <strong
          className="bk-preview-headline"
          style={{
            fontFamily: kit.typography || undefined,
            color: headlineColor,
          }}
        >
          {kit.name || "Your headline"}
        </strong>
        <span className="bk-preview-specimen">Aa Bb 0123</span>
        <span
          className="bk-preview-cta"
          style={{ background: ctaPaint, color: ctaForeground }}
        >
          Get started
        </span>
        <svg
          className="bk-preview-shapes"
          viewBox="0 0 132 104"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="40"
            cy="30"
            r="22"
            fill="none"
            strokeWidth="10"
            stroke={primary?.hex ?? "var(--color-editor-muted)"}
          />
          <circle
            cx="38"
            cy="28"
            r="4"
            fill={headlineColor}
            opacity="0.4"
          />
          <rect
            x="70"
            y="15"
            width="44"
            height="28"
            rx="8"
            fill={secondary?.hex ?? primary?.hex ?? "var(--color-editor-muted)"}
          />
          <polygon
            points="76,58 106,98 46,98"
            fill={
              accentColor?.hex ?? primary?.hex ?? "var(--color-editor-muted)"
            }
          />
          <polygon
            points="26,65 38,79 26,93 14,79"
            fill={secondary?.hex ?? primary?.hex ?? "var(--color-editor-muted)"}
          />
          <path
            d="M104 68 A12 12 0 0 1 128 68 Z"
            fill={primary?.hex ?? "var(--color-editor-muted)"}
          />
        </svg>
      </div>
    );
  }

  const typeFontFamily =
    kit.typography || "ui-sans-serif, system-ui, sans-serif";
  const hasChips = kit.style.trim() || imageStyle?.trim();

  // Card-only kit variables: the applied-pill mark needs just enough
  // contrast to read as a button, while the title prefers the kit's
  // secondary color but only when it stays readable on the canvas.
  const canvasHex = background?.hex;
  const markColor =
    primary && canvasHex && contrastRatio(primary.hex, canvasHex) >= 3
      ? primary.hex
      : headlineColor;
  const titleColor =
    secondary && canvasHex && contrastRatio(secondary.hex, canvasHex) >= 4.5
      ? secondary.hex
      : headlineColor;

  return (
    <div
      className="bk-preview"
      style={
        {
          background: backgroundPaint,
          color: headlineColor,
          "--bk-canvas": canvasHex ?? "var(--color-editor)",
          "--bk-ink": headlineColor,
          "--bk-primary": primary?.hex ?? "var(--color-editor-muted)",
          "--bk-mark": markColor,
          "--bk-title": titleColor,
        } as CSSProperties
      }
    >
      <div className="bk-preview-top">
        <div className="bk-preview-heading">
          {title ?? (
            <strong
              className="bk-preview-headline"
              style={{
                fontFamily: kit.typography || undefined,
                color: titleColor,
              }}
            >
              {kit.name}
            </strong>
          )}
          {kit.emotions.length > 0 && (
            <span
              className="bk-preview-support"
              style={{
                color: titleColor,
                fontFamily: kit.typography || undefined,
              }}
            >
              {kit.emotions.slice(0, 3).join(" · ")}
            </span>
          )}
        </div>
        {actions && (
          <div
            className="bk-preview-actions"
            role="toolbar"
            aria-label={`${kit.name} actions`}
          >
            {actions}
          </div>
        )}
      </div>
      <div className="bk-preview-content">
        {hasChips && (
          <div className="bk-preview-chips">
            {kit.style.trim() && (
              <span className="bk-preview-chip">
                <Sparkles className="bk-preview-chip-icon" aria-hidden="true" />
                <span className="sr-only">{"Creative style: "}</span>
                <span className="bk-preview-chip-value">{kit.style}</span>
              </span>
            )}
            {imageStyle?.trim() && (
              <span className="bk-preview-chip">
                <ImageIcon
                  className="bk-preview-chip-icon"
                  aria-hidden="true"
                />
                <span className="sr-only">{"Image style: "}</span>
                <span className="bk-preview-chip-value">{imageStyle}</span>
              </span>
            )}
          </div>
        )}
        <div className="bk-preview-type">
          <span
            className="bk-preview-type-specimen"
            aria-hidden="true"
            style={{ fontFamily: typeFontFamily }}
          >
            Aa
          </span>
          <span
            className="bk-preview-type-family"
            style={{
              fontFamily: typeFontFamily,
              color: kit.typography ? undefined : "var(--color-editor-muted)",
            }}
          >
            {kit.typography || "No typeface set"}
          </span>
        </div>
        <span
          className="bk-preview-cta"
          aria-hidden="true"
          style={{
            background: ctaPaint,
            color: ctaForeground,
            fontFamily: kit.typography || undefined,
          }}
        >
          Get started
          <ArrowRight className="bk-preview-cta-icon" aria-hidden="true" />
        </span>
      </div>
      <div className="bk-preview-illustration" aria-hidden="true">
        <DesignSettingsArt
          classPrefix="bk-preview"
          primary={primary?.hex ?? "var(--color-editor-muted)"}
          secondary={
            secondary?.hex ?? primary?.hex ?? "var(--color-editor-muted)"
          }
          accent={
            accentColor?.hex ??
            secondary?.hex ??
            primary?.hex ??
            "var(--color-editor-muted)"
          }
        />
      </div>
    </div>
  );
}

export const BRAND_COLOR_ROLES: Array<{
  value: BrandKitColor["role"];
  label: string;
}> = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "background", label: "Background" },
  { value: "text", label: "Font color" },
  { value: "accent", label: "Accent" },
];

/** Compact labels for the five-slot palette row, where "Background" and
 * "Font color" are too long to fit under a small swatch. */
export const BRAND_COLOR_SHORT_LABELS: Record<BrandKitColor["role"], string> = {
  primary: "Primary",
  secondary: "Secondary",
  background: "Canvas",
  text: "Text",
  accent: "Accent",
};

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
        {visibleKits.map((kit) => (
          <BrandKitCard
            key={kit.id}
            kit={kit}
            active={activeKitId === kit.id}
            appliedImageStyle={appliedImageStyle}
            onActivate={() =>
              standalone
                ? s.setDefaultBrandKit(kit.id)
                : s.activateBrandKit(kit.id)
            }
            onDeactivate={() =>
              standalone ? s.clearDefaultBrandKit() : s.deactivateBrandKit()
            }
            onEdit={() =>
              setDialogSession({
                mode: "edit",
                initialKit: structuredClone(kit),
              })
            }
            onRename={(name) => s.updateBrandKit(kit.id, { name })}
            onDelete={() => setDeleteTarget(kit)}
            applyMode={!standalone}
          />
        ))}
      </div>
    </div>
  );
}

function BrandKitCard({
  kit,
  active,
  onActivate,
  onDeactivate,
  onEdit,
  onRename,
  onDelete,
  applyMode = false,
  appliedImageStyle,
}: {
  kit: BrandKit;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  /** The toggle applies the kit to the open poster rather than setting the default. */
  applyMode?: boolean;
  /** The open document's resolved image style label; only shown when this
   * card is the applied one. */
  appliedImageStyle?: string | undefined;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(kit.name);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) nameInput.current?.focus();
  }, [renaming]);

  const commitRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== kit.name) onRename(trimmed);
    setRenaming(false);
  };

  return (
    <div
      className={`brandkit-card bk-showcase-card${active ? " active" : ""}`}
      data-tour="kit-card"
    >
      <div className="bk-face">
        <BrandKitPreview
          kit={kit}
          imageStyle={active ? appliedImageStyle : undefined}
          title={
            renaming ? (
              <input
                ref={nameInput}
                className="bk-face-name-input"
                aria-label="Kit name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitRename();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setRenaming(false);
                  }
                }}
                onBlur={commitRename}
              />
            ) : undefined
          }
          actions={
            <>
              <Hint
                label={
                  active
                    ? applyMode
                      ? "Remove from design"
                      : "Clear default"
                    : undefined
                }
              >
                <button
                  type="button"
                  className={`bk-default-toggle bk-toolbar-btn${active ? " active" : ""}`}
                  aria-pressed={active}
                  aria-label={
                    applyMode
                      ? `${active ? "Remove" : "Apply"} ${kit.name}`
                      : `${active ? "Remove" : "Set"} ${kit.name} as default`
                  }
                  data-tour="kit-default-toggle"
                  onClick={active ? onDeactivate : onActivate}
                >
                  {active && <Check size={13} aria-hidden="true" />}
                  {applyMode
                    ? active
                      ? "Applied"
                      : "Apply"
                    : active
                      ? "Default"
                      : "Set as default"}
                </button>
              </Hint>

              <Hint label="Edit kit">
                <button
                  type="button"
                  className="bk-icon-action bk-toolbar-btn"
                  aria-label={`Edit ${kit.name}`}
                  data-tour="kit-edit"
                  onClick={onEdit}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
              </Hint>

              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <Hint label="More actions">
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="bk-icon-action bk-toolbar-btn"
                      aria-label={`More actions for ${kit.name}`}
                    >
                      <MoreHorizontal size={16} aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                </Hint>
                <DropdownMenuContent
                  className="editor-menu"
                  align="end"
                  onCloseAutoFocus={(e) => {
                    if (renaming) e.preventDefault();
                  }}
                >
                  <DropdownMenuItem
                    onSelect={() => {
                      setDraftName(kit.name);
                      setRenaming(true);
                    }}
                  >
                    <Pencil aria-hidden="true" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={onDelete}
                  >
                    <Trash2 aria-hidden="true" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />

        <div
          className="bk-palette"
          role="group"
          aria-label={`${kit.name} palette`}
          data-tour="kit-palette"
        >
          {BRAND_COLOR_ROLES.map((role) => {
            const color = getBrandKitColor(kit, role.value);
            const shortLabel = BRAND_COLOR_SHORT_LABELS[role.value];
            if (!color) {
              return (
                <Hint
                  key={role.value}
                  label={`No ${role.label.toLowerCase()} color — edit kit to add`}
                >
                  <button
                    type="button"
                    className="bk-palette-slot is-empty"
                    onClick={onEdit}
                  >
                    <i className="bk-palette-swatch" aria-hidden="true" />
                    <span className="bk-palette-role">{shortLabel}</span>
                    <code>—</code>
                  </button>
                </Hint>
              );
            }
            const hex = color.hex.toUpperCase();
            return (
              <Hint
                key={color.id}
                label={`${role.label} · ${hex} · Click to copy`}
              >
                <button
                  type="button"
                  className="bk-palette-slot"
                  aria-label={`Copy ${role.label} ${hex}`}
                  onClick={() => copyBrandColorHex(color.hex)}
                >
                  <i
                    className="bk-palette-swatch"
                    aria-hidden="true"
                    style={{ background: brandKitPaint(color) }}
                  />
                  <span className="bk-palette-role">{shortLabel}</span>
                  <code>{hex}</code>
                </button>
              </Hint>
            );
          })}
        </div>
      </div>
    </div>
  );
}
