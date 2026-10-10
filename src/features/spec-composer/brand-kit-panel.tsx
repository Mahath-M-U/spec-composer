import { useState, type CSSProperties } from "react";
import {
  Check,
  ChevronRight,
  Gem,
  Pencil,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { BrandKitBuilder, type BrandKitBuilderMode } from "./brand-kit-builder";
import { getBrandKitColor } from "./brand-kits";
import { matchesBrandKitQuery } from "./brand-kit-search";
import { brandKitTileForeground, nearestColorName } from "./color-names";
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
}: {
  kit: BrandKit;
  variant?: "card" | "builder";
}) {
  const { primary, secondary, accent, background, text } =
    brandKitPreviewColors(kit);

  const backgroundPaint = background
    ? brandKitPaint(background)
    : "var(--color-editor)";
  const headlineColor = text
    ? text.hex
    : background
      ? brandKitTileForeground(background.hex)
      : "var(--color-editor-foreground)";
  const ctaPaint = primary
    ? brandKitPaint(primary)
    : "var(--color-editor-muted)";
  const ctaForeground = primary
    ? brandKitTileForeground(primary.hex)
    : "#FFFFFF";
  const accentColor = accent ?? secondary;

  return (
    <div
      className={
        variant === "builder" ? "bk-preview bk-preview--builder" : "bk-preview"
      }
      style={{
        background: backgroundPaint,
        ...(variant === "builder"
          ? { fontFamily: kit.typography || undefined, color: headlineColor }
          : {}),
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
      {variant === "builder" && (
        <span className="bk-preview-specimen">Aa Bb 0123</span>
      )}
      <span
        className="bk-preview-cta"
        style={{ background: ctaPaint, color: ctaForeground }}
      >
        Get started
      </span>
      {variant === "builder" ? (
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
      ) : (
        accentColor && (
          <i
            className="bk-preview-accent"
            aria-hidden="true"
            style={{ background: brandKitPaint(accentColor) }}
          />
        )
      )}
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

  if (!standalone && !d) return null;

  // Search only exists in the editor panel; standalone pages list every kit.
  const visibleKits = standalone
    ? s.brandKits
    : s.brandKits.filter((kit) => matchesBrandKitQuery(kit, kitQuery));

  // In the editor the toggle switches this poster's kit; on the design kit
  // pages it picks the default kit new posters start with.
  const activeKitId = standalone
    ? s.defaultBrandKitId
    : d?.creativeDirection.brandKitId;

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
          New design kit
        </Button>

        <Hint label="Generate M3 kit">
          <Button
            size="sm"
            variant="outline"
            className="brandkit-m3-trigger-button"
            aria-label="Generate from Material 3"
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
          <span>Try a different search term.</span>
        </div>
      )}

      <div className="brandkit-list-panel">
        {visibleKits.map((kit) => (
          <BrandKitCard
            key={kit.id}
            kit={kit}
            active={activeKitId === kit.id}
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
  applyMode = false,
}: {
  kit: BrandKit;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  /** The toggle applies the kit to the open poster rather than setting the default. */
  applyMode?: boolean;
}) {
  return (
    <div
      className={`brandkit-card bk-showcase-card${active ? " active" : ""}`}
      data-tour="kit-card"
    >
      <div className="bk-face">
        <div className="bk-face-top">
          <span className="truncate bk-face-name">
            {kit.name}
            {kit.sourceKind === "material3" && (
              <Hint label="Material 3">
                <span className="brandkit-m3-badge">M3</span>
              </Hint>
            )}
          </span>
          <button
            type="button"
            className={`bk-default-toggle${active ? " active" : ""}`}
            aria-pressed={active}
            aria-label={
              applyMode
                ? `${active ? "Remove" : "Apply"} ${kit.name}`
                : `${active ? "Remove" : "Set"} ${kit.name} as default`
            }
            data-tour="kit-default-toggle"
            onClick={active ? onDeactivate : onActivate}
          >
            {active && <Check size={12} aria-hidden="true" />}
            {applyMode
              ? active
                ? "Applied"
                : "Apply"
              : active
                ? "Default"
                : "Set as default"}
          </button>
        </div>

        <BrandKitPreview kit={kit} />

        <div
          className="bk-palette"
          role="group"
          aria-label={`${kit.name} palette`}
          data-tour="kit-palette"
        >
          {kit.colors.length ? (
            kit.colors.map((color) => (
              <Hint key={color.id} label={`Copy ${color.hex.toUpperCase()}`}>
                <button
                  type="button"
                  className="bk-palette-block"
                  style={{
                    background: brandKitPaint(color),
                    color: brandKitTileForeground(color.hex),
                  }}
                  onClick={() => copyBrandColorHex(color.hex)}
                >
                  <span className="bk-palette-role">
                    {brandColorRoleLabel(color.role)}
                  </span>
                </button>
              </Hint>
            ))
          ) : (
            <button
              type="button"
              className="bk-palette-block bk-palette-empty"
              onClick={onEdit}
            >
              <Plus size={14} aria-hidden="true" />
              <span>Add colors</span>
            </button>
          )}
        </div>

        {kit.colors.length > 0 && (
          <div className="bk-palette-labels">
            {kit.colors.map((color) => (
              <button
                key={color.id}
                type="button"
                className="bk-palette-label"
                onClick={() => copyBrandColorHex(color.hex)}
              >
                <strong>{nearestColorName(color.hex)}</strong>
                <code>{color.hex.toUpperCase()}</code>
              </button>
            ))}
          </div>
        )}

        <div className="bk-meta-row">
          <span
            className="bk-meta-glyph"
            style={{ fontFamily: kit.typography || undefined }}
            aria-hidden="true"
          >
            Aa
          </span>
          <span className="bk-meta-copy">
            <strong>{kit.typography || "No typeface set"}</strong>
            <small>
              {kit.style || "No style"}
              {kit.emotions.length > 0
                ? ` · ${kit.emotions.slice(0, 3).join(", ")}`
                : ""}
            </small>
          </span>
        </div>

        <button
          type="button"
          className="bk-edit-button"
          data-tour="kit-edit"
          onClick={onEdit}
        >
          <Pencil size={14} aria-hidden="true" />
          Edit kit
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
