import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Gem,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getBrandKitColor } from "./brand-kits";
import { matchesBrandKitQuery } from "./brand-kit-search";
import { nearestColorName } from "./color-names";
import { FEATURED_FONTS, MORE_FONTS } from "./fonts";
import { Label } from "./field-label";
import { PanelHeader } from "./panel-header";
import { useEditorStore } from "./store";
import type { BrandKit, BrandKitColor } from "./types";

export function brandKitPaint(color: BrandKitColor): string {
  return color.type === "gradient"
    ? `linear-gradient(${color.angle}deg, ${color.hex}, ${color.secondaryHex ?? color.hex})`
    : color.hex;
}

function brandKitTileForeground(hex: string): "#111311" | "#FFFFFF" {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (red * 299 + green * 587 + blue * 114) / 255000;
  return luminance > 0.58 ? "#111311" : "#FFFFFF";
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

async function copyBrandColorHex(hex: string) {
  try {
    await navigator.clipboard.writeText(hex.toUpperCase());
    toast.success(`Copied ${hex.toUpperCase()}`);
  } catch {
    toast.error("Couldn't copy color");
  }
}

/** A small sample poster showing a kit's colors and typography in use. */
function BrandKitPreview({ kit }: { kit: BrandKit }) {
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
    <div className="bk-preview" style={{ background: backgroundPaint }}>
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
      <span
        className="bk-preview-cta"
        style={{ background: ctaPaint, color: ctaForeground }}
      >
        Get started
      </span>
      {accentColor && (
        <i
          className="bk-preview-accent"
          aria-hidden="true"
          style={{ background: brandKitPaint(accentColor) }}
        />
      )}
    </div>
  );
}

const CREATIVE_STYLES = [
  "Minimal",
  "Editorial",
  "Bold",
  "Luxury",
  "Playful",
  "Tech",
  "Corporate",
  "Retro",
] as const;

const EMOTION_PRESETS = [
  "Calm",
  "Energetic",
  "Playful",
  "Elegant",
  "Bold",
  "Confident",
  "Cheerful",
  "Mysterious",
  "Romantic",
  "Nostalgic",
  "Serene",
  "Dramatic",
] as const;

const BRAND_COLOR_ROLES: Array<{
  value: BrandKitColor["role"];
  label: string;
}> = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "background", label: "Background" },
  { value: "text", label: "Font color" },
  { value: "accent", label: "Accent" },
];

const BRAND_COLOR_USECASES: Record<BrandKitColor["role"], readonly string[]> = {
  primary: ["Headlines", "Buttons", "Key shapes"],
  secondary: ["Subheadings", "Highlights", "Supporting shapes"],
  background: ["Canvas", "Sections", "Cards"],
  text: ["Headings", "Body text", "Captions"],
  accent: ["Badges", "Icons", "Details"],
};

function brandColorRoleLabel(role: BrandKitColor["role"]): string {
  return (
    BRAND_COLOR_ROLES.find((candidate) => candidate.value === role)?.label ??
    "Brand color"
  );
}

function defaultBrandColorUsecase(role: BrandKitColor["role"]): string {
  return BRAND_COLOR_USECASES[role][0] ?? "Headlines";
}

function selectedBrandColorUsecases(color: BrandKitColor): string[] {
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const [isGeneratingM3, setIsGeneratingM3] = useState(false);
  const [m3Name, setM3Name] = useState("");
  const [m3Seed, setM3Seed] = useState("#6750A4");
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

  const confirmCreate = () => {
    const name = creatingName.trim() || "Untitled kit";
    const id = s.createBrandKit(name);
    setIsCreating(false);
    setCreatingName("");
    setExpandedId(id);
  };

  const confirmGenerateM3 = () => {
    const name = m3Name.trim() || "Material 3 kit";
    const seed = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(m3Seed)
      ? m3Seed
      : "#6750A4";
    const id = s.createMaterialKit(name, seed);
    setIsGeneratingM3(false);
    setM3Name("");
    setExpandedId(id);
  };

  return (
    <div
      className={`brandkit-panel${standalone ? " brandkit-home-panel" : ""}${pageView ? " brandkit-page-panel" : ""}${isCreating || isGeneratingM3 ? " brandkit-creating" : ""}`}
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
        {isCreating ? (
          <form
            className="brandkit-new-row brandkit-newkit-button"
            onSubmit={(event) => {
              event.preventDefault();
              confirmCreate();
            }}
          >
            <input
              autoFocus
              value={creatingName}
              onChange={(event) => setCreatingName(event.target.value)}
              placeholder="Name this design kit"
              aria-label="New design kit name"
            />
            <Button size="sm" type="submit">
              Create
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Button
            size="sm"
            className="brandkit-newkit-button"
            data-tour="kit-new"
            onClick={() => {
              setIsCreating(true);
              setCreatingName("");
            }}
          >
            <Plus size={14} />
            New design kit
          </Button>
        )}

        {isGeneratingM3 ? (
          <form
            className="brandkit-new-row brandkit-m3-row brandkit-m3-form"
            onSubmit={(event) => {
              event.preventDefault();
              confirmGenerateM3();
            }}
          >
            <input
              autoFocus
              value={m3Name}
              onChange={(event) => setM3Name(event.target.value)}
              placeholder="Name this style kit"
              aria-label="New Material 3 style kit name"
            />
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(m3Seed) ? m3Seed : "#6750a4"}
              onChange={(event) => setM3Seed(event.target.value)}
              aria-label="Material 3 seed color"
              className="brandkit-m3-seed-swatch"
            />
            <input
              value={m3Seed}
              onChange={(event) => setM3Seed(event.target.value)}
              placeholder="#6750A4"
              aria-label="Material 3 seed color hex"
              className="brandkit-m3-seed-hex"
            />
            <Button size="sm" type="submit">
              Generate
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setIsGeneratingM3(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Hint label="Generate M3 kit">
            <Button
              size="sm"
              variant="outline"
              className="brandkit-m3-trigger-button"
              aria-label="Generate from Material 3"
              data-tour="kit-generate"
              onClick={() => {
                setIsGeneratingM3(true);
                setM3Name("");
              }}
            >
              <Sparkles size={14} />
            </Button>
          </Hint>
        )}
      </div>

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
            expanded={expandedId === kit.id}
            onToggleExpand={() =>
              setExpandedId((current) => (current === kit.id ? null : kit.id))
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
  expanded,
  onToggleExpand,
  applyMode = false,
}: {
  kit: BrandKit;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  /** The toggle applies the kit to the open poster rather than setting the default. */
  applyMode?: boolean;
}) {
  const s = useEditorStore();
  const [emotionCustom, setEmotionCustom] = useState("");
  const [fontOpen, setFontOpen] = useState(false);
  const [fontQuery, setFontQuery] = useState("");
  const [emotionOptionsOpen, setEmotionOptionsOpen] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fontPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fontOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!fontPickerRef.current?.contains(event.target as Node)) {
        setFontOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFontOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [fontOpen]);

  const patch = (p: Partial<BrandKit>) => s.updateBrandKit(kit.id, p);

  const normalizedFontQuery = fontQuery.trim().toLowerCase();
  const matchesFontQuery = (font: string) =>
    !normalizedFontQuery || font.toLowerCase().includes(normalizedFontQuery);
  const featuredFonts = FEATURED_FONTS.filter(matchesFontQuery);
  const moreFonts = MORE_FONTS.filter(matchesFontQuery);

  const chooseFont = (font: string) => {
    patch({ typography: font });
    setFontOpen(false);
    setFontQuery("");
  };

  const addColor = () => {
    if (kit.colors.length >= 5) return;
    const role =
      BRAND_COLOR_ROLES.find(
        (candidate) =>
          !kit.colors.some((color) => color.role === candidate.value),
      )?.value ?? "accent";
    const defaults: Record<BrandKitColor["role"], string> = {
      primary: "#C55454",
      secondary: "#D9A15B",
      background: "#EFE9DE",
      text: "#141413",
      accent: "#8B5CF6",
    };
    const id = crypto.randomUUID().slice(0, 8);
    patch({
      colors: [
        ...kit.colors,
        {
          id,
          hex: defaults[role],
          secondaryHex: defaults[role],
          angle: 135,
          type: "solid",
          role,
          usecase: defaultBrandColorUsecase(role),
        },
      ],
    });
    setSelectedColorId(id);
  };

  const updateColor = (id: string, p: Partial<BrandKitColor>) =>
    patch({
      colors: kit.colors.map((c) => (c.id === id ? { ...c, ...p } : c)),
    });

  const updateColorRole = (id: string, role: BrandKitColor["role"]) =>
    patch({
      colors: kit.colors.map((color) => {
        if (color.id === id)
          return { ...color, role, usecase: defaultBrandColorUsecase(role) };
        if (color.role === role)
          return {
            ...color,
            role: "accent",
            usecase: defaultBrandColorUsecase("accent"),
          };
        return color;
      }),
    });

  const toggleColorUsecase = (color: BrandKitColor, usecase: string) => {
    const selected = selectedBrandColorUsecases(color);
    const next = selected.includes(usecase)
      ? selected.filter((value) => value !== usecase)
      : [...selected, usecase];
    updateColor(color.id, { usecase: next.join(", ") });
  };

  const removeColor = (id: string) => {
    const remainingColors = kit.colors.filter((color) => color.id !== id);
    patch({ colors: remainingColors });
    if (selectedColorId === id)
      setSelectedColorId(remainingColors[0]?.id ?? null);
  };

  const toggleEmotion = (value: string) => {
    const has = kit.emotions.includes(value);
    patch({
      emotions: has
        ? kit.emotions.filter((e) => e !== value)
        : [...kit.emotions, value],
    });
  };

  const addCustomEmotion = () => {
    const value = emotionCustom.trim();
    if (!value || kit.emotions.includes(value)) {
      setEmotionCustom("");
      return;
    }
    patch({ emotions: [...kit.emotions, value] });
    setEmotionCustom("");
  };

  const removeEmotion = (value: string) =>
    patch({ emotions: kit.emotions.filter((e) => e !== value) });

  const selectedColor = selectedColorId
    ? kit.colors.find((color) => color.id === selectedColorId)
    : undefined;
  const selectedColorUsecases = selectedColor
    ? selectedBrandColorUsecases(selectedColor)
    : [];

  const toggleCard = () => {
    if (expanded) setSelectedColorId(null);
    onToggleExpand();
  };

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
              onClick={toggleCard}
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
          onClick={toggleCard}
          aria-expanded={expanded}
        >
          <Pencil size={14} aria-hidden="true" />
          {expanded ? "Close editor" : "Edit kit"}
          {expanded ? (
            <ChevronDown aria-hidden="true" />
          ) : (
            <ChevronRight aria-hidden="true" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="brandkit-card-body">
          <div className="brandkit-card-content">
            <div className="brandkit-identity-grid">
              <Label text="Name">
                <input
                  value={kit.name}
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </Label>

              <Label text="Creative style">
                <select
                  value={kit.style}
                  onChange={(event) => patch({ style: event.target.value })}
                >
                  {CREATIVE_STYLES.map((style) => (
                    <option key={style}>{style}</option>
                  ))}
                </select>
              </Label>

              <Label text="Typography" className="brandkit-field-wide">
                <div ref={fontPickerRef} className="brandkit-typography">
                  <button
                    className="font-trigger"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={fontOpen}
                    onClick={() => setFontOpen((open) => !open)}
                  >
                    <Type aria-hidden="true" />
                    <b style={{ fontFamily: kit.typography }}>
                      {kit.typography || "Choose a font"}
                    </b>
                    <ChevronDown aria-hidden="true" />
                  </button>

                  {fontOpen && (
                    <div className="font-picker-popover">
                      <div className="font-picker-head">
                        <div>
                          <Type aria-hidden="true" />
                          <div>
                            <b>Typography</b>
                            <small>Choose a font for every text layer</small>
                          </div>
                        </div>
                        <Hint label="Close">
                          <button
                            type="button"
                            aria-label="Close font picker"
                            onClick={() => setFontOpen(false)}
                          >
                            <X />
                          </button>
                        </Hint>
                      </div>
                      <label className="font-search">
                        <Search aria-hidden="true" />
                        <input
                          autoFocus
                          value={fontQuery}
                          onChange={(event) => setFontQuery(event.target.value)}
                          placeholder="Search fonts"
                        />
                      </label>
                      <div
                        className="font-list"
                        role="listbox"
                        aria-label="Fonts"
                      >
                        {featuredFonts.length > 0 && (
                          <>
                            <div className="font-list-label">
                              <span>Top 10</span>
                              <span>
                                <Star /> Popular
                              </span>
                            </div>
                            {featuredFonts.map((font, index) => (
                              <button
                                key={font}
                                type="button"
                                role="option"
                                aria-selected={kit.typography === font}
                                className="font-option featured"
                                onClick={() => chooseFont(font)}
                              >
                                <span className="font-rank">{index + 1}</span>
                                <span style={{ fontFamily: font }}>{font}</span>
                                {kit.typography === font && <Check />}
                              </button>
                            ))}
                          </>
                        )}
                        {moreFonts.length > 0 && (
                          <>
                            <div className="font-list-label">All fonts</div>
                            {moreFonts.map((font) => (
                              <button
                                key={font}
                                type="button"
                                role="option"
                                aria-selected={kit.typography === font}
                                className="font-option"
                                onClick={() => chooseFont(font)}
                              >
                                <span style={{ fontFamily: font }}>{font}</span>
                                {kit.typography === font && <Check />}
                              </button>
                            ))}
                          </>
                        )}
                        {!featuredFonts.length && !moreFonts.length && (
                          <p className="font-empty">
                            No fonts match “{fontQuery}”
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Label>
            </div>

            <div className="brandkit-colors">
              <div className="brandkit-colors-head">
                <div>
                  <span>Brand palette</span>
                  <small>Select a swatch to edit · {kit.colors.length}/5</small>
                </div>
              </div>

              <div
                className="brandkit-palette-selector"
                role="group"
                aria-label="Brand colors"
              >
                {kit.colors.map((color) => {
                  const selected = selectedColor?.id === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      aria-pressed={selected}
                      aria-expanded={selected}
                      aria-controls={`brandkit-color-editor-${color.id}`}
                      className={`brandkit-palette-tile${selected ? " selected" : ""}`}
                      style={{
                        background: brandKitPaint(color),
                        color: brandKitTileForeground(color.hex),
                      }}
                      onClick={() =>
                        setSelectedColorId((current) =>
                          current === color.id ? null : color.id,
                        )
                      }
                    >
                      {selected && (
                        <span className="brandkit-palette-tile-check">
                          <Check aria-hidden="true" />
                        </span>
                      )}
                      <span className="brandkit-palette-tile-copy">
                        <strong>
                          {color.type === "gradient"
                            ? `${color.hex.toUpperCase()} · ${(color.secondaryHex ?? color.hex).toUpperCase()}`
                            : color.hex.toUpperCase()}
                        </strong>
                        <small>{brandColorRoleLabel(color.role)}</small>
                      </span>
                    </button>
                  );
                })}
                {kit.colors.length < 5 && (
                  <button
                    type="button"
                    className="brandkit-palette-tile brandkit-palette-add"
                    onClick={addColor}
                  >
                    <Plus aria-hidden="true" />
                    <span>Add color</span>
                  </button>
                )}
              </div>

              {selectedColor && (
                <div
                  id={`brandkit-color-editor-${selectedColor.id}`}
                  className="brandkit-color-row"
                  style={
                    {
                      "--brandkit-row-color": selectedColor.hex,
                    } as CSSProperties
                  }
                >
                  <div className="brandkit-color-main">
                    <span
                      className="brandkit-color-preview"
                      style={{ background: brandKitPaint(selectedColor) }}
                    />
                    <select
                      value={selectedColor.role}
                      aria-label="Color role"
                      onChange={(event) =>
                        updateColorRole(
                          selectedColor.id,
                          event.target.value as BrandKitColor["role"],
                        )
                      }
                    >
                      {BRAND_COLOR_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedColor.type}
                      aria-label="Color fill type"
                      onChange={(event) =>
                        updateColor(selectedColor.id, {
                          type: event.target.value as BrandKitColor["type"],
                        })
                      }
                    >
                      <option value="solid">Solid</option>
                      <option value="gradient">Gradient</option>
                    </select>
                    <Hint label="Remove color">
                      <button
                        type="button"
                        aria-label="Remove color"
                        onClick={() => removeColor(selectedColor.id)}
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    </Hint>
                  </div>
                  <div
                    className={`brandkit-color-values${selectedColor.type === "gradient" ? " gradient" : ""}`}
                  >
                    <label className="brandkit-color-value">
                      <span>
                        {selectedColor.type === "gradient" ? "From" : "Color"}
                      </span>
                      <input
                        aria-label="Primary color"
                        type="color"
                        value={selectedColor.hex}
                        onChange={(event) =>
                          updateColor(selectedColor.id, {
                            hex: event.target.value,
                          })
                        }
                      />
                      <code>{selectedColor.hex.toUpperCase()}</code>
                    </label>
                    {selectedColor.type === "gradient" && (
                      <>
                        <label className="brandkit-color-value">
                          <span>To</span>
                          <input
                            aria-label="Secondary color"
                            type="color"
                            value={
                              selectedColor.secondaryHex ?? selectedColor.hex
                            }
                            onChange={(event) =>
                              updateColor(selectedColor.id, {
                                secondaryHex: event.target.value,
                              })
                            }
                          />
                          <code>
                            {(
                              selectedColor.secondaryHex ?? selectedColor.hex
                            ).toUpperCase()}
                          </code>
                        </label>
                        <label className="brandkit-gradient-angle">
                          <span>Angle</span>
                          <input
                            aria-label="Gradient angle"
                            type="number"
                            min="0"
                            max="360"
                            value={selectedColor.angle}
                            onChange={(event) =>
                              updateColor(selectedColor.id, {
                                angle: Math.min(
                                  360,
                                  Math.max(0, Number(event.target.value)),
                                ),
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </div>
                  <div
                    className="brandkit-color-usecases"
                    role="group"
                    aria-label={`Use ${brandColorRoleLabel(selectedColor.role)} for`}
                  >
                    <span>Use for</span>
                    <div>
                      {BRAND_COLOR_USECASES[selectedColor.role].map(
                        (usecase) => {
                          const selected =
                            selectedColorUsecases.includes(usecase);
                          return (
                            <button
                              key={usecase}
                              type="button"
                              className={selected ? "selected" : undefined}
                              aria-pressed={selected}
                              onClick={() =>
                                toggleColorUsecase(selectedColor, usecase)
                              }
                            >
                              {selected && (
                                <Check size={10} aria-hidden="true" />
                              )}
                              {usecase}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="brandkit-emotions">
              <div className="brandkit-section-head">
                <div>
                  <span>Brand emotion</span>
                  <small>
                    {kit.emotions.length
                      ? `${kit.emotions.length} selected`
                      : "Set the tone of your designs"}
                  </small>
                </div>
                <button
                  type="button"
                  className={emotionOptionsOpen ? "active" : undefined}
                  aria-expanded={emotionOptionsOpen}
                  onClick={() => setEmotionOptionsOpen((open) => !open)}
                >
                  {emotionOptionsOpen ? "Done" : "Choose"}
                  <ChevronDown aria-hidden="true" />
                </button>
              </div>
              {kit.emotions.length > 0 && (
                <div className="emotion-selected-list">
                  {kit.emotions.map((emotion) => (
                    <span key={emotion} className="emotion-selected-tag">
                      {emotion}
                      <Hint label="Remove">
                        <button
                          type="button"
                          aria-label={`Remove ${emotion}`}
                          onClick={() => removeEmotion(emotion)}
                        >
                          <X aria-hidden="true" />
                        </button>
                      </Hint>
                    </span>
                  ))}
                </div>
              )}
              {!kit.emotions.length && !emotionOptionsOpen && (
                <p className="brandkit-empty-hint">No emotions selected.</p>
              )}
              {emotionOptionsOpen && (
                <div className="brandkit-emotion-options">
                  <div
                    className="emotion-chip-grid"
                    role="listbox"
                    aria-label="Brand emotions"
                  >
                    {EMOTION_PRESETS.map((emotion) => {
                      const isActive = kit.emotions.includes(emotion);
                      return (
                        <button
                          key={emotion}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={`emotion-chip${isActive ? " active" : ""}`}
                          onClick={() => toggleEmotion(emotion)}
                        >
                          {isActive && <Check aria-hidden="true" />}
                          {emotion}
                        </button>
                      );
                    })}
                  </div>
                  <form
                    className="emotion-add-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addCustomEmotion();
                    }}
                  >
                    <input
                      value={emotionCustom}
                      onChange={(event) => setEmotionCustom(event.target.value)}
                      placeholder="Add a custom emotion"
                      aria-label="Add custom brand emotion"
                    />
                    <Hint label="Add emotion">
                      <button type="submit" aria-label="Add emotion">
                        <Plus aria-hidden="true" />
                      </button>
                    </Hint>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="brandkit-card-actions">
            <Button
              size="sm"
              variant="outline"
              className="brandkit-delete-button"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{kit.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the design kit, its palette, typography, and brand
              preferences. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep design kit</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (kit.sourceKind === "material3") s.deleteMaterialKit(kit.id);
                else s.deleteBrandKit(kit.id);
                setDeleteOpen(false);
              }}
            >
              Delete design kit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
