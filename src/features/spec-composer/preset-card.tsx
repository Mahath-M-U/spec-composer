import { Check, Plus, Proportions, Ruler } from "lucide-react";
import { dimensionRatio, type PresetDescriptor } from "./preset-catalog";
import { PresetArtwork } from "./resize-preset-preview";
import "./preset-card.css";

type PresetCardProps = {
  onClick: () => void;
  ariaLabel?: string;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
} & (
  | {
      mode?: "preset";
      preset: PresetDescriptor;
      current?: boolean;
    }
  | { mode: "create"; title?: string; description?: string }
);

/** The caller owns creation and resize behavior; all cards share this surface. */
export function PresetCard(props: PresetCardProps) {
  const create = props.mode === "create";
  const title = create
    ? (props.title ?? "Create a design")
    : props.preset.label;
  const description = create
    ? (props.description ?? "Preset or custom size")
    : "";
  const ratio = create
    ? ""
    : dimensionRatio(props.preset.width, props.preset.height);
  const metadata = create ? null : (
    <span className="preset-card-metadata">
      <span className="preset-card-ratio" title={`Aspect ratio ${ratio}`}>
        <Proportions size={10} aria-hidden="true" />
        <span>{ratio}</span>
      </span>
      <span
        className="preset-card-meta"
        title={`${props.preset.width} × ${props.preset.height} px`}
      >
        <Ruler size={10} aria-hidden="true" />
        <span>
          {props.preset.width}×{props.preset.height}
        </span>
      </span>
    </span>
  );
  return (
    <button
      type="button"
      className={`preset-card${create ? " preset-card--create" : ""}${props.className ? ` ${props.className}` : ""}`}
      onClick={props.onClick}
      aria-label={
        props.ariaLabel ??
        (create
          ? `${title} with a preset or custom size`
          : `${title}, ${props.preset.width} by ${props.preset.height} pixels`)
      }
      aria-pressed={props.selected}
      disabled={props.disabled}
    >
      {create ? (
        <>
          <Plus size={28} aria-hidden="true" />
          <span className="preset-card-title" title={title}>
            {title}
          </span>
          <span className="preset-card-description" title={description}>
            {description}
          </span>
        </>
      ) : (
        <>
          <span className="preset-card-art">
            <PresetArtwork {...props.preset} />
            {(props.current || props.preset.animated || props.selected) && (
              <span className="preset-card-status" aria-hidden="true">
                {props.current && (
                  <span className="preset-card-current">Current</span>
                )}
                {props.preset.animated && (
                  <span className="preset-card-badge">Animated</span>
                )}
                {props.selected && (
                  <span className="preset-card-check">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </span>
            )}
          </span>
          <span className="preset-card-details">
            <span className="preset-card-title" title={title}>
              {title}
            </span>
            {metadata}
          </span>
        </>
      )}
    </button>
  );
}
