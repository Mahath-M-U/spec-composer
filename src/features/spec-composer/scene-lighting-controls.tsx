import { useId } from "react";
import { CommitInput } from "./committed-input";
import { DescriptionTemplateControls } from "./description-template-controls";
import { StudioLightingEditor } from "./studio-lighting-editor";
import { LIGHT_SOURCE_PRESETS } from "./studio-lighting";
import { ART_FIELDS } from "./art-direction";
import {
  SHAPE_ROLE_OPTIONS,
  SHAPE_TYPES,
  SHAPE_TYPE_LABELS,
  effectiveRadius,
  type ShapeType,
} from "./shape-workflow";
import { useEditorStore } from "./store";
import {
  CAMERA_ANGLES,
  LIGHT_DIRECTIONS,
  LIGHT_TYPES,
  SHADOW_TYPES,
  type SpecElement,
  type ShapeRole,
  type GenerationSettings,
} from "./types";

export function ShapeControls({ element }: { element: SpecElement }) {
  const s = useEditorStore();
  return (
    <fieldset className="shape-controls" disabled={element.locked}>
      <div className="se-row">
        <label className="se-field">
          <span>Shape</span>
          <select
            className="se-input"
            value={element.style.shapeType ?? "rectangle"}
            onChange={(event) =>
              s.updateShapeAppearance(element.id, {
                shapeType: event.target.value as ShapeType,
              })
            }
          >
            {!SHAPE_TYPES.includes(element.style.shapeType as ShapeType) &&
              element.style.shapeType && (
                <option value={element.style.shapeType}>
                  {element.style.shapeType}
                </option>
              )}
            {SHAPE_TYPES.map((type) => (
              <option key={type} value={type}>
                {SHAPE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="se-field">
          <span>Role</span>
          <select
            className="se-input"
            value={element.semanticRole ?? ""}
            onChange={(event) =>
              s.setShapeRole(element.id, event.target.value as ShapeRole)
            }
          >
            {!element.semanticRole && (
              <option value="" disabled>
                Choose role
              </option>
            )}
            {SHAPE_ROLE_OPTIONS.map(([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="workflow-hint">
        Role: canvas label + output. Position, size and appearance: canvas +
        output.
      </p>
      {element.style.shapeType === "rounded rectangle" && (
        <CommitInput
          label="Corner radius"
          value={String(effectiveRadius(element))}
          numeric
          max={Math.min(element.width, element.height) / 2}
          onCommit={(value) => {
            const radius = Number(value);
            if (Number.isFinite(radius))
              s.updateShapeAppearance(element.id, {
                borderRadius: Math.max(
                  0,
                  Math.min(radius, Math.min(element.width, element.height) / 2),
                ),
              });
          }}
        />
      )}
      <DescriptionTemplateControls key={element.id} element={element} />
    </fieldset>
  );
}

export function SceneLightingControls({
  field,
  presentation = "collapsible",
}: {
  field?: "scene" | "lighting";
  presentation?: "collapsible" | "inline";
}) {
  const s = useEditorStore();
  const id = useId();
  const d = s.doc;
  if (!d) return null;
  const settings = d.generationSettings ?? {};
  const settingSelect = <
    K extends Exclude<keyof GenerationSettings, "studioLights">,
  >(
    label: string,
    key: K,
    options: readonly string[],
  ) => (
    <label className="se-field">
      <span>{label}</span>
      <select
        className="se-input"
        value={settings[key] ?? ""}
        onChange={(event) =>
          s.updateGenerationSettings({ [key]: event.target.value || undefined })
        }
      >
        <option value="">Unspecified</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
  const content = (
    <div className="scene-lighting-fields">
      <p className="workflow-hint">
        Prompt only · These settings describe the generated image; the canvas
        remains a layout preview.
      </p>
      {(["scene", "lighting"] as const)
        .filter((key) => !field || field === key)
        .map((key) => (
          <div key={key} className="scene-lighting-group">
            <label className="scene-include">
              <input
                type="checkbox"
                checked={d.promptOptions[key] === true}
                onChange={(event) =>
                  s.mutate((doc) => {
                    doc.promptOptions[key] = event.target.checked;
                  })
                }
              />
              Include {key === "scene" ? "scene" : "lighting"} in output
            </label>
            {key === "scene" && (
              <CommitInput
                label="Environment"
                value={d[key] ?? ""}
                placeholder={ART_FIELDS[key].placeholder}
                onCommit={(value) =>
                  s.mutate((doc) => {
                    doc[key] = value;
                    doc.promptOptions[key] = true;
                  })
                }
              />
            )}
            {key === "scene" && (
              <div className="scene-presets">
                {ART_FIELDS[key].presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      s.mutate((doc) => {
                        doc[key] = preset;
                        doc.promptOptions[key] = true;
                      })
                    }
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
            {key === "scene" ? (
              settingSelect("Camera angle", "cameraAngle", CAMERA_ANGLES)
            ) : (
              <>
                <div
                  className="light-source-presets"
                  role="group"
                  aria-label="Light source"
                >
                  {LIGHT_SOURCE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={
                        settings.studioLights === undefined &&
                        settings.lightType === preset.settings.lightType
                      }
                      onClick={() =>
                        s.updateGenerationSettings({
                          ...preset.settings,
                          studioLights: undefined,
                        })
                      }
                    >
                      <strong>{preset.label}</strong>
                      <span>{preset.description}</span>
                    </button>
                  ))}
                </div>
                <p className="workflow-hint">
                  Choosing a source replaces the studio setup. Undo restores it.
                </p>
                <StudioLightingEditor key={d.id}>
                  <div className="se-row">
                    {settingSelect("Light type", "lightType", LIGHT_TYPES)}
                    {settingSelect(
                      "Direction",
                      "lightDirection",
                      LIGHT_DIRECTIONS,
                    )}
                  </div>
                  <div className="se-row">
                    <CommitInput
                      label="Intensity (%)"
                      value={
                        settings.lightIntensity === undefined
                          ? ""
                          : String(settings.lightIntensity)
                      }
                      numeric
                      max={100}
                      placeholder="Unspecified"
                      onCommit={(value) =>
                        s.updateGenerationSettings({
                          lightIntensity: value.trim()
                            ? Number(value)
                            : undefined,
                        })
                      }
                    />
                    {settingSelect("Shadows", "shadows", SHADOW_TYPES)}
                  </div>
                </StudioLightingEditor>
              </>
            )}
            {key === "lighting" && (
              <CommitInput
                label="Lighting notes"
                value={d[key] ?? ""}
                placeholder={ART_FIELDS[key].placeholder}
                onCommit={(value) =>
                  s.mutate((doc) => {
                    doc[key] = value;
                    doc.promptOptions[key] = true;
                  })
                }
              />
            )}
          </div>
        ))}
      {d.savedCustomText && (
        <details className="saved-custom-output">
          <summary>Saved custom text</summary>
          <p className="workflow-hint">
            Structured edits regenerated the output. Your previous writing is
            saved here; undo also restores it.
          </p>
          {(["visual", "design"] as const).map(
            (mode) =>
              d.savedCustomText?.[mode] != null && (
                <div key={mode}>
                  <label className="se-field">
                    <span>{mode === "visual" ? "Prompt" : "Design"}</span>
                    <textarea
                      className="se-input"
                      readOnly
                      value={d.savedCustomText[mode]}
                      rows={4}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        d.savedCustomText?.[mode] ?? "",
                      )
                    }
                  >
                    Copy saved {mode === "visual" ? "prompt" : "design"}
                  </button>
                </div>
              ),
          )}
        </details>
      )}
    </div>
  );
  return field || presentation === "inline" ? (
    content
  ) : (
    <details className="scene-lighting-controls">
      <summary aria-controls={id}>
        Scene & Lighting{" "}
        <span>
          {d.savedCustomText
            ? "Global · Prompt only · Custom text saved"
            : "Global · Prompt only"}
        </span>
      </summary>
      <div id={id}>{content}</div>
    </details>
  );
}
