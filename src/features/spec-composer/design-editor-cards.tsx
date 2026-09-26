import { useId, type ReactNode } from "react";
import {
  Box,
  Component,
  FileText,
  Grid3x3,
  Image as ImageIcon,
  Info,
  Layers,
  Layers3,
  LayoutGrid,
  LayoutTemplate,
  ListChecks,
  Moon,
  Palette,
  Sparkles,
  Sun,
  Type,
  type LucideIcon,
} from "lucide-react";
import {
  boldField,
  parseDesignMarkdown,
  sectionsByH3,
  unquote,
  HEX_RE,
  type MdBlock,
} from "./design-md-parse";
import { ProseText } from "./design-md-view";
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

export function TokenCard({
  icon: Icon,
  title,
  actions,
  children,
}: {
  icon: LucideIcon;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section className="de-card" aria-labelledby={headingId}>
      <h3 id={headingId} className="de-card-title">
        <Icon className="de-card-icon" size={15} aria-hidden="true" />
        <span>{title}</span>
        {actions && <span className="de-card-actions">{actions}</span>}
      </h3>
      {children}
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

/** Wraps a title into at most `maxLines` short lines for the poster's SVG
 * `<tspan>`s; a purely visual best-effort, not a full word-wrap. */
function wrapTitle(text: string, maxChars = 14, maxLines = 3): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (lines.length === maxLines) break;
    const attempt = current ? `${current} ${word}` : word;
    if (attempt.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  return lines.slice(0, maxLines);
}

const archPath = (x: number, yTop: number, yBottom: number, width: number) => {
  const r = width / 2;
  return `M ${x} ${yBottom} L ${x} ${yTop + r} A ${r} ${r} 0 0 1 ${x + width} ${yTop + r} L ${x + width} ${yBottom} Z`;
};

export function SvgPosterPreview({
  ratio,
  background,
  primary,
  secondary,
  accent,
  title,
}: {
  ratio: number;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  title?: string | undefined;
}) {
  const h = 100 / (Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
  // Contrast-only ink for the illustrative title text; not brand or theme
  // data, just legibility against whatever background color this draws.
  const ink = hexLuminance(background) > 0.55 ? "#1a1712" : "#fbf7ef";
  const lines = title ? wrapTitle(title) : [];
  return (
    <div className="de-poster" style={{ aspectRatio: String(ratio || 1) }}>
      <svg
        className="de-poster-svg"
        viewBox={`0 0 100 ${h.toFixed(2)}`}
        aria-hidden="true"
        focusable="false"
      >
        <rect width={100} height={h} fill={background} />
        <circle
          cx={82}
          cy={h * 0.22}
          r={h * 0.16}
          fill={accent}
          opacity={0.85}
        />
        <path
          d={archPath(68, h * 0.42, h, h * 0.24)}
          fill={primary}
          opacity={0.92}
        />
        <rect
          x={8}
          y={h * 0.64}
          width={h * 0.36}
          height={h * 0.28}
          rx={2}
          fill={secondary}
          opacity={0.85}
        />
        <path
          d={`M 14 ${h * 0.92} C 10 ${h * 0.78} 18 ${h * 0.66} 30 ${h * 0.7}`}
          stroke={primary}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
        <ellipse
          cx={16}
          cy={h * 0.82}
          rx={5}
          ry={9}
          fill={primary}
          opacity={0.9}
          transform={`rotate(-30 16 ${h * 0.82})`}
        />
        <ellipse
          cx={25}
          cy={h * 0.69}
          rx={4}
          ry={7.5}
          fill={secondary}
          opacity={0.85}
          transform={`rotate(20 25 ${h * 0.69})`}
        />
        {lines.length > 0 && (
          <text
            x={8}
            y={h * 0.22}
            fontSize={h * 0.09}
            fontWeight={800}
            fill={ink}
          >
            {lines.map((line, i) => (
              <tspan key={i} x={8} dy={i === 0 ? 0 : h * 0.105}>
                {line}
              </tspan>
            ))}
          </text>
        )}
      </svg>
    </div>
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
    <div className="de-field">
      <span className="de-field-label">{part.tag}</span>
      <div className="de-field-row">
        {part.editing ? part.body : render()}
        <span className="de-field-actions">{part.actions}</span>
      </div>
    </div>
  );
}

export function DesignSettingsCard({
  title,
  tagline,
  theme,
  poster,
}: {
  title?: DesignPart | undefined;
  tagline?: DesignPart | undefined;
  theme?: DesignPart | undefined;
  poster: ReactNode;
}) {
  const editingAny = !!(title?.editing || tagline?.editing || theme?.editing);
  const themeValue = theme
    ? /\*\*Theme:\*\*\s*(\S+)/.exec(theme.text)?.[1]
    : undefined;
  return (
    <TokenCard icon={Sparkles} title="Design settings">
      <div className="de-settings" data-editing={editingAny ? "" : undefined}>
        <div className="de-poster-cell">{poster}</div>
        <div className="de-fields">
          {title && (
            <SettingsField
              part={title}
              render={() => (
                <span className="de-field-value de-field-title">
                  {title.text}
                </span>
              )}
            />
          )}
          {tagline && (
            <SettingsField
              part={tagline}
              render={() => (
                <span className="de-field-value de-field-tagline">
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
        </div>
      </div>
    </TokenCard>
  );
}

export function ColorTokensCard({ part }: { part: DesignPart }) {
  const fallback = (
    <TokenCard icon={Palette} title="Colors" actions={part.actions}>
      {part.body}
    </TokenCard>
  );
  if (part.editing) return fallback;
  const blocks = parseDesignMarkdown(part.text);
  const table = blocks.find(isTable);
  const brandNote = blocks
    .filter(isPara)
    .find((b) => /brand-mandatory/i.test(b.text));
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
    <TokenCard icon={Palette} title="Colors" actions={part.actions}>
      <div className="de-swatches">
        {swatches.map((s, i) => (
          <div key={i} className="de-swatch-card">
            <span className="de-swatch" style={{ background: s.hex }} />
            <span className="de-swatch-name">{s.name}</span>
            <code className="de-swatch-hex">{s.hex}</code>
            {s.roles.map((role, j) => (
              <small key={j} className="de-swatch-role">
                {role}
              </small>
            ))}
          </div>
        ))}
      </div>
      {brandNote && (
        <p className="de-info-strip">
          <Info size={12} aria-hidden="true" />
          {brandNote.text}
        </p>
      )}
    </TokenCard>
  );
}

function FontFamilyToken({
  title,
  blocks,
}: {
  title: string;
  blocks: MdBlock[];
}) {
  const [family, role] = title.split(" — ");
  const list = blocks.find(isList);
  const fields = (list?.items ?? [])
    .map((item) => boldField(item))
    .filter((f): f is { label: string; value: string } => !!f)
    .filter((f) => !(f.label === "Role" && role && f.value === role));
  return (
    <div className="de-family">
      <div className="de-family-head">
        <span className="de-family-name">{family}</span>
        {role && <span className="de-family-role">{role}</span>}
      </div>
      <dl className="de-family-fields">
        {fields.map((f, i) => (
          <div key={i} className="de-family-field">
            <dt>{f.label}</dt>
            <dd>
              {f.label === "Weights" || f.label === "Sizes" ? (
                f.value.split(", ").map((chip, j) => (
                  <span key={j} className="de-chip">
                    {chip}
                  </span>
                ))
              ) : (
                <span>{f.value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TypeScaleTable({ table }: { table: TableBlock }) {
  const col = (name: string) => table.head.indexOf(name);
  const rows = [...table.rows].reverse();
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

export function TypographyTokensCard({ part }: { part: DesignPart }) {
  const fallback = (
    <TokenCard icon={Type} title="Typography" actions={part.actions}>
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
  return (
    <TokenCard icon={Type} title="Typography" actions={part.actions}>
      <div className="de-typography">
        {familyGroups.length > 0 && (
          <div className="de-families">
            {familyGroups.map((g, i) => (
              <FontFamilyToken
                key={i}
                title={g.title ?? ""}
                blocks={g.blocks}
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

function SpacingBars({ table }: { table: TableBlock }) {
  const valueIdx = table.head.indexOf("Value");
  const values = table.rows.map((r) => parseFloat(r[valueIdx] ?? "") || 0);
  const max = Math.max(...values, 1);
  return (
    <div className="de-scale">
      {table.rows.map((r, i) => (
        <div key={i} className="de-scale-row">
          <span className="de-scale-label">{r[valueIdx]}</span>
          <span className="de-scale-track">
            <span
              className="de-scale-bar"
              style={{
                width: `${Math.min(100, Math.max(4, ((values[i] ?? 0) / max) * 100))}%`,
              }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

function RadiusTokens({ table }: { table: TableBlock }) {
  const elIdx = table.head.indexOf("Element");
  const valIdx = table.head.indexOf("Value");
  return (
    <div className="de-radii">
      {table.rows.map((r, i) => {
        const value = parseFloat(r[valIdx] ?? "") || 0;
        return (
          <div key={i} className="de-radius-tile">
            <span
              className="de-radius-corner"
              style={{ borderTopLeftRadius: Math.min(value, 20) }}
              aria-hidden="true"
            />
            <b className="de-radius-value">{r[valIdx]}</b>
            <small className="de-radius-label">{r[elIdx]}</small>
          </div>
        );
      })}
    </div>
  );
}

function LayoutTokensCard({ items }: { items: string[] }) {
  const fields = items
    .map((item) => boldField(item))
    .filter((f): f is { label: string; value: string } => !!f);
  return (
    <TokenCard icon={LayoutGrid} title="Layout">
      <dl className="de-layout-fields">
        {fields.map((f, i) => (
          <div key={i} className="de-layout-field">
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
    </TokenCard>
  );
}

export function SpacingAndLayoutCards({ part }: { part: DesignPart }) {
  const fallback = (
    <TokenCard icon={Box} title="Spacing & Shapes" actions={part.actions}>
      {part.body}
    </TokenCard>
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

  return (
    <>
      <TokenCard icon={Box} title="Spacing & Shapes" actions={part.actions}>
        <div className="de-spacing">
          {scaleTable && (
            <div className="de-spacing-scale">
              <h4 className="de-subhead">Spacing Scale</h4>
              <SpacingBars table={scaleTable} />
            </div>
          )}
          {(baseUnit || density) && (
            <div className="de-spacing-tiles">
              {baseUnit && (
                <div className="de-tile">
                  <Grid3x3 size={14} aria-hidden="true" />
                  <span className="de-tile-label">{baseUnit.label}</span>
                  <span className="de-tile-value">{baseUnit.value}</span>
                </div>
              )}
              {density && (
                <div className="de-tile">
                  <Layers size={14} aria-hidden="true" />
                  <span className="de-tile-label">{density.label}</span>
                  <span className="de-tile-value">{density.value}</span>
                </div>
              )}
            </div>
          )}
          {radiusTable && (
            <div className="de-radius">
              <h4 className="de-subhead">Border Radius</h4>
              <RadiusTokens table={radiusTable} />
            </div>
          )}
        </div>
      </TokenCard>
      {layoutList && <LayoutTokensCard items={layoutList.items} />}
    </>
  );
}

export function ComponentTokensCard({ part }: { part: DesignPart }) {
  const fallback = (
    <TokenCard icon={Component} title="Components" actions={part.actions}>
      {part.body}
    </TokenCard>
  );
  if (part.editing) return fallback;
  const groups = sectionsByH3(parseDesignMarkdown(part.text)).filter(
    (g) => g.title,
  );
  if (!groups.length) return fallback;
  return (
    <TokenCard icon={Component} title="Components" actions={part.actions}>
      <div className="de-components">
        {groups.map((g, i) => {
          const m = /^(.*?)(?:\s*×(\d+))?$/.exec(g.title ?? "");
          const name = (m?.[1] ?? g.title ?? "").trim();
          const count = m?.[2];
          const roleField = boldFields(g.blocks).find(
            (f) => f.label === "Role",
          );
          const description = g.blocks.filter(
            (b) => isPara(b) && boldField(b.text)?.label !== "Role",
          ) as ParaBlock[];
          return (
            <div key={i} className="de-component">
              <div className="de-component-head">
                <span className="de-component-chip">{name}</span>
                {count && <span className="de-component-count">×{count}</span>}
              </div>
              {roleField && (
                <p className="de-component-role">{roleField.value}</p>
              )}
              {description.map((b, j) => (
                <p key={j} className="de-component-desc">
                  <ProseText text={b.text} />
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </TokenCard>
  );
}

const GENERIC_ICONS: Record<string, LucideIcon> = {
  "skill:rules": ListChecks,
  "skill:surfaces": Layers,
  "skill:elevation": Layers3,
  "skill:imagery": ImageIcon,
  "skill:agent": Sparkles,
};
const iconFor = (key: string): LucideIcon => GENERIC_ICONS[key] ?? FileText;

export function DesignEditorSections({
  parts,
  doc,
  kit,
}: {
  parts: DesignPart[];
  doc: SpecDocument;
  kit?: BrandKit | undefined;
}) {
  const titlePart = parts.find((p) => p.key === "skill:title");
  const taglinePart = parts.find((p) => p.key === "skill:tagline");
  const themePart = parts.find((p) => p.key === "skill:theme");

  const roleHex = (role: BrandKit["colors"][number]["role"]) =>
    kit?.colors.find((c) => c.role === role)?.hex;
  const posterBg =
    roleHex("background") ?? doc.background.value ?? "var(--color-editor)";
  const posterPrimary =
    roleHex("primary") ??
    doc.creativeDirection.primaryColor ??
    "var(--editor-action)";
  const posterSecondary =
    roleHex("secondary") ??
    doc.creativeDirection.secondaryColor ??
    "var(--color-editor-muted)";
  const posterAccent = roleHex("accent") ?? "var(--color-editor-hover)";
  const ratio = doc.format.width / doc.format.height;
  const posterTitle = titlePart?.text || taglinePart?.text;

  const poster = (
    <SvgPosterPreview
      ratio={Number.isFinite(ratio) && ratio > 0 ? ratio : 1}
      background={posterBg}
      primary={posterPrimary}
      secondary={posterSecondary}
      accent={posterAccent}
      title={posterTitle}
    />
  );

  const cards: ReactNode[] = [
    <DesignSettingsCard
      key="settings"
      title={titlePart}
      tagline={taglinePart}
      theme={themePart}
      poster={poster}
    />,
  ];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
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
    if (part.key === "skill:components") {
      cards.push(<ComponentTokensCard key={part.key} part={part} />);
      continue;
    }
    if (part.key === "skill:layout") {
      const nested: DesignPart[] = [];
      let j = i + 1;
      while (j < parts.length && parts[j]!.key.startsWith("skill:el:")) {
        nested.push(parts[j]!);
        j++;
      }
      cards.push(
        <TokenCard
          key={part.key}
          icon={LayoutTemplate}
          title="Layout slots"
          actions={part.actions}
        >
          {part.body}
          {nested.map((n) => (
            <div key={n.key} className="de-subrow">
              <span className="de-subrow-tag">{n.tag}</span>
              <span className="de-subrow-actions">{n.actions}</span>
              <div className="de-subrow-body">{n.body}</div>
            </div>
          ))}
        </TokenCard>,
      );
      i = j - 1;
      continue;
    }
    if (part.key.startsWith("skill:el:")) continue;
    cards.push(
      <TokenCard
        key={part.key}
        icon={iconFor(part.key)}
        title={part.tag}
        actions={part.actions}
      >
        {part.body}
      </TokenCard>,
    );
  }

  return <div className="de-sections">{cards}</div>;
}
