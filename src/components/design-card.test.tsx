import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Check, Copy } from "lucide-react";
import { DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Hint, TooltipProvider } from "@/components/ui/tooltip";
import { describe, expect, it, vi } from "vitest";
import { DesignCard, type DesignCardProps } from "./design-card";

type ElementProps = { children?: ReactNode; [key: string]: unknown };

function renderCard(overrides: Partial<DesignCardProps> = {}) {
  const props: DesignCardProps = {
    title: "Product Launch",
    media: createElement("span", { "data-media": true }),
    ...overrides,
  };
  let tree: ReactElement;
  function Capture() {
    tree = DesignCard(props);
    return tree;
  }
  const html = renderToStaticMarkup(
    createElement(TooltipProvider, null, createElement(Capture)),
  );
  function elements(node: ReactNode): ReactElement<ElementProps>[] {
    if (Array.isArray(node)) return node.flatMap(elements);
    if (!isValidElement<ElementProps>(node)) return [];
    return [node, ...elements(node.props.children)];
  }
  function find(predicate: (element: ReactElement<ElementProps>) => boolean) {
    const element = elements(tree).find(predicate);
    expect(element).toBeDefined();
    return element!;
  }
  function query(predicate: (element: ReactElement<ElementProps>) => boolean) {
    return elements(tree).find(predicate);
  }
  return { props, html, find, query, all: elements(tree!) };
}

describe("design card", () => {
  it("escapes the title", () => {
    const { html } = renderCard({ title: '<Long title & "quotes">' });
    expect(html).toContain("&lt;Long title &amp; &quot;quotes&quot;&gt;");
  });

  it("joins category and dimensions into a single meta line", () => {
    const { find } = renderCard({
      category: "Instagram Post",
      dimensions: "1080 × 1350",
    });
    const subtitle = find(
      (element) => element.props["className"] === "design-card-subtitle",
    );
    expect(subtitle.props.children).toBe("Instagram Post · 1080 × 1350");
  });

  it("omits the meta line when category and dimensions are both missing", () => {
    const { query } = renderCard();
    const subtitle = query(
      (element) => element.props["className"] === "design-card-subtitle",
    );
    expect(subtitle).toBeUndefined();
  });

  it("renders the modified badge inside the badge slot", () => {
    const { find } = renderCard({
      modifiedBadge: createElement("span", { "data-badge": true }),
    });
    const badge = find(
      (element) => element.props["className"] === "design-card-badge",
    );
    expect(
      find((element) => element.props["data-badge"] === true),
    ).toBeDefined();
    expect(badge).toBeDefined();
  });

  it("omits the overflow trigger entirely when there are no menu items", () => {
    const { all } = renderCard();
    expect(all.some((element) => element.type === DropdownMenuTrigger)).toBe(
      false,
    );
  });

  it("uses renderLink for the clickable preview when provided", () => {
    const renderLink = vi.fn((linkProps) =>
      createElement("a", { href: "/design/1", ...linkProps }),
    );
    const { html, find } = renderCard({ renderLink, previewLabel: "Open it" });
    expect(html).toContain('href="/design/1"');
    expect(renderLink).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        className: "design-card-media-link",
        "aria-label": "Open it",
      }),
    );
    expect(find((element) => element.type === "a")).toBeDefined();
  });

  it("shows a check icon and a copied status once the copy action reports success", () => {
    const { find, query } = renderCard({
      copyAction: {
        ariaLabel: "Copy DESIGN.md: Product Launch",
        tooltip: "Copy DESIGN.md",
        onSelect: vi.fn(),
        copied: true,
      },
    });
    const button = find(
      (element) => element.props["className"] === "design-card-copy",
    );
    expect(find((element) => element.type === Check)).toBeDefined();
    expect(query((element) => element.type === Copy)).toBeUndefined();
    const status = find((element) => element.props["role"] === "status");
    expect(status.props.children).toBe("Copied");
    expect(button.props["aria-label"]).toBe("Copy DESIGN.md: Product Launch");
  });

  it("disables the copy button when the copy action reports disabled", () => {
    const { find } = renderCard({
      copyAction: {
        ariaLabel: "Copy DESIGN.md: Product Launch",
        tooltip: "Copy DESIGN.md",
        onSelect: vi.fn(),
        disabled: true,
      },
    });
    const button = find(
      (element) => element.props["className"] === "design-card-copy",
    );
    expect(button.props["disabled"]).toBe(true);
  });

  it("marks destructive menu items with the destructive class", () => {
    const { find } = renderCard({
      menuItems: [
        { id: "open", label: "Open", onSelect: vi.fn() },
        {
          id: "delete",
          label: "Delete",
          onSelect: vi.fn(),
          destructive: true,
          separatorBefore: true,
        },
      ],
    });
    const destructive = find(
      (element) =>
        element.type === DropdownMenuItem &&
        typeof element.props["className"] === "string" &&
        element.props["className"].includes(
          "design-card-menu-item--destructive",
        ),
    );
    expect(destructive).toBeDefined();
  });

  it("wraps the overflow trigger and copy button in tooltips", () => {
    const { find } = renderCard({
      menuItems: [{ id: "open", label: "Open", onSelect: vi.fn() }],
      copyAction: {
        ariaLabel: "Copy DESIGN.md: Product Launch",
        tooltip: "Copy DESIGN.md",
        onSelect: vi.fn(),
      },
    });
    const copyHint = find(
      (element) => element.type === Hint && element.props["label"] === "Copy DESIGN.md",
    );
    expect(copyHint).toBeDefined();
    const moreHint = find(
      (element) => element.type === Hint && element.props["label"] === "More actions",
    );
    expect(moreHint).toBeDefined();
  });
});

describe("design card styles", () => {
  const css = readFileSync(
    fileURLToPath(new URL("./design-card.css", import.meta.url)),
    "utf8",
  );
  const globalCss = readFileSync(
    fileURLToPath(new URL("../styles.css", import.meta.url)),
    "utf8",
  );

  it("uses only theme tokens, never hardcoded brand colors", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(css.toLowerCase()).not.toContain("c55454");
    expect(css.toLowerCase()).not.toContain("ca4b4b");
    expect(css.toLowerCase()).not.toContain("purple");
  });

  it("uses theme tokens for primary accents", () => {
    expect(css).toContain("var(--color-primary)");
    expect(css).toContain("var(--color-primary-foreground)");
    expect(css).toContain("color-mix(");
  });

  it("supports touch reveal and reduced motion", () => {
    expect(css).toContain("@media (hover: none)");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("removes the hover glow so hovering only changes the border color", () => {
    const hoverBlock = css.match(
      /\.design-card:is\(:hover, \[data-menu-open\]\)\s*\{[^}]*\}/,
    );
    expect(hoverBlock).toBeTruthy();
    expect(hoverBlock![0]).not.toContain("box-shadow");
    expect(css).not.toMatch(/box-shadow:[^;]*--color-primary/);
  });

  it("matches the resize card's surface and hover border treatment", () => {
    expect(css).toContain("border-color: var(--card-border-hover)");
    expect(css).toContain("white 7%");
  });

  it("defines the shared whole-card scale for hover-capable devices with motion enabled", () => {
    expect(globalCss).toMatch(
      /\.card-hover-scale\s*\{[^}]*transform:\s*scale\(1\);/,
    );
    expect(globalCss).toMatch(/\.card-hover-scale\s*\{[^}]*transform-origin: center;/);
    expect(css).toContain(
      "transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    );
    expect(globalCss).toContain(
      "@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    expect(globalCss).toMatch(/z-index:\s*1;\s*transform:\s*scale\(1\.015\);/);
  });

  it("keeps the copy button legible on the card surface at rest", () => {
    const base = css.match(/\.design-card-copy\s*\{([^}]+)\}/);
    expect(base).toBeTruthy();
    expect(base![1]).toContain("background: var(--design-card-surface)");
    expect(base![1]).toContain("color: var(--color-primary)");
  });

  it("uses contrasting primary colors for card and button interaction states", () => {
    const interaction = css.match(
      /\.design-card:is\(:hover, :focus-within, \[data-menu-open\]\) \.design-card-copy,\s*\.design-card-copy:is\(:hover, :active, :focus-visible\)\s*\{([^}]+)\}/,
    );
    expect(interaction).toBeTruthy();
    expect(interaction![1]).toContain("background: var(--color-primary)");
    expect(interaction![1]).toContain("color: var(--color-primary-foreground)");
    expect(interaction!.index).toBeGreaterThan(
      css.indexOf(".design-card-copy {"),
    );
    const copyBlocks = css.match(/\.design-card-copy\s*\{[^}]*\}/g) ?? [];
    expect(
      copyBlocks.filter((block) => /\bbackground:/.test(block)),
    ).toHaveLength(1);
  });

  it("reserves normal-width, naturally aligned tracks for homepage rows", () => {
    const row = globalCss.match(
      /\.home-page-content \.template-strip--starters,\s*\.home-page-content \.template-strip--recent\s*\{([^}]+)\}/,
    );
    expect(row).toBeTruthy();
    expect(row![1]).toContain("--home-card-min-width: 210px");
    expect(row![1]).toContain("align-items: start");
    expect(row![1]).toMatch(/grid-template-columns:\s*repeat\(\s*auto-fill,/);
  });

  it("uses a full-width ordered grid for My designs masonry with intrinsic item heights", () => {
    const fallback = globalCss.match(
      /\.projects-page \.project-masonry\s*\{([^}]+)\}/,
    );
    expect(fallback).toBeTruthy();
    expect(fallback![1]).toContain("display: grid");
    expect(fallback![1]).toContain("width: 100%");
    expect(fallback![1]).toMatch(
      /grid-template-columns:\s*repeat\(\s*auto-fit,/,
    );
    const measured = globalCss.match(
      /\.projects-page \.project-masonry\[data-project-masonry\]\s*\{([^}]+)\}/,
    );
    expect(measured).toBeTruthy();
    expect(measured![1]).toContain("repeat(var(--project-masonry-columns)");
    expect(measured![1]).toContain("grid-auto-flow: row");
    expect(measured![1]).toContain("grid-auto-rows: 1px");
    expect(measured![1]).toContain("row-gap: 0");
    expect(measured![1]).not.toMatch(/(?:height|overflow[^:]*):/);
    expect(globalCss).toMatch(
      /\.projects-page \.project-masonry > \.project-masonry-item\s*\{[^}]*align-self: start/,
    );
    expect(globalCss).toMatch(
      /\.projects-page \.project-masonry\s*\{\s*--project-masonry-max-columns: 2;/,
    );
    expect(globalCss).toMatch(
      /\.projects-page \.project-masonry\s*\{\s*--project-masonry-max-columns: 1;/,
    );
    expect(globalCss).not.toContain(".projects-page .template-masonry");
  });

  it("gives the chip a primary-tinted border with light, legible text", () => {
    expect(css).toMatch(
      /border:\s*1px solid color-mix\(in oklab, var\(--color-primary\)/,
    );
    expect(css).toMatch(/\.design-card-chip svg\s*\{[^}]*color:\s*var\(--color-primary\)/);
    expect(css).toMatch(
      /\.design-card-badge \.design-card-chip,[\s\S]*?color:\s*rgb\(255 255 255/,
    );
  });
});

describe("design card and resize card typography parity", () => {
  const designCss = readFileSync(
    fileURLToPath(new URL("./design-card.css", import.meta.url)),
    "utf8",
  );
  const presetCss = readFileSync(
    fileURLToPath(
      new URL("../features/spec-composer/preset-card.css", import.meta.url),
    ),
    "utf8",
  );

  function fontSize(css: string, selectorPattern: RegExp): number {
    const global = new RegExp(selectorPattern, "g");
    const blocks = css.match(global);
    expect(blocks).toBeTruthy();
    const withFontSize = blocks!.find((block) => block.includes("font-size"));
    expect(withFontSize).toBeTruthy();
    const match = withFontSize!.match(/font-size:\s*([\d.]+)px/);
    expect(match).toBeTruthy();
    return Number(match![1]);
  }

  it("keeps the design card's title no larger than the resize card's title", () => {
    const designTitle = fontSize(designCss, /\.design-card-title\s*\{[^}]*\}/);
    const presetTitle = fontSize(
      presetCss,
      /\.preset-card \.preset-card-title\s*\{[^}]*\}/,
    );
    expect(designTitle).toBeLessThanOrEqual(presetTitle);
  });

  it("keeps the design card's subtitle no larger than the resize card's description", () => {
    const designSubtitle = fontSize(
      designCss,
      /\.design-card-subtitle\s*\{[^}]*\}/,
    );
    const presetDescription = fontSize(
      presetCss,
      /\.preset-card \.preset-card-description\s*\{[^}]*\}/,
    );
    expect(designSubtitle).toBeLessThanOrEqual(presetDescription);
  });

  it("keeps the design card's chip no larger than the resize card's size pill", () => {
    const designChip = fontSize(
      designCss,
      /\.design-card-badge \.design-card-chip,[\s\S]*?\}/,
    );
    const presetMeta = fontSize(
      presetCss,
      /\.preset-card \.preset-card-ratio,\s*\n?\.preset-card \.preset-card-meta\s*\{[^}]*\}/,
    );
    expect(designChip).toBeLessThanOrEqual(presetMeta);
  });
});
