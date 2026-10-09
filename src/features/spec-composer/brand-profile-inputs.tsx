import { useRef, useState } from "react";
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
import {
  MultiSelect,
  OptionSelect,
  SegmentedSelect,
  type SelectOption,
} from "./brand-select";
import { materialRoleColors } from "./material-kits";
import type { BrandKitColor, BrandProfile } from "./types";

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

/** A single-line optional note, bound directly to the free-text extra of a
 * profile field. Collapsed behind a "+ Add note" toggle unless it already
 * has text, and re-collapses on blur if left empty; Enter never submits
 * anything above it. */
function NoteField({
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
  const [open, setOpen] = useState(() => !!value.trim());
  const inputRef = useRef<HTMLInputElement>(null);
  const focusPending = useRef(false);

  if (!open) {
    return (
      <button
        type="button"
        className="bk-note-toggle"
        onClick={() => {
          focusPending.current = true;
          setOpen(true);
        }}
      >
        + Add note
      </button>
    );
  }

  return (
    <input
      ref={(node) => {
        inputRef.current = node;
        if (node && focusPending.current) {
          focusPending.current = false;
          node.focus();
        }
      }}
      className="bk-note"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        if (!value.trim()) setOpen(false);
      }}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.preventDefault();
      }}
    />
  );
}

/** A collapsed `<details>` disclosure for the bipolar sliders, opening on
 * its own if any slider was already moved off neutral. `touched` is the
 * number of sliders currently off 50, shown as "· n adjusted". */
function FineTune({
  label,
  touched,
  children,
}: {
  label: string;
  touched: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(touched > 0);
  return (
    <details
      className="bk-finetune"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        Fine-tune {label}
        {touched > 0 ? ` · ${touched} adjusted` : null}
      </summary>
      {children}
    </details>
  );
}

const countAdjusted = (
  axes: BipolarAxis[],
  values: Record<string, number> | undefined,
) => axes.filter((axis) => (values?.[axis.id] ?? 50) !== 50).length;

export interface FieldProps {
  profile: BrandProfile;
  onChange: (next: BrandProfile) => void;
}

export function VisionField({ profile, onChange }: FieldProps) {
  return (
    <>
      <MultiSelect
        options={VISION_THEMES}
        value={profile.visionThemes ?? []}
        onChange={(visionThemes) => onChange({ ...profile, visionThemes })}
        ariaLabel="Vision themes"
        placeholder="Add a vision theme"
      />
      <NoteField
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
      <MultiSelect
        options={MISSION_FOCUS}
        value={profile.missionFocus ?? []}
        onChange={(missionFocus) => onChange({ ...profile, missionFocus })}
        ariaLabel="Mission focus"
        placeholder="Add a mission focus"
      />
      <NoteField
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
    <MultiSelect
      options={CORE_VALUES}
      value={profile.values ?? []}
      onChange={(values) => onChange({ ...profile, values })}
      max={5}
      ariaLabel="Core values"
      placeholder="Add a core value"
    />
  );
}

const archetypeOptions: SelectOption[] = ARCHETYPES.map((a) => ({
  id: a.id,
  label: a.label,
  description: a.description,
}));

/** Personality (archetype + sliders) and voice (traits + sliders) combined
 * into one section with a single Fine-tune disclosure for both slider
 * stacks. */
export function PersonalityVoiceField({ profile, onChange }: FieldProps) {
  const personality = profile.personality ?? {};
  const voiceTone = profile.voiceTone ?? {};
  const touched =
    countAdjusted(PERSONALITY_AXES, personality) +
    countAdjusted(VOICE_AXES, voiceTone);
  return (
    <>
      <OptionSelect
        options={archetypeOptions}
        value={profile.archetype ?? ""}
        onChange={(archetype) => onChange({ ...profile, archetype })}
        ariaLabel="Brand archetype"
        placeholder="Choose an archetype"
        clearable
      />
      <MultiSelect
        options={VOICE_TRAITS}
        value={profile.voiceTraits ?? []}
        onChange={(voiceTraits) => onChange({ ...profile, voiceTraits })}
        ariaLabel="Voice traits"
        placeholder="Add a voice trait"
      />
      <FineTune label="personality & voice" touched={touched}>
        <p className="bk-finetune-heading">Personality</p>
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
        <p className="bk-finetune-heading">Voice</p>
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
      </FineTune>
    </>
  );
}

export function AudienceField({ profile, onChange }: FieldProps) {
  return (
    <>
      <div className="bk-subgrid">
        <div className="bk-subfield">
          <span className="bk-subfield-label">Age</span>
          <MultiSelect
            options={AUDIENCE_AGES}
            value={profile.audienceAges ?? []}
            onChange={(audienceAges) => onChange({ ...profile, audienceAges })}
            ariaLabel="Audience ages"
            placeholder="Add an age range"
          />
        </div>
        <div className="bk-subfield">
          <span className="bk-subfield-label">Segment</span>
          <MultiSelect
            options={AUDIENCE_SEGMENTS}
            value={profile.audienceSegments ?? []}
            onChange={(audienceSegments) =>
              onChange({ ...profile, audienceSegments })
            }
            ariaLabel="Audience segments"
            placeholder="Add a segment"
          />
        </div>
        <div className="bk-subfield">
          <span className="bk-subfield-label">Interests</span>
          <MultiSelect
            options={AUDIENCE_INTERESTS}
            value={profile.audienceInterests ?? []}
            onChange={(audienceInterests) =>
              onChange({ ...profile, audienceInterests })
            }
            ariaLabel="Audience interests"
            placeholder="Add an interest"
          />
        </div>
      </div>
      <NoteField
        value={profile.audience ?? ""}
        onChange={(audience) => onChange({ ...profile, audience })}
        placeholder="Add a note about your audience"
        ariaLabel="Audience note"
      />
    </>
  );
}

const tierOptions: SelectOption[] = POSITIONING_TIERS.map((t) => ({
  id: t.id,
  label: t.label,
  description: t.description,
}));

export function PositioningField({ profile, onChange }: FieldProps) {
  return (
    <>
      <SegmentedSelect
        options={tierOptions}
        value={profile.positioningTier ?? ""}
        onChange={(positioningTier) => onChange({ ...profile, positioningTier })}
        ariaLabel="Positioning tier"
      />
      <MultiSelect
        options={DIFFERENTIATORS}
        value={profile.differentiators ?? []}
        onChange={(differentiators) => onChange({ ...profile, differentiators })}
        ariaLabel="Differentiators"
        placeholder="Add a differentiator"
      />
      <NoteField
        value={profile.positioning ?? ""}
        onChange={(positioning) => onChange({ ...profile, positioning })}
        placeholder="Add a note about your positioning"
        ariaLabel="Positioning note"
      />
    </>
  );
}
