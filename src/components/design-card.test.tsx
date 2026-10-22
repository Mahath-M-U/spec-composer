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

  it("keeps the copy button transparent at rest", () => {
    expect(css).toMatch(/\.design-card-copy\s*\{[^}]*background:\s*transparent/);
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
