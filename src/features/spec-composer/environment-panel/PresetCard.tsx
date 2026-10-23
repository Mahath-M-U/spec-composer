import type { EnvironmentPreset } from "../environment-presets";
import { PresetPreview } from "./PresetPreview";

const COPY: Record<string, { title: string; description: string }> = {
  studio: { title: "Studio", description: "Clean three-point rig" },
  outdoor: { title: "Outdoor", description: "Natural sunlight" },
  indoor: { title: "Indoor", description: "Warm window lighting" },
  "product-photography": {
    title: "Product Photography",
    description: "Crisp, clean lighting",
  },
  abstract: { title: "Abstract", description: "Bold color gels" },
};

export function PresetCard({
  preset,
  active,
  onClick,
}: {
  preset: EnvironmentPreset;
  active: boolean;
  onClick: () => void;
}) {
  const copy = COPY[preset.id] ?? {
    title: preset.label,
    description: preset.description,
  };
  return (
    <button
      type="button"
      className="environment-preset-card"
      aria-label={`Apply ${preset.label} preset`}
      aria-pressed={active}
      title={preset.description}
      onClick={onClick}
    >
      <PresetPreview id={preset.id} />
      <span className="environment-tile-text">
        <strong>{copy.title}</strong>
        <small>{copy.description}</small>
      </span>
    </button>
  );
}
