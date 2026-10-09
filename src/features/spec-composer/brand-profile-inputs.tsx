import { useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ARCHETYPES,
  AUDIENCE_AGES,
  AUDIENCE_INTERESTS,
  AUDIENCE_SEGMENTS,
  CORE_VALUES,
  DIFFERENTIATORS,
  MISSION_FOCUS,
  PALETTE_PRESETS,
  PERSONALITY_AXES,
  POSITIONING_TIERS,
  VISION_THEMES,
  VOICE_AXES,
  VOICE_TRAITS,
  type BipolarAxis,
} from "./brand-profile";
import { materialRoleColors } from "./material-kits";
import { FEATURED_FONTS, MORE_FONTS } from "./fonts";
import type { BrandKitColor, BrandProfile } from "./types";

/** A chip multi-select built from `.emotion-chip`/`.emotion-add-row`, the
 * markup already used by the card editor's emotion picker. */
export function ChipMultiSelect({
  options,
  value,
  onChange,
  max,
  allowCustom = true,
  ariaLabel,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  allowCustom?: boolean;
  ariaLabel: string;
}) {
  const [custom, setCustom] = useState("");
  const atMax = max != null && value.length >= max;
  const customChips = value.filter((v) => !options.includes(v));

  const toggle = (option: string) => {
    const has = value.includes(option);
    if (!has && atMax) return;
    onChange(has ? value.filter((v) => v !== option) : [...value, option]);
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (!trimmed || value.includes(trimmed) || atMax) {
      setCustom("");
      return;
    }
    onChange([...value, trimmed]);
    setCustom("");
  };

  return (
    <div className="bk-chip-field">
      <div className="emotion-chip-grid" role="listbox" aria-label={ariaLabel}>
        {options.map((option) => {
          const active = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={active}
              disabled={!active && atMax}
              className={`emotion-chip${active ? " active" : ""}`}
              onClick={() => toggle(option)}
            >
              {active && <Check aria-hidden="true" />}
              {option}
            </button>
          );
        })}
        {customChips.map((option) => (
          <button
            key={option}
            type="button"
            role="option"
            aria-selected
            className="emotion-chip active"
            onClick={() => toggle(option)}
          >
            <Check aria-hidden="true" />
            {option}
          </button>
        ))}
      </div>
      {allowCustom && (
        <form
          className="emotion-add-row"
          onSubmit={(event) => {
            event.preventDefault();
            addCustom();
          }}
        >
          <input
            value={custom}
            disabled={atMax}
            onChange={(event) => setCustom(event.target.value)}
            placeholder={atMax ? `Up to ${max}` : "Add your own"}
            aria-label={`Add custom ${ariaLabel.toLowerCase()}`}
          />
          <Hint label="Add">
            <button type="submit" aria-label="Add" disabled={atMax}>
              <Plus aria-hidden="true" />
            </button>
          </Hint>
        </form>
      )}
    </div>
  );
}

export interface TileOption {
  id: string;
  label: string;
  description?: string;
}

/** A single-choice grid of title + description cards. */
export function TileSelect({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: TileOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn("bk-tile-grid", className)}
      role="listbox"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-pressed={selected}
            className="bk-tile"
            onClick={() => onChange(selected ? "" : option.id)}
          >
            <strong>{option.label}</strong>
            {option.description && <small>{option.description}</small>}
          </button>
        );
      })}
    </div>
  );
}

/** A native range input with pole labels and a live descriptor, so it never
 * pulls in the shadcn Slider's ring focus style. */
export function BipolarSlider({
  axis,
  value,
  onChange,
}: {
  axis: BipolarAxis;
  value: number;
  onChange: (next: number) => void;
}) {
  const descriptor = value < 35 ? axis.left : value > 65 ? axis.right : "Balanced";
  return (
    <div className="bk-slider">
      <div className="bk-slider-poles">
        <span>{axis.left}</span>
        <span className="bk-slider-value">{descriptor}</span>
        <span>{axis.right}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        aria-label={`${axis.left} to ${axis.right}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

/** Starting palettes; clicking one replaces the kit's role colors (fresh
 * ids, so later per-role edits don't collide with the preset's). */
export function PalettePresetCards({
  onApply,
}: {
  onApply: (colors: BrandKitColor[]) => void;
}) {
  return (
    <div className="bk-palette-presets" role="list" aria-label="Palette presets">
      {PALETTE_PRESETS.map((preset) => (
        <button
          key={preset.name}
          type="button"
          className="bk-palette-preset"
          onClick={() =>
            onApply(
              preset.colors.map((color) => ({
                ...color,
                id: crypto.randomUUID().slice(0, 8),
              })),
            )
          }
        >
          <span className="bk-palette-preset-swatches" aria-hidden="true">
            {preset.colors.map((color) => (
              <i key={color.role} style={{ background: color.hex }} />
            ))}
          </span>
          <small>{preset.name}</small>
        </button>
      ))}
    </div>
  );
}

const SEED_PRESETS = [
  "#6750A4",
  "#2563EB",
  "#16A34A",
  "#DC2626",
  "#D97706",
  "#DB2777",
  "#0D9488",
  "#7C3AED",
];

const isHex = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

/** Preset seed dots plus a colour input, hex field and a live 5-role strip
 * built from the same `materialRoleColors` helper the generated kit uses. */
export function SeedSwatchPicker({
  seed,
  onChange,
}: {
  seed: string;
  onChange: (hex: string) => void;
}) {
  const valid = isHex(seed);
  const roles = materialRoleColors(valid ? seed : "#6750A4");
  return (
    <div className="bk-seed-preview">
      <div className="bk-seed-dots" role="group" aria-label="Seed color presets">
        {SEED_PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            className="bk-seed-dot"
            aria-pressed={seed.toLowerCase() === hex.toLowerCase()}
            aria-label={hex}
            style={{ background: hex }}
            onClick={() => onChange(hex)}
          />
        ))}
      </div>
      <div className="bk-swatch-row">
        <input
          type="color"
          className="bk-swatch"
          value={valid ? seed : "#6750a4"}
          aria-label="Seed color"
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          value={seed}
          placeholder="#6750A4"
          aria-label="Seed color hex"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="bk-swatch-row bk-swatch-row-strip" aria-hidden="true">
        {roles.map((role) => (
          <i key={role.role} style={{ background: role.hex }} />
        ))}
      </div>
    </div>
  );
}

/** Role swatch tiles for create mode: a palette preset's (or the default
 * kit's) colors, each individually editable via a native color input. */
export function PaletteSwatchTiles({
  colors,
  onChange,
}: {
  colors: BrandKitColor[];
  onChange: (colors: BrandKitColor[]) => void;
}) {
  const updateColor = (id: string, hex: string) =>
    onChange(
      colors.map((color) =>
        color.id === id ? { ...color, hex, secondaryHex: hex } : color,
      ),
    );
  return (
    <div className="bk-swatch-row">
      {colors.map((color) => (
        <label key={color.id} className="bk-swatch-tile">
          <input
            type="color"
            className="bk-swatch"
            value={color.hex}
            aria-label={`${color.role} color`}
            onChange={(event) => updateColor(color.id, event.target.value)}
          />
          <small>{color.role}</small>
        </label>
      ))}
    </div>
  );
}

/** FEATURED_FONTS tiles showing "Aa" and the kit name in that font, plus a
 * search over MORE_FONTS — reuses the font lists behind the card's font
 * picker so the two stay in sync. */
export function FontTileGrid({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (font: string) => void;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const matches = (font: string) =>
    !normalized || font.toLowerCase().includes(normalized);
  const fonts = [...FEATURED_FONTS.filter(matches), ...MORE_FONTS.filter(matches)];
  return (
    <div className="bk-font-grid-wrap">
      <label className="bk-font-search font-search">
        <Search aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search fonts"
          aria-label="Search fonts"
        />
      </label>
      <div className="bk-font-grid" role="listbox" aria-label="Typography">
        {fonts.map((font) => {
          const selected = value === font;
          return (
            <button
              key={font}
              type="button"
              role="option"
              aria-selected={selected}
              aria-pressed={selected}
              className="bk-font-tile"
              style={{ fontFamily: font }}
              onClick={() => onChange(font)}
            >
              <span className="bk-font-tile-glyph">Aa</span>
              <span className="bk-font-tile-name">{name || "Untitled kit"}</span>
            </button>
          );
        })}
        {!fonts.length && <p className="font-empty">No fonts match “{query}”</p>}
      </div>
    </div>
  );
}

/** A single-line optional note, bound directly to the free-text extra of a
 * profile field. Enter never submits anything above it. */
function NoteInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <input
      className="bk-note"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.preventDefault();
      }}
    />
  );
}

export interface FieldProps {
  profile: BrandProfile;
  onChange: (next: BrandProfile) => void;
}

export function VisionField({ profile, onChange }: FieldProps) {
  return (
    <>
      <ChipMultiSelect
        options={VISION_THEMES}
        value={profile.visionThemes ?? []}
        onChange={(visionThemes) => onChange({ ...profile, visionThemes })}
        ariaLabel="Vision themes"
      />
      <NoteInput
        value={profile.vision ?? ""}
        onChange={(vision) => onChange({ ...profile, vision })}
        placeholder="Add a note about your vision"
        ariaLabel="Vision note"
      />
    </>
  );
}

export function MissionField({ profile, onChange }: FieldProps) {
  return (
    <>
      <ChipMultiSelect
        options={MISSION_FOCUS}
        value={profile.missionFocus ?? []}
        onChange={(missionFocus) => onChange({ ...profile, missionFocus })}
        ariaLabel="Mission focus"
      />
      <NoteInput
        value={profile.mission ?? ""}
        onChange={(mission) => onChange({ ...profile, mission })}
        placeholder="Add a note about your mission"
        ariaLabel="Mission note"
      />
    </>
  );
}

export function ValuesField({ profile, onChange }: FieldProps) {
  return (
    <ChipMultiSelect
      options={CORE_VALUES}
      value={profile.values ?? []}
      onChange={(values) => onChange({ ...profile, values })}
      max={5}
      ariaLabel="Core values"
    />
  );
}

const archetypeOptions: TileOption[] = ARCHETYPES.map((a) => ({
  id: a.id,
  label: a.label,
  description: a.description,
}));

export function PersonalityField({ profile, onChange }: FieldProps) {
  const personality = profile.personality ?? {};
  return (
    <>
      <TileSelect
        options={archetypeOptions}
        value={profile.archetype ?? ""}
        onChange={(archetype) => onChange({ ...profile, archetype })}
        ariaLabel="Brand archetype"
        className="bk-archetype-grid"
      />
      <div className="bk-slider-stack">
        {PERSONALITY_AXES.map((axis) => (
          <BipolarSlider
            key={axis.id}
            axis={axis}
            value={personality[axis.id] ?? 50}
            onChange={(v) =>
              onChange({
                ...profile,
                personality: { ...personality, [axis.id]: v },
              })
            }
          />
        ))}
      </div>
    </>
  );
}

export function AudienceField({ profile, onChange }: FieldProps) {
  return (
    <>
      <ChipMultiSelect
        options={AUDIENCE_AGES}
        value={profile.audienceAges ?? []}
        onChange={(audienceAges) => onChange({ ...profile, audienceAges })}
        ariaLabel="Audience ages"
      />
      <ChipMultiSelect
        options={AUDIENCE_SEGMENTS}
        value={profile.audienceSegments ?? []}
        onChange={(audienceSegments) =>
          onChange({ ...profile, audienceSegments })
        }
        ariaLabel="Audience segments"
      />
      <ChipMultiSelect
        options={AUDIENCE_INTERESTS}
        value={profile.audienceInterests ?? []}
        onChange={(audienceInterests) =>
          onChange({ ...profile, audienceInterests })
        }
        ariaLabel="Audience interests"
      />
      <NoteInput
        value={profile.audience ?? ""}
        onChange={(audience) => onChange({ ...profile, audience })}
        placeholder="Add a note about your audience"
        ariaLabel="Audience note"
      />
    </>
  );
}

const tierOptions: TileOption[] = POSITIONING_TIERS.map((t) => ({
  id: t.id,
  label: t.label,
  description: t.description,
}));

export function PositioningField({ profile, onChange }: FieldProps) {
  return (
    <>
      <TileSelect
        options={tierOptions}
        value={profile.positioningTier ?? ""}
        onChange={(positioningTier) => onChange({ ...profile, positioningTier })}
        ariaLabel="Positioning tier"
      />
      <ChipMultiSelect
        options={DIFFERENTIATORS}
        value={profile.differentiators ?? []}
        onChange={(differentiators) => onChange({ ...profile, differentiators })}
        ariaLabel="Differentiators"
      />
      <NoteInput
        value={profile.positioning ?? ""}
        onChange={(positioning) => onChange({ ...profile, positioning })}
        placeholder="Add a note about your positioning"
        ariaLabel="Positioning note"
      />
    </>
  );
}

export function VoiceField({ profile, onChange }: FieldProps) {
  const voiceTone = profile.voiceTone ?? {};
  return (
    <>
      <div className="bk-slider-stack">
        {VOICE_AXES.map((axis) => (
          <BipolarSlider
            key={axis.id}
            axis={axis}
            value={voiceTone[axis.id] ?? 50}
            onChange={(v) =>
              onChange({ ...profile, voiceTone: { ...voiceTone, [axis.id]: v } })
            }
          />
        ))}
      </div>
      <ChipMultiSelect
        options={VOICE_TRAITS}
        value={profile.voiceTraits ?? []}
        onChange={(voiceTraits) => onChange({ ...profile, voiceTraits })}
        ariaLabel="Voice traits"
      />
    </>
  );
}
