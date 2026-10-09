import { useEffect, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  EMOTION_PRESETS,
  FILLED_SECTION_TOTAL,
  brandProfileLines,
  countFilledSections,
  PALETTE_PRESETS,
} from "./brand-profile";
import { FontSelect, MultiSelect } from "./brand-select";
import {
  AudienceField,
  PalettePresetCards,
  PaletteSwatchTiles,
  PersonalityVoiceField,
  PositioningField,
  SeedSwatchPicker,
  ValuesField,
  VisionField,
  MissionField,
} from "./brand-profile-inputs";
import { BrandKitPreview } from "./brand-kit-panel";
import { materialRoleColors } from "./material-kits";
import { useEditorStore } from "./store";
import type { BrandKit, BrandKitColor, BrandProfile } from "./types";

export type BrandKitBuilderMode = "create" | "generate";

const isHex = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

interface Draft {
  name: string;
  emotions: string[];
  typography: string;
  profile: BrandProfile;
  /** Create mode's editable role palette. */
  colors: BrandKitColor[];
  /** Generate mode's Material 3 seed. */
  seed: string;
  /** Whether the palette has been changed from its default, for the
   * "x of 9 sections filled" counter. */
  paletteTouched: boolean;
  /** Whether typography has been changed from its default. */
  typographyTouched: boolean;
}

function initialDraft(): Draft {
  return {
    name: "",
    emotions: [],
    typography: "Manrope",
    profile: {},
    colors: PALETTE_PRESETS[0]!.colors.map((color) => ({
      ...color,
      id: crypto.randomUUID().slice(0, 8),
    })),
    seed: "#6750A4",
    paletteTouched: false,
    typographyTouched: false,
  };
}

/** The one-screen brand kit builder: Create and Generate both collect all 9
 * brand-strategy fields plus the look (palette/typography) on a single
 * scrollable form, no wizard steps. */
export function BrandKitBuilder({
  open,
  mode,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  mode: BrandKitBuilderMode;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const s = useEditorStore();
  const [draft, setDraft] = useState<Draft>(initialDraft);

  useEffect(() => {
    if (open) setDraft(initialDraft());
  }, [open, mode]);

  const patchProfile = (next: BrandProfile) =>
    setDraft((d) => ({ ...d, profile: next }));

  const fallbackName = mode === "create" ? "Untitled kit" : "Material 3 kit";
  const previewColors =
    mode === "generate"
      ? materialRoleColors(isHex(draft.seed) ? draft.seed : "#6750A4")
      : draft.colors;
  const previewKit: BrandKit = {
    id: "preview",
    name: draft.name.trim() || fallbackName,
    colors: previewColors,
    emotions: draft.emotions,
    style: mode === "generate" ? "Material 3" : "Minimal",
    typography: draft.typography,
    createdAt: "",
    updatedAt: "",
  };
  const summaryLines = brandProfileLines(draft.profile);
  const filled = countFilledSections({
    profile: draft.profile,
    emotions: draft.emotions,
    paletteTouched: draft.paletteTouched,
    typographyTouched: draft.typographyTouched,
  });

  const finish = () => {
    const name = draft.name.trim() || fallbackName;
    const base = {
      emotions: draft.emotions,
      typography: draft.typography,
      ...(Object.keys(draft.profile).length ? { profile: draft.profile } : {}),
    };
    const id =
      mode === "create"
        ? s.createBrandKit(name, { ...base, colors: draft.colors })
        : s.createMaterialKit(
            name,
            isHex(draft.seed) ? draft.seed : "#6750A4",
            base,
          );
    onCreated(id);
    onOpenChange(false);
  };

  const blockEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bk-builder">
        <div className="bk-builder-head">
          <DialogTitle className="bk-builder-title">
            {mode === "create" ? "New design kit" : "Generate Material 3 kit"}
          </DialogTitle>
          <input
            autoFocus
            className="bk-builder-name"
            value={draft.name}
            onChange={(event) =>
              setDraft((d) => ({ ...d, name: event.target.value }))
            }
            onKeyDown={blockEnter}
            placeholder={`Name this ${mode === "create" ? "design kit" : "style kit"}`}
            aria-label="Kit name"
          />
          <span className="bk-builder-count">
            {filled} of {FILLED_SECTION_TOTAL} sections filled
          </span>
        </div>

        <div className="bk-builder-body">
          <div className="bk-builder-form">
            <fieldset className="bk-group">
              <legend className="bk-group-title">Purpose</legend>
              <div className="bk-pair">
                <fieldset className="bk-section">
                  <legend>Vision</legend>
                  <p className="bk-section-hint">Where is the brand headed?</p>
                  <VisionField profile={draft.profile} onChange={patchProfile} />
                </fieldset>
                <fieldset className="bk-section">
                  <legend>Mission</legend>
                  <p className="bk-section-hint">What does the brand do, and for whom?</p>
                  <MissionField profile={draft.profile} onChange={patchProfile} />
                </fieldset>
              </div>
            </fieldset>

            <fieldset className="bk-group">
              <legend className="bk-group-title">Character</legend>
              <div className="bk-pair">
                <fieldset className="bk-section">
                  <legend>Core values</legend>
                  <p className="bk-section-hint">Pick up to 5 that define the brand.</p>
                  <ValuesField profile={draft.profile} onChange={patchProfile} />
                </fieldset>
                <fieldset className="bk-section">
                  <legend>Emotion</legend>
                  <p className="bk-section-hint">How should the brand feel?</p>
                  <MultiSelect
                    options={EMOTION_PRESETS}
                    value={draft.emotions}
                    onChange={(emotions) => setDraft((d) => ({ ...d, emotions }))}
                    ariaLabel="Brand emotions"
                    placeholder="Add an emotion"
                  />
                </fieldset>
              </div>
              <fieldset className="bk-section">
                <legend>Personality & voice</legend>
                <p className="bk-section-hint">
                  Pick an archetype and how it sounds; fine-tune if you like.
                </p>
                <PersonalityVoiceField
                  profile={draft.profile}
                  onChange={patchProfile}
                />
              </fieldset>
            </fieldset>

            <fieldset className="bk-group">
              <legend className="bk-group-title">Market</legend>
              <fieldset className="bk-section">
                <legend>Target audience</legend>
                <p className="bk-section-hint">Who is this brand speaking to?</p>
                <AudienceField profile={draft.profile} onChange={patchProfile} />
              </fieldset>
              <fieldset className="bk-section">
                <legend>Positioning</legend>
                <p className="bk-section-hint">Where does the brand sit in the market?</p>
                <PositioningField profile={draft.profile} onChange={patchProfile} />
              </fieldset>
            </fieldset>

            <fieldset className="bk-group">
              <legend className="bk-group-title">Look</legend>
              <fieldset className="bk-section">
                <legend>Color palette</legend>
                <p className="bk-section-hint">
                  {mode === "create"
                    ? "Start from a preset, then tweak any swatch."
                    : "Pick a seed color — every role tone is generated from it."}
                </p>
                {mode === "create" ? (
                  <>
                    <PalettePresetCards
                      onApply={(colors) =>
                        setDraft((d) => ({ ...d, colors, paletteTouched: true }))
                      }
                    />
                    <PaletteSwatchTiles
                      colors={draft.colors}
                      onChange={(colors) =>
                        setDraft((d) => ({ ...d, colors, paletteTouched: true }))
                      }
                    />
                  </>
                ) : (
                  <SeedSwatchPicker
                    seed={draft.seed}
                    onChange={(seed) =>
                      setDraft((d) => ({ ...d, seed, paletteTouched: true }))
                    }
                  />
                )}
              </fieldset>
              <fieldset className="bk-section">
                <legend>Typography</legend>
                <p className="bk-section-hint">One font for every text layer.</p>
                <FontSelect
                  value={draft.typography}
                  onChange={(typography) =>
                    setDraft((d) => ({ ...d, typography, typographyTouched: true }))
                  }
                  ariaLabel="Typography"
                />
              </fieldset>
            </fieldset>
          </div>

          <div className="bk-builder-preview">
            <BrandKitPreview kit={previewKit} />
            <ul className="bk-builder-summary">
              {summaryLines.length ? (
                summaryLines.map((line, index) => <li key={index}>{line}</li>)
              ) : (
                <li>Fill in the form to preview your brand strategy.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="bk-builder-foot">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={finish}>
            {mode === "create" ? "Create kit" : "Generate kit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
