import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  COMPOSE_LAYOUTS,
  layoutZones,
  type ComposeLayout,
  type Box,
} from "./compose-layouts";
import { LayoutPresetThumbnail } from "./layout-preset-thumbnail";
import { createElement } from "./registry";
import { createDocument } from "./templates";

const render = (presetId: ComposeLayout) =>
  renderToStaticMarkup(<LayoutPresetThumbnail presetId={presetId} />);
function boxes(html: string, region: string): Box[] {
  return [
    ...html.matchAll(
      new RegExp(`<rect[^>]*data-thumbnail-region="${region}"[^>]*>`, "g"),
    ),
  ].map(([rect]) => {
    const number = (key: keyof Box) =>
      Number(rect.match(new RegExp(` ${key}="([^"]+)"`))?.[1]);
    return {
      x: number("x"),
      y: number("y"),
      width: number("width"),
      height: number("height"),
    };
  });
}

describe("LayoutPresetThumbnail", () => {
  it("covers every preset with a distinct decorative, asset-free square SVG", () => {
    const previews = COMPOSE_LAYOUTS.map(({ id }) => render(id));
    expect(new Set(previews).size).toBe(COMPOSE_LAYOUTS.length);
    for (const html of previews) {
      expect(html).toContain('viewBox="0 0 100 100"');
      expect(html).toContain('aria-hidden="true" focusable="false"');
      expect(html).toContain('fill="#EFE9DE"');
      expect(boxes(html, "text").length).toBeGreaterThan(0);
      expect(html).not.toMatch(/<image|href=|<title|\bid=/);
    }
  });

  it("matches engine image zones, including equal columns and full-bleed overlays without an invented copy card", () => {
    const layouts: ComposeLayout[] = [
      "copy-left",
      "copy-right",
      "grid-2up",
      "split-top",
      "split-bottom",
      "sidebar-left",
      "framed",
      "layered-card",
      "full-bleed-overlay",
      "overlay-top",
      "spotlight",
      "visual-band",
      "zigzag",
    ];
    for (const id of layouts) {
      expect(boxes(render(id), "image")).toEqual([
        layoutZones(id, { width: 100, height: 100 }).visual,
      ]);
    }
    const layered = render("layered-card");
    expect(boxes(layered, "text")[0]).toMatchObject({
      x: 14,
      y: 32,
      width: 72,
    });
    expect((layered.match(/<rect/g) ?? []).length).toBe(
      1 + 1 + boxes(layered, "text").length,
    );
    expect(boxes(render("full-bleed-overlay"), "text")[0]!.y).toBeGreaterThan(
      60,
    );
    expect(boxes(render("overlay-top"), "text")[0]!.y).toBeLessThan(10);
  });

  it("shows a four-image grid above copy and preserves centered, corner and diagonal relationships", () => {
    const images = boxes(render("collage"), "image");
    expect(images).toHaveLength(4);
    expect(new Set(images.map((b) => b.x)).size).toBe(2);
    expect(new Set(images.map((b) => b.y)).size).toBe(2);
    expect(images.every((b) => b.y + b.height <= 60)).toBe(true);
    expect(boxes(render("collage"), "text").every((b) => b.y > 60)).toBe(true);
    const stackImage = boxes(render("stack-center"), "image")[0]!;
    expect(stackImage.x + stackImage.width / 2).toBe(50);
    expect(boxes(render("stack-center"), "text")[0]!.y).toBeGreaterThan(
      stackImage.y + stackImage.height,
    );
    const corners = boxes(render("corner-badge"), "text");
    expect(corners.at(-1)!.x).toBeGreaterThan(corners[0]!.x);
    expect(corners.at(-1)!.y).toBeGreaterThan(corners[0]!.y);
    const diagonal = [
      ...boxes(render("diagonal"), "text"),
      ...boxes(render("diagonal"), "image"),
    ].sort((a, b) => a.y - b.y);
    expect(diagonal.map((b) => b.x)).toEqual(
      [...diagonal.map((b) => b.x)].sort((a, b) => a - b),
    );
  });

  it("fits Original to document aspect ratio and uses saved boxes with a current-box fallback", () => {
    const document = createDocument();
    document.format = { ...document.format, width: 200, height: 100 };
    document.elements = [
      {
        ...createElement("heroImage", document.format, 0),
        id: "image",
        x: 20,
        y: 10,
        width: 80,
        height: 40,
      },
      {
        ...createElement("title", document.format, 1),
        id: "title",
        x: 110,
        y: 20,
        width: 60,
        height: 10,
      },
      { ...createElement("shape", document.format, 2), id: "shape" },
      {
        ...createElement("body", document.format, 3),
        id: "hidden",
        visible: false,
      },
    ];
    const current = renderToStaticMarkup(
      <LayoutPresetThumbnail presetId="original" document={document} />,
    );
    expect(boxes(current, "image")).toEqual([
      { x: 10, y: 30, width: 40, height: 20 },
    ]);
    expect(boxes(current, "text")).toEqual([
      { x: 55, y: 35, width: 30, height: 5 },
    ]);
    const saved = renderToStaticMarkup(
      <LayoutPresetThumbnail
        presetId="original"
        document={document}
        origin={{ image: { x: 40, y: 20, width: 100, height: 60 } }}
      />,
    );
    expect(boxes(saved, "image")).toEqual([
      { x: 20, y: 35, width: 50, height: 30 },
    ]);
    expect(boxes(saved, "text")).toEqual(boxes(current, "text"));
  });
});
