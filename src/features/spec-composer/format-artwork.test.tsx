import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formats } from "./formats";
import { FORMAT_ARTWORK, formatArtworkId } from "./format-artwork";
import { RESIZE_PRESET_GROUPS } from "./resize";
import { PRESET_ARTWORK_IDS, PresetArtwork } from "./resize-preset-preview";

describe("format artwork mapping", () => {
  it("explicitly maps every Home format to an authored composition", () => {
    expect(Object.keys(FORMAT_ARTWORK).sort()).toEqual(
      formats.map((format) => format.id).sort(),
    );
    for (const format of formats) {
      expect(PRESET_ARTWORK_IDS).toContain(formatArtworkId(format.id));
    }
    expect(formatArtworkId("unknown")).toBeUndefined();
    expect(formatArtworkId("constructor")).toBeUndefined();
  });
  it("keeps catalog dimensions independent, including shared IDs with different ratios", () => {
    const resize = RESIZE_PRESET_GROUPS.flatMap((group) => group.presets);
    const before = JSON.stringify({ formats, resize });
    for (const id of ["instagram-post", "instagram-ad", "linkedin-post"]) {
      const home = formats.find((format) => format.id === id)!;
      const preset = resize.find((format) => format.id === id)!;
      expect([home.width, home.height]).not.toEqual([
        preset.width,
        preset.height,
      ]);
      const markup = renderToStaticMarkup(
        <PresetArtwork
          id={id}
          artworkId={formatArtworkId(id)}
          width={home.width}
          height={home.height}
        />,
      );
      expect(markup).toContain(`viewBox="0 0 ${home.width} ${home.height}"`);
      expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(markup).not.toContain('transform="scale(');
    }
    expect(JSON.stringify({ formats, resize })).toBe(before);
    expect(
      formats.find((format) => format.id === "instagram-post"),
    ).toMatchObject({ width: 1080, height: 1350 });
    expect(
      resize.find((format) => format.id === "instagram-post"),
    ).toMatchObject({ width: 1080, height: 1080 });
  });
  it("uses a deterministic dimension fallback without importing canvas contents", () => {
    const markup = () =>
      renderToStaticMarkup(
        <PresetArtwork id="future" width={600} height={800} />,
      );
    expect(markup()).toBe(markup());
    expect(markup()).toContain('data-preset-art="dimensions"');
    expect(markup()).toContain("600 × 800");
    expect(markup()).not.toMatch(/<image|<foreignObject|onClick/);
  });
});
