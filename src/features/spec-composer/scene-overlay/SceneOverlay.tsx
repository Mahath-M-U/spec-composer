/** Canvas Scene Overlay: a screen-space SVG layer, sibling of
 * `.canvas-selection` in canvas-surface.tsx, showing the camera and lights
 * independently of any canvas element. Returns null when guides are
 * globally hidden; a hidden object simply isn't rendered (and so
 * intercepts no pointer events). Never mounted by static-render.tsx, so it
 * never appears in an exported image. */
import { useEditorStore } from "../store";
import { normToScreen, sceneToCanvas } from "../scene-space";
import { SceneGuides, type SceneGuideKind } from "./SceneGuides";
import { SceneHandle } from "./SceneHandle";
import type { SceneVec2, StudioLight } from "../types";
import "./scene-overlay.css";

function lightGuideKind(light: StudioLight): SceneGuideKind {
  if (light.role === "Rim") return "rim";
  return (light.kind as SceneGuideKind) ?? "area";
}

export function SceneOverlay() {
  const doc = useEditorStore((s) => s.doc);
  const pan = useEditorStore((s) => s.pan);
  const zoom = useEditorStore((s) => s.zoom);
  const selectedSceneId = useEditorStore((s) => s.selectedSceneId);
  const sceneGuidesVisible = useEditorStore((s) => s.sceneGuidesVisible);
  if (!doc || !sceneGuidesVisible) return null;
  const format = doc.format;
  const camera = doc.generationSettings?.camera;
  const lights = doc.generationSettings?.studioLights ?? [];
  const cameraSelected = selectedSceneId === "camera";
  const cameraScreen =
    camera && !camera.guideHidden ? normToScreen(camera.position, format, pan, zoom) : undefined;
  const targetScreen =
    camera && !camera.guideHidden && cameraSelected
      ? normToScreen(camera.target, format, pan, zoom)
      : undefined;
  return (
    <svg
      className="scene-overlay"
      data-canvas-ui
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {cameraScreen && targetScreen && (
        <line
          className="scene-guide-target-line"
          x1={cameraScreen.x}
          y1={cameraScreen.y}
          x2={targetScreen.x}
          y2={targetScreen.y}
          style={{ stroke: "var(--editor-action)", strokeDasharray: "3 3" }}
        />
      )}
      {camera && !camera.guideHidden && (
        <SceneHandle
          id="camera"
          canvas={camera.position}
          rotation={camera.rotation}
          selected={cameraSelected}
          format={format}
          pan={pan}
          zoom={zoom}
        >
          <SceneGuides kind="camera" selected={cameraSelected} />
        </SceneHandle>
      )}
      {lights
        .filter((light) => !light.guideHidden)
        .map((light) => {
          const canvas: SceneVec2 =
            light.canvas ??
            sceneToCanvas({ azimuth: light.azimuth, elevation: light.elevation }).canvas;
          const selected = selectedSceneId === light.id;
          return (
            <SceneHandle
              key={light.id}
              id={light.id}
              canvas={canvas}
              rotation={light.rotation ?? 0}
              selected={selected}
              format={format}
              pan={pan}
              zoom={zoom}
            >
              <SceneGuides
                kind={lightGuideKind(light)}
                selected={selected}
                {...(light.coneAngle !== undefined ? { coneAngle: light.coneAngle } : {})}
              />
            </SceneHandle>
          );
        })}
    </svg>
  );
}
