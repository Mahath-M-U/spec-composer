import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StaticDocument } from "./static-render";
import { createDocument } from "./templates";
import { createSceneCamera, createSceneLight } from "./scene-objects";

const here = dirname(fileURLToPath(import.meta.url));

/** Every .ts/.tsx source file under src/features/spec-composer, recursively,
 * excluding tests — used to confirm scene-overlay is only ever imported by
 * canvas-surface.tsx (AC3: "never in exports"). */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(entry.name)) return [];
    if (/\.test\.tsx?$/.test(entry.name)) return [];
    return [path];
  });
}

describe("export regression: Scene Overlay never reaches exported/static output", () => {
  it("imports scene-overlay only from canvas-surface.tsx", () => {
    const importers = sourceFiles(here).filter((path) => {
      if (path.endsWith(join("scene-overlay", "SceneOverlay.tsx"))) return false;
      const text = readFileSync(path, "utf8");
      return /from ["'].*scene-overlay\/SceneOverlay["']/.test(text);
    });
    const relative = importers.map((path) => path.slice(here.length + 1));
    expect(relative).toEqual(["canvas-surface.tsx"]);
  });

  it("never renders a scene-overlay/scene-guide/scene-handle class in StaticDocument's export markup", () => {
    const doc = createDocument();
    doc.generationSettings = {
      camera: createSceneCamera(),
      studioLights: [createSceneLight("sun", []), createSceneLight("spot", [])],
      ambient: { enabled: true, intensity: 50, temperature: 5600 },
    };
    const html = renderToStaticMarkup(createElement(StaticDocument, { doc }));
    for (const needle of [
      "scene-overlay",
      "scene-guide",
      "scene-handle",
      "data-scene-object",
    ])
      expect(html).not.toContain(needle);
  });

  it("StaticDocument's own source never references the Scene Overlay module", () => {
    const text = readFileSync(join(here, "static-render.tsx"), "utf8");
    expect(text).not.toContain("scene-overlay");
    expect(text).not.toContain("SceneOverlay");
  });
});
