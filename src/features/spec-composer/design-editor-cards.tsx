import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import {
  Box,
  Camera,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Frame,
  Image as ImageIcon,
  Layers,
  Layers3,
  LayoutGrid,
  LayoutTemplate,
  ListChecks,
  MapPin,
  Moon,
  Palette,
  Pencil,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  Type,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Hint } from "@/components/ui/tooltip";
import {
  boldField,
  parseDesignMarkdown,
  sectionsByH3,
  unquote,
  HEX_RE,
  type MdBlock,
} from "./design-md-parse";
import { ProseText } from "./design-md-view";
import { spacingTokenNames } from "./design-md";
import {
  buildComposition,
  type CompositionModel,
  type CompSlot,
} from "./composition-view";
import { ratio } from "./compiler";
import type { BrandKit, SpecDocument } from "./types";

/** Presentational cards for the Design Editor: each reads a compiled
 * DESIGN.md section's own text and, when it parses cleanly, renders it as a
 * style-guide card instead of raw markdown. Editing, deleting and the
 * underlying DESIGN.md text are unaffected — `part.actions` and `part.body`
 * (built in Editor.tsx) are rendered verbatim wherever a card can't, or
 * shouldn't, parse the text itself. */

export type DesignPart = {
  key: string;
  tag: string;
  text: string;
  editing: boolean;
  actions: ReactNode;
  body: ReactNode;
  /** The element this section targets, when it has one (see sectionTarget). */
  elementId?: string | undefined;
  /** Whether that element is the current canvas selection. */
  selected?: boolean | undefined;
  /** Selects the element and opens the Style panel. */
  onSelect?: (() => void) | undefined;
};

type TableBlock = Extract<MdBlock, { type: "table" }>;
type ListBlock = Extract<MdBlock, { type: "list" }>;
type ParaBlock = Extract<MdBlock, { type: "para" }>;
const isTable = (b: MdBlock): b is TableBlock => b.type === "table";
const isList = (b: MdBlock): b is ListBlock => b.type === "list";
const isPara = (b: MdBlock): b is ParaBlock => b.type === "para";
const boldFields = (blocks: MdBlock[]) =>
  blocks
    .filter(isPara)
    .map((b) => boldField(b.text))
    .filter((f): f is { label: string; value: string } => !!f);

/** Interactive descendants that should keep their own click behavior
 * instead of triggering a row/card `onSelect` (prompt-field inputs,
 * edit/delete buttons, SectionEditor controls, the subrow label button…). */
const INTERACTIVE =
  "input, textarea, select, button, a, label, [contenteditable], [role='button'], [role='slider'], [role='combobox']";

/** Builds an `onClick` that selects the element behind a row/card (and
 * opens the Style panel) when the click lands on non-interactive space —
 * the thumbnail, prose or padding — but leaves clicks on interactive
 * descendants and text selection alone. Returns `undefined` when there's
 * nothing to select or the row is mid-edit, so callers can skip wiring up
 * `data-clickable` too. */
function selectOnClick(
  onSelect: (() => void) | undefined,
  disabled: boolean,
): MouseEventHandler<HTMLDivElement> | undefined {
  if (!onSelect || disabled) return undefined;
  return (e) => {
    if (!(e.target instanceof Element) || !e.currentTarget.contains(e.target))
      return;
    const hit = e.target.closest(INTERACTIVE);
    if (hit && e.currentTarget.contains(hit)) return;
    if (window.getSelection()?.toString()) return;
    onSelect();
  };
}

export function TokenCard({
  icon: Icon,
  title,
  actions,
  meta,
  summary,
  preview,
  forceOpen,
  defaultOpen,
  selected,
  children,
}: {
  icon: LucideIcon;
  title: string;
  actions?: ReactNode;
  meta?: ReactNode;
  summary?: ReactNode | undefined;
  preview?: ReactNode | undefined;
  forceOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  selected?: boolean | undefined;
  children: ReactNode;
}) {
  const headingId = useId();
  const bodyId = useId();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const expanded = open || !!forceOpen;
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);
  return (
    <section
      className="de-card"
      aria-labelledby={headingId}
      data-open={expanded ? "" : undefined}
      data-selected={selected ? "" : undefined}
    >
      <div
        className="de-card-head"
        onClick={(e) => {
          const target = e.target;
          if (!e.currentTarget.contains(target as Node)) return;
          if (target instanceof Element && target.closest(".de-card-actions"))
            return;
          setOpen((o) => !o);
        }}
      >
        <h3 id={headingId} className="de-card-title">
          <button
            type="button"
            className="de-card-toggle"
            aria-expanded={expanded}
            aria-controls={bodyId}
          >
            <span className="de-card-icon-tile">
              <Icon size={18} aria-hidden="true" />
            </span>
            <span className="de-card-text">
              <span className="de-card-name">{title}</span>
              {summary && <span className="de-card-summary">{summary}</span>}
            </span>
            {preview && (
              <span className="de-card-preview" aria-hidden="true">
                {preview}
              </span>
            )}
          </button>
        </h3>
        {actions && <span className="de-card-actions">{actions}</span>}
        <ChevronDown className="de-card-chevron" size={16} aria-hidden="true" />
      </div>
      <div id={bodyId} className="de-card-body" hidden={!expanded}>
        {meta && <div className="de-card-meta">{meta}</div>}
        {children}
      </div>
    </section>
  );
}

/** The user's brand illustration, recolored per-role (accent/primary/
 * secondary) from the paths' original artwork colors, split into a curve
 * cluster, a sun and a set of leaves so the card can arrange them around its
 * text instead of laying out one full-bleed shape. */
function DesignSettingsArt({
  primary,
  secondary,
  accent,
}: {
  primary: string;
  secondary: string;
  accent: string;
}) {
  return (
    <>
      <svg
        className="de-hero-art de-hero-curve"
        viewBox="0 0 412 620"
        preserveAspectRatio="xMaxYMax meet"
        aria-hidden="true"
        focusable="false"
        fillRule="evenodd"
        clipRule="evenodd"
      >
        <g transform="matrix(1,0,0,1,-868.638644,-102.810495)">
          <g transform="matrix(-0.878581,-0.008475,0.008475,-0.878581,1396.014591,1130.864008)">
            <path
              d="M470.664,460.412C480.235,462.563 604.057,458.909 604.714,462.431C604.789,462.834 604.757,522.287 604.755,527.492C604.254,529.518 603.417,529.006 561.499,529.243C557.404,529.267 555.452,527.45 555.455,531.495C555.473,556.541 555.582,556.385 555.562,581.501C555.562,582.438 556.874,590.934 552.517,590.921C547.962,590.908 496.189,590.756 495.579,590.915C492.529,591.716 494.477,593.265 493.617,631.244C479.019,632.93 428.119,632.071 427.538,631.447C426.812,630.667 426.213,461.418 427.892,460.959C431.192,460.055 431.275,462.547 470.664,460.412Z"
              fill={accent}
            />
          </g>
          <g transform="matrix(1.044674,0,0,1.044674,262.860719,62.274423)">
            <path
              d="M826.838,240.583C827.271,143.85 826.179,143.357 827.8,141.773C829.053,140.547 911.497,82.076 918.789,76.904C971.407,39.586 973.253,36.877 973.339,39.56C973.681,50.25 973.342,528.025 973.312,570.501C973.282,613.344 979.493,635.484 925.448,631.367C925.995,628.972 925.839,628.954 925.825,580.496C925.769,389.918 928.339,387.85 912.273,361.649C879.193,307.7 829.618,330.155 827.73,330.74C825.604,323.847 827.707,323.66 826.838,240.583Z"
              fill={accent}
            />
          </g>
          <g transform="matrix(1.044674,0,0,1.044674,262.860719,62.006573)">
            <path
              d="M827.73,330.74C829.618,330.155 879.193,307.7 912.273,361.649C928.339,387.85 925.769,389.918 925.825,580.496C925.839,628.954 925.995,628.972 925.448,631.367C914.176,632.747 914.163,631.82 783.5,631.622C780.482,631.617 780.578,631.6 779.303,630.645C779.206,629.627 778.453,418.188 779.769,405.529C783.162,372.891 800.057,346.511 821.409,334.353C826.759,331.307 826.8,331.41 827.263,331.145C827.66,330.918 827.462,330.893 827.73,330.74Z"
              fill={primary}
            />
          </g>
          <g transform="matrix(0.727124,0,0,0.727124,457.140106,262.733338)">
            <path
              d="M827.73,330.74C829.618,330.155 879.193,307.7 912.273,361.649C928.339,387.85 925.769,389.918 925.825,580.496C925.839,628.954 925.995,628.972 925.448,631.367C914.176,632.747 914.163,631.82 783.5,631.622C780.482,631.617 780.578,631.6 779.303,630.645C779.206,629.627 778.453,418.188 779.769,405.529C783.162,372.891 800.057,346.511 821.409,334.353C826.759,331.307 826.8,331.41 827.263,331.145C827.66,330.918 827.462,330.893 827.73,330.74Z"
              fill={secondary}
            />
          </g>
        </g>
      </svg>
      <svg
        className="de-hero-art de-hero-sun"
        viewBox="0 0 112 110"
        aria-hidden="true"
        focusable="false"
        fillRule="evenodd"
        clipRule="evenodd"
      >
        <g transform="matrix(1,0,0,1,-799.945123,-160.004749)">
          <g transform="matrix(0.561943,0,0,0.561943,489.47079,143.973518)">
            <path
              d="M552.502,131.5C552.5,126.917 552.493,97.119 567.006,76.074C637.919,-26.75 772.845,55.726 747.706,148.564C723.303,238.682 619.007,239.55 579.589,193.429C553.977,163.463 555.103,149.42 552.502,131.5Z"
              fill={accent}
            />
          </g>
        </g>
      </svg>
      <svg
        className="de-hero-art de-hero-leaves"
        viewBox="0 0 389 306"
        aria-hidden="true"
        focusable="false"
        fillRule="evenodd"
        clipRule="evenodd"
      >
        <g transform="matrix(1,0,0,1,0.806535,-413.912671)">
          <g transform="matrix(0.953428,0,0,0.953428,-99.523407,59.26415)">
            <g transform="matrix(1.095703,0,0,1.095703,61,0)">
              <path
                d="M125.675,571.339C127.45,571.14 127.137,570.699 127.221,569.397C132.318,490.364 191.645,415.007 271.561,404.947C289.806,402.65 294.731,401.971 293.628,407.531C267.174,540.891 158.692,566.152 127.62,579.817C123.729,581.529 127.018,627.243 125.67,630.582C125.08,632.041 117.664,631.612 117.494,631.523C116.671,631.094 117.27,550.959 116.8,547.426C116.518,545.308 53.394,511.445 39.88,435.441C38.611,428.307 38.509,396.407 39.891,385.551C40.371,381.781 46.411,334.337 53.186,339.942C85.868,366.982 115.781,402.564 123.755,467.473C125.543,482.024 124.6,564.382 125.675,571.339Z"
                fill={secondary}
              />
            </g>
            <g transform="matrix(1.095703,0,0,1.095703,61,0)">
              <path
                d="M397.433,521.774C398.535,522.108 411.174,525.937 410.628,527.529C403.467,548.408 345.326,624.973 270.489,631.371C266.225,631.735 148.93,631.746 148.552,631.425C146.761,629.904 191.262,551.47 277.556,524.674C341.083,504.949 387.587,519.55 397.433,521.774Z"
                fill={secondary}
              />
            </g>
            <g transform="matrix(1.095703,0,0,1.095703,61,0)">
              <path
                d="M51.414,522.605C59.315,528.856 107.726,567.159 115.825,630.815C115.974,631.987 62.145,632.332 57.491,630.527C34.928,621.776 39.243,609.99 39.014,542.502C38.926,516.541 38.564,514.537 40.499,515.503C43.452,516.975 50.563,522.004 51.414,522.605Z"
                fill={secondary}
              />
            </g>
          </g>
        </g>
      </svg>
    </>
  );
}

function SettingsField({
  part,
  render,
}: {
  part: DesignPart;
  render: () => ReactNode;
}) {
  return (
    <div className="de-field" data-editing={part.editing ? "" : undefined}>
      <span className="de-field-label">{part.tag}</span>
      <div className="de-field-row">
        {part.editing ? part.body : render()}
        <span className="de-field-actions">{part.actions}</span>
      </div>
    </div>
  );
}

/** The Image style select, shown as a pill with its own pencil toggle rather
 * than a `DesignPart` — it's Prompt Editor state, not a DESIGN.md section, so
 * it has no `part.editing`/`part.actions` of its own to key off. */
function ImageStyleField({
  label,
  control,
}: {
  label: string;
  control: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pencilRef = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  useEffect(() => {
    if (editing) {
      wrapRef.current?.querySelector("select")?.focus();
    } else if (refocus.current) {
      refocus.current = false;
      pencilRef.current?.focus();
    }
  }, [editing]);
  const close = (returnFocus: boolean) => {
    refocus.current = returnFocus;
    setEditing(false);
  };
  return (
    <div className="de-field" data-editing={editing ? "" : undefined}>
      <div className="de-field-row">
        {editing ? (
          // Closes the picker on blur/Escape/Enter, mirroring a native
          // <select>'s own dismissal; this project has no jsx-a11y lint rule
          // requiring a role/tabIndex for these handlers.
          <div
            ref={wrapRef}
            className="de-hero-style"
            onChange={() => close(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                close(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                close(true);
              }
            }}
          >
            {control}
          </div>
        ) : (
          <span className="de-pill de-theme-pill">
            <ImageIcon size={12} aria-hidden="true" />
            Image style: {label}
          </span>
        )}
        <span className="de-field-actions">
          <span className="prompt-tag-actions">
            <Hint label="Edit image style">
              <button
                ref={pencilRef}
                type="button"
                className="prompt-part-edit"
                aria-label="Edit image style"
                onClick={() => setEditing(true)}
              >
                <Pencil size={11} />
              </button>
            </Hint>
          </span>
        </span>
      </div>
    </div>
  );
}

export function DesignSettingsCard({
  title,
  tagline,
  theme,
  font,
  art,
  styleControl,
  styleLabel,
}: {
  title?: DesignPart | undefined;
  tagline?: DesignPart | undefined;
  theme?: DesignPart | undefined;
  font?: string | undefined;
  art: ReactNode;
  styleControl?: ReactNode | undefined;
  styleLabel?: string | undefined;
}) {
  const editingAny = !!(title?.editing || tagline?.editing || theme?.editing);
  const themeValue = theme
    ? /\*\*Theme:\*\*\s*(\S+)/.exec(theme.text)?.[1]
    : undefined;
  return (
    <section
      className="de-card de-hero"
      aria-label="Design settings"
      data-editing={editingAny ? "" : undefined}
      data-has-theme={theme ? "" : undefined}
    >
      {art}
      <div className="de-hero-head">
        <span className="de-hero-eyebrow">
          <Sparkles size={11} aria-hidden="true" />
          Design settings
        </span>
        {title && (
          <SettingsField
            part={title}
            render={() => (
              <span
                className="de-field-value de-hero-title"
                style={
                  {
                    fontFamily: font || undefined,
                    "--de-title-chars": Math.max(title.text.length, 10),
                  } as CSSProperties
                }
              >
                {title.text}
              </span>
            )}
          />
        )}
      </div>
      <div className="de-hero-body">
        {tagline && (
          <SettingsField
            part={tagline}
            render={() => (
              <span className="de-field-value de-hero-tagline">
                {tagline.text}
              </span>
            )}
          />
        )}
        {theme && (
          <SettingsField
            part={theme}
            render={() =>
              themeValue ? (
                <span className="de-pill de-theme-pill">
                  {themeValue === "dark" ? (
                    <Moon size={12} aria-hidden="true" />
                  ) : (
                    <Sun size={12} aria-hidden="true" />
                  )}
                  Theme: {themeValue}
                </span>
              ) : (
                theme.body
              )
            }
          />
        )}
        {styleControl && (
          <ImageStyleField
            label={styleLabel ?? "None"}
            control={styleControl}
          />
        )}
      </div>
    </section>
  );
}

const hexLuminance = (hex: string) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())?.[1];
  if (!m) return 1;
  const h = m.length === 3 ? [...m].map((c) => c + c).join("") : m;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)) / 255;
};

// Contrast-only ink for the palette block's label/hex against its own swatch
// color; not brand or theme data, just legibility.
const swatchInk = (hex: string) =>
  hexLuminance(hex) > 0.55 ? "#1a1712" : "#fbf7ef";

const roleLabel = (role: string): string => {
  const r = role.split(" — ")[0]?.toLowerCase() ?? "";
  if (/gradient end/.test(r)) return "GRADIENT";
  if (r.includes("primary")) return "PRIMARY";
  if (r.includes("secondary")) return "SECONDARY";
  if (r.includes("accent")) return "ACCENT";
  if (/\btext$/.test(r)) return "FONT COLOR";
  if (r === "canvas background" || r === "brand background")
    return "BACKGROUND";
  if (/(background|fill)$/.test(r)) return "FILL";
  if (/border$/.test(r)) return "BORDER";
  return r.toUpperCase();
};

function ColorSwatchBlock({
  name,
  hex,
  roles,
}: {
  name: string;
  hex: string;
  roles: string[];
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);
  const HEX = hex.toUpperCase();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(HEX);
      setCopied(true);
      toast.success(`Copied ${HEX}`);
    } catch {
      toast.error("Couldn't copy color");
    }
  };
  const labels = [...new Set(roles.map(roleLabel))];
  const shown = labels.length
    ? labels[0] + (labels.length > 1 ? ` +${labels.length - 1}` : "")
    : "";
  const ink = swatchInk(hex);
  return (
    <li className="de-palette-block" style={{ background: hex, color: ink }}>
      {shown && (
        <Hint label={roles.join(", ")}>
          <span className="de-palette-role" tabIndex={0}>
            {shown}
          </span>
        </Hint>
      )}
      <div className="de-palette-bottom">
        <code className="de-palette-hex">{HEX.replace(/^#/, "")}</code>
        <Hint label={copied ? "Copied" : "Copy"}>
          <button
            type="button"
            className="de-palette-copy"
            aria-label={copied ? `Copied ${HEX}` : `Copy ${name} ${HEX}`}
            onClick={copy}
          >
            {copied ? (
              <Check size={12} aria-hidden="true" />
            ) : (
              <Copy size={12} aria-hidden="true" />
            )}
          </button>
        </Hint>
      </div>
    </li>
  );
}

/** A compact strip of up to 6 color swatches for the collapsed Colors card
 * header, with a "+N" overflow count when there are more. */
function ColorsPreview({ hexes }: { hexes: string[] }) {
  const shown = hexes.slice(0, 6);
  const extra = hexes.length - shown.length;
  return (
    <>
      {shown.map((hex, i) => (
        <i key={i} className="de-pv-swatch" style={{ background: hex }} />
      ))}
      {extra > 0 && `+${extra}`}
    </>
  );
}

export function ColorTokensCard({ part }: { part: DesignPart }) {
  const fallback = (
    <TokenCard
      icon={Palette}
      title="Colors"
      actions={part.actions}
      forceOpen={part.editing}
    >
      {part.body}
    </TokenCard>
  );
  if (part.editing) return fallback;
  const blocks = parseDesignMarkdown(part.text);
  const table = blocks.find(isTable);
  if (!table) return fallback;
  const nameIdx = table.head.indexOf("Name");
  const valueIdx = table.head.indexOf("Value");
  const roleIdx = table.head.indexOf("Role");
  if (nameIdx < 0 || valueIdx < 0) return fallback;
  const swatches = table.rows.map((r) => ({
    name: r[nameIdx] ?? "",
    hex: unquote(r[valueIdx] ?? ""),
    roles: roleIdx >= 0 ? (r[roleIdx] ?? "").split("; ").filter(Boolean) : [],
  }));
  if (!swatches.length || swatches.some((s) => !HEX_RE.test(s.hex)))
    return fallback;
  return (
    <TokenCard
      icon={Palette}
      title="Colors"
      actions={part.actions}
      forceOpen={part.editing}
      summary={`${swatches.length} color${swatches.length === 1 ? "" : "s"}`}
      preview={<ColorsPreview hexes={swatches.map((s) => s.hex)} />}
    >
      <ul className="de-palette" aria-label="Color palette">
        {swatches.map((s, i) => (
          <ColorSwatchBlock key={i} name={s.name} hex={s.hex} roles={s.roles} />
        ))}
      </ul>
    </TokenCard>
  );
}

const FAMILY_FIELD_ORDER = [
  "Substitute",
  "Weights",
  "Sizes",
  "Line height",
  "Letter spacing",
  "Role",
];

function FontFamilyToken({
  title,
  blocks,
  showName,
}: {
  title: string;
  blocks: MdBlock[];
  showName: boolean;
}) {
  const [family, role] = title.split(" — ");
  const list = blocks.find(isList);
  const fields = (list?.items ?? [])
    .map((item) => boldField(item))
    .filter((f): f is { label: string; value: string } => !!f);
  if (role && !fields.some((f) => f.label === "Role"))
    fields.push({ label: "Role", value: role });
  fields.sort((a, b) => {
    const ai = FAMILY_FIELD_ORDER.indexOf(a.label);
    const bi = FAMILY_FIELD_ORDER.indexOf(b.label);
    return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
  });
  return (
    <div className="de-family">
      {showName && <span className="de-family-name">{family}</span>}
      <ul className="de-family-fields">
        {fields.map((f, i) => (
          <li key={i} className="de-family-field">
            <span className="de-family-label">{f.label}:</span>{" "}
            <span className="de-family-value">
              <ProseText text={f.value} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TypeScaleTable({ table }: { table: TableBlock }) {
  const col = (name: string) => table.head.indexOf(name);
  const rows = [...table.rows].sort(
    (a, b) =>
      (parseFloat(b[col("Size")] ?? "") || 0) -
      (parseFloat(a[col("Size")] ?? "") || 0),
  );
  return (
    <div className="de-type-scale">
      {rows.map((r, i) => {
        const sizeText = r[col("Size")] ?? "";
        const size = parseFloat(sizeText) || 16;
        const family = r[col("Family")] ?? "";
        const weight = r[col("Weight")] ?? "";
        const lh = r[col("Line Height")] ?? "";
        const tracking = r[col("Letter Spacing")] ?? "";
        const role = r[col("Role")] ?? "";
        const fontSize = Math.min(32, Math.max(18, size * 0.4));
        return (
          <div key={i} className="de-type-row">
            <span
              className="de-type-sample"
              style={{
                fontFamily: `"${family}", ui-sans-serif, system-ui, sans-serif`,
                fontWeight: Number(weight) || 400,
                fontSize,
              }}
            >
              Aa
            </span>
            <span className="de-type-meta">
              <b className="de-type-role">{role}</b>
              <small>
                {family} · {sizeText} · {weight}
                {lh ? ` · ${lh}` : ""}
                {tracking && tracking !== "—" ? ` · ${tracking}` : ""}
              </small>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Up to 3 "Aa" font samples for the collapsed Typography card header, each
 * set in its own family with the family name underneath. */
function TypePreview({ families }: { families: string[] }) {
  return (
    <>
      {families.slice(0, 3).map((f, i) => (
        <span key={i} className="de-pv-font">
          <b
            style={{
              fontFamily: `"${f}", ui-sans-serif, system-ui, sans-serif`,
            }}
          >
            Aa
          </b>
          <small>{f}</small>
        </span>
      ))}
    </>
  );
}

export function TypographyTokensCard({ part }: { part: DesignPart }) {
  const fallback = (
    <TokenCard
      icon={Type}
      title="Typography"
      actions={part.actions}
      forceOpen={part.editing}
    >
      {part.body}
    </TokenCard>
  );
  if (part.editing) return fallback;
  const groups = sectionsByH3(parseDesignMarkdown(part.text));
  const scaleGroup = groups.find((g) => g.title === "Type Scale");
  const familyGroups = groups.filter(
    (g) => g.title && g.title !== "Type Scale",
  );
  const scaleTable = scaleGroup?.blocks.find(isTable);
  if (!familyGroups.length && !scaleTable) return fallback;
  const fonts =
    familyGroups.length > 0
      ? [
          ...new Set(
            familyGroups
              .map((g) => g.title?.split(" — ")[0]?.trim())
              .filter((f): f is string => !!f),
          ),
        ]
      : scaleTable
        ? [
            ...new Set(
              scaleTable.rows
                .map((r) => r[scaleTable.head.indexOf("Family")]?.trim())
                .filter((f): f is string => !!f),
            ),
          ]
        : [];
  const summary = [
    fonts.length ? `${fonts.length} fonts` : "",
    scaleTable ? `${scaleTable.rows.length} text styles` : "",
  ]
    .filter(Boolean)
    .join(" • ");
  return (
    <TokenCard
      icon={Type}
      title="Typography"
      actions={part.actions}
      forceOpen={part.editing}
      summary={summary}
      preview={<TypePreview families={fonts} />}
    >
      <div
        className="de-typography"
        data-split={familyGroups.length > 0 && scaleTable ? "" : undefined}
      >
        {familyGroups.length > 0 && (
          <div className="de-families">
            {familyGroups.map((g, i) => (
              <FontFamilyToken
                key={i}
                title={g.title ?? ""}
                blocks={g.blocks}
                showName={familyGroups.length > 1}
              />
            ))}
          </div>
        )}
        {scaleTable && (
          <div className="de-type-scale-wrap">
            <h4 className="de-subhead">Type Scale</h4>
            <TypeScaleTable table={scaleTable} />
          </div>
        )}
      </div>
    </TokenCard>
  );
}

function DiagramTile({
  diagram,
  label,
  value,
  note,
}: {
  diagram?: ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="de-dtile">
      <div className="de-dtile-art" aria-hidden="true">
        {diagram}
      </div>
      <span className="de-dtile-label">{label}</span>
      <b className="de-dtile-value">{value}</b>
      {note && <span className="de-dtile-note">{note}</span>}
    </div>
  );
}

/** A value/max connector: a filled dot at each end joined by a line whose
 * length (solid) or dash (very long, `data-long`) reads as the gap's size
 * relative to the largest value in its group. */
function gapDiagram(ratio: number) {
  return (
    <span
      className="de-gap"
      data-long={ratio > 0.6 ? "" : undefined}
      style={{ "--de-gap": ratio } as CSSProperties}
    >
      <i />
      <span className="de-gap-line" />
      <i />
    </span>
  );
}

const NUMERIC_NAME_RE = /^\d+(\.\d+)?(px)?$/;

function SpacingTokens({ table }: { table: TableBlock }) {
  const valueIdx = table.head.indexOf("Value");
  const nameIdx = table.head.indexOf("Name");
  const tokenIdx = table.head.indexOf("Token");
  const values = table.rows.map((r) => parseFloat(r[valueIdx] ?? "") || 0);
  const max = Math.max(...values, 1);
  const fallback = spacingTokenNames(table.rows.length);
  return (
    <div className="de-dtiles">
      {table.rows.map((r, i) => {
        const candidates = [
          tokenIdx >= 0 ? r[tokenIdx] : undefined,
          nameIdx >= 0 ? r[nameIdx] : undefined,
        ];
        const label =
          candidates
            .map((c) => c?.trim())
            .find((c) => c && !NUMERIC_NAME_RE.test(c)) ??
          fallback[i] ??
          "";
        const ratio = Math.min(1, Math.max(0.08, (values[i] ?? 0) / max));
        return (
          <DiagramTile
            key={i}
            diagram={gapDiagram(ratio)}
            label={label}
            value={r[valueIdx] ?? ""}
          />
        );
      })}
    </div>
  );
}

function RadiusTokens({ table }: { table: TableBlock }) {
  const elIdx = table.head.indexOf("Element");
  const valIdx = table.head.indexOf("Value");
  return (
    <div className="de-dtiles">
      {table.rows.map((r, i) => {
        const value = parseFloat(r[valIdx] ?? "") || 0;
        return (
          <DiagramTile
            key={i}
            diagram={
              <span
                className="de-radius-demo"
                style={{ borderTopLeftRadius: Math.min(value, 16) }}
              />
            }
            label={r[elIdx] ?? ""}
            value={r[valIdx] ?? ""}
          />
        );
      })}
    </div>
  );
}

const TEXT_ALIGN_ICONS: Record<string, LucideIcon> = {
  left: TextAlignStart,
  center: TextAlignCenter,
  right: TextAlignEnd,
  justify: TextAlignJustify,
};

function layoutDiagram(label: string, value: string): ReactNode {
  if (label === "Canvas") {
    const m = /(\d+)\s*×\s*(\d+)/.exec(value);
    if (!m) return undefined;
    const w = Number(m[1]);
    const h = Number(m[2]);
    const s = Math.min(40 / w, 30 / h);
    return (
      <span
        className="de-canvas-demo"
        style={{ width: w * s, height: h * s }}
      />
    );
  }
  if (label === "Safe margin") return <span className="de-margin-demo" />;
  if (label === "Element gap") return gapDiagram(0.5);
  if (label === "Text alignment") {
    const Icon = TEXT_ALIGN_ICONS[value.toLowerCase()] ?? TextAlignStart;
    return <Icon size={20} className="de-align-demo" />;
  }
  return undefined;
}

const CANVAS_VALUE_NOTE_RE = /^(.*?)\s*\(([^)]+)\)\s*$/;

const LAYOUT_PREVIEW_FIELDS: { match: string; short: string }[] = [
  { match: "safe margin", short: "Margin" },
  { match: "element gap", short: "Gap" },
  { match: "text alignment", short: "Align" },
];

/** Compact "Margin / Gap / Align" tiles for the collapsed Layout card
 * header, built from whichever of those fields the section has. */
function LayoutPreview({
  fields,
}: {
  fields: { label: string; value: string }[];
}) {
  const tiles = LAYOUT_PREVIEW_FIELDS.map(({ match, short }) => {
    const field = fields.find((f) => f.label.toLowerCase() === match);
    return field && { short, value: field.value };
  }).filter((t): t is { short: string; value: string } => !!t);
  return (
    <>
      {tiles.map((t, i) => (
        <span key={i} className="de-pv-tile">
          <small>{t.short}</small>
          <span>{t.value}</span>
        </span>
      ))}
    </>
  );
}

function LayoutTokensCard({ items }: { items: string[] }) {
  const fields = items
    .map((item) => boldField(item))
    .filter((f): f is { label: string; value: string } => !!f);
  const canvas = fields.find((f) => f.label.toLowerCase() === "canvas");
  return (
    <TokenCard
      icon={LayoutGrid}
      title="Layout"
      summary={canvas?.value}
      preview={<LayoutPreview fields={fields} />}
    >
      <div className="de-dtiles de-dtiles--layout">
        {fields.map((f, i) => {
          const canvasSplit =
            f.label === "Canvas" ? CANVAS_VALUE_NOTE_RE.exec(f.value) : null;
          const note = canvasSplit?.[2];
          return (
            <DiagramTile
              key={i}
              diagram={layoutDiagram(f.label, f.value)}
              label={f.label}
              value={canvasSplit?.[1] ?? f.value}
              {...(note ? { note } : {})}
            />
          );
        })}
      </div>
    </TokenCard>
  );
}

/** Up to 4 spacing bars (scaled to the largest value) and up to 4 radius
 * corners for the collapsed Spacing & Shapes card header. */
function SpacingPreview({
  spacing,
  radii,
}: {
  spacing: number[];
  radii: number[];
}) {
  const max = Math.max(...spacing, 1);
  return (
    <>
      {spacing.slice(0, 4).map((v, i) => (
        <i
          key={`bar-${i}`}
          className="de-pv-bar"
          style={{ "--de-pv-w": Math.max(0.15, v / max) } as CSSProperties}
        />
      ))}
      {radii.slice(0, 4).map((v, i) => (
        <i
          key={`radius-${i}`}
          className="de-pv-radius"
          style={{ borderTopLeftRadius: Math.min(v, 10) }}
        />
      ))}
    </>
  );
}

export function SpacingAndLayoutCards({ part }: { part: DesignPart }) {
  const fallback = (
    <>
      <TokenCard
        icon={Box}
        title="Spacing & Shapes"
        actions={part.actions}
        forceOpen={part.editing}
      >
        {part.body}
      </TokenCard>
    </>
  );
  if (part.editing) return fallback;
  const groups = sectionsByH3(parseDesignMarkdown(part.text));
  const base = groups.find((g) => g.title === null);
  const scaleGroup = groups.find((g) => g.title === "Spacing Scale");
  const radiusGroup = groups.find((g) => g.title === "Border Radius");
  const layoutGroup = groups.find((g) => g.title === "Layout");

  const baseFields = base ? boldFields(base.blocks) : [];
  const baseUnit = baseFields.find((f) => f.label === "Base unit");
  const density = baseFields.find((f) => f.label === "Density");
  const scaleTable = scaleGroup?.blocks.find(isTable);
  const radiusTable = radiusGroup?.blocks.find(isTable);
  const layoutList = layoutGroup?.blocks.find(isList);

  if (!baseUnit && !density && !scaleTable && !radiusTable) return fallback;

  const summary = [baseUnit && `Base ${baseUnit.value}`, density?.value]
    .filter(Boolean)
    .join(" • ");
  const scaleValueIdx = scaleTable?.head.indexOf("Value") ?? -1;
  const spacingValues = (scaleTable?.rows ?? [])
    .map((r) => parseFloat(r[scaleValueIdx] ?? ""))
    .filter((v) => !Number.isNaN(v));
  const radiusValueIdx = radiusTable?.head.indexOf("Value") ?? -1;
  const radiusValues = (radiusTable?.rows ?? [])
    .map((r) => parseFloat(r[radiusValueIdx] ?? ""))
    .filter((v) => !Number.isNaN(v));

  const meta = (baseUnit || density) && (
    <>
      {baseUnit && (
        <span className="de-stat">
          <Layers size={13} aria-hidden="true" />
          <span className="de-stat-label">Base unit</span>
          <b className="de-stat-value">{baseUnit.value}</b>
        </span>
      )}
      {density && (
        <span className="de-stat">
          <SlidersHorizontal size={13} aria-hidden="true" />
          <span className="de-stat-label">Density</span>
          <b className="de-stat-value">{density.value}</b>
        </span>
      )}
    </>
  );

  return (
    <>
      <TokenCard
        icon={Box}
        title="Spacing & Shapes"
        actions={part.actions}
        meta={meta}
        forceOpen={part.editing}
        summary={summary}
        preview={
          <SpacingPreview spacing={spacingValues} radii={radiusValues} />
        }
      >
        <div className="de-spacing">
          {scaleTable && (
            <section className="de-spacing-group">
              <h4 className="de-subhead">Spacing tokens</h4>
              <SpacingTokens table={scaleTable} />
            </section>
          )}
          {scaleTable && radiusTable && <hr className="de-divider" />}
          {radiusTable && (
            <section className="de-spacing-group">
              <h4 className="de-subhead">Border radius</h4>
              <RadiusTokens table={radiusTable} />
            </section>
          )}
        </div>
      </TokenCard>
      {layoutList && <LayoutTokensCard items={layoutList.items} />}
    </>
  );
}

/** A small preview swatch for one Composition item: a headline shows "Aa", an
 * image kind shows an image glyph, everything else (eyebrow/body/cta/shape)
 * shows a couple of bars tinted with the element's own fill. */
function CompThumb({
  preview,
  fill,
}: {
  preview: CompositionModel["items"][number]["preview"];
  fill?: string | undefined;
}) {
  return (
    <span
      className="de-comp-thumb"
      data-preview={preview}
      style={{ "--de-comp-fill": fill } as CSSProperties}
      aria-hidden="true"
    >
      {preview === "headline" ? (
        "Aa"
      ) : preview === "image" ? (
        <ImageIcon size={14} />
      ) : (
        <>
          <i />
          <i />
        </>
      )}
    </span>
  );
}

/** One layout slot under a Composition item: its placement facts (name,
 * zone, position and W/H/Covers/Copy-budget/imagery meta) are always
 * visible. The slot's editor body (`part.body`) shows only while that slot
 * is actively being edited via its pencil action; there is no persistent
 * "Content" disclosure. */
function CompSlotRow({
  slot,
  itemImagery,
}: {
  slot: CompSlot;
  itemImagery?: string | undefined;
}) {
  const { part } = slot;
  const showImagery = slot.imagery && slot.imagery !== itemImagery;
  return (
    <li className="de-comp-slot" data-editing={part.editing ? "" : undefined}>
      <span className="de-comp-slot-name">
        {slot.name} — {slot.zone}
      </span>
      <span className="de-comp-slot-pos">{slot.pos}</span>
      <span className="de-comp-slot-meta">
        <span>W {slot.width}</span>
        {slot.height && <span>H {slot.height}</span>}
        {slot.covers && <span>Covers {slot.covers} of canvas</span>}
        {slot.copyBudget != null && (
          <span>Copy ≤ ~{slot.copyBudget} chars</span>
        )}
        {showImagery && <span>{slot.imagery}</span>}
      </span>
      <span className="de-comp-slot-actions">{part.actions}</span>
      {part.editing && <div className="de-comp-slot-body">{part.body}</div>}
    </li>
  );
}

/** Up to 6 element-name chips for the collapsed Composition card header,
 * with a "+N" overflow count when there are more. */
function ChipsPreview({ names }: { names: string[] }) {
  const shown = names.slice(0, 6);
  const extra = names.length - shown.length;
  return (
    <>
      {shown.map((name, i) => (
        <span key={i} className="de-pill de-pv-chip">
          {name}
        </span>
      ))}
      {extra > 0 && `+${extra}`}
    </>
  );
}

/** The standalone Layout card: the `skill:layout` part's own canvas/ratio/
 * density/safe margin/coverage stats (parsed once by `buildComposition` into
 * `CompositionModel.meta`), plus the part's editing body and hand-edited
 * note body when applicable. Split out of `CompositionCard` so these canvas-
 * level facts read as their own card rather than crowding the per-element
 * Composition list. */
function CanvasLayoutCard({
  part,
  meta,
  custom,
}: {
  part: DesignPart;
  meta: CompositionModel["meta"];
  custom: boolean;
}) {
  const stats = (
    <>
      <span className="de-stat">
        <LayoutTemplate size={13} aria-hidden="true" />
        <span className="de-stat-label">Canvas</span>
        <b className="de-stat-value">{meta.canvas}</b>
      </span>
      <span className="de-stat">
        <LayoutTemplate size={13} aria-hidden="true" />
        <span className="de-stat-label">Ratio</span>
        <b className="de-stat-value">{meta.ratio}</b>
      </span>
      {meta.density && (
        <span className="de-stat">
          <SlidersHorizontal size={13} aria-hidden="true" />
          <span className="de-stat-label">Density</span>
          <b className="de-stat-value">{meta.density}</b>
        </span>
      )}
      {meta.safeMargin && (
        <span className="de-stat">
          <Box size={13} aria-hidden="true" />
          <span className="de-stat-label">Safe margin</span>
          <b className="de-stat-value">{meta.safeMargin}</b>
        </span>
      )}
      {meta.coverage && (
        <span className="de-stat">
          <Layers size={13} aria-hidden="true" />
          <span className="de-stat-label">Coverage</span>
          <b className="de-stat-value">{meta.coverage}</b>
        </span>
      )}
    </>
  );
  return (
    <TokenCard
      icon={Frame}
      title={part.tag}
      actions={part.actions}
      forceOpen={part.editing}
      meta={stats}
      summary={`${meta.canvas} · ${meta.ratio}`}
    >
      {(part.editing || custom) && part.body}
    </TokenCard>
  );
}

/** The unified Components + Layout slots + Imagery card: one item row per
 * element kind (thumbnail, tokens, prose) with its Placement slots nested
 * underneath. Reads `buildComposition`'s view-model only — every section's
 * and every slot's own `actions`/`body` are rendered verbatim, so editing
 * and deleting work exactly as they did across the three separate cards. */
function CompositionCard({ model }: { model: CompositionModel }) {
  const sources = (
    <>
      {model.sections.map((p) => (
        <span key={p.key} className="de-comp-src">
          <span className="de-comp-src-label">{p.tag}</span>
          {p.actions}
        </span>
      ))}
    </>
  );
  const editingKeys = new Set(model.editing.map((p) => p.key));
  const forceOpen =
    model.editing.length > 0 ||
    model.items.some((item) => item.slots.some((s) => s.part.editing)) ||
    model.orphans.some((p) => p.editing);
  return (
    <TokenCard
      icon={LayoutTemplate}
      title="Composition"
      forceOpen={forceOpen}
      summary={`${model.items.length} element${model.items.length === 1 ? "" : "s"}`}
      preview={<ChipsPreview names={model.items.map((i) => i.name)} />}
    >
      {model.sections.length > 0 && (
        <div className="de-comp-sources">{sources}</div>
      )}
      {model.editing.map((p) => (
        <section
          key={p.key}
          className="de-comp-editor"
          aria-label={`Editing ${p.tag}`}
        >
          <h4 className="de-subhead">{p.tag}</h4>
          {p.body}
        </section>
      ))}
      {model.items.length > 0 && (
        <ol className="de-comp-list">
          {model.items.map((item, i) => (
            <li key={item.key} className="de-comp-item">
              <div className="de-comp-main">
                <CompThumb preview={item.preview} fill={item.fill} />
                <span className="de-comp-badge">{i + 1}</span>
                <h4 className="de-comp-title">
                  <span className="de-comp-name">{item.name}</span>
                  {item.count > 1 && (
                    <span className="de-comp-count">×{item.count}</span>
                  )}
                </h4>
                {item.role && <p className="de-comp-role">{item.role}</p>}
                {item.tokens.length > 0 && (
                  <ul className="de-comp-tokens">
                    {item.tokens.map((t, ti) => (
                      <li
                        key={ti}
                        className="de-comp-token"
                        data-emphasis={t.emphasis ? "" : undefined}
                        data-variant={t.variant}
                      >
                        {t.swatch && (
                          <i
                            className="de-comp-swatch"
                            style={{ background: t.swatch }}
                            aria-hidden="true"
                          />
                        )}
                        {t.value ?? t.label}
                      </li>
                    ))}
                  </ul>
                )}
                {item.prose.map((p, pi) => (
                  <p key={pi} className="de-comp-desc">
                    <ProseText text={p} />
                  </p>
                ))}
                {item.imagery && (
                  <p className="de-comp-imagery">{item.imagery}</p>
                )}
              </div>
              {item.slots.length > 0 && (
                <div className="de-comp-place">
                  <h5 className="de-comp-place-title">
                    <MapPin size={12} aria-hidden="true" />
                    Placement
                  </h5>
                  <ul>
                    {item.slots.map((slot) => (
                      <CompSlotRow
                        key={slot.part.key}
                        slot={slot}
                        itemImagery={item.imagery}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {model.orphans.map((p) => (
        <div key={p.key} className="de-subrow">
          <span className="de-subrow-tag">{p.tag}</span>
          <span className="de-subrow-actions">{p.actions}</span>
          <div className="de-subrow-body">{p.body}</div>
        </div>
      ))}
      {model.notes
        .filter((p) => !editingKeys.has(p.key))
        .map((p) => (
          <section key={p.key} className="de-comp-note">
            <h4 className="de-subhead">{p.tag}</h4>
            {p.body}
          </section>
        ))}
    </TokenCard>
  );
}

const GENERIC_ICONS: Record<string, LucideIcon> = {
  "skill:rules": ListChecks,
  "skill:elevation": Layers3,
  "skill:art": Camera,
};
const iconFor = (key: string): LucideIcon => GENERIC_ICONS[key] ?? FileText;

export function DesignEditorSections({
  parts,
  doc,
  kit,
  styleControl,
  styleLabel,
}: {
  parts: DesignPart[];
  doc: SpecDocument;
  kit?: BrandKit | undefined;
  styleControl?: ReactNode | undefined;
  styleLabel?: string | undefined;
}) {
  const titlePart = parts.find((p) => p.key === "skill:title");
  const taglinePart = parts.find((p) => p.key === "skill:tagline");
  const themePart = parts.find((p) => p.key === "skill:theme");

  const roleHex = (role: BrandKit["colors"][number]["role"]) =>
    kit?.colors.find((c) => c.role === role)?.hex;
  const posterPrimary =
    roleHex("primary") ?? doc.creativeDirection.primaryColor ?? "#B95132";
  const posterSecondary =
    roleHex("secondary") ?? doc.creativeDirection.secondaryColor ?? "#7F8762";
  const posterAccent = roleHex("accent") ?? "#FBC5AB";
  const font = kit?.typography;

  const cards: ReactNode[] = [
    <DesignSettingsCard
      key="settings"
      title={titlePart}
      tagline={taglinePart}
      theme={themePart}
      font={font}
      art={
        <DesignSettingsArt
          primary={posterPrimary}
          secondary={posterSecondary}
          accent={posterAccent}
        />
      }
      styleControl={styleControl}
      styleLabel={styleLabel}
    />,
  ];

  // Components, Layout slots and Imagery fold into one Composition card;
  // built once from whichever of the three sections and slots are present
  // (any may be missing — deleted sections just leave that piece out).
  const componentsPart = parts.find((p) => p.key === "skill:components");
  const layoutPart = parts.find((p) => p.key === "skill:layout");
  const imageryPart = parts.find((p) => p.key === "skill:imagery");
  const slotParts = parts.filter((p) => p.key.startsWith("skill:el:"));
  const typePart = parts.find((p) => p.key === "skill:type");
  const compositionModel =
    componentsPart || layoutPart || imageryPart || slotParts.length
      ? buildComposition({
          components: componentsPart,
          layout: layoutPart,
          imagery: imageryPart,
          type: typePart,
          slots: slotParts,
          doc,
        })
      : null;
  let composed = false;

  for (const part of parts) {
    if (
      part.key === "skill:title" ||
      part.key === "skill:tagline" ||
      part.key === "skill:theme"
    )
      continue;
    if (part.key === "skill:colors") {
      cards.push(<ColorTokensCard key={part.key} part={part} />);
      continue;
    }
    if (part.key === "skill:type") {
      cards.push(<TypographyTokensCard key={part.key} part={part} />);
      continue;
    }
    if (part.key === "skill:spacing") {
      cards.push(<SpacingAndLayoutCards key={part.key} part={part} />);
      continue;
    }
    if (
      part.key === "skill:components" ||
      part.key === "skill:layout" ||
      part.key === "skill:imagery" ||
      part.key.startsWith("skill:el:")
    ) {
      if (!composed && compositionModel) {
        if (layoutPart)
          cards.push(
            <CanvasLayoutCard
              key="canvas-layout"
              part={layoutPart}
              meta={compositionModel.meta}
              custom={doc.promptParts?.["skill:layout"] != null}
            />,
          );
        cards.push(
          <CompositionCard key="composition" model={compositionModel} />,
        );
        composed = true;
      }
      continue;
    }
    cards.push(
      <TokenCard
        key={part.key}
        icon={iconFor(part.key)}
        title={part.tag}
        actions={part.actions}
        forceOpen={part.editing}
      >
        {part.body}
      </TokenCard>,
    );
  }

  return <div className="de-sections">{cards}</div>;
}

const PROMPT_ICONS: Record<string, LucideIcon> = {
  format: Frame,
  imageStyle: ImageIcon,
  colors: Palette,
  brand: Sparkles,
  mood: Type,
  dominant: ImageIcon,
  layout: LayoutGrid,
  avoid: ListChecks,
};

/** The Prompt Editor's own `.de-sections` grid: one card per generated
 * line, all `el:*` elements folded into a single "Elements" card (mirroring
 * how DesignEditorSections folds Components/Layout/Imagery into one
 * Composition card), with the purpose brief inserted right after Format. */
export function PromptEditorSections({
  parts,
  doc,
  brief,
  artDirection,
}: {
  parts: DesignPart[];
  doc: SpecDocument;
  brief?: ReactNode;
  artDirection?: ReactNode;
}) {
  const cards: ReactNode[] = [];
  let elementsPushed = false;

  for (const part of parts) {
    if (part.key.startsWith("el:")) {
      if (elementsPushed) continue;
      elementsPushed = true;
      const els = parts.filter((p) => p.key.startsWith("el:"));
      cards.push(
        <TokenCard
          key="elements"
          icon={LayoutTemplate}
          title="Elements"
          summary={`${els.length} element${els.length === 1 ? "" : "s"}`}
          preview={<ChipsPreview names={els.map((p) => p.tag)} />}
          forceOpen={els.some((p) => p.editing || p.selected)}
          defaultOpen
        >
          {els.map((p) => (
            <div
              key={p.key}
              className="de-subrow"
              data-selected={p.selected ? "" : undefined}
              data-clickable={p.onSelect && !p.editing ? "" : undefined}
              onClick={selectOnClick(p.onSelect, !!p.editing)}
            >
              {p.onSelect ? (
                <button
                  type="button"
                  className="de-subrow-tag"
                  onClick={p.onSelect}
                  aria-label={`Edit style of ${p.tag}`}
                >
                  {p.tag}
                </button>
              ) : (
                <span className="de-subrow-tag">{p.tag}</span>
              )}
              <span className="de-subrow-actions">{p.actions}</span>
              <div className="de-subrow-body">{p.body}</div>
            </div>
          ))}
        </TokenCard>,
      );
      continue;
    }

    let summary: ReactNode | undefined;
    let preview: ReactNode | undefined;
    if (part.key === "format") {
      summary = `${doc.format.width} × ${doc.format.height} · ${ratio(doc.format.width, doc.format.height)}`;
    } else if (part.key === "colors") {
      preview = (
        <ColorsPreview
          hexes={[
            doc.background.value,
            doc.background.type === "gradient"
              ? doc.background.secondaryValue
              : undefined,
            doc.creativeDirection.primaryColor,
            doc.creativeDirection.secondaryColor,
          ].filter((h): h is string => !!h)}
        />
      );
    } else if (part.key === "brand") {
      summary = doc.creativeDirection.typography;
      preview = (
        <ColorsPreview
          hexes={[
            doc.creativeDirection.primaryColor,
            doc.creativeDirection.secondaryColor,
          ]}
        />
      );
    } else if (part.key === "mood") {
      preview = <ChipsPreview names={doc.creativeDirection.mood} />;
    }

    const selectHandler = selectOnClick(part.onSelect, !!part.editing);
    const body = selectHandler ? (
      <div className="de-select-area" data-clickable="" onClick={selectHandler}>
        {part.body}
      </div>
    ) : (
      part.body
    );

    cards.push(
      <TokenCard
        key={part.key}
        icon={PROMPT_ICONS[part.key] ?? FileText}
        title={part.tag}
        actions={part.actions}
        forceOpen={part.editing || part.selected}
        selected={part.selected}
        defaultOpen
        summary={summary}
        preview={preview}
      >
        {body}
      </TokenCard>,
    );
    if (part.key === "format" && brief) cards.push(brief);
    if (part.key === "format" && artDirection) cards.push(artDirection);
  }

  return <div className="de-sections">{cards}</div>;
}
