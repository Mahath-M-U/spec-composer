import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { describe, expect, it, vi } from "vitest";
import {
  PreviewCard,
  PreviewCardSkeleton,
  type PreviewCardProps,
} from "./preview-card";

type ElementProps = { children?: ReactNode; [key: string]: unknown };

function renderCard(overrides: Partial<PreviewCardProps> = {}) {
  const props: PreviewCardProps = {
    title: "Product Launch",
    subtitle: "Marketing",
    media: createElement("span", { "data-media": true }),
    primaryAction: {
      label: "Use template",
      ariaLabel: "Use template: Product Launch",
      icon: createElement("span", { "data-icon": "primary" }),
      onSelect: vi.fn(),
    },
    ...overrides,
  };
  let tree: ReactElement;
  function Capture() {
    tree = PreviewCard(props);
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
  function query(predicate: (element: ReactElement<ElementProps>) => boolean) {
    return elements(tree).find(predicate);
  }
  return { props, html, find, query, all: elements(tree!) };
}

describe("preview card", () => {
  it("shares the primary action between the media target and the overlay button by identity", () => {
    const { props, find } = renderCard();
    const mediaLink = find(
      (element) =>
        element.type === "button" &&
        element.props["className"] === "preview-card-media-link",
    );
    const primary = find(
      (element) => element.props["className"] === "preview-card-primary",
    );
    expect(mediaLink.props["onClick"]).toBe(props.primaryAction.onSelect);
    expect(primary.props["onClick"]).toBe(props.primaryAction.onSelect);
    expect(mediaLink.props["tabIndex"]).toBe(-1);
  });

  it("renders the primary action through renderLink as an anchor, reused by the media target", () => {
    const renderLink = vi.fn((linkProps) =>
      createElement("a", { href: "/design/1", ...linkProps }),
    );
    const { html, find } = renderCard({
      primaryAction: {
        label: "Open",
        ariaLabel: "Open Product Launch",
        renderLink,
      },
    });
    expect(html).toContain('href="/design/1"');
    const links = find((element) => element.type === "a");
    expect(links).toBeDefined();
    expect(renderLink).toHaveBeenCalledTimes(2);
    const [mediaCall, primaryCall] = renderLink.mock.calls.map(
      (call) => call[0],
    );
    expect(mediaCall["className"]).toBe("preview-card-media-link");
    expect(mediaCall["aria-label"]).toBe("Open Product Launch");
    expect(mediaCall["tabIndex"]).toBe(-1);
    expect(primaryCall["className"]).toBe("preview-card-primary");
    expect(primaryCall["tabIndex"]).toBeUndefined();
  });

  it("orders the overlay as primary, then secondary actions, then the overflow menu trigger", () => {
    const { all, find } = renderCard({
      secondaryActions: [
        {
          label: "Copy",
          ariaLabel: "Copy: Product Launch",
          onSelect: vi.fn(),
        },
      ],
      menuItems: [{ id: "open", label: "Use template", onSelect: vi.fn() }],
    });
    const primary = find(
      (element) => element.props["className"] === "preview-card-primary",
    );
    const secondary = find(
      (element) =>
        element.props["className"] ===
        "preview-card-icon preview-card-secondary",
    );
    const trigger = find((element) => element.type === DropdownMenuTrigger);
    const order = [primary, secondary, trigger].map((element) =>
      all.indexOf(element),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("hides the overlay title from assistive tech and marks decorative pills aria-hidden", () => {
    const { find } = renderCard({
      pills: [
        { id: "category", label: "Marketing", decorative: true },
        { id: "size", label: "1080 × 1080", title: "Square" },
      ],
    });
    const title = find(
      (element) => element.props["className"] === "preview-card-overlay-title",
    );
    expect(title.props["aria-hidden"]).toBe("true");
    const pills = find(
      (element) => element.props["className"] === "preview-card-pill",
    );
    expect(pills).toBeDefined();
    const all = renderCard({
      pills: [
        { id: "category", label: "Marketing", decorative: true },
        { id: "size", label: "1080 × 1080", title: "Square" },
      ],
    }).all;
    const pillElements = all.filter(
      (element) => element.props["className"] === "preview-card-pill",
    );
    expect(pillElements[0]!.props["aria-hidden"]).toBe(true);
    expect(pillElements[1]!.props["aria-hidden"]).toBeUndefined();
    expect(pillElements[1]!.props["title"]).toBe("Square");
  });

  it("renders secondary actions as icon-only with disabled, busy and sr-only status, never a visible text label", () => {
    const onSelect = vi.fn();
    const { find } = renderCard({
      secondaryActions: [
        {
          label: "Copy",
          ariaLabel: "Copy DESIGN.md: Product Launch",
          icon: createElement("span", { "data-icon": "copy" }),
          onSelect,
          disabled: true,
          busy: true,
          status: "Copying…",
        },
      ],
    });
    const button = find(
      (element) =>
        element.props["className"] ===
        "preview-card-icon preview-card-secondary",
    );
    expect(button.props["onClick"]).toBe(onSelect);
    expect(button.props["disabled"]).toBe(true);
    expect(button.props["aria-busy"]).toBe(true);
    const children = Array.isArray(button.props.children)
      ? button.props.children
      : [button.props.children];
    expect(children.some((child) => typeof child === "string")).toBe(false);
    const status = find((element) => element.props["role"] === "status");
    expect(status.props.children).toBe("Copying…");
  });

  it("supports separators, destructive styling, disabled state and renderLink asChild items in the menu", () => {
    const renderLink = vi.fn((linkProps) =>
      createElement("a", { href: "/design/1", ...linkProps }),
    );
    const onSelect = vi.fn();
    const { all, find } = renderCard({
      menuItems: [
        { id: "open", label: "Open", renderLink, ariaLabel: "Open design" },
        { id: "duplicate", label: "Duplicate", onSelect, disabled: true },
        {
          id: "delete",
          label: "Delete",
          onSelect: vi.fn(),
          destructive: true,
          separatorBefore: true,
        },
      ],
    });
    const items = all.filter((element) => element.type === DropdownMenuItem);
    expect(items).toHaveLength(3);
    expect(items[0]!.props["asChild"]).toBe(true);
    expect(renderLink).toHaveBeenCalledWith(
      expect.objectContaining({ "aria-label": "Open design" }),
    );
    expect(items[1]!.props["onSelect"]).toBe(onSelect);
    expect(items[1]!.props["disabled"]).toBe(true);
    const destructive = find(
      (element) =>
        element.type === DropdownMenuItem &&
        typeof element.props["className"] === "string" &&
        element.props["className"].includes(
          "preview-card-menu-item--destructive",
        ),
    );
    expect(destructive.props.children).toMatchObject({});
    const separator = all.find(
      (element) => element.type === DropdownMenuSeparator,
    );
    expect(separator).toBeDefined();
    expect(all.indexOf(separator!)).toBeLessThan(all.indexOf(items[2]!));
    expect(all.indexOf(items[1]!)).toBeLessThan(all.indexOf(separator!));
  });

  it("omits the overflow trigger entirely when there are no menu items", () => {
    const { all } = renderCard({ menuItems: [] });
    expect(all.some((element) => element.type === DropdownMenuTrigger)).toBe(
      false,
    );
  });

  it("never attaches click or keydown handlers to the article, and wires onWarm to pointer enter and focus", () => {
    const onWarm = vi.fn();
    const { find } = renderCard({ onWarm });
    const article = find((element) => element.type === "article");
    expect(article.props["onClick"]).toBeUndefined();
    expect(article.props["onKeyDown"]).toBeUndefined();
    expect(article.props["onPointerEnter"]).toBe(onWarm);
    expect(article.props["onFocus"]).toBe(onWarm);
  });

  it("renders an always-visible badge in the media slot", () => {
    const { find } = renderCard({
      badge: createElement("span", { "data-badge": true }),
    });
    const badge = find(
      (element) => element.props["className"] === "preview-card-badge",
    );
    expect(badge).toBeDefined();
  });

  it("sets the aspect ratio CSS variable from the aspectRatio prop", () => {
    const { find } = renderCard({ aspectRatio: "1 / 1" });
    const media = find(
      (element) => element.props["className"] === "preview-card-media",
    );
    expect(media.props["style"]).toMatchObject({
      "--preview-card-aspect": "1 / 1",
    });
  });

  it("falls back to the primary action's aria-label for the overflow menu label", () => {
    const { find } = renderCard({
      menuItems: [{ id: "open", label: "Open", onSelect: vi.fn() }],
    });
    const trigger = find(
      (element) =>
        element.type === "button" &&
        element.props["className"] === "preview-card-icon preview-card-more",
    );
    expect(trigger.props["aria-label"]).toBe("More actions for Product Launch");
  });
});

describe("preview card skeleton", () => {
  it("renders a media placeholder and a metadata line", () => {
    const html = renderToStaticMarkup(createElement(PreviewCardSkeleton));
    expect(html).toContain("preview-card-skeleton");
    expect(html).toContain("media-skeleton");
    expect(html).toContain("media-skeleton--line");
  });

  it("applies a custom aspect ratio", () => {
    const html = renderToStaticMarkup(
      <PreviewCardSkeleton aspectRatio="1 / 1" />,
    );
    expect(html).toContain("--preview-card-aspect:1 / 1");
  });
});
