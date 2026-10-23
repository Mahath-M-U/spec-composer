import { Copy, Eye, EyeOff, Power, Trash2 } from "lucide-react";
import { CommitInput } from "../committed-input";
import { useEditorStore } from "../store";
import { sceneObjectList, type SceneObjectSummary } from "../scene-objects";
import { SceneIcon } from "./scene-icons";

/** The Scene tab's icon id for a row, derived from its label (the id itself
 * is "camera", a light's generated uuid, or "ambient" — none of which name
 * a light kind). */
function iconIdFor(row: SceneObjectSummary): string {
  if (row.type !== "light") return row.type;
  const prefix = row.label.split(" ")[0] ?? "";
  return (
    {
      Sunlight: "sun",
      Diffused: "diffused",
      Spotlight: "spot",
      Point: "point",
      Area: "area",
      Rim: "rim",
    }[prefix] ?? "area"
  );
}

function SceneRow({ row }: { row: SceneObjectSummary }) {
  const s = useEditorStore();
  const selected = useEditorStore((state) => state.selectedSceneId === row.id);
  const toggleEnabled = () => {
    if (row.type === "camera") s.updateSceneCamera({ enabled: !row.enabled });
    else if (row.type === "ambient") s.updateAmbient({ enabled: !row.enabled });
    else s.updateSceneLight(row.id, { enabled: !row.enabled });
  };
  return (
    <li className="scene-list-row" data-selected={selected}>
      <button
        type="button"
        className="scene-list-select"
        aria-pressed={selected}
        aria-label={`Select ${row.label}`}
        title={`Select ${row.label}`}
        onClick={() => s.selectScene(row.id)}
      >
        <SceneIcon id={iconIdFor(row)} />
      </button>
      {row.type === "light" ? (
        <CommitInput
          label={`Rename ${row.label}`}
          value={row.label}
          required
          maxLength={60}
          onCommit={(value) => s.renameSceneObject(row.id, value)}
        />
      ) : (
        <span className="scene-list-name">{row.label}</span>
      )}
      <div className="scene-list-actions">
        {row.type !== "ambient" && (
          <button
            type="button"
            className="scene-list-icon-button"
            aria-label={`${row.guideHidden ? "Show" : "Hide"} ${row.label} guide`}
            title={`${row.guideHidden ? "Show" : "Hide"} guide`}
            onClick={() => s.toggleSceneGuide(row.id)}
          >
            {row.guideHidden ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        )}
        <button
          type="button"
          className="scene-list-icon-button"
          aria-pressed={row.enabled}
          aria-label={`${row.enabled ? "Disable" : "Enable"} ${row.label}`}
          title={row.enabled ? "Disable" : "Enable"}
          onClick={toggleEnabled}
        >
          <Power aria-hidden="true" />
        </button>
        {row.type === "light" && (
          <button
            type="button"
            className="scene-list-icon-button"
            aria-label={`Duplicate ${row.label}`}
            title="Duplicate"
            onClick={() => s.duplicateSceneLight(row.id)}
          >
            <Copy aria-hidden="true" />
          </button>
        )}
        {row.type !== "ambient" && (
          <button
            type="button"
            className="scene-list-icon-button scene-list-delete"
            aria-label={`Delete ${row.label}`}
            title="Delete"
            onClick={() => s.removeSceneObject(row.id)}
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  );
}

export function SceneList() {
  const doc = useEditorStore((state) => state.doc);
  if (!doc) return null;
  const rows = sceneObjectList(doc);
  return (
    <ul className="scene-list" aria-label="Scene objects">
      {rows.map((row) => (
        <SceneRow key={row.id} row={row} />
      ))}
    </ul>
  );
}
