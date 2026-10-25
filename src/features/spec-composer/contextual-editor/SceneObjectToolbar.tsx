/** Compact contextual toolbar for the selected scene object (camera, light,
 * or ambient): shows only the controls relevant to that object, rendered
 * from the same scene-controls.ts descriptors as the Design Inspector's
 * scene section, reading live store state so the two stay in sync (see
 * Editor.tsx's StylePanel). Mounted from canvas-surface.tsx next to
 * FloatingContextualToolbar, anchored to the object's own screen position. */
import { Copy, SlidersHorizontal, Trash2 } from "lucide-react";
import { SceneIcon } from "../environment-panel/scene-icons";
import { normToScreen } from "../scene-space";
import {
  applySceneControl,
  resolveSceneObject,
  sceneObjectAnchor,
  sceneObjectIconId,
  sceneObjectLabel,
} from "../scene-controls-store";
import {
  controlsForSceneObject,
  sceneControlValue,
  type SceneControlDescriptor,
  type SceneObjectRef,
} from "../scene-controls";
import { useEditorStore } from "../store";
import { useCoalescedSceneEdit } from "../use-coalesced-scene-edit";
import type { SceneFormat } from "../scene-space";
import { ToolbarShell } from "./ToolbarShell";

/** One descriptor's control, exported mainly so tests can exercise the
 * coalesced-edit contract (see use-coalesced-scene-edit.ts) directly. */
export function SceneControlInput({
  id,
  objectRef,
  descriptor,
}: {
  id: string;
  objectRef: SceneObjectRef;
  descriptor: SceneControlDescriptor;
}) {
  const value = sceneControlValue(objectRef, descriptor);
  const coalesced = useCoalescedSceneEdit<unknown>((patch, history) =>
    applySceneControl(id, descriptor, patch, history),
  );
  switch (descriptor.type) {
    case "slider":
      return (
        <label className="scene-toolbar-field" title={descriptor.label}>
          <span>{descriptor.label}</span>
          <input
            type="range"
            aria-label={descriptor.label}
            min={descriptor.min}
            max={descriptor.max}
            step={descriptor.step}
            value={typeof value === "number" ? value : (descriptor.min ?? 0)}
            onPointerDown={coalesced.onPointerDown}
            onPointerUp={coalesced.onPointerUp}
            onPointerCancel={coalesced.onPointerCancel}
            onChange={(event) => coalesced.onChange(Number(event.target.value))}
          />
        </label>
      );
    case "select":
      return (
        <label className="scene-toolbar-field" title={descriptor.label}>
          <span>{descriptor.label}</span>
          <select
            aria-label={descriptor.label}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => applySceneControl(id, descriptor, event.target.value)}
          >
            {descriptor.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    case "color":
      return (
        <label className="scene-toolbar-field scene-toolbar-color" title={descriptor.label}>
          <span>{descriptor.label}</span>
          <input
            type="color"
            aria-label={descriptor.label}
            value={typeof value === "string" ? value : "#ffffff"}
            onPointerDown={coalesced.onPointerDown}
            onPointerUp={coalesced.onPointerUp}
            onPointerCancel={coalesced.onPointerCancel}
            onChange={(event) => coalesced.onChange(event.target.value)}
          />
        </label>
      );
    case "toggle":
      return (
        <label className="scene-toolbar-field scene-toolbar-toggle">
          <input
            type="checkbox"
            aria-label={descriptor.label}
            checked={!!value}
            onChange={(event) => applySceneControl(id, descriptor, event.target.checked)}
          />
          {descriptor.label}
        </label>
      );
    case "button":
      return (
        <button
          type="button"
          className="ui-toolbar-button"
          aria-label={descriptor.label}
          onClick={() => applySceneControl(id, descriptor, undefined)}
        >
          {descriptor.key === "duplicate" ? (
            <Copy size={14} aria-hidden="true" />
          ) : (
            <Trash2 size={14} aria-hidden="true" />
          )}
          {descriptor.label}
        </button>
      );
  }
}

export function SceneObjectToolbar({
  id,
  format,
  pan,
  zoom,
  onOpenInspector,
}: {
  id: string;
  format: SceneFormat;
  pan: { x: number; y: number };
  zoom: number;
  onOpenInspector?: (() => void) | undefined;
}) {
  const doc = useEditorStore((s) => s.doc);
  const ref = doc ? resolveSceneObject(doc, id) : undefined;
  if (!ref) return null;
  const anchorNorm = sceneObjectAnchor(ref) ?? { x: 0, y: 1.2 };
  const screen = normToScreen(anchorNorm, format, pan, zoom);
  const label = sceneObjectLabel(ref);
  return (
    <ToolbarShell
      anchor={{ left: screen.x, top: screen.y, width: 0, height: 0 }}
      ariaLabel={`${label} controls`}
      onEscape={() => useEditorStore.getState().selectScene(null)}
    >
      <span className="scene-toolbar-icon" aria-hidden="true">
        <SceneIcon id={sceneObjectIconId(ref)} />
      </span>
      {controlsForSceneObject(ref).map((descriptor) => (
        <SceneControlInput key={descriptor.key} id={id} objectRef={ref} descriptor={descriptor} />
      ))}
      <button
        type="button"
        className="ui-toolbar-button"
        aria-label="Open Design Inspector"
        title="Advanced / Inspector"
        onClick={() => {
          const state = useEditorStore.getState();
          state.setPanel("style");
          state.setStyleTab("style");
          onOpenInspector?.();
        }}
      >
        <SlidersHorizontal size={16} />
      </button>
    </ToolbarShell>
  );
}
