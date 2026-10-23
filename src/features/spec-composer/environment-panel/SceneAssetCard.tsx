import type { ReactNode } from "react";
import { SCENE_DRAG_TYPE, type SceneDragPayload } from "../scene-objects";
import { SceneIcon } from "./scene-icons";

/** An Add-tab card: shares `.contextual-element-card` styling with the
 * element library (contextual-editor/ElementLibrary.tsx) so the two feel
 * like one catalog. */
export function SceneAssetCard({
  iconId,
  label,
  hint,
  added,
  disabled,
  dragPayload,
  onActivate,
  locate,
  statusText,
}: {
  iconId: string;
  label: string;
  hint: string;
  added?: boolean;
  disabled?: boolean;
  /** Present when the card can be dragged onto the canvas. */
  dragPayload?: SceneDragPayload;
  onActivate: () => void;
  /** Rendered instead of the add action once the (single) object is added
   * (the Camera card). */
  locate?: () => void;
  statusText?: ReactNode;
}) {
  return (
    <button
      type="button"
      className="contextual-element-card"
      data-added={added ? "true" : undefined}
      title={disabled ? `${label} limit reached` : `Add ${label}`}
      disabled={disabled && !locate}
      draggable={!!dragPayload && !disabled}
      onClick={() => (added && locate ? locate() : onActivate())}
      onDragStart={
        dragPayload
          ? (event) => {
              event.dataTransfer.setData(SCENE_DRAG_TYPE, JSON.stringify(dragPayload));
              event.dataTransfer.effectAllowed = "copy";
            }
          : undefined
      }
    >
      <SceneIcon id={iconId} />
      <span className="contextual-element-text">
        <span className="contextual-element-name">{label}</span>
        <small>{added ? statusText ?? "Added" : hint}</small>
      </span>
    </button>
  );
}
