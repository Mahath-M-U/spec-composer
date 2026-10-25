import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PresetCard } from "./preset-card";
import {
  formats,
  homePreset,
  RESIZE_PRESET_GROUPS,
  resizePreset,
} from "./preset-catalog";

describe("shared preset cards", () => {
  it.each([
    homePreset(formats[0]!),
    resizePreset(RESIZE_PRESET_GROUPS[0]!.presets[0]!, "Instagram"),
  ])(
    "renders $label with the same preview/footer structure and native button callback",
    (preset) => {
      const onClick = vi.fn();
      const tree = PresetCard({
        preset,
        onClick,
        ariaLabel: `Select ${preset.label}`,
      });
      tree.props.onClick();
      expect(onClick).toHaveBeenCalledOnce();
      const html = renderToStaticMarkup(tree);
      expect(html.match(/<button/g)).toHaveLength(1);
      expect(html).toContain('type="button"');
      expect(html).toContain(`aria-label="Select ${preset.label}"`);
      expect(html.match(/class="preset-card-art"/g)).toHaveLength(1);
      expect(html.match(/class="preset-card-details"/g)).toHaveLength(1);
      const footerStart = html.indexOf('<span class="preset-card-details">');
      const preview = html.slice(0, footerStart);
      const footer = html.slice(footerStart);
      expect(preview).not.toContain("preset-card-metadata");
      expect(footer).toContain('class="preset-card-metadata"');
      expect(footer).toContain('class="preset-card-ratio"');
      expect(footer).toContain('class="preset-card-meta"');
      expect(preview).not.toContain('class="preset-card-art" aria-hidden=');
      expect(preview).toMatch(/<svg\b[^>]*aria-hidden="true"/);
      expect(footer).toContain(`title="${preset.label}"`);
      expect(footer.indexOf('class="preset-card-title"')).toBeLessThan(
        footer.indexOf('class="preset-card-metadata"'),
      );
      expect(html).toContain('class="preset-card card-hover-scale"');
      expect(html.match(/class="preset-card-metadata"/g)).toHaveLength(1);
      expect(html).toContain(`title="${preset.width} × ${preset.height} px"`);
      expect(html).toContain(`viewBox="0 0 ${preset.width} ${preset.height}"`);
      expect(html).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(html).not.toContain("<input");
      expect(html).not.toContain("aria-pressed=");
      expect(html).not.toContain("resize-card-");
      expect(html).not.toContain("preset-card--home");
    },
  );

  it("calculates exact ratios from dimensions and preserves animation metadata", () => {
    const preset = homePreset(
      formats.find((format) => format.id === "facebook-post")!,
    );
    const html = renderToStaticMarkup(
      <PresetCard preset={{ ...preset, animated: true }} onClick={vi.fn()} />,
    );
    expect(html).toContain('title="Aspect ratio 40:21"');
    expect(html).toContain("Animated</span>");
    expect(html).not.toContain("1.91:1");
  });

  it("exposes current, selected and disabled state without owning canvas effects", () => {
    const preset = resizePreset(
      RESIZE_PRESET_GROUPS[0]!.presets[0]!,
      "Instagram",
    );
    const html = renderToStaticMarkup(
      <PresetCard
        preset={{ ...preset, animated: true }}
        onClick={vi.fn()}
        ariaLabel="Select Instagram Post, current size"
        className="test-layout"
        selected
        current
        disabled
      />,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('class="preset-card-current">Current</span>');
    expect(html).toContain('class="preset-card-check"');
    expect(html).toContain('class="preset-card-badge">Animated</span>');
    const status = html.slice(
      html.indexOf('<span class="preset-card-status"'),
      html.indexOf('<span class="preset-card-details">'),
    );
    expect(status).toContain("preset-card-current");
    expect(status).toContain("preset-card-badge");
    expect(status).toContain("preset-card-check");
    expect(html.indexOf('class="preset-card-status"')).toBeLessThan(
      html.indexOf('class="preset-card-metadata"'),
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('class="preset-card card-hover-scale test-layout"');
  });

  it.each([
    {
      title: "Create a design",
      description: "Preset or custom size",
      ariaLabel: "Create a design with a preset or custom size",
    },
    {
      title: "Custom size",
      description: "Enter width and height",
      ariaLabel: "Enter a custom size",
    },
  ])(
    "renders $title inside one clickable create surface",
    ({ title, description, ariaLabel }) => {
      const onClick = vi.fn();
      const tree = PresetCard({
        mode: "create",
        title,
        description,
        ariaLabel,
        onClick,
        selected: true,
        disabled: true,
      });
      tree.props.onClick();
      expect(onClick).toHaveBeenCalledOnce();
      const html = renderToStaticMarkup(tree);
      expect(html.match(/<button/g)).toHaveLength(1);
      expect(html).toContain(
        'class="preset-card card-hover-scale preset-card--create"',
      );
      expect(html).toContain(`aria-label="${ariaLabel}"`);
      expect(html).toContain(`title="${title}"`);
      expect(html).toContain(`title="${description}"`);
      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain('disabled=""');
      expect(html).not.toContain("preset-card-art");
      expect(html).not.toContain("preset-card-details");
      expect(html.match(/<svg\b[^>]*aria-hidden="true"[^>]*>/g)).toHaveLength(
        1,
      );
      expect(html.match(/<svg/g)).toHaveLength(1);
    },
  );

  it("defaults create mode to the original home creation labels", () => {
    const html = renderToStaticMarkup(
      <PresetCard mode="create" onClick={vi.fn()} />,
    );
    expect(html).toContain('title="Create a design"');
    expect(html).toContain('title="Preset or custom size"');
    expect(html).toContain(
      'aria-label="Create a design with a preset or custom size"',
    );
  });
});
