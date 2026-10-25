import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AddFormatCard,
  FormatCard,
  FormatGrid,
  PlatformFilterBar,
} from "./format-gallery";
import { formats, platforms } from "./formats";
import { PresetCard } from "./preset-card";

type ElementProps = { children?: ReactNode; [key: string]: unknown };
function elements(node: ReactNode): ReactElement<ElementProps>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<ElementProps>(node)) return [];
  return [node, ...elements(node.props.children)];
}

describe("home format gallery", () => {
  it("shows every platform in the original order with one selected filter", () => {
    const tree = PlatformFilterBar({
      platforms,
      value: "Popular",
      onChange: vi.fn(),
    });
    const buttons = elements(tree).filter((item) => item.type === "button");
    expect(buttons.map((item) => item.props["data-platform"])).toEqual(
      platforms.map((platform) => platform.toLowerCase()),
    );
    expect(buttons.filter((item) => item.props["aria-pressed"])).toHaveLength(
      1,
    );
    expect(buttons[0]!.props["aria-pressed"]).toBe(true);
    const html = renderToStaticMarkup(tree);
    expect(html).not.toContain("More platforms");
    expect(html).not.toContain("aria-haspopup");
  });

  it("passes original platform values directly, including all former overflow filters", () => {
    const onChange = vi.fn();
    const tree = PlatformFilterBar({ platforms, value: "Pinterest", onChange });
    const buttons = elements(tree).filter((item) => item.type === "button");
    const pinterest = buttons.find(
      (item) => item.props["data-platform"] === "pinterest",
    )!;
    expect(pinterest.props["aria-pressed"]).toBe(true);
    for (const button of buttons) (button.props["onClick"] as () => void)();
    expect(onChange.mock.calls.map(([platform]) => platform)).toEqual([
      ...platforms,
    ]);
  });

  it("preserves direct callbacks for a short filter list", () => {
    const onChange = vi.fn();
    const tree = PlatformFilterBar({
      platforms: platforms.slice(0, 2),
      value: "Popular",
      onChange,
    });
    const buttons = elements(tree).filter((item) => item.type === "button");
    expect(buttons).toHaveLength(2);
    (buttons[1]!.props["onClick"] as () => void)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("WhatsApp");
  });

  it.each([
    ["instagram-post", "4:5"],
    ["instagram-square", "1:1"],
    ["instagram-story", "9:16"],
    ["instagram-reel", "9:16"],
    ["linkedin-post", "1:1"],
    ["linkedin-banner", "4:1"],
    ["facebook-post", "40:21"],
    ["facebook-cover", "205:78"],
  ])(
    "creates the original %s with correct shared-card metadata",
    (id, ratio) => {
      const format = formats.find((item) => item.id === id)!;
      const onSelect = vi.fn();
      const tree = FormatCard({ format, index: 0, onSelect });
      expect(tree.type).toBe(PresetCard);
      (tree.props.onClick as () => void)();
      expect(onSelect).toHaveBeenCalledExactlyOnceWith(format);
      expect(onSelect.mock.calls[0]![0]).toBe(format);
      const html = renderToStaticMarkup(tree);
      expect(html).toContain(`${format.width} × ${format.height} px`);
      expect(html).not.toContain("Use template");
      expect(html).toContain(`title="Aspect ratio ${ratio}"`);
      expect(html).toContain('class="preset-card-art"');
      expect(html).toContain('class="preset-card-details"');
      const footerStart = html.indexOf('<span class="preset-card-details">');
      const preview = html.slice(0, footerStart);
      const footer = html.slice(footerStart);
      expect(footer).toContain(`title="Aspect ratio ${ratio}"`);
      expect(footer).toContain(`${format.width} × ${format.height} px`);
      expect(footer).toContain('class="preset-card-metadata"');
      expect(footer).toContain(`title="${format.label}"`);
      expect(preview).not.toContain("preset-card-metadata");
      expect(footer.indexOf('class="preset-card-title"')).toBeLessThan(
        footer.indexOf('class="preset-card-metadata"'),
      );
      expect(html).toContain(`viewBox="0 0 ${format.width} ${format.height}"`);
    },
  );

  it("preserves the custom-size callback alongside the preset grid", () => {
    const onCreateCustom = vi.fn();
    const onSelect = vi.fn();
    const tree = FormatGrid({
      formats: formats.slice(0, 2),
      onSelect,
      onCreateCustom,
    });
    const all = elements(tree);
    const add = all.find((item) => item.type === AddFormatCard)!;
    expect(add.props["onClick"]).toBe(onCreateCustom);
    const button = AddFormatCard({ onClick: onCreateCustom });
    expect(button.type).toBe(PresetCard);
    expect(button.props.mode).toBe("create");
    button.props.onClick();
    expect(onCreateCustom).toHaveBeenCalledOnce();
    const presets = all.filter((item) => item.type === FormatCard);
    expect(presets).toHaveLength(2);
    expect(presets[0]!.props["onSelect"]).toBe(onSelect);
    expect(renderToStaticMarkup(createElement("div", null, tree))).toContain(
      "Create a design",
    );
    const createMarkup = renderToStaticMarkup(button);
    expect(createMarkup).toContain("Preset or custom size");
    expect(createMarkup).not.toContain("preset-card-art");
    expect(createMarkup).not.toContain("preset-card-details");
  });
});
