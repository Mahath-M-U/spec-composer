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
  Trash2,
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  CREATIVE_STYLES,
  EMOTION_PRESETS,
  FILLED_SECTION_TOTAL,
  countFilledSections,
} from "./brand-profile";
import { FontSelect, MultiSelect, OptionSelect } from "./brand-select";
import {
  AudienceField,
  PaletteDetailsField,
  PalettePresetCards,
  PaletteSwatchTiles,
  PersonalityVoiceField,
  PositioningField,
  ValuesField,
  VisionField,
  MissionField,
} from "./brand-profile-inputs";
import {
  BRAND_COLOR_ROLES,
  BRAND_COLOR_USECASES,
  BrandKitPreview,
  brandColorRoleLabel,
  copyBrandColorHex,
  defaultBrandColorUsecase,
  selectedBrandColorUsecases,
} from "./brand-kit-panel";
import { assignBrandRoles, paletteWithSharesFromFile } from "./image-palette";
import {
  brandKitPatchFromDraft,
  createBrandKitDraft,
  type BrandKitBuilderMode,
} from "./brand-kit-draft";
export type { BrandKitBuilderMode } from "./brand-kit-draft";
import { useEditorStore } from "./store";
import type { BrandKit, BrandProfile } from "./types";

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
  initialKit,
  onSaved,
}: {
  open: boolean;
  mode: BrandKitBuilderMode;
  onOpenChange: (open: boolean) => void;
  initialKit?: BrandKit | undefined;
  onSaved: (id: string) => void;
}) {
  const s = useEditorStore();
  const [draft, setDraft] = useState(() =>
    createBrandKitDraft(mode, initialKit),
  );
  const [disclosures, setDisclosures] = useState(initialDisclosures);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
      setDraft(createBrandKitDraft(mode, initialKit));
      setDeleteOpen(false);
      setDisclosures(initialDisclosures());
    }
    return () => {
      generation.value++;
      paletteProcessing.current = false;
    };
  }, [open, mode, initialKit]);

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
    if (!file || paletteProcessing.current || !open) return;
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

  const previewColors = draft.colors;
  const previewKit: BrandKit = {
    id: "preview",
    ...brandKitPatchFromDraft(draft),
    createdAt: "",
    updatedAt: "",
  };
  const filled = countFilledSections({
    profile: draft.profile,
    emotions: draft.emotions,
    paletteTouched: draft.paletteTouched,
    typographyTouched: draft.typographyTouched,
  });

  const finish = () => {
    if (paletteProcessing.current) return;
    const patch = brandKitPatchFromDraft(draft);
    let id: string;
    if (mode === "edit") {
      if (!initialKit) return;
      s.updateBrandKit(initialKit.id, patch);
      id = initialKit.id;
    } else if (mode === "generate") {
      id = s.createMaterialKit(patch.name, draft.seed, patch);
    } else {
      id = s.createBrandKit(patch.name, patch);
    }
    onSaved(id);
    changeOpen(false);
  };

  const blockEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.preventDefault();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="bk-builder">
          <div className="bk-builder-head">
            <DialogTitle className="bk-builder-title">
              {mode === "edit"
                ? "Edit design kit"
                : mode === "generate"
                  ? "Generate design kit"
                  : "New design kit"}
            </DialogTitle>
          </div>

          <div className="bk-builder-body">
            <div className="bk-builder-preview">
              <span className="bk-preview-label">Live preview</span>
              <BrandKitPreview kit={previewKit} variant="builder" />
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
                  placeholder="Name this design kit"
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
                <label className="bk-builder-style-field">
                  <span>Creative style</span>
                  <OptionSelect
                    value={draft.style}
                    options={[
                      ...CREATIVE_STYLES,
                      ...(!CREATIVE_STYLES.some(
                        (style) => style === draft.style,
                      ) && draft.style
                        ? [draft.style]
                        : []),
                    ].map((style) => ({ id: style, label: style }))}
                    onChange={(style) => setDraft((d) => ({ ...d, style }))}
                    ariaLabel="Creative style"
                    placeholder="Choose a style"
                  />
                </label>
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
                    <Hint
                      label={
                        disclosures.colors ? "Collapse colors" : "Expand colors"
                      }
                    >
                      <button
                        type="button"
                        className="bk-colors-action"
                        aria-label={
                          disclosures.colors
                            ? "Collapse colors"
                            : "Expand colors"
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
                <input
                  ref={paletteFileInput}
                  type="file"
                  hidden
                  tabIndex={-1}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onPickPalette}
                />
                <div
                  className="bk-colors-content"
                  id="bk-colors-content"
                  hidden={!disclosures.colors}
                >
                  <PaletteSwatchTiles
                    colors={previewColors}
                    onChange={(colors) =>
                      setDraft((d) => ({ ...d, colors, paletteTouched: true }))
                    }
                    onCopy={copyBrandColorHex}
                    roleLabel={brandColorRoleLabel}
                  />
                  <p className="bk-palette-hint">
                    Select a color to edit. Copy its hex with the icon.
                  </p>
                  <PaletteDetailsField
                    colors={draft.colors}
                    onChange={(colors) =>
                      setDraft((d) => ({ ...d, colors, paletteTouched: true }))
                    }
                    roles={BRAND_COLOR_ROLES}
                    usecases={BRAND_COLOR_USECASES}
                    defaultUsecase={defaultBrandColorUsecase}
                    selectedUsecases={selectedBrandColorUsecases}
                  />
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
                      Pick an archetype and how it sounds; fine-tune if you
                      like.
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
                    <span className="bk-card-hint">
                      Audience and positioning
                    </span>
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
            {mode === "edit" && initialKit && (
              <Button
                variant="ghost"
                className="bk-builder-delete"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 aria-hidden="true" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => changeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={finish} disabled={paletteBusy}>
              {mode === "edit"
                ? "Save changes"
                : mode === "generate"
                  ? "Generate kit"
                  : "Create kit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bk-builder-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{initialKit?.name}”?</AlertDialogTitle>
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
                if (!initialKit) return;
                if (initialKit.sourceKind === "material3")
                  s.deleteMaterialKit(initialKit.id);
                else s.deleteBrandKit(initialKit.id);
                setDeleteOpen(false);
                changeOpen(false);
              }}
            >
              Delete design kit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
