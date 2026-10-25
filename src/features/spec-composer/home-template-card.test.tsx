import {
  createElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DesignCard } from "@/components/design-card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { describe, expect, it, vi } from "vitest";
import { HomeTemplateCard } from "./home-template-card";
import { TemplateCardMedia } from "./template-card-media";
import { templateImageFor } from "./template-images";
import { createDocument } from "./templates";

vi.mock("./template-card-media", async () => {
  const { createElement } = await import("react");
  return {
    TemplateCardMedia: () =>
      createElement("span", { "data-template-preview": true }),
  };
});

type ElementProps = { children?: ReactNode; [key: string]: unknown };
function renderCard(
  overrides: Partial<ComponentProps<typeof HomeTemplateCard>> = {},
) {
  const props = {
    doc: {
      ...createDocument(),
      name: "Product Launch",
      imageStyle: "cinematic",
      promptMode: "visual_prompt" as const,
    },
    category: "Marketing",
    priority: true,
    copied: false,
    copying: false,
    onOpen: vi.fn(),
    onCopy: vi.fn(),
    onWarmEditor: vi.fn(),
    ...overrides,
  };
  let tree: ReactElement;
  function Capture() {
    tree = HomeTemplateCard(props);
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
  const card = find((element) => element.type === DesignCard);
  const cardProps = card.props as unknown as ComponentProps<typeof DesignCard>;
  return { props, html, find, all: elements(tree!), card, cardProps };
}

describe("home template card", () => {
  it("passes the full template media and compact metadata to DesignCard", () => {
    const { props, html, card, cardProps } = renderCard();
    expect(card.type).toBe(DesignCard);
    expect(html).toContain('aria-label="Use template: Product Launch"');
    expect(html).toContain('aria-label="Copy prompt: Product Launch"');
    expect(html).toContain('aria-label="More actions for Product Launch"');
    expect(html).toContain('data-template-preview="true"');
    expect(html).toContain("Product Launch");
    expect(html).toContain("Marketing / Instagram Post");
    expect(cardProps.aspectRatio).toBe("1080 / 1350");
    expect(html).not.toContain("Cinematic");
    expect(html).not.toContain("<time");
    expect(html).not.toContain("recent-design-edited-chip");
    expect(html).toContain("design-card-chip");
    expect(html).toContain("lucide-ruler");
    expect(html).toContain(
      `${props.doc.format.width}×${props.doc.format.height}`,
    );
    expect(cardProps.media).toMatchObject({
      type: TemplateCardMedia,
      props: {
        doc: props.doc,
        priority: true,
        image: templateImageFor(props.doc.name),
      },
    });
  });

  it("shares the existing Use and Copy callbacks across preview, badge and overflow by identity", () => {
    const { props, cardProps } = renderCard();
    expect(cardProps.onOpen).toBe(props.onOpen);
    expect(cardProps.previewLabel).toBe("Use template: Product Launch");
    expect(cardProps.copyAction!.onSelect).toBe(props.onCopy);
    const menu = cardProps.menuItems!;
    expect(menu).toHaveLength(2);
    expect(menu[0]!.onSelect).toBe(props.onOpen);
    expect(menu[0]!.label).toBe("Use template");
    expect(menu[1]!.onSelect).toBe(props.onCopy);
    expect(menu[1]!.label).toBe("Copy prompt");
    expect(cardProps.onWarm).toBe(props.onWarmEditor);
  });

  it("preserves pending and copied feedback on the icon-only Copy button", () => {
    const pending = renderCard({ copying: true });
    const copyAction = pending.cardProps.copyAction!;
    expect(copyAction.disabled).toBe(true);
    expect(copyAction.busy).toBe(true);
    expect(copyAction.ariaLabel).toBe("Copy prompt: Product Launch");
    expect(copyAction.status).toBeUndefined();
    expect(copyAction.copied).toBe(false);
    expect(pending.cardProps.menuItems![1]!.disabled).toBe(true);
    const copied = renderCard({ copied: true });
    expect(copied.cardProps.copyAction!.copied).toBe(true);
    expect(copied.html).toContain('aria-busy="false"');
  });

  it("offers DESIGN.md copying without project-only actions", () => {
    const { cardProps, html } = renderCard({
      doc: { ...createDocument(), promptMode: "design_skill" },
    });
    expect(cardProps.menuItems![1]!.label).toBe("Copy DESIGN.md");
    expect(cardProps.copyAction!.tooltip).toBe("Copy DESIGN.md");
    expect(html).toContain('aria-label="Copy DESIGN.md:');
    const labels = cardProps.menuItems!.map((item) => item.label);
    expect(labels).not.toContain("Rename");
    expect(labels).not.toContain("Delete");
  });

  it("keeps the badge, copy action and overflow menu present when onCopy is provided", () => {
    const { cardProps } = renderCard();
    expect(cardProps.modifiedBadge).toBeDefined();
    expect(cardProps.copyAction).toBeDefined();
    expect(cardProps.menuItems).toHaveLength(2);
  });

  it("never exposes favorite or preview-only affordances", () => {
    const { all } = renderCard();
    const labels = all
      .map((element) => element.props["aria-label"])
      .filter((label): label is string => typeof label === "string");
    expect(labels.some((label) => /favorite|preview/i.test(label))).toBe(false);
  });

  it("falls back to the format label when no category is provided", () => {
    const { cardProps, props } = renderCard({ category: undefined });
    expect(cardProps.category).toBe(props.doc.format.label);
    expect(cardProps.dimensions).toBeUndefined();
  });

  it("supports a minimal sidebar usage without copy affordances or template photos", () => {
    const onOpen = vi.fn();
    const { cardProps } = renderCard({
      copied: undefined,
      copying: undefined,
      onCopy: undefined,
      onWarmEditor: undefined,
      onOpen,
      className: "template-panel-card",
      templatePhoto: false,
    });
    expect(cardProps.copyAction).toBeUndefined();
    expect(cardProps.menuItems).toBeUndefined();
    expect(cardProps.className).toBe("card-hover-scale template-panel-card");
    expect(
      (cardProps.media as ReactElement<{ image?: unknown }>).props.image,
    ).toBeUndefined();
    expect(cardProps.onOpen).toBe(onOpen);
  });
});
