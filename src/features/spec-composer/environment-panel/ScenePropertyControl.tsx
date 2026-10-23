import { useEffect, useId, useState } from "react";
import { CommitInput } from "../committed-input";
import { applySceneControl } from "../scene-controls-store";
import {
  sceneControlValue,
  type SceneControlDescriptor,
  type SceneObjectRef,
} from "../scene-controls";
import { useCoalescedSceneEdit } from "../use-coalesced-scene-edit";

/** Same descriptors and write bridge as the canvas toolbar, with compact numeric editing. */
export function ScenePropertyControl({
  id,
  objectRef,
  descriptor,
}: {
  id: string;
  objectRef: SceneObjectRef;
  descriptor: SceneControlDescriptor;
}) {
  const value = sceneControlValue(objectRef, descriptor);
  const apply = (next: unknown, history = true) =>
    applySceneControl(id, descriptor, next, history);
  const coalesced = useCoalescedSceneEdit<unknown>(apply);
  const inputId = useId();
  const color =
    typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
      ? value
      : "#ffffff";
  const [hex, setHex] = useState(color);
  useEffect(() => setHex(color), [color]);
  if (descriptor.type === "button") return null;
  if (descriptor.type === "slider") {
    const numeric = typeof value === "number" ? value : (descriptor.min ?? 0);
    return (
      <div className="environment-property environment-slider-property">
        <label htmlFor={inputId}>{descriptor.label}</label>
        <CommitInput
          label={`${descriptor.label} value`}
          numeric
          {...(descriptor.min !== undefined ? { min: descriptor.min } : {})}
          {...(descriptor.max !== undefined ? { max: descriptor.max } : {})}
          {...(descriptor.step !== undefined ? { step: descriptor.step } : {})}
          required
          value={String(numeric)}
          onCommit={(next) => apply(Number(next))}
        />
        <input
          id={inputId}
          type="range"
          aria-label={descriptor.label}
          min={descriptor.min}
          max={descriptor.max}
          step={descriptor.step}
          value={numeric}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            coalesced.onPointerDown();
          }}
          onPointerUp={coalesced.onPointerUp}
          onPointerCancel={coalesced.onPointerCancel}
          onBlur={coalesced.onPointerUp}
          onChange={(event) => coalesced.onChange(Number(event.target.value))}
        />
      </div>
    );
  }
  if (descriptor.type === "color")
    return (
      <div className="environment-property environment-color-property">
        <label htmlFor={inputId}>Color</label>
        <div className="environment-color-inputs">
          <input
            type="color"
            aria-label="Light color"
            value={color}
            onChange={(event) => coalesced.onChange(event.target.value)}
            onFocus={coalesced.onPointerDown}
            onBlur={coalesced.onPointerUp}
          />
          <input
            id={inputId}
            type="text"
            aria-label="Color HEX"
            value={hex}
            maxLength={7}
            spellCheck={false}
            aria-invalid={!/^#[0-9a-f]{6}$/i.test(hex)}
            onChange={(event) => {
              const next = event.target.value;
              setHex(next);
              if (/^#[0-9a-f]{6}$/i.test(next)) apply(next);
            }}
            onBlur={() => setHex(color)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "Escape")
                event.currentTarget.blur();
            }}
          />
        </div>
      </div>
    );
  if (descriptor.type === "toggle")
    return (
      <label className="environment-property environment-toggle-property">
        <span>{descriptor.label}</span>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(event) => apply(event.target.checked)}
        />
      </label>
    );
  if (descriptor.key === "shadows")
    return (
      <div className="environment-property environment-shadow-property">
        <span>Shadows</span>
        <div
          className="environment-shadow-options"
          role="group"
          aria-label="Shadows"
        >
          {descriptor.options?.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => apply(option.value)}
            >
              {option.value === "None" ? "Off" : option.label}
            </button>
          ))}
        </div>
      </div>
    );
  return (
    <label className="environment-property environment-select-property">
      <span>{descriptor.label}</span>
      <select
        aria-label={descriptor.label}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => apply(event.target.value)}
      >
        {descriptor.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
