import { Crosshair, LocateFixed, Plus } from "lucide-react";
import { SCENE_DRAG_TYPE, type SceneDragPayload } from "../scene-objects";
import { CircularAction } from "./CircularAction";
import { SceneIcon } from "./scene-icons";

export function SceneAssetCard({
  iconId,
  label,
  hint,
  added,
  disabled,
  dragPayload,
  onActivate,
  locate,
  onSetFromView,
}: {
  iconId: string;
  label: string;
  hint: string;
  added?: boolean;
  disabled?: boolean;
  dragPayload?: SceneDragPayload;
  onActivate: () => void;
  locate?: () => void;
  onSetFromView?: () => void;
}) {
  return (
    <div
      className="environment-asset-tile"
      data-added={added || undefined}
      data-disabled={(disabled && !added) || undefined}
      draggable={!!dragPayload && !disabled}
      onDragStart={
        dragPayload && !disabled
          ? (event) => {
              event.dataTransfer.setData(
                SCENE_DRAG_TYPE,
                JSON.stringify(dragPayload),
              );
              event.dataTransfer.effectAllowed = "copy";
            }
          : undefined
      }
    >
      <button
        type="button"
        className="environment-asset-main"
        disabled={disabled && !added}
        title={
          disabled && !added
            ? "Six-light limit reached"
            : added
              ? `Locate ${label}`
              : `Add ${label}`
        }
        onClick={added && locate ? locate : onActivate}
      >
        <SceneIcon id={iconId} />
        <span className="environment-tile-text">
          <strong>{label}</strong>
          <small>{added ? "Camera added" : hint}</small>
        </span>
      </button>
      <CircularAction
        label={added ? `Locate ${label}` : `Add ${label}`}
        disabled={disabled && !added}
        onClick={added && locate ? locate : onActivate}
      >
        {added ? (
          <LocateFixed aria-hidden="true" />
        ) : (
          <Plus aria-hidden="true" />
        )}
      </CircularAction>
      {onSetFromView && (
        <button
          type="button"
          className="environment-set-view"
          onClick={onSetFromView}
        >
          <Crosshair size={12} aria-hidden="true" /> Set from View
        </button>
      )}
    </div>
  );
}
