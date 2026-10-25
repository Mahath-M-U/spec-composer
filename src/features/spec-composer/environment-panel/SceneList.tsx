import { useEditorStore } from "../store";
import { sceneObjectList } from "../scene-objects";
import { SceneRow } from "./SceneRow";

export function SceneList() {
  const doc = useEditorStore((s) => s.doc);
  if (!doc) return null;
  const rows = sceneObjectList(doc).filter((row) => row.type !== "ambient");
  return rows.length ? (
    <ul className="scene-list" aria-label="Scene objects">
      {rows.map((row) => (
        <SceneRow key={row.id} row={row} />
      ))}
    </ul>
  ) : (
    <p className="environment-empty">
      Add a camera or light to start your scene.
    </p>
  );
}
