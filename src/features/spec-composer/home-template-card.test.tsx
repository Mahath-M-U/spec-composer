import {
  createElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
  return { props, html, find, all: elements(tree!) };
}

describe("home template card", () => {
  it("renders full template media and compact metadata with mounted accessible actions", () => {
    const { props, html, find } = renderCard();
    expect(html).toContain('aria-label="Use template: Product Launch"');
    expect(html).toContain('aria-label="Copy prompt: Product Launch"');
    expect(html).toContain('aria-label="More actions for Product Launch"');
    expect(html).toContain('data-template-preview="true"');
    expect(html).toContain("Product Launch");
    expect(html).toContain(props.doc.format.label);
    expect(html).toContain(
      `${props.doc.format.width} × ${props.doc.format.height}`,
    );
    expect(html).not.toContain("Marketing");
    expect(html).not.toContain("Cinematic");
    expect(html).not.toContain("<time");
    const media = find((element) => element.type === TemplateCardMedia);
    expect(media.props).toMatchObject({
      doc: props.doc,
      priority: true,
      image: templateImageFor(props.doc.name),
    });
  });

  it("shares existing Use and Copy callbacks across preview, overlay and overflow", () => {
    const { props, find, all } = renderCard();
    const preview = find(
      (element) =>
        element.type === "button" &&
        element.props["className"] === "recent-design-preview-link",
    );
    const use = find(
      (element) =>
        element.type === "button" &&
        element.props["className"] ===
          "recent-design-action recent-design-open",
    );
    const copy = find(
      (element) =>
        element.type === "button" &&
        element.props["className"] ===
          "recent-design-action recent-design-copy",
    );
    const menu = all.filter((element) => element.type === DropdownMenuItem);
    expect(menu).toHaveLength(2);
    expect(preview.props["onClick"]).toBe(props.onOpen);
    expect(use.props["onClick"]).toBe(props.onOpen);
    expect(menu[0]!.props["onSelect"]).toBe(props.onOpen);
    expect(copy.props["onClick"]).toBe(props.onCopy);
    expect(menu[1]!.props["onSelect"]).toBe(props.onCopy);
    expect(menu[0]!.props.children).toContain(" Use template");
    expect(menu[1]!.props.children).toContain("Copy prompt");
    const card = find((element) => element.type === "article");
    expect(card.props["onClick"]).toBeUndefined();
    expect(card.props["onKeyDown"]).toBeUndefined();
    expect(card.props["onPointerEnter"]).toBe(props.onWarmEditor);
    expect(card.props["onFocus"]).toBe(props.onWarmEditor);
  });

  it("preserves pending and copied feedback without changing the visible Copy label", () => {
    const pending = renderCard({ copying: true });
    const button = pending.find(
      (element) =>
        element.type === "button" &&
        element.props["className"] ===
          "recent-design-action recent-design-copy",
    );
    const menu = pending.all.filter(
      (element) => element.type === DropdownMenuItem,
    );
    expect(button.props["disabled"]).toBe(true);
    expect(button.props["aria-busy"]).toBe(true);
    expect(button.props.children).toContain("Copy");
    expect(menu[1]!.props["disabled"]).toBe(true);
    expect(pending.html).toContain("Copying…");
    const copied = renderCard({ copied: true });
    expect(copied.html).toContain("Copied");
    expect(copied.html).toContain('aria-busy="false"');
  });

  it("offers DESIGN.md copying without project-only actions", () => {
    const { all, html } = renderCard({
      doc: { ...createDocument(), promptMode: "design_skill" },
    });
    const menu = all.filter((element) => element.type === DropdownMenuItem);
    expect(menu[1]!.props.children).toContain("Copy DESIGN.md");
    expect(html).toContain('aria-label="Copy DESIGN.md:');
    const labels = menu.flatMap((element) => element.props.children);
    expect(labels).not.toContain("Rename");
    expect(labels).not.toContain("Delete");
  });
});
