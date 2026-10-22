import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PresetCard, PresetCreateCard } from "./preset-card";

describe("shared preset cards", () => {
  it.each(["home", "resize"] as const)(
    "renders one accessible %s button and delegates selection",
    (variant) => {
      const onClick = vi.fn();
      const tree = PresetCard({
        title: "Story",
        width: 1080,
        height: 1920,
        artwork: <svg aria-hidden="true" />,
        onClick,
        ariaLabel: "Select Story",
        variant,
        ...(variant === "resize" ? { ratio: "9:16" } : { badge: "Animated" }),
      });
      tree.props.onClick();
      expect(onClick).toHaveBeenCalledOnce();
      const html = renderToStaticMarkup(tree);
      expect(html.match(/<button/g)).toHaveLength(1);
      expect(html).toContain('aria-label="Select Story"');
      expect(html).toContain('title="1080 × 1920 px"');
      expect(html).toContain(variant === "resize" ? "9:16" : "Animated");
      expect(html).not.toContain("<input");
    },
  );
  it("exposes current, selected, and disabled state without owning canvas effects", () => {
    const html = renderToStaticMarkup(
      <PresetCard
        title="Square"
        width={1080}
        height={1080}
        artwork={<svg />}
        onClick={vi.fn()}
        ariaLabel="Select Square, current size"
        variant="resize"
        selected
        current
        disabled
      />,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Current</span>");
    expect(html).toContain('disabled=""');
    expect(html).toContain("resize-card-check");
  });
  it("delegates custom-size toggles and keeps full accessible descriptions", () => {
    const onClick = vi.fn();
    const tree = PresetCreateCard({
      variant: "resize",
      title: "Custom size",
      description: "Enter width and height",
      ariaLabel: "Enter a custom size",
      selected: true,
      onClick,
    });
    tree.props.onClick();
    expect(onClick).toHaveBeenCalledOnce();
    const html = renderToStaticMarkup(tree);
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('title="Enter width and height"');
    expect(html).toContain("preset-card--create");
  });
});
