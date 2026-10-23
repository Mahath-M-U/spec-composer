import { useEditorStore } from "../store";
import { canAddCamera, canAddLight, SCENE_ASSETS } from "../scene-objects";
import { SceneAssetCard } from "./SceneAssetCard";
import { PresetSection } from "./PresetSection";

const ASSET_ORDER = [
  "camera",
  "sun",
  "spot",
  "diffused",
  "area",
  "point",
  "rim",
];

export function AddTab({ onLocateScene }: { onLocateScene?: () => void }) {
  const doc = useEditorStore((s) => s.doc);
  if (!doc) return null;
  const hasCamera = !canAddCamera(doc);
  const atLightCap = !canAddLight(doc);
  return (
    <div className="environment-add-tab">
      <div className="environment-asset-grid">
        {ASSET_ORDER.map((id) =>
          SCENE_ASSETS.find((asset) => asset.id === id)!,
        ).map((asset) => {
          if (asset.kind === "camera")
            return (
              <SceneAssetCard
                key={asset.id}
                iconId="camera"
                label={asset.label}
                hint={asset.hint}
                added={hasCamera}
                disabled={hasCamera}
                {...(!hasCamera
                  ? { dragPayload: { type: "camera" as const } }
                  : {})}
                onActivate={() => useEditorStore.getState().addSceneCamera()}
                locate={() => {
                  useEditorStore.getState().selectScene("camera");
                  onLocateScene?.();
                }}
                onSetFromView={() =>
                  useEditorStore.getState().setCameraFromView()
                }
              />
            );
          if (asset.kind === "cameraFromView") return null;
          const kind = asset.kind;
          const overrides = {
            ...(asset.roleOverride ? { role: asset.roleOverride } : {}),
            ...(asset.depthOverride ? { depth: asset.depthOverride } : {}),
          };
          return (
            <SceneAssetCard
              key={asset.id}
              iconId={asset.id}
              label={asset.label}
              hint={asset.hint}
              disabled={atLightCap}
              dragPayload={{ type: "light", kind, ...overrides }}
              onActivate={() =>
                useEditorStore
                  .getState()
                  .addSceneLight(kind, undefined, overrides)
              }
            />
          );
        })}
      </div>
      <PresetSection />
    </div>
  );
}
