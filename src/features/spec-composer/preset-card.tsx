import type { ReactNode } from "react";
import { Check, Plus, Ratio, Ruler } from "lucide-react";
import "./preset-card.css";

type CardVariant = "home" | "resize";
type PresetCardProps = {
  title: string;
  width: number;
  height: number;
  artwork: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  variant?: CardVariant;
  ratio?: string;
  badge?: string | undefined;
  selected?: boolean;
  current?: boolean;
  disabled?: boolean;
};

/** A size-selection button. Its caller owns all creation and resize behavior. */
export function PresetCard({
  title,
  width,
  height,
  artwork,
  onClick,
  ariaLabel,
  variant = "home",
  ratio,
  badge,
  selected,
  current,
  disabled,
}: PresetCardProps) {
  const resize = variant === "resize";
  return (
    <button
      type="button"
      className={`${resize ? "resize-format-card" : "format-card"} preset-card preset-card--${variant}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={resize ? !!selected : selected}
      disabled={disabled}
    >
      <span
        className={`preset-card-art${resize ? " resize-card-art" : ""}`}
        aria-hidden="true"
      >
        {artwork}
        {current && <span className="resize-card-current">Current</span>}
        {selected && (
          <span className="resize-card-check">
            <Check size={13} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={resize ? "resize-card-details" : "preset-card-details"}>
        <span
          className={resize ? "resize-card-title" : "preset-card-title"}
          title={title}
        >
          <span>{title}</span>
        </span>
        {ratio && (
          <span className="resize-card-ratio" title={`Aspect ratio ${ratio}`}>
            <Ratio size={8} aria-hidden="true" />
            <span>{ratio}</span>
          </span>
        )}
        <span
          className={resize ? "resize-card-meta" : "preset-card-meta"}
          title={`${width} × ${height} px`}
        >
          {resize && <Ruler size={8} aria-hidden="true" />}
          <span>
            {resize ? `${width}×${height}` : `${width} × ${height} px`}
          </span>
        </span>
        {badge && <span className="preset-card-badge">{badge}</span>}
      </span>
    </button>
  );
}

export function PresetCreateCard({
  onClick,
  variant = "home",
  title = "Create a design",
  description = "Preset or custom size",
  ariaLabel = "Create a design with a preset or custom size",
  selected,
  disabled,
}: {
  onClick: () => void;
  variant?: CardVariant;
  title?: string;
  description?: string;
  ariaLabel?: string;
  selected?: boolean;
  disabled?: boolean;
}) {
  const resize = variant === "resize";
  return (
    <button
      type="button"
      className={`${resize ? "resize-format-card resize-format-card--custom" : "format-card format-card--add"} preset-card preset-card--${variant} preset-card--create`}
      aria-label={ariaLabel}
      aria-pressed={resize ? !!selected : selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="preset-card-art preset-create-art" aria-hidden="true">
        <Plus size={28} />
      </span>
      <span
        className={
          resize
            ? "resize-card-details resize-card-details--custom"
            : "preset-card-details"
        }
      >
        <span
          className={resize ? "resize-card-title" : "preset-card-title"}
          title={title}
        >
          <span>{title}</span>
        </span>
        <span
          className={resize ? "resize-card-meta" : "preset-card-meta"}
          title={description}
        >
          {resize && <Ruler size={8} aria-hidden="true" />}
          <span>{description}</span>
        </span>
      </span>
    </button>
  );
}
