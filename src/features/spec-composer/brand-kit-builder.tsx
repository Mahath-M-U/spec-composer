import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  ChevronDown,
  Compass,
  Loader2,
  Palette,
  Pipette,
  Sparkles,
  Target,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
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
import {
  BrandKitPreview,
  brandColorRoleLabel,
  copyBrandColorHex,
  defaultBrandColorUsecase,
} from "./brand-kit-panel";
import { assignBrandRoles, paletteWithSharesFromFile } from "./image-palette";
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

const initialDisclosures = () => ({
  colors: true,
  presets: true,
  purpose: true,
  character: true,
  market: true,
});

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
  const [disclosures, setDisclosures] = useState(initialDisclosures);
  const [paletteBusy, setPaletteBusy] = useState(false);
  const paletteFileInput = useRef<HTMLInputElement>(null);
  const paletteProcessing = useRef(false);
  const paletteGeneration = useRef({ value: 0 });

  useEffect(() => {
    const generation = paletteGeneration.current;
    generation.value++;
    paletteProcessing.current = false;
    setPaletteBusy(false);
    if (open) {
      setDraft(initialDraft());
      setDisclosures(initialDisclosures());
    }
    return () => {
      generation.value++;
      paletteProcessing.current = false;
    };
  }, [open, mode]);

  const changeOpen = (next: boolean) => {
    if (!next) {
      paletteGeneration.current.value++;
      paletteProcessing.current = false;
      setPaletteBusy(false);
      if (paletteFileInput.current) paletteFileInput.current.value = "";
    }
    onOpenChange(next);
  };

  const onPickPalette = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || paletteProcessing.current || !open || mode !== "create")
      return;
    const generation = ++paletteGeneration.current.value;
    paletteProcessing.current = true;
    setPaletteBusy(true);
    try {
      const palette = await paletteWithSharesFromFile(file);
      if (generation !== paletteGeneration.current.value) return;
      const colors = assignBrandRoles(
        palette.map((color) => color.hex),
        defaultBrandColorUsecase,
        palette.map((color) => color.share),
      );
      setDraft((current) =>
        generation === paletteGeneration.current.value
          ? { ...current, colors, paletteTouched: true }
          : current,
      );
      toast.success(`Loaded ${colors.length} colors from image`);
    } catch (error) {
      if (generation === paletteGeneration.current.value)
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't read colors from this image.",
        );
    } finally {
      if (generation === paletteGeneration.current.value) {
        paletteProcessing.current = false;
        setPaletteBusy(false);
        input.value = "";
      }
    }
  };

  const setDisclosure = (key: keyof typeof disclosures, next: boolean) =>
    setDisclosures((current) =>
      current[key] === next ? current : { ...current, [key]: next },
    );

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
    if (paletteProcessing.current) return;
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
    changeOpen(false);
  };

  const blockEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="bk-builder">
        <div className="bk-builder-head">
          <DialogTitle className="bk-builder-title">
            {mode === "create" ? "New design kit" : "Generate Material 3 kit"}
          </DialogTitle>
        </div>

        <div className="bk-builder-body">
          <div className="bk-builder-preview">
            <span className="bk-preview-label">Live preview</span>
            <BrandKitPreview kit={previewKit} variant="builder" />
            <ul className="bk-builder-summary">
              {summaryLines.length ? (
                summaryLines.map((line, index) => <li key={index}>{line}</li>)
              ) : (
                <li>Your colors and typography update here as you edit.</li>
              )}
            </ul>
          </div>
          <div className="bk-builder-form">
            <div className="bk-builder-name-field">
              <label htmlFor="bk-builder-name">Kit name</label>
              <input
                id="bk-builder-name"
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
            </div>
            <section
              className="bk-look-card"
              aria-labelledby="bk-typography-title"
            >
              <div className="bk-card-head">
                <span className="bk-card-icon">
                  <Type aria-hidden="true" />
                </span>
                <div className="bk-card-heading">
                  <h3 id="bk-typography-title">Typography</h3>
                  <p>One font for every text layer</p>
                </div>
              </div>
              <FontSelect
                value={draft.typography}
                onChange={(typography) =>
                  setDraft((d) => ({
                    ...d,
                    typography,
                    typographyTouched: true,
                  }))
                }
                ariaLabel="Typography"
              />
            </section>

            <section
              className="bk-look-card bk-colors-card"
              aria-labelledby="bk-colors-title"
            >
              <div className="bk-card-head">
                <span className="bk-card-icon">
                  <Palette aria-hidden="true" />
                </span>
                <span className="bk-card-heading">
                  <span className="bk-card-title" id="bk-colors-title">
                    Colors
                  </span>
                  <span className="bk-card-hint">
                    {previewColors.length} colors
                  </span>
                </span>
                <span className="bk-mini-swatches" aria-hidden="true">
                  {previewColors.map((color) => (
                    <i key={color.id} style={{ background: color.hex }} />
                  ))}
                </span>
                <div className="bk-colors-actions">
                  {mode === "create" && (
                    <Hint label="Palette from image">
                      <button
                        type="button"
                        className="bk-colors-action"
                        aria-label="Palette from image"
                        aria-busy={paletteBusy}
                        disabled={paletteBusy}
                        onClick={() => paletteFileInput.current?.click()}
                      >
                        {paletteBusy ? (
                          <Loader2
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Pipette aria-hidden="true" />
                        )}
                      </button>
                    </Hint>
                  )}
                  <Hint
                    label={
                      disclosures.colors ? "Collapse colors" : "Expand colors"
                    }
                  >
                    <button
                      type="button"
                      className="bk-colors-action"
                      aria-label={
                        disclosures.colors ? "Collapse colors" : "Expand colors"
                      }
                      aria-expanded={disclosures.colors}
                      aria-controls="bk-colors-content"
                      onClick={() =>
                        setDisclosure("colors", !disclosures.colors)
                      }
                    >
                      <ChevronDown
                        className="bk-disclosure-chevron"
                        aria-hidden="true"
                      />
                    </button>
                  </Hint>
                </div>
              </div>
              {mode === "create" && (
                <input
                  ref={paletteFileInput}
                  type="file"
                  hidden
                  tabIndex={-1}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onPickPalette}
                />
              )}
              <div
                className="bk-colors-content"
                id="bk-colors-content"
                hidden={!disclosures.colors}
              >
                {mode === "generate" && (
                  <>
                    <p className="bk-section-hint">
                      Choose a seed to generate every role color.
                    </p>
                    <SeedSwatchPicker
                      seed={draft.seed}
                      onChange={(seed) =>
                        setDraft((d) => ({ ...d, seed, paletteTouched: true }))
                      }
                      showRolePreview={false}
                    />
                  </>
                )}
                <PaletteSwatchTiles
                  colors={previewColors}
                  onChange={
                    mode === "create"
                      ? (colors) =>
                          setDraft((d) => ({
                            ...d,
                            colors,
                            paletteTouched: true,
                          }))
                      : undefined
                  }
                  onCopy={copyBrandColorHex}
                  roleLabel={brandColorRoleLabel}
                />
                {mode === "create" && (
                  <>
                    <p className="bk-palette-hint">
                      Select a color to edit. Copy its hex with the icon.
                    </p>
                    <details
                      className="bk-palette-explore"
                      open={disclosures.presets}
                      onToggle={(event) =>
                        setDisclosure("presets", event.currentTarget.open)
                      }
                    >
                      <summary>
                        Explore palettes <ChevronDown aria-hidden="true" />
                      </summary>
                      <PalettePresetCards
                        onApply={(colors) =>
                          setDraft((d) => ({
                            ...d,
                            colors,
                            paletteTouched: true,
                          }))
                        }
                      />
                    </details>
                  </>
                )}
              </div>
            </section>

            <div className="bk-strategy-intro">
              <div>
                <h3>
                  Brand strategy <span>Optional</span>
                </h3>
                <p>Add context when you need it.</p>
              </div>
              <span className="bk-builder-count">
                {filled} of {FILLED_SECTION_TOTAL} sections filled
              </span>
            </div>

            <details
              className="bk-group"
              open={disclosures.purpose}
              onToggle={(event) =>
                setDisclosure("purpose", event.currentTarget.open)
              }
            >
              <summary className="bk-card-head">
                <span className="bk-card-icon">
                  <Compass aria-hidden="true" />
                </span>
                <span className="bk-card-heading">
                  <span className="bk-card-title">Purpose</span>
                  <span className="bk-card-hint">Vision and mission</span>
                </span>
                <ChevronDown
                  className="bk-disclosure-chevron"
                  aria-hidden="true"
                />
              </summary>
              <div className="bk-group-content">
                <div className="bk-pair">
                  <fieldset className="bk-section">
                    <legend>Vision</legend>
                    <p className="bk-section-hint">
                      Where is the brand headed?
                    </p>
                    <VisionField
                      profile={draft.profile}
                      onChange={patchProfile}
                    />
                  </fieldset>
                  <fieldset className="bk-section">
                    <legend>Mission</legend>
                    <p className="bk-section-hint">
                      What does the brand do, and for whom?
                    </p>
                    <MissionField
                      profile={draft.profile}
                      onChange={patchProfile}
                    />
                  </fieldset>
                </div>
              </div>
            </details>

            <details
              className="bk-group"
              open={disclosures.character}
              onToggle={(event) =>
                setDisclosure("character", event.currentTarget.open)
              }
            >
              <summary className="bk-card-head">
                <span className="bk-card-icon">
                  <Sparkles aria-hidden="true" />
                </span>
                <span className="bk-card-heading">
                  <span className="bk-card-title">Character</span>
                  <span className="bk-card-hint">
                    Values, emotion and voice
                  </span>
                </span>
                <ChevronDown
                  className="bk-disclosure-chevron"
                  aria-hidden="true"
                />
              </summary>
              <div className="bk-group-content">
                <div className="bk-pair">
                  <fieldset className="bk-section">
                    <legend>Core values</legend>
                    <p className="bk-section-hint">
                      Pick up to 5 that define the brand.
                    </p>
                    <ValuesField
                      profile={draft.profile}
                      onChange={patchProfile}
                    />
                  </fieldset>
                  <fieldset className="bk-section">
                    <legend>Emotion</legend>
                    <p className="bk-section-hint">
                      How should the brand feel?
                    </p>
                    <MultiSelect
                      options={EMOTION_PRESETS}
                      value={draft.emotions}
                      onChange={(emotions) =>
                        setDraft((d) => ({ ...d, emotions }))
                      }
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
              </div>
            </details>

            <details
              className="bk-group"
              open={disclosures.market}
              onToggle={(event) =>
                setDisclosure("market", event.currentTarget.open)
              }
            >
              <summary className="bk-card-head">
                <span className="bk-card-icon">
                  <Target aria-hidden="true" />
                </span>
                <span className="bk-card-heading">
                  <span className="bk-card-title">Market</span>
                  <span className="bk-card-hint">Audience and positioning</span>
                </span>
                <ChevronDown
                  className="bk-disclosure-chevron"
                  aria-hidden="true"
                />
              </summary>
              <div className="bk-group-content">
                <fieldset className="bk-section">
                  <legend>Target audience</legend>
                  <p className="bk-section-hint">
                    Who is this brand speaking to?
                  </p>
                  <AudienceField
                    profile={draft.profile}
                    onChange={patchProfile}
                  />
                </fieldset>
                <fieldset className="bk-section">
                  <legend>Positioning</legend>
                  <p className="bk-section-hint">
                    Where does the brand sit in the market?
                  </p>
                  <PositioningField
                    profile={draft.profile}
                    onChange={patchProfile}
                  />
                </fieldset>
              </div>
            </details>
          </div>
        </div>

        <div className="bk-builder-foot">
          <Button variant="outline" onClick={() => changeOpen(false)}>
            Cancel
          </Button>
          <Button onClick={finish} disabled={paletteBusy}>
            {mode === "create" ? "Create kit" : "Generate kit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
