import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  AddFormatCard,
  FormatCard,
  FormatGrid,
  PlatformFilterBar,
} from "./format-gallery";
import { formats, platforms } from "./formats";

type ElementProps = { children?: ReactNode; [key: string]: unknown };
function elements(node: ReactNode): ReactElement<ElementProps>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<ElementProps>(node)) return [];
  return [node, ...elements(node.props.children)];
}

describe("home format gallery", () => {
  it("keeps six primary filters and groups remaining platforms under More", () => {
    const tree = PlatformFilterBar({
      platforms,
      value: "Popular",
      onChange: vi.fn(),
    });
    const all = elements(tree);
    const primary = all.filter(
      (item) => item.type === "button" && item.props["data-platform"],
    );
    expect(
      primary
        .map((item) => item.props.children)
        .map((children) => (children as ReactElement[])[1]!.props),
    ).toEqual(
      platforms.slice(0, 6).map((platform) => ({ children: platform })),
    );
    const menu = all.filter((item) => item.type === DropdownMenuRadioItem);
    expect(menu.map((item) => item.props["value"])).toEqual(platforms.slice(6));
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('aria-label="More platforms"');
    expect(html).toContain('aria-pressed="true"');
  });

  it("labels an overflow selection and passes its original platform value", () => {
    const onChange = vi.fn();
    const tree = PlatformFilterBar({ platforms, value: "Pinterest", onChange });
    const all = elements(tree);
    const more = all.find(
      (item) => item.type === "button" && item.props["data-selected"],
    );
    expect(more?.props["aria-label"]).toBe("More platforms: Pinterest");
    const group = all.find((item) => item.type === DropdownMenuRadioGroup)!;
    expect(group.props["value"]).toBe("Pinterest");
    const change = group.props["onValueChange"] as (value: string) => void;
    change("TikTok");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("TikTok");
    change("invalid");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("preserves direct primary-filter callbacks and handles a short filter list", () => {
    const onChange = vi.fn();
    const tree = PlatformFilterBar({
      platforms: platforms.slice(0, 2),
      value: "Popular",
      onChange,
    });
    const all = elements(tree);
    const whatsapp = all.find(
      (item) => item.props["data-platform"] === "whatsapp",
    )!;
    (whatsapp.props["onClick"] as () => void)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("WhatsApp");
    expect(
      all.filter((item) => item.type === DropdownMenuRadioGroup),
    ).toHaveLength(0);
  });

  it("creates the original preset with unchanged dimensions and minimal metadata", () => {
    const format = formats.find((item) => item.id === "instagram-story")!;
    const onSelect = vi.fn();
    const tree = FormatCard({ format, index: 0, onSelect });
    (tree.props.onClick as () => void)();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(format);
    expect(onSelect.mock.calls[0]![0]).toBe(format);
    const html = renderToStaticMarkup(tree);
    expect(html).toContain(`${format.width} × ${format.height} px`);
    expect(html).not.toContain("Use template");
    expect(html).not.toContain(format.subtitle);
    expect(html).toContain(`viewBox="0 0 ${format.width} ${format.height}"`);
  });

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
    button.props.onClick();
    expect(onCreateCustom).toHaveBeenCalledOnce();
    const presets = all.filter((item) => item.type === FormatCard);
    expect(presets).toHaveLength(2);
    expect(presets[0]!.props["onSelect"]).toBe(onSelect);
    expect(renderToStaticMarkup(createElement("div", null, tree))).toContain(
      "Create a design",
    );
  });
});
