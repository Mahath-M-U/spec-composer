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
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Hint } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { POSITIONING_TIERS } from "./brand-profile";
import { getBrandKitColor } from "./brand-kits";
import {
  brandKitTileForeground,
  contrastRatio,
  readableTextOn,
} from "./color-names";
import { DesignSettingsArt } from "./design-settings-art";
import type { BrandKit, BrandKitColor } from "./types";
import "./design-kit-card.css";

export function brandKitColorPaint(
  color: Pick<BrandKitColor, "type" | "angle" | "hex" | "secondaryHex">,
): string {
  return color.type === "gradient"
    ? `linear-gradient(${color.angle}deg, ${color.hex}, ${color.secondaryHex ?? color.hex})`
    : color.hex;
}

export function brandKitPaint(color: BrandKitColor): string {
  return brandKitColorPaint(color);
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
  const positioningLabel = POSITIONING_TIERS.find(
    (tier) => tier.id === kit.profile?.positioningTier,
  )?.label;
  const hasChips = kit.style.trim() || positioningLabel || imageStyle?.trim();

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
            {positioningLabel && (
              <span className="bk-preview-chip">
                <Tag className="bk-preview-chip-icon" aria-hidden="true" />
                <span className="sr-only">{"Positioning: "}</span>
                <span className="bk-preview-chip-value">
                  {positioningLabel}
                </span>
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

/** Noninteractive color samples. Callers can supply a separate editable palette. */
export function BrandKitSwatches({
  colors,
  max = 5,
}: {
  colors: readonly BrandKitColor[];
  max?: number;
}) {
  return (
    <span
      className="design-kit-card-dots"
      aria-label={colors.length ? "Kit palette" : "No kit colors"}
    >
      {colors.slice(0, max).map((color) => (
        <i
          key={color.id}
          style={{ background: brandKitColorPaint(color) }}
          title={color.hex}
        />
      ))}
      {!colors.length && <small>No colors yet</small>}
    </span>
  );
}

/** A compact icon + name + detail summary, for the places a full
 * DesignKitCard is too large to fit: the editor tool rail's button and the
 * discovery sidebar link's no-kit empty state. Phrasing content only
 * (span/strong/small/i/svg), so callers can nest it inside a <button> or
 * <a> without creating invalid interactive-in-interactive markup. */
export function DesignKitSummary({
  kit,
  title,
  subtitle,
  showSwatches = true,
}: {
  kit?: BrandKit | undefined;
  title?: ReactNode;
  subtitle?: ReactNode;
  showSwatches?: boolean;
}) {
  const summary = kit
    ? [kit.typography, kit.style, ...kit.emotions.slice(0, 2)]
        .filter(Boolean)
        .join(" · ")
    : "Build your identity";
  return (
    <span className="design-kit-summary">
      <Gem className="design-kit-card-icon" aria-hidden="true" />
      <span className="design-kit-card-copy">
        <strong className="design-kit-card-title">
          {title ?? kit?.name ?? "Design kits"}
        </strong>
        <small className="design-kit-card-subtitle">
          {subtitle ?? summary}
        </small>
        {showSwatches && <BrandKitSwatches colors={kit?.colors ?? []} />}
      </span>
    </span>
  );
}

export interface DesignKitCardActions {
  active: boolean;
  /** Selects the accessible wording (aria-label and Hint) for applying the
   * kit to the open poster rather than setting the default; the visible
   * button text is the same in both modes. */
  applyMode?: boolean;
  onActivate(): void;
  onDeactivate(): void;
  onEdit(): void;
  onRename(name: string): void;
  onDelete(): void;
}

interface KitRename {
  renaming: boolean;
  draftName: string;
  setDraftName(value: string): void;
  nameInput: React.RefObject<HTMLInputElement | null>;
  commitRename(): void;
  startRename(): void;
  cancelRename(): void;
}

function useKitRename(
  kit: BrandKit | undefined,
  onRename?: (name: string) => void,
): KitRename {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(kit?.name ?? "");
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) nameInput.current?.focus();
  }, [renaming]);

  const commitRename = () => {
    const trimmed = draftName.trim();
    if (kit && onRename && trimmed && trimmed !== kit.name) onRename(trimmed);
    setRenaming(false);
  };
  const startRename = () => {
    setDraftName(kit?.name ?? "");
    setRenaming(true);
  };
  const cancelRename = () => setRenaming(false);

  return {
    renaming,
    draftName,
    setDraftName,
    nameInput,
    commitRename,
    startRename,
    cancelRename,
  };
}

function KitNameInput({ rename }: { rename: KitRename }) {
  return (
    <input
      ref={rename.nameInput}
      className="bk-face-name-input"
      aria-label="Kit name"
      value={rename.draftName}
      onChange={(e) => rename.setDraftName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          rename.commitRename();
        } else if (e.key === "Escape") {
          e.preventDefault();
          rename.cancelRename();
        }
      }}
      onBlur={rename.commitRename}
    />
  );
}

/** The apply toggle, edit action, and overflow (rename/delete) menu shown in
 * an interactive DesignKitCard's floating toolbar. A plain helper (not a JSX
 * component) so callers get back real, already-rendered buttons rather than
 * an opaque element. */
function DesignKitActions({
  kit,
  actions,
  rename,
  menuOpen,
  setMenuOpen,
}: {
  kit: BrandKit;
  actions: DesignKitCardActions;
  rename: KitRename;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  const { active, applyMode = false, onActivate, onDeactivate, onEdit, onDelete } =
    actions;

  return (
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
              : `${active ? "Remove" : "Apply"} ${kit.name} as default`
          }
          data-tour="kit-default-toggle"
          onClick={active ? onDeactivate : onActivate}
        >
          {active && <Check size={13} aria-hidden="true" />}
          {active ? "Applied" : "Apply"}
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
            if (rename.renaming) e.preventDefault();
          }}
        >
          <DropdownMenuItem onSelect={rename.startRename}>
            <Pencil aria-hidden="true" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
            <Trash2 aria-hidden="true" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export interface DesignKitCardProps {
  kit: BrandKit;
  /** Present makes the card interactive (Apply/Edit/More toolbar, rename,
   * copy-hex palette buttons); absent renders a read-only display card. */
  actions?: DesignKitCardActions | undefined;
  /** Display cards only — interactive cards take their active state from
   * `actions.active` instead. */
  active?: boolean | undefined;
  appliedImageStyle?: string | undefined;
}

/** The one design kit card: a wide artwork face with name, mood, style chip,
 * "Aa" font row, and Get started CTA, plus five color swatches with role and
 * hex underneath. Used everywhere a kit is shown in full — the editor's
 * applied-kit sidebar card, the Home and Design kits page lists, the
 * discovery sidebar link, and the Design kits hero — switching only between
 * an interactive mode (`actions` supplied) and a read-only display mode. */
export function DesignKitCard({
  kit,
  actions,
  active,
  appliedImageStyle,
}: DesignKitCardProps) {
  const rename = useKitRename(kit, actions?.onRename);
  const [menuOpen, setMenuOpen] = useState(false);
  const isStatic = !actions;
  const isActive = actions?.active ?? active ?? false;
  const cardPrimary =
    brandKitPreviewColors(kit).primary?.hex ?? "var(--color-editor-muted)";

  return (
    <div
      className={`design-kit-card brandkit-card bk-showcase-card card-hover-scale${isStatic ? " is-static" : ""}${isActive ? " active" : ""}`}
      style={{ "--bk-card-primary": cardPrimary } as CSSProperties}
      data-tour={actions ? "kit-card" : undefined}
    >
      <div className="bk-face">
        <BrandKitPreview
          kit={kit}
          imageStyle={isActive ? appliedImageStyle : undefined}
          title={rename.renaming ? <KitNameInput rename={rename} /> : undefined}
          actions={
            actions
              ? DesignKitActions({ kit, actions, rename, menuOpen, setMenuOpen })
              : undefined
          }
        />

        <div
          className="bk-palette"
          role="group"
          aria-label={`${kit.name} palette`}
          data-tour={actions ? "kit-palette" : undefined}
        >
          {BRAND_COLOR_ROLES.map((role) => {
            const color = getBrandKitColor(kit, role.value);
            const shortLabel = BRAND_COLOR_SHORT_LABELS[role.value];

            if (!actions) {
              // Display mode: a plain, non-interactive slot — swatch, role,
              // and hex stay visible, with no Hint or button.
              return (
                <span
                  key={role.value}
                  className={`bk-palette-slot${color ? "" : " is-empty"}`}
                >
                  <i
                    className="bk-palette-swatch"
                    aria-hidden="true"
                    style={color ? { background: brandKitPaint(color) } : undefined}
                  />
                  <span className="bk-palette-role">{shortLabel}</span>
                  <code>{color ? color.hex.toUpperCase() : "—"}</code>
                </span>
              );
            }

            if (!color) {
              return (
                <Hint
                  key={role.value}
                  label={`No ${role.label.toLowerCase()} color — edit kit to add`}
                >
                  <button
                    type="button"
                    className="bk-palette-slot is-empty"
                    onClick={actions.onEdit}
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
