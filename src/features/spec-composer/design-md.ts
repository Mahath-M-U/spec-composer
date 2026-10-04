import {
  an,
  ratio,
  region,
  segText,
  withOverrides,
  type PromptLine,
  type PromptSeg,
} from "./compiler.ts";
import {
  ART_FIELD_KEYS,
  artValue,
  isSectionIncluded,
  materialPhrase,
} from "./art-direction.ts";
import {
  isImageKind,
  isTextKind,
  type BrandKit,
  type ElementKind,
  type SpecDocument,
  type SpecElement,
} from "./types.ts";

/** Header lines of the DESIGN.md: rendered before the first section, with no
 * heading of their own. */
export const DESIGN_SKILL_HEADER: Record<string, string> = {
  "skill:title": "Title",
  "skill:tagline": "Tagline",
  "skill:theme": "Theme",
  "skill:overview": "Overview",
};
/** Section headings of the DESIGN.md, keyed by line. Slot lines
 * (`skill:el:*`) have none: they're bullets under "Layout". */
export const DESIGN_SKILL_SECTIONS: Record<string, string> = {
  "skill:colors": "Colors",
  "skill:type": "Typography",
  "skill:spacing": "Spacing & Shapes",
  "skill:components": "Components",
  "skill:rules": "Do's and Don'ts",
  "skill:elevation": "Elevation",
  "skill:imagery": "Imagery",
  "skill:mood": "Mood",
  "skill:scene": "Scene",
  "skill:lighting": "Lighting",
  "skill:layout": "Layout",
};

export const KIND_INFO: Record<ElementKind, [label: string, role: string]> = {
  title: ["Headline", "Primary headline — the first read of the composition"],
  subheading: ["Subheading", "Supporting line that expands on the headline"],
  body: ["Body Copy", "Descriptive supporting copy"],
  eyebrow: ["Eyebrow", "Small kicker above the headline that sets context"],
  offer: ["Offer", "Promotional hook such as a discount or deal"],
  price: ["Price", "Price callout"],
  badge: ["Badge", "Small label or sticker that flags status"],
  cta: ["Call-to-Action Button", "The one action the viewer should take"],
  heroImage: ["Hero Image", "Dominant visual that anchors the composition"],
  productImage: ["Product Image", "Product shot — the object being sold"],
  humanModelImage: ["Model Image", "People or model photography"],
  supportingImage: ["Supporting Image", "Secondary visual that adds context"],
  logo: ["Logo", "Brand logo lockup"],
  brandMark: ["Brand Mark", "Compact brand symbol"],
  shape: ["Shape", "Decorative or container shape"],
  divider: ["Divider", "Separator line between content groups"],
};
const label = (kind: ElementKind) => KIND_INFO[kind][0];

const FONT_SUBSTITUTE = {
  serif: "Source Serif 4, Georgia, or ui-serif as fallback",
  sans: "Inter, Roboto, or the ui-sans-serif/system-ui stack",
  mono: "JetBrains Mono, Menlo, or ui-monospace",
};
const fontCategory = (family: string): keyof typeof FONT_SUBSTITUTE =>
  /sans/i.test(family)
    ? "sans"
    : /serif|playfair|lora|baskerville|cambria|garamond|georgia|merriweather|times/i.test(
          family,
        )
      ? "serif"
      : /mono|courier/i.test(family)
        ? "mono"
        : "sans";

const pct = (v: number, total: number) => `${Math.round((v / total) * 100)}%`;
const r4 = (v: number) => Math.round(v / 4) * 4;
const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const uniq = <T>(xs: T[]) => [...new Set(xs)];
const SPACING_LADDER = [
  "Text gap",
  "Component gap",
  "Content gap",
  "Section gap",
  "Hero spacing",
] as const;
/** Names the Spacing Scale's `count` values by size rank, smallest to
 * largest, so each reads as a role (text gap, hero spacing…) rather than a
 * raw pixel step. Beyond five, the middle ranks repeat as "Section gap 2",
 * "Section gap 3" and so on. */
export function spacingTokenNames(count: number): string[] {
  if (count <= 0) return [];
  if (count === 1) return ["Component gap"];
  if (count <= 5)
    return Array.from(
      { length: count },
      (_, i) => SPACING_LADDER[Math.round((i * 4) / (count - 1))]!,
    );
  return Array.from({ length: count }, (_, i) => {
    if (i < 4) return SPACING_LADDER[i]!;
    if (i === count - 1) return "Hero spacing";
    const n = i - 2;
    return `Section gap ${n}`;
  });
}
const median = (xs: number[]) =>
  [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const lineHeight = (v: number | undefined) => (v ?? 1.2).toFixed(2);
/** Text slots carry a length budget alongside their current copy, so the
 * skill works for any content. */
export const copyBudget = (el: SpecElement) =>
  Math.max(5, Math.ceil((el.content?.length ?? 0) / 5) * 5);

function hexRgb(hex: string): [number, number, number] | undefined {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())?.[1];
  if (!m) return undefined;
  const h = m.length === 3 ? [...m].map((c) => c + c).join("") : m;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}
/** Hex colors print lowercase everywhere; anything else passes through. */
const hx = <T extends string | undefined>(v: T): T =>
  (v && hexRgb(v) ? v.trim().toLowerCase() : v) as T;
const lowerHex = (doc: SpecDocument): SpecDocument => ({
  ...doc,
  background: {
    ...doc.background,
    value: hx(doc.background.value),
    secondaryValue: hx(doc.background.secondaryValue),
  },
  creativeDirection: {
    ...doc.creativeDirection,
    primaryColor: hx(doc.creativeDirection.primaryColor),
    secondaryColor: hx(doc.creativeDirection.secondaryColor),
  },
  elements: doc.elements.map((e) => ({
    ...e,
    style: {
      ...e.style,
      color: hx(e.style.color),
      background: hx(e.style.background),
      borderColor: hx(e.style.borderColor),
    },
  })),
});
const luminance = (hex: string) => {
  const rgb = hexRgb(hex);
  return rgb ? (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 : 1;
};
/** A readable name for a swatch, e.g. "Warm White" or "Pale Peach". */
function colorName(hex: string) {
  const rgb = hexRgb(hex);
  if (!rgb) return "Custom";
  const [r, g, b] = rgb.map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.12 || d < 0.04) {
    const base =
      l > 0.9
        ? "White"
        : l > 0.72
          ? "Silver"
          : l > 0.35
            ? "Gray"
            : l > 0.12
              ? "Charcoal"
              : "Black";
    return d < 0.02 ? base : `${r > b ? "Warm" : "Cool"} ${base}`;
  }
  const h =
    60 *
    (max === r
      ? ((g - b) / d + 6) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4);
  const hues: [number, string][] = [
    [10, "Red"],
    [40, "Orange"],
    [65, "Yellow"],
    [160, "Green"],
    [195, "Teal"],
    [250, "Blue"],
    [290, "Violet"],
    [335, "Pink"],
    [360, "Red"],
  ];
  let hue = hues.find(([end]) => h < end)?.[1] ?? "Red";
  if (hue === "Orange" && l > 0.75) hue = "Peach";
  else if (hue === "Orange" && l < 0.35) hue = "Brown";
  const tone =
    l > 0.85
      ? "Pale"
      : l > 0.68
        ? "Light"
        : l < 0.22
          ? "Deep"
          : l < 0.38
            ? "Dark"
            : s > 0.75
              ? "Vivid"
              : "";
  return tone ? `${tone} ${hue}` : hue;
}

type Swatch = { hex: string; name: string; roles: string[] };

/** Everything the DESIGN.md sections share, measured once from the doc. */
function measure(doc: SpecDocument, kit?: BrandKit) {
  const { width: W, height: H } = doc.format;
  const cd = doc.creativeDirection;
  const visible = doc.elements
    .filter((e) => e.visible)
    .sort((a, b) => a.zIndex - b.zIndex);
  // Full-bleed layers would zero out every margin and gap.
  const inset = visible.filter(
    (e) => e.width < W * 0.95 && e.height < H * 0.95,
  );
  const text = visible.filter((e) => isTextKind(e.kind) && e.style.fontSize);
  const images = visible.filter((e) => isImageKind(e.kind));
  const family = (e: SpecElement) => e.style.fontFamily ?? cd.typography;

  const swatchRoles = new Map<string, string[]>();
  const addColor = (hex: string | undefined, role: string) => {
    if (!hex || !hexRgb(hex)) return;
    const key = hex.trim().toLowerCase();
    const roles = swatchRoles.get(key) ?? [];
    if (!roles.includes(role)) roles.push(role);
    swatchRoles.set(key, roles);
  };
  addColor(doc.background.value, "Canvas background");
  if (doc.background.type === "gradient")
    addColor(doc.background.secondaryValue, "Canvas gradient end");
  if (kit?.colors.length)
    for (const c of kit.colors) {
      addColor(c.hex, `Brand ${c.role}${c.usecase ? ` — ${c.usecase}` : ""}`);
      if (c.type === "gradient")
        addColor(c.secondaryHex, `Brand ${c.role} gradient end`);
    }
  else {
    addColor(cd.primaryColor, "Primary brand color");
    addColor(cd.secondaryColor, "Secondary brand color");
  }
  for (const e of visible) {
    if (isTextKind(e.kind)) addColor(e.style.color, `${label(e.kind)} text`);
    addColor(
      e.style.background,
      `${label(e.kind)} ${isTextKind(e.kind) ? "background" : "fill"}`,
    );
    addColor(e.style.borderColor, `${label(e.kind)} border`);
  }
  const seen = new Map<string, number>();
  const swatches: Swatch[] = [...swatchRoles].map(([hex, roles]) => {
    const base = colorName(hex);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const name = n > 1 ? `${base} ${n}` : base;
    return { hex, name, roles };
  });

  const families = new Map<string, SpecElement[]>();
  for (const e of text)
    families.set(family(e), [...(families.get(family(e)) ?? []), e]);
  const scale: SpecElement[] = [];
  for (const e of text)
    if (!scale.some((x) => x.kind === e.kind)) scale.push(e);
  scale.sort((a, b) => (a.style.fontSize ?? 0) - (b.style.fontSize ?? 0));

  const margins = inset.length
    ? [
        Math.min(...inset.map((e) => e.x)),
        Math.min(...inset.map((e) => e.y)),
        W - Math.max(...inset.map((e) => e.x + e.width)),
        H - Math.max(...inset.map((e) => e.y + e.height)),
      ].map((v) => Math.max(0, v))
    : [];
  // The gap from each slot to the nearest slot stacked below it.
  const gaps: number[] = [];
  for (const a of inset) {
    const below = inset
      .filter((b) => a.x < b.x + b.width && b.x < a.x + a.width)
      .map((b) => b.y - (a.y + a.height))
      .filter((gap) => gap > 0);
    if (below.length) gaps.push(Math.min(...below));
  }
  // Gaps taller than a fifth of the canvas are negative space, not rhythm.
  const rhythm = gaps.filter((gap) => gap <= H * 0.2);
  const spacing = uniq(
    [...margins, ...rhythm].map(r4).filter((v) => v > 0),
  ).sort((a, b) => a - b);
  const coverage = Math.min(
    1,
    inset.reduce((n, e) => n + e.width * e.height, 0) / (W * H),
  );
  const alignments = text.map((e) => e.style.alignment ?? "left");
  const align =
    uniq(alignments).sort(
      (a, b) =>
        alignments.filter((x) => x === b).length -
        alignments.filter((x) => x === a).length,
    )[0] ?? "left";

  const radii: [string, number][] = [];
  for (const e of visible) {
    const r = e.style.borderRadius;
    if (r == null || (isTextKind(e.kind) && !e.style.background)) continue;
    if (!radii.some(([l]) => l === label(e.kind)))
      radii.push([label(e.kind), r]);
  }
  const largest = [...images].sort(
    (a, b) => b.width * b.height - a.width * a.height,
  )[0];
  const accent = hx(
    kit?.colors.find((c) => c.role === "accent")?.hex ?? cd.secondaryColor,
  );

  return {
    W,
    H,
    cd,
    visible,
    text,
    images,
    family,
    swatches,
    families,
    scale,
    margins,
    safeMargin: margins.length ? r4(Math.min(...margins)) : 0,
    gap: r4(median(rhythm.length ? rhythm : gaps)),
    spacing,
    base: spacing.length && spacing.every((v) => v % 8 === 0) ? 8 : 4,
    density:
      coverage < 0.3 ? "spacious" : coverage < 0.55 ? "comfortable" : "compact",
    coverage,
    align,
    radii,
    largest,
    accent,
    theme:
      (luminance(doc.background.value) +
        luminance(doc.background.secondaryValue ?? doc.background.value)) /
        2 >
      0.5
        ? "light"
        : "dark",
  };
}
type Measured = ReturnType<typeof measure>;

/** A self-contained spec for one element, shared by Components and the
 * example prompts. */
function describeComponent(e: SpecElement, doc: SpecDocument, m: Measured) {
  const s = e.style;
  const r = s.borderRadius ?? 0;
  const border = s.borderWidth
    ? `, border ${s.borderWidth}px solid ${s.borderColor ?? "currentColor"}`
    : "";
  const extra = `${e.rotation ? ` Rotated ${e.rotation}°.` : ""}${(s.opacity ?? 1) < 1 ? ` Opacity ${s.opacity}.` : ""}`;
  const where = region(e, doc);
  if (isTextKind(e.kind))
    return `Text ${s.color ?? "inherits"}, ${s.background ? `background ${s.background}, border-radius ${r}px` : "no background"}${border}. ${m.family(e)} ${s.fontSize}px weight ${s.fontWeight ?? 400}${s.fontStyle === "italic" ? " italic" : ""}, line-height ${lineHeight(s.lineHeight)}${s.letterSpacing ? `, letter-spacing ${s.letterSpacing}px` : ""}, ${s.alignment ?? "left"}-aligned. Sits ${where}, spanning ${pct(e.width, m.W)} of the canvas width. Copy budget ~${copyBudget(e)} characters.${extra}`;
  if (isImageKind(e.kind))
    return `${s.objectFit ?? "cover"} fit, ${r ? `border-radius ${r}px` : "square corners"}${border}. Sits ${where}, covering ~${pct(e.width * e.height, m.W * m.H)} of the canvas. Imagery: ${e.aiDescription || "on-brand imagery"}.${extra}`;
  return `${s.shapeType ?? (e.kind === "divider" ? "line" : "rectangle")}${s.background ? ` filled ${s.background}` : ""}${r ? `, border-radius ${r}px` : ""}${border}. Sits ${where}, ${pct(e.width, m.W)} × ${pct(e.height, m.H)} of the canvas.${extra}`;
}

/** One slot of the reusable layout, back-to-front. Text and image slots keep
 * their copy as an editable field. */
function slotSegs(el: SpecElement, doc: SpecDocument): PromptSeg[] {
  const { width: W, height: H } = doc.format;
  const o = doc.promptOptions;
  const where = o.relativePositioning ? `, ${region(el, doc)}` : "";
  const size = o.dimensions
    ? `, at ${pct(el.x, W)} / ${pct(el.y, H)}, ${pct(el.width, W)} × ${pct(el.height, H)} of the canvas (≈${el.width} × ${el.height} px)`
    : "";
  const head = `- ${el.name} (${el.kind})${where}${size}`;
  const mp = materialPhrase(el) ? [materialPhrase(el)] : [];
  if (isTextKind(el.kind))
    return [
      head,
      `: copy up to ~${copyBudget(el)} characters, currently “`,
      { id: el.id, field: "content", value: el.content ?? "", fallback: "" },
      "”.",
      ...mp,
    ];
  if (isImageKind(el.kind))
    return [
      head,
      ": imagery — ",
      {
        id: el.id,
        field: "aiDescription",
        value: el.aiDescription || "",
        fallback: "on-brand imagery",
      },
      `, ${el.style.objectFit || "cover"} fit.`,
      ...mp,
    ];
  return [`${head}.`, ...mp];
}

const table = (head: string[], rows: string[][]) =>
  [
    `| ${head.join(" | ")} |`,
    `|${head.map(() => "------").join("|")}|`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");

export function compileDesignSkillSegments(
  source: SpecDocument,
  kit?: BrandKit,
): PromptLine[] {
  const doc = lowerHex(source);
  const o = doc.promptOptions;
  const f = doc.format;
  const m = measure(doc, kit);
  const { cd, visible } = m;
  const mood = cd.mood.join(", ");
  const moodOn = isSectionIncluded(doc, "mood");
  const lead = [...m.text].sort(
    (a, b) => (b.style.fontSize ?? 0) - (a.style.fontSize ?? 0),
  )[0];
  const bgName = colorName(doc.background.value).toLowerCase();
  const brandMandatory = !!(o.brandDirectives && cd.brandKitId);
  const kinds = uniq(visible.map((e) => e.kind));

  const lines: [string, PromptSeg[]][] = [
    [
      "skill:title",
      [`${kit?.name ?? `${cd.style} ${f.label}`} — Style Reference`],
    ],
    [
      "skill:tagline",
      [
        `${moodOn && mood ? `${mood} ` : ""}${cd.style.toLowerCase()} on ${bgName}`,
      ],
    ],
    ["skill:theme", [`**Theme:** ${m.theme}`]],
    [
      "skill:overview",
      [
        `Measurements come from a ${f.width} × ${f.height} ${f.label} composition (${ratio(f.width, f.height)}) and are exact; roles and recommendations are interpreted. Copy and imagery shown are this composition's current content — swap them freely and keep the palette, type, spacing, components and layout below.\n\n${an(cd.style).replace(/^a/, "A")} ${cd.style.toLowerCase()} ${f.label}${moodOn ? ` with a ${mood} mood` : ""}${lead ? `, led by ${m.family(lead)} ${label(lead.kind).toLowerCase()} type at ${lead.style.fontSize}px weight ${lead.style.fontWeight ?? 400}` : ""} on a ${bgName} canvas${m.accent ? `, with ${colorName(m.accent).toLowerCase()} (${m.accent}) as the accent` : ""}. ${m.largest ? `The ${label(m.largest.kind).toLowerCase()} anchors the ${region(m.largest, doc)}, covering ~${pct(m.largest.width * m.largest.height, m.W * m.H)} of the canvas` : "The design is type-led, with no photography"}; the layout is ${m.density}, ${m.align}-aligned, with a ${m.safeMargin}px safe margin.${cd.notes.trim() ? ` ${cd.notes.trim()}` : ""}`,
      ],
    ],
  ];

  if (o.colors)
    lines.push([
      "skill:colors",
      [
        `${table(
          ["Name", "Value", "Role"],
          m.swatches.map((s) => [s.name, `\`${s.hex}\``, s.roles.join("; ")]),
        )}${brandMandatory ? "\n\nThese are brand-mandatory values; do not substitute." : ""}`,
      ],
    ]);

  if (o.typography && m.text.length) {
    const blocks = [...m.families].map(([fam, els]) => {
      const cat = fontCategory(fam);
      const sizes = uniq(els.map((e) => e.style.fontSize ?? 0)).sort(
        (a, b) => a - b,
      );
      const lhs = uniq(els.map((e) => lineHeight(e.style.lineHeight))).sort();
      const tracking = els
        .filter((e) => e.style.letterSpacing)
        .map((e) => `${e.style.letterSpacing}px at ${e.style.fontSize}px`);
      const role = `${cat === "serif" ? "Serif" : cat === "mono" ? "Monospace" : "Sans"} used for ${uniq(els.map((e) => label(e.kind).toLowerCase())).join(", ")}`;
      return [
        `### ${fam} — ${role}`,
        `- **Substitute:** ${FONT_SUBSTITUTE[cat]}`,
        `- **Weights:** ${uniq(els.map((e) => e.style.fontWeight ?? 400))
          .sort((a, b) => a - b)
          .join(", ")}`,
        `- **Sizes:** ${sizes.map((v) => `${v}px`).join(", ")}`,
        `- **Line height:** ${lhs.length > 1 ? `${lhs[0]}–${lhs[lhs.length - 1]}` : lhs[0]}`,
        `- **Letter spacing:** ${tracking.length ? uniq(tracking).join(", ") : "0"}`,
        `- **Role:** ${role}`,
      ].join("\n");
    });
    lines.push([
      "skill:type",
      [
        `${blocks.join("\n\n")}\n\n### Type Scale\n\n${table(
          ["Role", "Family", "Weight", "Size", "Line Height", "Letter Spacing"],
          m.scale.map((e) => [
            kebab(e.kind),
            m.family(e),
            `${e.style.fontWeight ?? 400}`,
            `${e.style.fontSize}px`,
            lineHeight(e.style.lineHeight),
            e.style.letterSpacing ? `${e.style.letterSpacing}px` : "—",
          ]),
        )}`,
      ],
    ]);
  }

  const spacingNames = spacingTokenNames(m.spacing.length);
  lines.push([
    "skill:spacing",
    [
      [
        `**Base unit:** ${m.base}px`,
        `**Density:** ${m.density}`,
        m.spacing.length
          ? `### Spacing Scale\n\n${table(
              ["Token", "Value"],
              m.spacing.map((v, i) => [spacingNames[i] ?? "", `${v}px`]),
            )}`
          : "",
        m.radii.length
          ? `### Border Radius\n\n${table(
              ["Element", "Value"],
              m.radii.map(([l, r]) => [l, `${r}px`]),
            )}`
          : "",
        `### Layout\n\n- **Canvas:** ${m.W} × ${m.H}px (${ratio(m.W, m.H)})\n- **Safe margin:** ${m.safeMargin}px\n- **Element gap:** ${m.gap}px\n- **Text alignment:** ${m.align}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    ],
  ]);

  if (kinds.length)
    lines.push([
      "skill:components",
      [
        kinds
          .map((k) => {
            const els = visible.filter((e) => e.kind === k);
            const first = els[0]!;
            return `### ${label(k)}${els.length > 1 ? ` ×${els.length}` : ""}\n**Role:** ${KIND_INFO[k][1]}\n\n${describeComponent(first, doc, m)}`;
          })
          .join("\n\n"),
      ],
    ]);

  const does = [
    ...(o.typography
      ? [...m.families].map(
          ([fam, els]) =>
            `Use ${fam} at ${uniq(els.map((e) => `${e.style.fontSize}px`)).join("/")} for ${uniq(els.map((e) => label(e.kind).toLowerCase())).join(", ")}; don't substitute another family at these sizes`,
        )
      : []),
    ...(o.colors
      ? [
          `Take every text and surface color from the Colors palette${brandMandatory ? "; the brand values are mandatory" : ""}`,
        ]
      : []),
    ...(m.radii.some(([, r]) => r > 0)
      ? [
          `Keep ${m.radii
            .filter(([, r]) => r > 0)
            .map(([l, r]) => `${r}px on ${l}`)
            .join(", ")} — these are the structural radii`,
        ]
      : []),
    `Keep the ${m.safeMargin}px safe margin and ~${m.gap}px rhythm between stacked slots on a ${m.base}px base unit`,
    `Keep text ${m.align}-aligned${moodOn ? ` and the mood ${mood}` : ""}`,
    ...(o.elementConstraints
      ? visible
          .filter((e) => e.constraint?.positiveConstraint)
          .map((e) => `${e.name}: ${e.constraint?.positiveConstraint}`)
      : []),
    "Swap copy and imagery freely; keep slot sizes, positions and styles",
  ];
  const brandLocked = visible.filter((e) => e.constraint?.brandLocked);
  const donts = [
    ...(o.negativeConstraints
      ? visible
          .filter((e) => e.constraint?.negativeConstraint)
          .map((e) => `${e.name}: ${e.constraint?.negativeConstraint}`)
      : []),
    ...visible
      .filter((e) => e.constraint?.lock === "exact")
      .map((e) => `Don't reinterpret ${e.name} — reproduce it exactly`),
    ...(brandLocked.length
      ? [
          `Don't restyle ${brandLocked.map((e) => e.name).join(", ")} — they're brand-locked`,
        ]
      : []),
    ...(o.colors ? ["Don't introduce colors outside the palette"] : []),
    ...(o.negativeConstraints
      ? [
          "Don't add text or elements beyond the slots in Layout",
          "Don't use clutter, generic stock-poster styling or illegible type",
          "Don't let slots overlap by accident or leave the safe area",
        ]
      : []),
  ];
  lines.push([
    "skill:rules",
    [
      `### Do\n${does.map((d) => `- ${d}`).join("\n")}${donts.length ? `\n\n### Don't\n${donts.map((d) => `- ${d}`).join("\n")}` : ""}`,
    ],
  ]);

  lines.push([
    "skill:elevation",
    [
      "- **All slots:** flat, no shadow — depth comes from layering order, scale and color contrast",
    ],
  ]);
  lines.push([
    "skill:imagery",
    [
      m.largest
        ? `${m.images.length} image slot${m.images.length > 1 ? "s" : ""}: ${m.images.map((e) => label(e.kind).toLowerCase()).join(", ")}. The ${label(m.largest.kind).toLowerCase()} is the dominant visual — ${region(m.largest, doc)}, ${m.largest.style.objectFit ?? "cover"} fit, ~${pct(m.largest.width * m.largest.height, m.W * m.H)} of the canvas.\n\n${m.images.map((e) => `- ${e.name}: ${e.aiDescription || "on-brand imagery"}`).join("\n")}`
        : "Type-only composition: no photography or illustration. Color blocks and typography carry the design.",
    ],
  ]);
  lines.push(["skill:mood", mood ? [`${mood}.`] : []]);
  for (const key of ART_FIELD_KEYS) {
    const value = artValue(doc[key]);
    lines.push([`skill:${key}`, value ? [`${value}.`] : []]);
  }
  lines.push([
    "skill:layout",
    [
      `${m.W} × ${m.H} ${f.label} canvas (${ratio(m.W, m.H)}) with ${m.density} density — slots cover ~${Math.round(m.coverage * 100)}% of the canvas. Text is ${m.align}-aligned inside a ${m.safeMargin}px safe margin${m.largest ? `, and the ${label(m.largest.kind).toLowerCase()} anchors the ${region(m.largest, doc)}` : ""}.${visible.length ? " Slots, back-to-front — positions and sizes are relative to the canvas:" : ""}`,
    ],
  ]);
  for (const e of visible) lines.push([`skill:el:${e.id}`, slotSegs(e, doc)]);

  return withOverrides(lines, doc);
}

/** The design skill as a DESIGN.md document. Headings are added here, so the
 * per-part edits in the panel only ever touch section bodies. */
export function compileDesignSkill(doc: SpecDocument, kit?: BrandKit) {
  const lines = compileDesignSkillSegments(doc, kit)
    .filter((l) => !l.off)
    .map((l) => ({ key: l.key, text: segText(l.segs).trim() }))
    .filter((l) => l.text.length > 0);
  return (
    lines
      .map((l, i) => {
        const heading = DESIGN_SKILL_SECTIONS[l.key];
        const text =
          l.key === "skill:title"
            ? `# ${l.text}`
            : l.key === "skill:tagline"
              ? l.text
                  .split("\n")
                  .map((t) => `> ${t}`)
                  .join("\n")
              : heading
                ? `## ${heading}\n\n${l.text}`
                : l.text;
        if (!i) return text;
        // Slot bullets continue the list opened under "Layout".
        const listItem =
          l.key.startsWith("skill:el:") &&
          lines[i - 1]?.key.startsWith("skill:el:");
        return `${listItem ? "\n" : "\n\n"}${text}`;
      })
      .join("") + "\n"
  );
}
