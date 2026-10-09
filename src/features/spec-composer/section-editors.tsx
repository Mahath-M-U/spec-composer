import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Link2, Type, X } from "lucide-react";
import { sectionTarget, type Target } from "./section-target";
import { FEATURED_FONTS, MORE_FONTS } from "./fonts";
import { useEditorStore } from "./store";
import {
  ART_FIELDS,
  BRAND_TONES,
  MATERIAL_PRESETS,
  hasPreset,
  setArtField,
  togglePreset,
  type ArtFieldKey,
} from "./art-direction";
import {
  isImageKind,
  isTextKind,
  type BrandKit,
  type BrandKitColor,
  type ElementKind,
  type SpecDocument,
  type SpecElement,
} from "./types";

/** Visual editors for the prompt panel's sections: color pickers, font menus,
 * number fields and tags that write straight to the document, so the canvas
 * updates with them. While a design kit is active it re-applies its colors,
 * fonts and mood on every load, so those fields edit the kit instead (and are
 * marked as linked). Any hand-written text for the section is dropped on
 * edit, so the section regenerates from the new values. */

const KIND_LABEL: Record<ElementKind, string> = {
  title: "Headline",
  subheading: "Subheading",
  body: "Body copy",
  eyebrow: "Eyebrow",
  offer: "Offer",
  price: "Price",
  badge: "Badge",
  cta: "Call-to-action",
  heroImage: "Hero image",
  productImage: "Product image",
  humanModelImage: "Model image",
  supportingImage: "Supporting image",
  logo: "Logo",
  brandMark: "Brand mark",
  shape: "Shape",
  divider: "Divider",
};
const FONTS: string[] = [...FEATURED_FONTS, ...MORE_FONTS];
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
/** `<input type="color">` only takes #rrggbb. */
const toColorInput = (v: string | undefined, fallback = "#000000") => {
  const hex = v?.trim() ?? "";
  if (!HEX.test(hex)) return fallback;
  return hex.length === 4
    ? `#${[...hex.slice(1)].map((c) => c + c).join("")}`.toLowerCase()
    : hex.toLowerCase();
};

/** Coalesces rapid changes (a color picker drag, typing) into one commit a
 * moment later; anything pending is committed when the editor closes. */
function useDebouncedCommit<T>(commit: (value: T) => void, delay = 150) {
  const state = useRef<{
    commit: (value: T) => void;
    pending: { value: T } | null;
    timer: ReturnType<typeof setTimeout> | undefined;
  }>({ commit, pending: null, timer: undefined });
  state.current.commit = commit;
  useEffect(() => {
    const s = state.current;
    return () => {
      clearTimeout(s.timer);
      if (s.pending) s.commit(s.pending.value);
    };
  }, []);
  return (value: T) => {
    const s = state.current;
    s.pending = { value };
    clearTimeout(s.timer);
    s.timer = setTimeout(() => {
      const pending = s.pending;
      s.pending = null;
      if (pending) s.commit(pending.value);
    }, delay);
  };
}

function Linked() {
  return <Link2 className="se-linked" aria-label="Design kit" />;
}

function ColorControl({
  label,
  value,
  onChange,
  linked,
}: {
  label: string;
  value: string | undefined;
  onChange: (hex: string) => void;
  linked?: boolean;
}) {
  const [local, setLocal] = useState(() => toColorInput(value));
  useEffect(() => setLocal(toColorInput(value)), [value]);
  const commit = useDebouncedCommit(onChange);
  return (
    <label className="se-color">
      <span className="se-color-chip" style={{ background: local }}>
        <input
          type="color"
          value={local}
          onChange={(e) => {
            setLocal(e.target.value);
            commit(e.target.value);
          }}
        />
      </span>
      <span className="se-color-meta">
        <small>
          {label}
          {linked && <Linked />}
        </small>
        <code>{local}</code>
      </span>
    </label>
  );
}

function FontControl({
  label,
  value,
  onChange,
  linked,
}: {
  label: string;
  value: string;
  onChange: (family: string) => void;
  linked?: boolean;
}) {
  return (
    <label className="se-field">
      <span>
        {label}
        {linked && <Linked />}
      </span>
      <select
        className="se-input"
        value={value}
        style={{
          fontFamily: `"${value}", ui-sans-serif, system-ui, sans-serif`,
        }}
        onChange={(e) => onChange(e.target.value)}
      >
        {!FONTS.includes(value) && <option value={value}>{value}</option>}
        <optgroup label="Featured">
          {FEATURED_FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </optgroup>
        <optgroup label="More fonts">
          {MORE_FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}

function NumberControl({
  label,
  value,
  onChange,
  min = 0,
  max = 2000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="se-field">
      <span>{label}</span>
      <input
        className="se-input"
        type="number"
        min={min}
        max={max}
        step={step}
        value={Math.round(value * 100) / 100}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (Number.isFinite(next))
            onChange(Math.min(max, Math.max(min, next)));
        }}
      />
    </label>
  );
}

function SelectControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="se-field">
      <span>{label}</span>
      <select
        className="se-input"
        value={value}
        onChange={(e) => {
          const hit = options.find(([v]) => String(v) === e.target.value);
          if (hit) onChange(hit[0]);
        }}
      >
        {options.map(([v, name]) => (
          <option key={v} value={v}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextControl({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  linked,
  debounce,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  linked?: boolean;
  /** For fields that rewrite the design kit, which is costly per keystroke. */
  debounce?: boolean;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  const commit = useDebouncedCommit(onChange, debounce ? 400 : 0);
  const change = (next: string) => {
    setLocal(next);
    if (debounce) commit(next);
    else onChange(next);
  };
  return (
    <label className="se-field">
      <span>
        {label}
        {linked && <Linked />}
      </span>
      {multiline ? (
        <textarea
          className="se-input se-textarea"
          value={local}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(e) => change(e.target.value)}
        />
      ) : (
        <input
          className="se-input"
          value={local}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(e) => change(e.target.value)}
        />
      )}
    </label>
  );
}

function TagsControl({
  label,
  value,
  onChange,
  linked,
  suggestions,
  suggestionsLabel,
}: {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  linked?: boolean;
  /** Preset chips shown below the tag list, e.g. brand-tone presets on Mood. */
  suggestions?: readonly string[];
  suggestionsLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const tag = draft.trim().toLowerCase();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  };
  return (
    <div className="se-field">
      <span>
        {label}
        {linked && <Linked />}
      </span>
      <div className="se-tags">
        {value.map((tag) => (
          <span key={tag} className="se-tag">
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
            >
              <X />
            </button>
          </span>
        ))}
        <input
          className="se-tag-input"
          value={draft}
          placeholder="Add a mood…"
          aria-label={`Add to ${label}`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="se-presets">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="se-preset"
              aria-pressed={value.includes(s)}
              aria-label={`${suggestionsLabel ?? label} preset: ${s}`}
              onClick={() =>
                onChange(
                  value.includes(s)
                    ? value.filter((t) => t !== s)
                    : [...value, s],
                )
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Preset chips for a free-text field: toggles `preset` within the field's
 * comma-separated value. Shared by Scene, Lighting and Material. */
export function PresetChips({
  label,
  presets,
  value,
  onChange,
}: {
  label: string;
  presets: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="se-presets" role="group" aria-label={`${label} presets`}>
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          className="se-preset"
          aria-pressed={hasPreset(value, preset)}
          aria-label={`${label} preset: ${preset}`}
          onClick={() => onChange(togglePreset(value, preset))}
        >
          {preset}
        </button>
      ))}
    </div>
  );
}

/** Where each design value lives: on the document, or on the poster's brand
 * kit when the kit sets it (mirrors applyBrandKitToDocument). */
function useBindings(lineKey: string) {
  const s = useEditorStore();
  const d = s.doc as SpecDocument;
  const kit = s.brandKits.find((k) => k.id === d.creativeDirection.brandKitId);
  const role = (r: BrandKitColor["role"]) =>
    kit?.colors.find((c) => c.role === r);
  const primary = kit
    ? (role("primary") ??
      kit.colors.find((c) => c.role !== "background" && c.role !== "text"))
    : undefined;
  const secondary = kit ? (role("secondary") ?? role("accent")) : undefined;

  /** One document change; the section's hand-written text goes with it. */
  const edit = (fn: (doc: SpecDocument) => void) =>
    s.mutate((doc) => {
      fn(doc);
      if (doc.promptParts) delete doc.promptParts[lineKey];
    });
  const editKit = (patch: (kit: BrandKit) => Partial<BrandKit>) => {
    const state = useEditorStore.getState();
    const current = state.brandKits.find((k) => k.id === kit?.id);
    if (!current) return;
    state.updateBrandKit(current.id, patch(current));
    if (state.doc?.promptParts?.[lineKey] != null)
      state.mutate((doc) => {
        if (doc.promptParts) delete doc.promptParts[lineKey];
      }, false);
  };
  const editKitColor = (id: string, patch: Partial<BrandKitColor>) =>
    editKit((k) => ({
      colors: k.colors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  const styleOf = (ids: string[]) => (patch: Partial<SpecElement["style"]>) =>
    edit((doc) =>
      doc.elements.forEach((e) => {
        if (ids.includes(e.id)) Object.assign(e.style, patch);
      }),
    );

  return {
    d,
    kit,
    primary,
    secondary,
    text: kit ? (role("text") ?? primary) : undefined,
    background: role("background"),
    edit,
    editKit,
    editKitColor,
    styleOf,
    /** The typography every text layer follows. */
    typography: {
      value: kit?.typography || d.creativeDirection.typography,
      linked: !!kit?.typography,
      set: (family: string) =>
        kit?.typography
          ? editKit(() => ({ typography: family }))
          : edit((doc) => {
              doc.creativeDirection.typography = family;
              doc.elements.forEach((e) => {
                if (isTextKind(e.kind)) e.style.fontFamily = family;
              });
            }),
    },
  };
}
type Bindings = ReturnType<typeof useBindings>;

function BackgroundControls({ b }: { b: Bindings }) {
  const kbg = b.background;
  const bg = b.d.background;
  const type = kbg?.type ?? bg.type;
  const from = kbg?.hex ?? bg.value;
  const to = kbg
    ? (kbg.secondaryHex ?? kbg.hex)
    : (bg.secondaryValue ?? bg.value);
  const angle = kbg?.angle ?? bg.angle ?? 135;
  const setBg = (
    kitPatch: Partial<BrandKitColor>,
    docPatch: (b: SpecDocument["background"]) => void,
  ) =>
    kbg
      ? b.editKitColor(kbg.id, kitPatch)
      : b.edit((doc) => docPatch(doc.background));
  return (
    <>
      <div className="se-row">
        <SelectControl
          label="Background"
          value={type}
          options={[
            ["solid", "Solid"],
            ["gradient", "Gradient"],
          ]}
          onChange={(next) =>
            setBg({ type: next, secondaryHex: to }, (bgd) => {
              bgd.type = next;
              if (next === "gradient" && !bgd.secondaryValue) {
                bgd.secondaryValue = bgd.value;
                bgd.angle = 135;
              }
            })
          }
        />
        {type === "gradient" && (
          <NumberControl
            label="Angle°"
            value={angle}
            max={360}
            onChange={(next) =>
              setBg({ angle: next }, (bgd) => {
                bgd.angle = next;
              })
            }
          />
        )}
      </div>
      <div className="se-colors">
        <ColorControl
          label={type === "gradient" ? "From" : "Canvas"}
          value={from}
          linked={!!kbg}
          onChange={(hex) =>
            setBg({ hex }, (bgd) => {
              bgd.value = hex;
            })
          }
        />
        {type === "gradient" && (
          <ColorControl
            label="To"
            value={to}
            linked={!!kbg}
            onChange={(hex) =>
              setBg({ secondaryHex: hex }, (bgd) => {
                bgd.secondaryValue = hex;
              })
            }
          />
        )}
      </div>
    </>
  );
}

function BrandColorControls({ b }: { b: Bindings }) {
  const cd = b.d.creativeDirection;
  return (
    <>
      <ColorControl
        label="Primary"
        value={b.primary?.hex ?? cd.primaryColor}
        linked={!!b.primary}
        onChange={(hex) =>
          b.primary
            ? b.editKitColor(b.primary.id, { hex })
            : b.edit((doc) => {
                doc.creativeDirection.primaryColor = hex;
              })
        }
      />
      <ColorControl
        label="Secondary"
        value={b.secondary?.hex ?? cd.secondaryColor}
        linked={!!b.secondary}
        onChange={(hex) =>
          b.secondary
            ? b.editKitColor(b.secondary.id, { hex })
            : b.edit((doc) => {
                doc.creativeDirection.secondaryColor = hex;
              })
        }
      />
    </>
  );
}

function MoodControls({ b }: { b: Bindings }) {
  const cd = b.d.creativeDirection;
  const moodLinked = !!b.kit?.emotions.length;
  const styleLinked = !!b.kit?.style;
  return (
    <>
      <TagsControl
        label="Mood"
        value={moodLinked ? (b.kit?.emotions ?? []) : cd.mood}
        linked={moodLinked}
        suggestions={BRAND_TONES}
        suggestionsLabel="Brand tone"
        onChange={(tags) =>
          moodLinked
            ? b.editKit(() => ({ emotions: tags }))
            : b.edit((doc) => {
                doc.creativeDirection.mood = tags;
              })
        }
      />
      <TextControl
        label="Style"
        value={styleLinked ? (b.kit?.style ?? "") : cd.style}
        linked={styleLinked}
        debounce={styleLinked}
        placeholder="e.g. Editorial"
        onChange={(style) =>
          styleLinked
            ? b.editKit(() => ({ style }))
            : b.edit((doc) => {
                doc.creativeDirection.style = style;
              })
        }
      />
      <FontControl
        label="Typography (all text)"
        value={b.typography.value}
        linked={b.typography.linked}
        onChange={b.typography.set}
      />
    </>
  );
}

/** The Scene / Lighting section's controls: free text plus preset chips.
 * No debounce, so a chip click's immediate write never races a pending
 * keystroke commit. */
function ArtFieldControls({ b, field }: { b: Bindings; field: ArtFieldKey }) {
  const meta = ART_FIELDS[field];
  const value = b.d[field] ?? "";
  const set = (next: string) => b.edit((doc) => setArtField(doc, field, next));
  return (
    <>
      <TextControl
        label={meta.label}
        value={value}
        multiline={field === "scene"}
        placeholder={meta.placeholder}
        onChange={set}
      />
      <PresetChips label={meta.label} presets={meta.presets} value={value} onChange={set} />
    </>
  );
}

/** An element's Material and texture field: free text plus preset chips. */
function MaterialControls({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <TextControl
        label="Material and texture"
        value={value}
        placeholder="e.g. Brushed aluminum, soft fabric"
        onChange={onChange}
      />
      <PresetChips
        label="Material and texture"
        presets={MATERIAL_PRESETS}
        value={value}
        onChange={onChange}
      />
    </>
  );
}

/** Controls for one layer, or for every layer of a kind at once. */
function ElementControls({
  b,
  ids,
  single,
}: {
  b: Bindings;
  ids: string[];
  single: boolean;
}) {
  const els = b.d.elements.filter((e) => ids.includes(e.id));
  const el = els[0];
  if (!el) return null;
  const st = el.style;
  const setStyle = b.styleOf(ids);
  const setEl = (patch: Partial<SpecElement>) =>
    b.edit((doc) =>
      doc.elements.forEach((e) => {
        if (ids.includes(e.id)) Object.assign(e, patch);
      }),
    );
  if (isTextKind(el.kind)) {
    const fontLinked = !!b.kit?.typography;
    return (
      <>
        {single && (
          <TextControl
            label="Text"
            value={el.content ?? ""}
            multiline
            onChange={(content) => setEl({ content })}
          />
        )}
        <FontControl
          label={fontLinked ? "Font (all text)" : "Font"}
          value={
            (fontLinked ? b.kit?.typography : st.fontFamily) ??
            b.d.creativeDirection.typography
          }
          linked={fontLinked}
          onChange={(fontFamily) =>
            fontLinked
              ? b.editKit(() => ({ typography: fontFamily }))
              : setStyle({ fontFamily })
          }
        />
        <div className="se-row">
          <NumberControl
            label="Size"
            value={st.fontSize ?? 16}
            min={1}
            max={1000}
            onChange={(fontSize) => setStyle({ fontSize })}
          />
          <SelectControl
            label="Weight"
            value={st.fontWeight ?? 400}
            options={WEIGHTS.map((w) => [w, `${w}`] as const)}
            onChange={(fontWeight) => setStyle({ fontWeight })}
          />
          <SelectControl
            label="Align"
            value={st.alignment ?? "left"}
            options={[
              ["left", "Left"],
              ["center", "Center"],
              ["right", "Right"],
            ]}
            onChange={(alignment) => setStyle({ alignment })}
          />
        </div>
        <div className="se-colors">
          <ColorControl
            label={b.text ? "Text (all text)" : "Text"}
            value={b.text?.hex ?? st.color}
            linked={!!b.text}
            onChange={(color) =>
              b.text
                ? b.editKitColor(b.text.id, { hex: color })
                : setStyle({ color })
            }
          />
          {(st.background != null ||
            el.kind === "cta" ||
            el.kind === "badge") && (
            <ColorControl
              label="Fill"
              value={st.background}
              onChange={(background) => setStyle({ background })}
            />
          )}
        </div>
        {single && (
          <MaterialControls
            value={el.material ?? ""}
            onChange={(material) => setEl({ material })}
          />
        )}
      </>
    );
  }
  if (isImageKind(el.kind))
    return (
      <>
        {single && (
          <TextControl
            label="Imagery"
            value={el.aiDescription ?? ""}
            multiline
            placeholder="Describe the image"
            onChange={(aiDescription) => setEl({ aiDescription })}
          />
        )}
        <div className="se-row">
          <SelectControl
            label="Fit"
            value={st.objectFit ?? "cover"}
            options={[
              ["cover", "Cover"],
              ["contain", "Contain"],
            ]}
            onChange={(objectFit) => setStyle({ objectFit })}
          />
          <NumberControl
            label="Radius"
            value={st.borderRadius ?? 0}
            max={500}
            onChange={(borderRadius) => setStyle({ borderRadius })}
          />
        </div>
        {single && (
          <MaterialControls
            value={el.material ?? ""}
            onChange={(material) => setEl({ material })}
          />
        )}
      </>
    );
  const fillLinked = !!b.primary;
  return (
    <Fragment>
      <div className="se-row se-row-color">
        <ColorControl
          label={fillLinked ? "Fill (brand primary)" : "Fill"}
          value={fillLinked ? b.primary?.hex : st.background}
          linked={fillLinked}
          onChange={(hex) =>
            b.primary
              ? b.editKitColor(b.primary.id, { hex })
              : setStyle({ background: hex })
          }
        />
        {el.kind === "shape" && (
          <NumberControl
            label="Radius"
            value={st.borderRadius ?? 0}
            max={500}
            onChange={(borderRadius) => setStyle({ borderRadius })}
          />
        )}
      </div>
      {single && (
        <MaterialControls
          value={el.material ?? ""}
          onChange={(material) => setEl({ material })}
        />
      )}
    </Fragment>
  );
}

/** Every distinct hex in a DESIGN.md palette table, by row name. */
const paletteRows = (text: string) =>
  [...text.matchAll(/\|\s*([^|`]+?)\s*\|\s*`(#[0-9a-fA-F]{3,6})`/g)].map(
    (m) => ({ name: m[1] ?? "", hex: (m[2] ?? "").toLowerCase() }),
  );

function PaletteControls({ b, text }: { b: Bindings; text: string }) {
  /** Swaps one color for another everywhere it's used, kit included. */
  const recolor = (from: string, to: string) => {
    const same = (v?: string) => v?.trim().toLowerCase() === from;
    b.edit((doc) => {
      const bg = doc.background;
      if (same(bg.value)) bg.value = to;
      if (same(bg.secondaryValue)) bg.secondaryValue = to;
      const cd = doc.creativeDirection;
      if (same(cd.primaryColor)) cd.primaryColor = to;
      if (same(cd.secondaryColor)) cd.secondaryColor = to;
      for (const e of doc.elements) {
        if (same(e.style.color)) e.style.color = to;
        if (same(e.style.background)) e.style.background = to;
        if (same(e.style.borderColor)) e.style.borderColor = to;
      }
    });
    if (b.kit?.colors.some((c) => same(c.hex) || same(c.secondaryHex)))
      b.editKit((k) => ({
        colors: k.colors.map((c) => ({
          ...c,
          hex: same(c.hex) ? to : c.hex,
          ...(same(c.secondaryHex) ? { secondaryHex: to } : {}),
        })),
      }));
  };
  const rows = paletteRows(text);
  return (
    <div className="se-colors">
      {rows.map((r, i) => (
        <ColorControl
          key={i}
          label={r.name}
          value={r.hex}
          linked={!!b.kit?.colors.some((c) => c.hex.toLowerCase() === r.hex)}
          onChange={(hex) => recolor(r.hex, hex)}
        />
      ))}
    </div>
  );
}

function TypeControls({ b }: { b: Bindings }) {
  const cd = b.d.creativeDirection;
  const text = b.d.elements.filter((e) => e.visible && isTextKind(e.kind));
  const familyOf = (e: SpecElement) => e.style.fontFamily ?? cd.typography;
  const families = [...new Set(text.map(familyOf))];
  const kinds = [...new Set(text.map((e) => e.kind))];
  const linked = !!b.kit?.typography;
  return (
    <>
      {families.map((family) => (
        <FontControl
          key={family}
          label={linked ? "Typeface (all text)" : `Typeface · ${family}`}
          value={family}
          linked={linked}
          onChange={(next) =>
            linked
              ? b.editKit(() => ({ typography: next }))
              : b.edit((doc) => {
                  doc.elements.forEach((e) => {
                    if (isTextKind(e.kind) && familyOf(e) === family)
                      e.style.fontFamily = next;
                  });
                  if (doc.creativeDirection.typography === family)
                    doc.creativeDirection.typography = next;
                })
          }
        />
      ))}
      {kinds.map((kind) => {
        const ids = text.filter((e) => e.kind === kind).map((e) => e.id);
        const first = text.find((e) => e.kind === kind);
        const setStyle = b.styleOf(ids);
        return (
          <div key={kind} className="se-row se-row-labelled">
            <b className="se-row-title">{KIND_LABEL[kind]}</b>
            <NumberControl
              label="Size"
              value={first?.style.fontSize ?? 16}
              min={1}
              max={1000}
              onChange={(fontSize) => setStyle({ fontSize })}
            />
            <SelectControl
              label="Weight"
              value={first?.style.fontWeight ?? 400}
              options={WEIGHTS.map((w) => [w, `${w}`] as const)}
              onChange={(fontWeight) => setStyle({ fontWeight })}
            />
          </div>
        );
      })}
    </>
  );
}

function ImageryControls({ b }: { b: Bindings }) {
  const images = b.d.elements.filter((e) => e.visible && isImageKind(e.kind));
  return (
    <>
      {images.map((e) => (
        <TextControl
          key={e.id}
          label={e.name}
          value={e.aiDescription ?? ""}
          multiline
          placeholder="Describe the image"
          onChange={(aiDescription) =>
            b.edit((doc) => {
              const el = doc.elements.find((x) => x.id === e.id);
              if (el) el.aiDescription = aiDescription;
            })
          }
        />
      ))}
    </>
  );
}

/** Whether an editor shows any field the design kit owns. */
function hasLinked(target: Target, b: Bindings) {
  if (!b.kit) return false;
  switch (target.type) {
    case "background":
      return !!b.background;
    case "colors":
      return !!(b.background || b.primary || b.secondary);
    case "brand":
      return !!(b.primary || b.secondary || b.typography.linked);
    case "mood":
      return !!(b.kit.emotions.length || b.kit.style || b.typography.linked);
    case "palette":
      return b.kit.colors.length > 0;
    case "type":
      return b.typography.linked;
    case "imagery":
      return false;
    case "components":
      return !!(b.typography.linked || b.text || b.primary);
    case "scene":
    case "lighting":
      return false;
    case "typography":
      return b.typography.linked;
    case "element": {
      const el = b.d.elements.find((e) => e.id === target.id);
      if (!el || isImageKind(el.kind)) return false;
      return isTextKind(el.kind)
        ? !!(b.typography.linked || b.text)
        : !!b.primary;
    }
  }
}

export function SectionEditor({
  lineKey,
  baseText,
  onEditText,
}: {
  lineKey: string;
  /** The section's generated text, which palette editors read hexes from. */
  baseText: string;
  onEditText: () => void;
}) {
  const b = useBindings(lineKey);
  const target = sectionTarget(lineKey, b.d);
  if (!target) return null;
  let body: ReactNode = null;
  switch (target.type) {
    case "background":
      body = <BackgroundControls b={b} />;
      break;
    case "colors":
      body = (
        <>
          <BackgroundControls b={b} />
          <div className="se-colors">
            <BrandColorControls b={b} />
          </div>
        </>
      );
      break;
    case "brand":
      body = (
        <>
          <div className="se-colors">
            <BrandColorControls b={b} />
          </div>
          <FontControl
            label="Typography (all text)"
            value={b.typography.value}
            linked={b.typography.linked}
            onChange={b.typography.set}
          />
        </>
      );
      break;
    case "mood":
      body = <MoodControls b={b} />;
      break;
    case "palette":
      body = <PaletteControls b={b} text={baseText} />;
      break;
    case "type":
      body = <TypeControls b={b} />;
      break;
    case "imagery":
      body = <ImageryControls b={b} />;
      break;
    case "scene":
    case "lighting":
      body = <ArtFieldControls b={b} field={target.type} />;
      break;
    case "typography":
      body = (
        <FontControl
          label="Typography (all text)"
          value={b.typography.value}
          linked={b.typography.linked}
          onChange={b.typography.set}
        />
      );
      break;
    case "components": {
      const visible = b.d.elements.filter((e) => e.visible);
      const kinds = [...new Set(visible.map((e) => e.kind))];
      body = kinds.map((kind) => (
        <div key={kind} className="se-group">
          <b className="se-group-title">{KIND_LABEL[kind]}</b>
          <ElementControls
            b={b}
            ids={visible.filter((e) => e.kind === kind).map((e) => e.id)}
            single={false}
          />
        </div>
      ));
      break;
    }
    case "element":
      body = <ElementControls b={b} ids={[target.id]} single />;
      break;
  }
  return (
    <div className="se" role="group" aria-label="Edit section">
      {b.kit && hasLinked(target, b) && (
        <p className="se-note">
          <Link2 aria-hidden="true" />
          <span>
            Linked fields come from the <b>{b.kit.name}</b> design kit —
            changing them updates the kit and every design that uses it.
          </span>
        </p>
      )}
      {body}
      <button type="button" className="se-text-link" onClick={onEditText}>
        <Type aria-hidden="true" />
        Edit the text instead
      </button>
    </div>
  );
}
