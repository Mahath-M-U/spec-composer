/** A pure view-model mapper for the Design Editor's "Composition" card: it
 * joins the compiled DESIGN.md text for Components, Layout and Imagery with
 * the live `doc.elements` so the card can render one item row per element
 * kind (thumbnail, tokens, placement) instead of three separate cards. This
 * is presentation only — DESIGN.md generation, parsing, the store and every
 * edit/delete action are untouched; `buildComposition` only reads. Font
 * values (family/size/weight/line height/letter spacing) are resolved
 * against the Typography section's Type Scale table rather than repeated
 * here — only per-element overrides that diverge from that table are
 * shown. */

import type { DesignPart } from "./design-editor-cards";
import {
  boldField,
  parseDesignMarkdown,
  sectionsByH3,
  type MdBlock,
} from "./design-md-parse";
import { KIND_INFO, copyBudget } from "./design-md";
import { region, ratio } from "./compiler";
import {
  isImageKind,
  isTextKind,
  type ElementKind,
  type SpecDocument,
  type SpecElement,
} from "./types";

export type PreviewType =
  "shape" | "eyebrow" | "image" | "headline" | "body" | "cta" | "generic";

export type CompToken = {
  label: string;
  value?: string | undefined;
  swatch?: string | undefined;
  emphasis?: boolean | undefined;
  variant?: "typeStyle" | "override" | undefined;
};

export type CompSlot = {
  part: DesignPart;
  name: string;
  zone: string;
  pos: string;
  width: string;
  height?: string | undefined;
  covers?: string | undefined;
  copyBudget?: number | undefined;
  imagery?: string | undefined;
};

export type CompItem = {
  key: string;
  kind?: ElementKind | undefined;
  name: string;
  count: number;
  role?: string | undefined;
  preview: PreviewType;
  fill?: string | undefined;
  tokens: CompToken[];
  prose: string[];
  imagery?: string | undefined;
  primary: boolean;
  slots: CompSlot[];
};

export type CompositionModel = {
  meta: {
    canvas: string;
    ratio: string;
    density?: string | undefined;
    safeMargin?: string | undefined;
    coverage?: string | undefined;
  };
  sections: DesignPart[];
  editing: DesignPart[];
  notes: DesignPart[];
  items: CompItem[];
  orphans: DesignPart[];
};

type ParaBlock = Extract<MdBlock, { type: "para" }>;
const isPara = (b: MdBlock): b is ParaBlock => b.type === "para";
type TableBlock = Extract<MdBlock, { type: "table" }>;
const isTable = (b: MdBlock): b is TableBlock => b.type === "table";
const uniq = <T>(xs: T[]) => [...new Set(xs)];
const lh = (v: number | undefined) => (v ?? 1.2).toFixed(2);

/** One row of the Typography section's "Type Scale" table, keyed by a
 * normalized `ElementKind`-shaped role so text tokens can look up the
 * family/size/weight/line-height/letter-spacing that role already owns. */
type TypeStyle = {
  role: string;
  family: string;
  size: string;
  weight: string;
  lineHeight: string;
  letterSpacing: string;
};

const normalizeRole = (role: string) =>
  role
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Parses the Typography (`skill:type`) part's "Type Scale" table the same
 * way `TypographyTokensCard` does, into a lookup from normalized role to its
 * type style row. Returns an empty map if there's no part, no "Type Scale"
 * group, no table, or no `Role` column. */
function parseTypeScale(part?: DesignPart): Map<string, TypeStyle> {
  const map = new Map<string, TypeStyle>();
  if (!part) return map;
  const groups = sectionsByH3(parseDesignMarkdown(part.text));
  const scaleGroup = groups.find((g) => g.title === "Type Scale");
  const table = scaleGroup?.blocks.find(isTable);
  if (!table) return map;
  const col = (name: string) => table.head.indexOf(name);
  const roleCol = col("Role");
  if (roleCol < 0) return map;
  const familyCol = col("Family");
  const weightCol = col("Weight");
  const sizeCol = col("Size");
  const lineHeightCol = col("Line Height");
  const letterSpacingCol = col("Letter Spacing");
  for (const row of table.rows) {
    const rawRole = (row[roleCol] ?? "").trim();
    if (!rawRole) continue;
    const key = normalizeRole(rawRole);
    if (map.has(key)) continue;
    map.set(key, {
      role: rawRole,
      family: (row[familyCol] ?? "").trim(),
      size: (row[sizeCol] ?? "").trim(),
      weight: (row[weightCol] ?? "").trim(),
      lineHeight: (row[lineHeightCol] ?? "").trim(),
      letterSpacing: (row[letterSpacingCol] ?? "").trim(),
    });
  }
  return map;
}

/** Compares an element's computed style against its matched Type Scale row
 * and emits one override chip per field that actually differs — the Type
 * Scale table (owned by the Typography card) stays the single source of
 * truth for the shared values. */
function typeOverrides(
  el: SpecElement,
  doc: SpecDocument,
  t: TypeStyle,
): CompToken[] {
  const s = el.style;
  const tokens: CompToken[] = [];

  const family = s.fontFamily ?? doc.creativeDirection.typography;
  if (family.trim().toLowerCase() !== t.family.trim().toLowerCase())
    tokens.push({
      label: "Family",
      value: `Family ${family} override`,
      variant: "override",
    });

  if (s.fontSize != null) {
    const tSize = parseFloat(t.size);
    if (!Number.isNaN(tSize) && tSize !== s.fontSize)
      tokens.push({
        label: "Size",
        value: `Size ${s.fontSize}px override`,
        variant: "override",
      });
  }

  const weight = s.fontWeight ?? 400;
  const tWeight = parseFloat(t.weight);
  if (!Number.isNaN(tWeight) && tWeight !== weight)
    tokens.push({
      label: "Weight",
      value: `Weight ${weight} override`,
      variant: "override",
    });

  const lineHeight = parseFloat(lh(s.lineHeight));
  const tLineHeight = parseFloat(t.lineHeight);
  if (!Number.isNaN(tLineHeight) && Math.abs(tLineHeight - lineHeight) > 0.005)
    tokens.push({
      label: "Line height",
      value: `Line height ${lh(s.lineHeight)} override`,
      variant: "override",
    });

  const letterSpacing = s.letterSpacing ?? 0;
  const parsedTLetterSpacing = parseFloat(t.letterSpacing);
  const tLetterSpacing =
    t.letterSpacing === "" ||
    t.letterSpacing === "—" ||
    Number.isNaN(parsedTLetterSpacing)
      ? 0
      : parsedTLetterSpacing;
  if (tLetterSpacing !== letterSpacing)
    tokens.push({
      label: "Letter spacing",
      value: `Letter spacing ${letterSpacing}px override`,
      variant: "override",
    });

  return tokens;
}

/** "top-far left" -> "Top · far left"; "center-center" -> "Center". */
function humanizeZone(zone: string): string {
  const i = zone.indexOf("-");
  const v = zone.slice(0, i);
  const h = zone.slice(i + 1);
  if (v === "center" && h === "center") return "Center";
  return `${v.charAt(0).toUpperCase()}${v.slice(1)} · ${h}`;
}

// Luminance band that keeps the glyph legible on both the dark (#1e1e1e) and
// light (#f5f1eb) thumbnail surfaces.
const THUMB_MIN_LUM = 0.08;
const THUMB_MAX_LUM = 0.5;

const HEX_RE = /#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i;

/** WCAG relative luminance of a #rrggbb colour (sRGB linearised). */
function relativeLuminance(hex: string): number {
  const c = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** Picks a solid #rrggbb from an element's background (first gradient stop)
 * or, failing that, its text color — but only if it lands in a luminance
 * band that stays visible against both editor surfaces. Gradients without a
 * matching stop, `transparent`, `rgba()` and named colours are skipped. */
function thumbFill(el: SpecElement | undefined): string | undefined {
  const candidates = [el?.style.background, el?.style.color];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = HEX_RE.exec(candidate);
    if (!match) continue;
    let hex = match[0].slice(1).toLowerCase();
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    if (hex.length === 8) {
      const alpha = parseInt(hex.slice(6, 8), 16);
      if (alpha < 0x80) continue;
      hex = hex.slice(0, 6);
    }
    const lum = relativeLuminance(hex);
    if (lum >= THUMB_MIN_LUM && lum <= THUMB_MAX_LUM) return `#${hex}`;
  }
  return undefined;
}

function previewFor(kind?: ElementKind): PreviewType {
  if (!kind) return "generic";
  if (kind === "shape" || kind === "divider") return "shape";
  if (kind === "eyebrow" || kind === "badge") return "eyebrow";
  if (isImageKind(kind)) return "image";
  if (
    kind === "title" ||
    kind === "subheading" ||
    kind === "offer" ||
    kind === "price"
  )
    return "headline";
  if (kind === "body") return "body";
  if (kind === "cta") return "cta";
  return "generic";
}

/** Style tokens for one element kind, read straight off its first slot
 * element — the same facts `describeComponent` in design-md.ts turns into
 * prose, but as chips. For text kinds, font values are looked up from the
 * Typography section's Type Scale (`typeScale`) instead of restated: a
 * matched role collapses to a single "Type style" chip plus any per-element
 * overrides; an unmatched role falls back to the original per-field chips. */
function buildTokens(
  kind: ElementKind,
  el: SpecElement,
  doc: SpecDocument,
  typeScale: Map<string, TypeStyle>,
): CompToken[] {
  const s = el.style;
  const tokens: CompToken[] = [];
  if (isTextKind(kind)) {
    const t = typeScale.get(kind.toLowerCase());
    if (t) {
      tokens.push({
        label: "Type style",
        value: `Type style: ${t.role}`,
        variant: "typeStyle",
      });
      tokens.push(...typeOverrides(el, doc, t));
    } else {
      const family = s.fontFamily ?? doc.creativeDirection.typography;
      tokens.push({ label: "Family", value: family });
      if (s.fontSize) tokens.push({ label: "Size", value: `${s.fontSize}px` });
      tokens.push({ label: "Weight", value: `${s.fontWeight ?? 400}` });
      tokens.push({ label: "Line height", value: lh(s.lineHeight) });
      if (s.letterSpacing)
        tokens.push({
          label: "Letter spacing",
          value: `${s.letterSpacing}px`,
        });
    }
    if (s.fontStyle === "italic")
      tokens.push({ label: "Style", value: "Italic" });
    tokens.push({ label: "Align", value: s.alignment ?? "left" });
    if (s.color)
      tokens.push({
        label: "Color",
        value: s.color.toLowerCase(),
        swatch: s.color,
      });
    if (s.background) {
      tokens.push({
        label: "Background",
        value: s.background.toLowerCase(),
        swatch: s.background,
      });
      tokens.push({ label: "Radius", value: `${s.borderRadius ?? 0}px` });
    }
    if (kind === "cta")
      tokens.push({
        label: "Fill",
        value: s.background ? "Filled" : s.borderWidth ? "Outline" : "Plain",
      });
  } else if (isImageKind(kind)) {
    tokens.push({ label: "Fit", value: `${s.objectFit ?? "cover"} fit` });
    const r = s.borderRadius ?? 0;
    tokens.push({ label: "Radius", value: r > 0 ? `${r}px` : "Square" });
  } else {
    tokens.push({
      label: "Shape",
      value: s.shapeType ?? (kind === "divider" ? "line" : "rectangle"),
    });
    if (s.background)
      tokens.push({
        label: "Fill",
        value: s.background.toLowerCase(),
        swatch: s.background,
      });
    const r = s.borderRadius ?? 0;
    if (r > 0) tokens.push({ label: "Radius", value: `${r}px` });
  }
  if (s.borderWidth)
    tokens.push({
      label: "Border",
      value: `${s.borderWidth}px`,
      swatch: s.borderColor,
    });
  return tokens;
}

/** Joins the Components/Imagery sections' own compiled text with the live
 * element data behind each `skill:el:*` slot into one item per element kind.
 * Markdown text stays the source of truth for anything interpreted (role,
 * density, safe margin, coverage) or hand-edited (`doc.promptParts`);
 * everything measurable (placement, tokens, thumbnails) comes from the
 * elements themselves. No part's `actions`/`body` is ever dropped: every
 * components/imagery/el part ends up in `sections`, an item's `slots`, or
 * `orphans`. The `skill:layout` part itself is rendered by a separate Layout
 * card, not by this one — only its parsed stats (canvas/ratio/density/safe
 * margin/coverage) stay in `CompositionModel.meta`. */
export function buildComposition(i: {
  components?: DesignPart | undefined;
  layout?: DesignPart | undefined;
  imagery?: DesignPart | undefined;
  type?: DesignPart | undefined;
  slots: DesignPart[];
  doc: SpecDocument;
}): CompositionModel {
  const { doc } = i;
  const { width: W, height: H } = doc.format;
  const round = (v: number) => Math.round(v);
  const typeScale = parseTypeScale(i.type);

  const layoutText = i.layout?.text ?? "";
  const density = /with (\w+) density/.exec(layoutText)?.[1];
  const safeMarginMatch = /inside an? (\d+)px safe margin/.exec(layoutText);
  const coverageMatch = /slots cover ~(\d+)%/.exec(layoutText);
  const meta: CompositionModel["meta"] = {
    canvas: `${W} × ${H}`,
    ratio: ratio(W, H),
    ...(density ? { density } : {}),
    ...(safeMarginMatch ? { safeMargin: `${safeMarginMatch[1]}px` } : {}),
    ...(coverageMatch ? { coverage: `${coverageMatch[1]}%` } : {}),
  };

  const orphans: DesignPart[] = [];
  const slotsByKind = new Map<ElementKind, CompSlot[]>();
  const elByKind = new Map<ElementKind, SpecElement>();
  const kindOrder: ElementKind[] = [];
  for (const part of i.slots) {
    const id = part.key.slice("skill:el:".length);
    const el = doc.elements.find((e) => e.id === id);
    if (!el) {
      orphans.push(part);
      continue;
    }
    const zone = humanizeZone(region(el, doc));
    const slot: CompSlot = {
      part,
      name: el.name,
      zone,
      pos: `${round((el.x / W) * 100)}% × ${round((el.y / H) * 100)}%`,
      width: `${round((el.width / W) * 100)}%`,
    };
    if (el.kind === "shape" || el.kind === "divider")
      slot.height = `${round((el.height / H) * 100)}%`;
    if (isImageKind(el.kind)) {
      slot.covers = `~${round(((el.width * el.height) / (W * H)) * 100)}%`;
      slot.imagery = el.aiDescription || "on-brand imagery";
    }
    if (isTextKind(el.kind)) slot.copyBudget = copyBudget(el);
    if (!slotsByKind.has(el.kind)) {
      slotsByKind.set(el.kind, []);
      kindOrder.push(el.kind);
      elByKind.set(el.kind, el);
    }
    slotsByKind.get(el.kind)!.push(slot);
  }

  const componentsCustom = doc.promptParts?.["skill:components"] != null;
  const groups = i.components
    ? sectionsByH3(parseDesignMarkdown(i.components.text)).filter(
        (g) => g.title,
      )
    : [];
  const kindByLabel = new Map<string, ElementKind>(
    (Object.entries(KIND_INFO) as [ElementKind, [string, string]][]).map(
      ([k, [l]]) => [l.toLowerCase(), k],
    ),
  );

  const images = doc.elements.filter((e) => e.visible && isImageKind(e.kind));
  const largestImage = [...images].sort(
    (a, b) => b.width * b.height - a.width * a.height,
  )[0];

  const items: CompItem[] = [];
  const usedKinds = new Set<ElementKind>();

  for (const [gi, g] of groups.entries()) {
    const m = /^(.*?)(?:\s*×(\d+))?$/.exec(g.title ?? "");
    const name = (m?.[1] ?? g.title ?? "").trim();
    const count = m?.[2] ? Number(m[2]) : undefined;
    const kind = kindByLabel.get(name.toLowerCase());
    const roleField = g.blocks
      .filter(isPara)
      .map((b) => boldField(b.text))
      .find(
        (f): f is { label: string; value: string } => !!f && f.label === "Role",
      );
    const prose = g.blocks
      .filter(isPara)
      .filter((b) => boldField(b.text)?.label !== "Role")
      .map((b) => b.text);

    const slots = kind ? (slotsByKind.get(kind) ?? []) : [];
    const el = kind ? elByKind.get(kind) : undefined;
    const useTokens = !componentsCustom && slots.length > 0 && !!el;
    const tokens: CompToken[] = useTokens
      ? buildTokens(kind!, el!, doc, typeScale)
      : [];
    const primary = !!(kind && largestImage && kind === largestImage.kind);
    if (primary && useTokens)
      tokens.unshift({ label: "Primary focus", emphasis: true });
    const distinctImagery = uniq(
      slots.map((s) => s.imagery).filter((v): v is string => !!v),
    );
    if (kind) usedKinds.add(kind);

    items.push({
      key: `group:${gi}:${kind ?? name}`,
      kind,
      name,
      count: slots.length || count || 1,
      role: roleField?.value,
      preview: previewFor(kind),
      fill: thumbFill(el),
      tokens,
      prose: useTokens ? [] : prose,
      imagery: distinctImagery.length === 1 ? distinctImagery[0] : undefined,
      primary,
      slots,
    });
  }

  for (const kind of kindOrder) {
    if (usedKinds.has(kind)) continue;
    const slots = slotsByKind.get(kind)!;
    const el = elByKind.get(kind)!;
    const tokens = buildTokens(kind, el, doc, typeScale);
    const primary = !!(largestImage && kind === largestImage.kind);
    if (primary) tokens.unshift({ label: "Primary focus", emphasis: true });
    const distinctImagery = uniq(
      slots.map((s) => s.imagery).filter((v): v is string => !!v),
    );
    items.push({
      key: kind,
      kind,
      name: KIND_INFO[kind][0],
      count: slots.length,
      role: KIND_INFO[kind][1],
      preview: previewFor(kind),
      fill: thumbFill(el),
      tokens,
      prose: [],
      imagery: distinctImagery.length === 1 ? distinctImagery[0] : undefined,
      primary,
      slots,
    });
  }

  const imageryCustom = doc.promptParts?.["skill:imagery"] != null;
  const noImageItems = !items.some((it) => it.kind && isImageKind(it.kind));
  const notes: DesignPart[] = [];
  if (i.imagery && (imageryCustom || noImageItems)) notes.push(i.imagery);
  if (i.components && componentsCustom && groups.length === 0)
    notes.push(i.components);

  const sections = [i.components, i.imagery].filter(
    (p): p is DesignPart => !!p,
  );
  const editing = sections.filter((p) => p.editing);

  return { meta, sections, editing, notes, items, orphans };
}
