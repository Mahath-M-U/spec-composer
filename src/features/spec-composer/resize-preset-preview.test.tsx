import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RESIZE_PRESET_GROUPS, type ResizePreset } from "./resize";
import { ResizePresetPreview } from "./resize-preset-preview";

const presets = RESIZE_PRESET_GROUPS.flatMap((group) => group.presets);
const headlines: Record<string, string> = {
  "instagram-post": "Ideas take shape.",
  "instagram-story": "MAKE ROOM FOR MORE.",
  "instagram-ad": "A slower kind of living.",
  "facebook-landscape": "Good things take shape.",
  "facebook-square": "MAKE EVERY DAY COUNT.",
  "facebook-cover": "Space for new perspectives.",
  "youtube-thumbnail": "BUILD BETTER IDEAS.",
  "youtube-channel": "CREATIVE STUDIO.",
  "youtube-short": "ONE MINUTE. ONE BIG IDEA.",
  "linkedin-post": "Better work starts here.",
  "linkedin-banner": "Ideas into impact.",
  "linkedin-square": "Make meaningful progress.",
  "x-post": "A fresh point of view.",
  "x-header": "Keep the conversation moving.",
  "x-square": "Think beyond the frame.",
  "video-full-hd": "Stories worth watching.",
  "video-4k-uhd": "See the bigger picture.",
};

function render(preset: ResizePreset) {
  return renderToStaticMarkup(<ResizePresetPreview preset={preset} />);
}

describe("ResizePresetPreview", () => {
  it("gives every existing preset an explicit, distinct editorial composition", () => {
    expect(presets).toHaveLength(17);
    expect(Object.keys(headlines).sort()).toEqual(
      presets.map(({ id }) => id).sort(),
    );
    const bodies = new Set<string>();
    for (const preset of presets) {
      const markup = render(preset);
      expect(markup).toContain(`data-resize-art="${preset.id}"`);
      expect(markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).toContain(
        headlines[preset.id],
      );
      bodies.add(markup.slice(markup.indexOf("<g ")));
    }
    expect(bodies.size).toBe(presets.length);
  });

  it.each(presets)(
    "keeps $id at its actual dimensions and decorative",
    (preset) => {
      const markup = render(preset);
      expect(markup).toContain(
        `viewBox="0 0 ${preset.width} ${preset.height}"`,
      );
      expect(markup).toContain(
        `width="${preset.width}" height="${preset.height}"`,
      );
      expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('focusable="false"');
      expect(markup).not.toMatch(
        /<(?:image|foreignObject|filter|script|animate)\b|\b(?:href|id|tabindex)=/i,
      );
      expect(markup.length).toBeLessThan(6_000);
    },
  );

  it("renders deterministically without changing any preset metadata", () => {
    for (const preset of presets) {
      const original = { ...preset };
      const frozen = Object.freeze({ ...preset });
      expect(render(frozen)).toBe(render(frozen));
      expect(frozen).toEqual(original);
      expect(preset).toEqual(original);
    }
  });

  it("uses a neutral dimension illustration for an unknown preset", () => {
    const preset: ResizePreset = {
      id: "future-format",
      label: "Future format",
      width: 600,
      height: 800,
      platform: "generic",
      type: "post",
    };
    const markup = render(preset);
    expect(markup).toContain('data-resize-art="dimensions"');
    expect(markup).toContain('viewBox="0 0 600 800"');
    expect(markup).toContain("600 × 800");
    expect(markup).not.toContain("Ideas");
  });
});
