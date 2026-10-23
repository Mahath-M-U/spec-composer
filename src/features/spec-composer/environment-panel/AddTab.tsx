import { CommitInput } from "../committed-input";
import { useEditorStore } from "../store";
import { canAddCamera, canAddLight, SCENE_ASSETS } from "../scene-objects";
import type { SceneDragPayload } from "../scene-objects";
import { SceneAssetCard } from "./SceneAssetCard";
import { PresetSection } from "./PresetSection";

/** Add tab: Camera, Set from View, one card per light kind (Rim is a
 * role/depth variant of Spotlight), the Ambient setting row, and the
 * Presets section. */
export function AddTab({ onLocateScene }: { onLocateScene?: () => void }) {
  const s = useEditorStore();
  const doc = s.doc;
  if (!doc) return null;
  const settings = doc.generationSettings;
  const hasCamera = !canAddCamera(doc);
  const atLightCap = !canAddLight(doc);
  const ambient = settings?.ambient;
  return (
    <div className="environment-add-tab">
      <div className="contextual-element-grid">
        {SCENE_ASSETS.map((asset) => {
          if (asset.kind === "camera")
            return (
              <SceneAssetCard
                key={asset.id}
                iconId="camera"
                label={asset.label}
                hint={asset.hint}
                added={hasCamera}
                disabled={hasCamera}
                {...(hasCamera ? {} : { dragPayload: { type: "camera" } satisfies SceneDragPayload })}
                onActivate={() => s.addSceneCamera()}
                locate={() => {
                  s.selectScene("camera");
                  onLocateScene?.();
                }}
                statusText="Added · locate"
              />
            );
          if (asset.kind === "cameraFromView")
            return (
              <SceneAssetCard
                key={asset.id}
                iconId="cameraFromView"
                label={asset.label}
                hint={asset.hint}
                onActivate={() => s.setCameraFromView()}
              />
            );
          const kind = asset.kind;
          return (
            <SceneAssetCard
              key={asset.id}
              iconId={asset.id}
              label={asset.label}
              hint={asset.hint}
              disabled={atLightCap}
              dragPayload={
                {
                  type: "light",
                  kind,
                  ...(asset.roleOverride ? { role: asset.roleOverride } : {}),
                  ...(asset.depthOverride ? { depth: asset.depthOverride } : {}),
                } satisfies SceneDragPayload
              }
              onActivate={() =>
                s.addSceneLight(kind, undefined, {
                  ...(asset.roleOverride ? { role: asset.roleOverride } : {}),
                  ...(asset.depthOverride ? { depth: asset.depthOverride } : {}),
                })
              }
            />
          );
        })}
      </div>
      <div className="environment-ambient-row">
        <label className="scene-include">
          <input
            type="checkbox"
            checked={ambient?.enabled ?? false}
            onChange={(event) => s.updateAmbient({ enabled: event.target.checked })}
          />
          Ambient fill
        </label>
        {ambient?.enabled && (
          <div className="se-row">
            <CommitInput
              label="Intensity"
              numeric
              min={0}
              max={100}
              value={String(ambient.intensity)}
              onCommit={(value) => s.updateAmbient({ intensity: Number(value) })}
            />
            <CommitInput
              label="Temperature (K)"
              numeric
              min={2000}
              max={10000}
              value={String(ambient.temperature)}
              onCommit={(value) => s.updateAmbient({ temperature: Number(value) })}
            />
          </div>
        )}
      </div>
      <PresetSection />
    </div>
  );
}
