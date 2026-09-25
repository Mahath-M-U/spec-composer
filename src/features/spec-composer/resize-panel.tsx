import { useEffect, useRef, useState } from "react";
import { Check, Plus, Scaling, Search, X } from "lucide-react";
import { toast } from "sonner";
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
import { FormatPreview } from "./format-gallery";
import { PanelHeader } from "./panel-header";
import {
  RESIZE_PRESET_GROUPS,
  fromPixels,
  hasResizeTextOverrides,
  makeResizeFormat,
  toPixels,
  validateResizeSize,
  type ResizePreset,
  type ResizeUnit,
} from "./resize";
import { useEditorStore } from "./store";

const VARIANTS = [
  "editorial",
  "type",
  "product",
  "minimal",
  "tint",
  "banner",
  "video",
] as const;
const PRESET_CARDS = RESIZE_PRESET_GROUPS.flatMap((group, groupIndex) =>
  group.presets.map((preset, presetIndex) => ({
    group: group.label,
    preset,
    format: {
      ...makeResizeFormat(preset.width, preset.height, preset),
      previewVariant:
        VARIANTS[(groupIndex * 3 + presetIndex) % VARIANTS.length],
    },
  })),
);

export function ResizePanel() {
  const doc = useEditorStore((state) => state.doc);
  const [unit, setUnit] = useState<ResizeUnit>("px");
  const [widthDraft, setWidthDraft] = useState(() =>
    String(doc?.format.width ?? 1080),
  );
  const [heightDraft, setHeightDraft] = useState(() =>
    String(doc?.format.height ?? 1080),
  );
  const [query, setQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const unitRef = useRef(unit);
  unitRef.current = unit;
  const docId = doc?.id;
  const docWidth = doc?.format.width;
  const docHeight = doc?.format.height;

  useEffect(() => {
    if (docWidth === undefined || docHeight === undefined) return;
    setWidthDraft(fromPixels(docWidth, unitRef.current));
    setHeightDraft(fromPixels(docHeight, unitRef.current));
  }, [docId, docWidth, docHeight]);

  useEffect(() => {
    setSelectedId(null);
    setCustomOpen(false);
  }, [docId]);

  if (!doc) return null;
  const width = toPixels(widthDraft, unit);
  const height = toPixels(heightDraft, unit);
  const selectedCard = selectedId
    ? PRESET_CARDS.find((card) => card.preset.id === selectedId)
    : undefined;
  const target = selectedCard
    ? { width: selectedCard.preset.width, height: selectedCard.preset.height }
    : customOpen
      ? { width, height }
      : null;
  const error = customOpen ? validateResizeSize(width, height) : null;
  const unchanged =
    !!target &&
    target.width === doc.format.width &&
    target.height === doc.format.height;
  const disabled = pending || !target || !!error || unchanged;
  const isCurrent = (preset: ResizePreset) =>
    preset.width === doc.format.width && preset.height === doc.format.height;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCards = PRESET_CARDS.filter(({ group, preset, format }) =>
    `${group} ${preset.label} ${preset.width} ${preset.height} ${format.subtitle}`
      .toLowerCase()
      .includes(normalizedQuery),
  );
  const showCustomCard =
    !normalizedQuery || "custom size create design".includes(normalizedQuery);

  const changeUnit = (nextUnit: ResizeUnit) => {
    const widthPx = toPixels(widthDraft, unit);
    const heightPx = toPixels(heightDraft, unit);
    setWidthDraft(
      Number.isFinite(widthPx) ? fromPixels(widthPx, nextUnit) : widthDraft,
    );
    setHeightDraft(
      Number.isFinite(heightPx) ? fromPixels(heightPx, nextUnit) : heightDraft,
    );
    setUnit(nextUnit);
  };

  const togglePreset = (id: string) => {
    if (pending) return;
    setCustomOpen(false);
    setSelectedId((current) => (current === id ? null : id));
  };

  const performResize = async () => {
    if (pending) return;
    setPending(true);
    try {
      const current = useEditorStore.getState().doc;
      if (!current) return;
      const card = selectedCard;
      const format = card
        ? makeResizeFormat(card.preset.width, card.preset.height, card.preset)
        : makeResizeFormat(width, height);
      const changed = useEditorStore.getState().resizeCurrent(format);
      if (!changed) return;
      await useEditorStore.getState().saveNow();
      if (useEditorStore.getState().saveStatus === "error")
        throw new Error("The resized design could not be saved.");
      setSelectedId(null);
      toast.success(
        card
          ? `Resized to ${card.group} ${card.preset.label} (${card.preset.width} × ${card.preset.height} px)`
          : `Resized to ${width} × ${height} px`,
      );
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Could not resize this design.",
      );
    } finally {
      setPending(false);
    }
  };

  const requestResize = () => {
    if (disabled) return;
    if (hasResizeTextOverrides(doc)) setConfirmOpen(true);
    else void performResize();
  };

  const actionText = unchanged
    ? "The design is already this size."
    : !target || selectedCard
      ? null
      : "Resize the current design. Elements scale to fit; you can undo it.";

  return (
    <div className="resize-panel">
      <PanelHeader
        icon={Scaling}
        eyebrow="Canvas"
        title="Resize"
        meta={
          <span
            aria-label={`Current size ${doc.format.width} × ${doc.format.height} pixels`}
          >
            {doc.format.width} × {doc.format.height} px
          </span>
        }
      />

      <div className="resize-gallery-body">
        {customOpen && (
          <section className="resize-custom-form" aria-label="Custom size">
            <div className="resize-custom-form-title">
              <strong>Custom size</strong>
              <button
                type="button"
                aria-label="Close custom size"
                onClick={() => setCustomOpen(false)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="resize-custom-fields">
              <label htmlFor="resize-width">
                Width
                <input
                  id="resize-width"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={widthDraft}
                  onChange={(event) => setWidthDraft(event.target.value)}
                />
              </label>
              <label htmlFor="resize-height">
                Height
                <input
                  id="resize-height"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={heightDraft}
                  onChange={(event) => setHeightDraft(event.target.value)}
                />
              </label>
              <label htmlFor="resize-units">
                Units
                <select
                  id="resize-units"
                  value={unit}
                  onChange={(event) =>
                    changeUnit(event.target.value as ResizeUnit)
                  }
                >
                  <option value="px">px</option>
                  <option value="in">in</option>
                  <option value="cm">cm</option>
                </select>
              </label>
            </div>
            <p>Physical units use 96 px per inch.</p>
            {error && (
              <p className="resize-error" role="alert">
                {error}
              </p>
            )}
          </section>
        )}

        <div className="resize-search asset-search-wrap">
          <Search aria-hidden="true" />
          <input
            className="asset-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sizes"
            aria-label="Search sizes"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear size search"
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="resize-card-grid" aria-label="Available sizes">
          {showCustomCard && (
            <button
              type="button"
              className="resize-format-card resize-format-card--custom"
              aria-label="Enter a custom size"
              aria-pressed={customOpen}
              onClick={() => {
                setSelectedId(null);
                setCustomOpen((open) => !open);
              }}
            >
              <span className="resize-custom-visual" aria-hidden="true">
                <Plus size={28} />
              </span>
              <span className="resize-card-title">Custom size</span>
              <span className="resize-card-meta">Enter width and height</span>
            </button>
          )}
          {visibleCards.map(({ group, preset, format }, index) => {
            const selected = preset.id === selectedId;
            const current = isCurrent(preset);
            return (
              <button
                key={preset.id}
                type="button"
                className="resize-format-card"
                aria-pressed={selected}
                aria-label={`${selected ? "Deselect" : "Select"} ${group} ${preset.label}, ${preset.width} by ${preset.height} pixels${current ? ", current size" : ""}`}
                onClick={() => togglePreset(preset.id)}
              >
                <div className="resize-card-art">
                  <FormatPreview format={format} index={index} />
                  {current && (
                    <span className="resize-card-current" aria-hidden="true">
                      Current
                    </span>
                  )}
                  {selected && (
                    <span className="resize-card-check" aria-hidden="true">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="resize-card-title">
                  {group} {preset.label}
                </span>
                <span className="resize-card-meta">
                  {preset.width} × {preset.height} px · {format.subtitle}
                </span>
              </button>
            );
          })}
          {!showCustomCard && !visibleCards.length && (
            <p className="resize-empty">No sizes match.</p>
          )}
        </div>
      </div>

      <div className="resize-action-bar">
        {actionText && <p>{actionText}</p>}
        <button type="button" disabled={disabled} onClick={requestResize}>
          {pending ? "Resizing…" : "Resize design"}
        </button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate size-dependent text?</AlertDialogTitle>
            <AlertDialogDescription>
              This design has hand-edited prompt or DESIGN.md text that may
              contain old dimensions. Resizing will regenerate that text. Undo
              restores it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void performResize()}>
              Resize and regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
