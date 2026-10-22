import {
  createElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PreviewCard } from "@/components/preview-card";
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
  const html = renderToStaticMarkup(createElement(Capture));
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
  const card = find((element) => element.type === PreviewCard);
  const cardProps = card.props as unknown as ComponentProps<typeof PreviewCard>;
  return { props, html, find, all: elements(tree!), card, cardProps };
}

describe("home template card", () => {
  it("passes the full template media and compact metadata to PreviewCard", () => {
    const { props, html, card, cardProps } = renderCard();
    expect(card.type).toBe(PreviewCard);
    expect(html).toContain('aria-label="Use template: Product Launch"');
    expect(html).toContain('aria-label="Copy prompt: Product Launch"');
    expect(html).toContain('aria-label="More actions for Product Launch"');
    expect(html).toContain('data-template-preview="true"');
    expect(html).toContain("Product Launch");
    expect(html).toContain(props.doc.format.label);
    expect(html).toContain(
      `${props.doc.format.width} × ${props.doc.format.height}`,
    );
    expect(html).toContain("Marketing");
    expect(html).not.toContain("Cinematic");
    expect(html).not.toContain("<time");
    expect(cardProps.media).toMatchObject({
      type: TemplateCardMedia,
      props: {
        doc: props.doc,
        priority: true,
        image: templateImageFor(props.doc.name),
      },
    });
  });

  it("shares the existing Use and Copy callbacks across preview, overlay and overflow by identity", () => {
    const { props, cardProps } = renderCard();
    expect(cardProps.primaryAction.onSelect).toBe(props.onOpen);
    expect(cardProps.secondaryActions![0]!.onSelect).toBe(props.onCopy);
    const menu = cardProps.menuItems!;
    expect(menu).toHaveLength(2);
    expect(menu[0]!.onSelect).toBe(props.onOpen);
    expect(menu[0]!.label).toBe("Use template");
    expect(menu[1]!.onSelect).toBe(props.onCopy);
    expect(menu[1]!.label).toBe("Copy prompt");
    expect(cardProps.onWarm).toBe(props.onWarmEditor);
  });

  it("preserves pending and copied feedback on an icon-only Copy button", () => {
    const pending = renderCard({ copying: true });
    const secondary = pending.cardProps.secondaryActions![0]!;
    expect(secondary.disabled).toBe(true);
    expect(secondary.busy).toBe(true);
    expect(secondary.ariaLabel).toBe("Copy prompt: Product Launch");
    expect(secondary.status).toBe("Copying…");
    expect(pending.cardProps.menuItems![1]!.disabled).toBe(true);
    expect(pending.html).toContain("Copying…");
    const copied = renderCard({ copied: true });
    expect(copied.cardProps.secondaryActions![0]!.status).toBe("Copied");
    expect(copied.html).toContain("Copied");
    expect(copied.html).toContain('aria-busy="false"');
  });

  it("offers DESIGN.md copying without project-only actions", () => {
    const { cardProps, html } = renderCard({
      doc: { ...createDocument(), promptMode: "design_skill" },
    });
    expect(cardProps.menuItems![1]!.label).toBe("Copy DESIGN.md");
    expect(html).toContain('aria-label="Copy DESIGN.md:');
    const labels = cardProps.menuItems!.map((item) => item.label);
    expect(labels).not.toContain("Rename");
    expect(labels).not.toContain("Delete");
  });

  it("keeps the overlay actions ordered as Use, Copy, then the overflow menu", () => {
    const { cardProps } = renderCard();
    expect(Object.keys(cardProps)).toEqual(
      expect.arrayContaining([
        "primaryAction",
        "secondaryActions",
        "menuItems",
      ]),
    );
    expect(cardProps.secondaryActions).toHaveLength(1);
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
    expect(cardProps.pills).toHaveLength(1);
    expect(cardProps.subtitle).toBe(props.doc.format.label);
    expect(cardProps.subtitleTitle).toBe(props.doc.format.label);
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
    expect(cardProps.secondaryActions).toBeUndefined();
    expect(cardProps.menuItems).toBeUndefined();
    expect(cardProps.className).toBe("template-panel-card");
    expect(
      (cardProps.media as ReactElement<{ image?: unknown }>).props.image,
    ).toBeUndefined();
    expect(cardProps.primaryAction.onSelect).toBe(onOpen);
  });
});
