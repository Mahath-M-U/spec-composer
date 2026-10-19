import { useState, type ReactNode } from "react";
import { Plus, Sun, Trash2 } from "lucide-react";
import { CommitInput } from "./committed-input";
import { useEditorStore } from "./store";
import {
  MAX_STUDIO_LIGHTS,
  STUDIO_LIGHT_ROLES,
  STUDIO_LIGHT_SHAPES,
  STUDIO_LIGHT_MODIFIERS,
  STUDIO_PRESETS,
} from "./studio-lighting";
import { SHADOW_TYPES, type StudioLight } from "./types";

function LightSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="se-field">
      <span>{label}</span>
      <select
        className="se-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function LightDetails({ light }: { light: StudioLight }) {
  const update = useEditorStore((s) => s.updateStudioLight);
  const numberField = (
    label: string,
    key:
      | "azimuth"
      | "elevation"
      | "width"
      | "height"
      | "intensity"
      | "diffusion"
      | "temperature",
    min: number,
    max: number,
    step = 1,
  ) => (
    <CommitInput
      label={label}
      value={String(light[key])}
      numeric
      required
      min={min}
      max={max}
      step={step}
      onCommit={(value) => update(light.id, { [key]: Number(value) })}
    />
  );
  return (
    <div className="studio-light-details">
      <div className="studio-section-heading">
        <h4>Selected light</h4>
        <span>{light.enabled ? "Enabled" : "Disabled in output"}</span>
      </div>
      <CommitInput
        label="Name"
        value={light.name}
        required
        maxLength={60}
        onCommit={(name) => update(light.id, { name })}
      />
      <div className="se-row">
        <LightSelect
          label="Role"
          value={light.role}
          options={STUDIO_LIGHT_ROLES}
          onChange={(role) =>
            update(light.id, { role: role as StudioLight["role"] })
          }
        />
        <LightSelect
          label="Modifier"
          value={light.modifier}
          options={STUDIO_LIGHT_MODIFIERS}
          onChange={(modifier) =>
            update(light.id, { modifier: modifier as StudioLight["modifier"] })
          }
        />
      </div>
      <div className="studio-section-heading">
        <h4>Position</h4>
        <span>Camera relative</span>
      </div>
      <div className="se-row">
        {numberField("Azimuth (°)", "azimuth", -180, 180)}
        {numberField("Elevation (°)", "elevation", -90, 90)}
      </div>
      <p className="workflow-hint">
        0° is front; −90° left, +90° right, ±180° behind. Elevation: 0° at
        subject, +90° overhead.
      </p>
      <div className="studio-section-heading">
        <h4>Light & softness</h4>
      </div>
      <div className="se-row">
        {numberField("Intensity (0–100)", "intensity", 0, 100)}
        {numberField("Diffusion (%)", "diffusion", 0, 100)}
      </div>
      <p className="workflow-hint">
        Intensity is relative, not watts. Diffusion describes the desired
        softness in the prompt.
      </p>
      <LightSelect
        label="Source shape"
        value={light.shape}
        options={STUDIO_LIGHT_SHAPES}
        onChange={(shape) =>
          update(light.id, { shape: shape as StudioLight["shape"] })
        }
      />
      <div className="se-row">
        {numberField(
          light.shape === "Disk"
            ? "Diameter (× subject width)"
            : "Width (× subject width)",
          "width",
          0.1,
          5,
          0.1,
        )}
        {light.shape === "Rectangle" &&
          numberField("Height (× subject width)", "height", 0.1, 5, 0.1)}
      </div>
      <p className="workflow-hint">
        Larger sources suggest broader, softer light. 1× equals the subject’s
        width.
      </p>
      <details className="studio-advanced">
        <summary>Color & shadows</summary>
        <div className="se-row">
          {numberField("Temperature (K)", "temperature", 2000, 10000, 100)}
          <LightSelect
            label="Shadows"
            value={light.shadows}
            options={SHADOW_TYPES}
            onChange={(shadows) =>
              update(light.id, { shadows: shadows as StudioLight["shadows"] })
            }
          />
        </div>
      </details>
    </div>
  );
}

function RigSchematic({
  lights,
  selectedId,
  onSelect,
}: {
  lights: StudioLight[];
  selectedId?: string | undefined;
  onSelect: (id: string) => void;
}) {
  // Leader lines keep the true source bearing visible when labels must separate.
  const placed: { x: number; y: number }[] = [];
  const positions = lights.map((light) => {
    const angle = (light.azimuth * Math.PI) / 180;
    const source = {
      x: 120 + Math.sin(angle) * 78,
      y: 92 + Math.cos(angle) * 56,
    };
    const candidates = [source];
    for (let y = 30; y <= 150; y += 30) {
      for (let x = 30; x <= 210; x += 30) candidates.push({ x, y });
    }
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - source.x, a.y - source.y) -
        Math.hypot(b.x - source.x, b.y - source.y),
    );
    const marker =
      candidates.find(
        (point) =>
          Math.hypot(point.x - 120, point.y - 92) > 30 &&
          placed.every(
            (other) => Math.hypot(point.x - other.x, point.y - other.y) >= 30,
          ),
      ) ?? source;
    placed.push(marker);
    return { source, marker };
  });
  return (
    <figure className="studio-rig-figure">
      <figcaption>Rig schematic ? prompt only</figcaption>
      <div className="studio-rig-diagram">
        <svg viewBox="0 0 240 200" aria-hidden="true" focusable="false">
          <ellipse className="studio-orbit" cx="120" cy="92" rx="78" ry="56" />
          <path className="studio-axis" d="M120 20v165M25 92h190" />
          {lights.map((light, index) => {
            const position = positions[index];
            if (!position) return null;
            const { source, marker } = position;
            return (
              <g key={light.id} className={light.enabled ? "" : "is-disabled"}>
                <line
                  className="studio-ray"
                  x1="120"
                  y1="92"
                  x2={source.x}
                  y2={source.y}
                />
                <circle
                  className="studio-source-point"
                  cx={source.x}
                  cy={source.y}
                  r="2"
                />
                <line
                  className="studio-label-leader"
                  x1={source.x}
                  y1={source.y}
                  x2={marker.x}
                  y2={marker.y}
                />
              </g>
            );
          })}
          <circle className="studio-subject" cx="120" cy="92" r="16" />
          <text x="120" y="96" className="studio-subject-label">
            Subject
          </text>
          <text x="120" y="13">
            Behind
          </text>
          <text x="18" y="96">
            L
          </text>
          <text x="222" y="96">
            R
          </text>
          <path
            className="studio-camera"
            d="M112 174h16v10h-16zM116 174v-3h8v3"
          />
          <text x="120" y="197">
            Camera / front ? 0?
          </text>
        </svg>
        {lights.map((light, index) => {
          const position = positions[index];
          if (!position) return null;
          const { marker } = position;
          return (
            <button
              key={light.id}
              type="button"
              className={`studio-light-marker${light.enabled ? "" : " is-disabled"}`}
              style={{
                left: `${(marker.x / 240) * 100}%`,
                top: `${(marker.y / 200) * 100}%`,
              }}
              aria-label={`Select ${light.name}${light.enabled ? "" : " (disabled)"}`}
              aria-pressed={selectedId === light.id}
              title={`${light.name} ? ${light.elevation}? elevation`}
              onClick={() => onSelect(light.id)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <p className="workflow-hint">
        Top view. Select a numbered source to adjust it. Dotted leaders separate
        crowded labels; source positions stay fixed. Elevation and size are set
        below.
      </p>
    </figure>
  );
}

export function StudioLightingEditor({ children }: { children: ReactNode }) {
  const s = useEditorStore();
  const [selectedId, setSelectedId] = useState<string>();
  const lights = s.doc?.generationSettings?.studioLights;
  const selected =
    lights?.find((light) => light.id === selectedId) ?? lights?.[0];
  return (
    <div
      className="studio-lighting-editor"
      onPointerDownCapture={(event) => {
        // Commit a pending field before actions that replace, remove or select a light.
        const active = event.currentTarget.ownerDocument.activeElement;
        if (
          active instanceof HTMLInputElement &&
          event.currentTarget.contains(active) &&
          active !== event.target
        )
          active.blur();
      }}
    >
      <div className="studio-section-heading">
        <h3>Studio lighting</h3>
        <span>Up to {MAX_STUDIO_LIGHTS} sources</span>
      </div>
      <p className="workflow-hint">
        Start with a diffused setup for a model or product, then tune each
        source. Presets replace the current lights; undo restores them.
      </p>
      <div className="studio-preset-options">
        {STUDIO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.description}
            onClick={() => {
              s.applyStudioPreset(preset.id);
              setSelectedId(
                useEditorStore.getState().doc?.generationSettings
                  ?.studioLights?.[0]?.id,
              );
            }}
          >
            <Sun aria-hidden="true" />
            <span>
              <strong>{preset.label}</strong>
              <small>{preset.description}</small>
            </span>
          </button>
        ))}
      </div>
      {lights !== undefined && (
        <>
          <RigSchematic
            lights={lights}
            selectedId={selected?.id}
            onSelect={setSelectedId}
          />
          <div className="studio-section-heading">
            <h4>Light sources</h4>
            <span>
              {lights.filter((light) => light.enabled).length} / {lights.length}{" "}
              enabled
            </span>
          </div>
          <ul className="studio-light-list" aria-label="Studio light sources">
            {lights.map((light, index) => (
              <li key={light.id} data-selected={selected?.id === light.id}>
                <input
                  type="checkbox"
                  checked={light.enabled}
                  aria-label={`Enable ${light.name}`}
                  onChange={(event) =>
                    s.updateStudioLight(light.id, {
                      enabled: event.target.checked,
                    })
                  }
                />
                <button
                  type="button"
                  className="studio-light-select"
                  aria-pressed={selected?.id === light.id}
                  onClick={() => setSelectedId(light.id)}
                >
                  <span className="studio-light-number">{index + 1}</span>
                  <span>
                    <strong>{light.name}</strong>
                    <small>
                      {light.role} · {light.modifier} · {light.intensity}%
                    </small>
                  </span>
                </button>
                <button
                  type="button"
                  className="studio-light-remove"
                  aria-label={`Remove ${light.name}`}
                  title={`Remove ${light.name}`}
                  onClick={() => s.removeStudioLight(light.id)}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {lights.length === 0 && (
            <p className="workflow-hint" role="status">
              No sources yet. Add a light or choose a studio preset. This rig
              currently requests ambient illumination only.
            </p>
          )}
          {lights.length > 0 && !lights.some((light) => light.enabled) && (
            <p className="workflow-hint" role="status">
              All sources are disabled. The prompt requests ambient illumination
              only.
            </p>
          )}
        </>
      )}
      <div className="studio-rig-actions">
        <button
          type="button"
          className="studio-add-light"
          disabled={(lights?.length ?? 0) >= MAX_STUDIO_LIGHTS}
          onClick={() => {
            s.addStudioLight();
            setSelectedId(
              useEditorStore
                .getState()
                .doc?.generationSettings?.studioLights?.at(-1)?.id,
            );
          }}
        >
          <Plus aria-hidden="true" />
          Add light
        </button>
        {lights !== undefined && (
          <button
            type="button"
            className="studio-simple-toggle"
            onClick={() => s.resetStudioRig()}
          >
            Use simple lighting
          </button>
        )}
      </div>
      {(lights?.length ?? 0) >= MAX_STUDIO_LIGHTS && (
        <p className="workflow-hint">
          Six-source limit reached. Remove a source to add another.
        </p>
      )}
      {lights === undefined ? (
        <div className="studio-simple-fields">
          <div className="studio-section-heading">
            <h4>Simple lighting</h4>
          </div>
          {children}
        </div>
      ) : selected ? (
        <LightDetails key={selected.id} light={selected} />
      ) : null}
    </div>
  );
}
