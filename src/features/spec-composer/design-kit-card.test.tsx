import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  BrandKitSwatches,
  DesignKitCard,
  DesignKitSummary,
  type DesignKitCardActions,
  brandKitColorPaint,
} from "./design-kit-card";
import type { BrandKit } from "./types";

function withTooltips(node: ReactNode) {
  return createElement(TooltipProvider, null, node);
}

function makeKit(overrides: Partial<BrandKit> & { id: string }): BrandKit {
  return {
    name: "Untitled kit",
    colors: [],
    emotions: [],
    style: "Minimal",
    typography: "Manrope",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const auroraKit = makeKit({
  id: "kit-aurora",
  name: "Aurora",
  typography: "Fraunces",
  colors: [
    {
      id: "c1",
      role: "primary",
      hex: "#112233",
      type: "solid",
      angle: 0,
      usecase: "",
    },
    {
      id: "c2",
      role: "secondary",
      hex: "#223344",
      type: "solid",
      angle: 0,
      usecase: "",
    },
    {
      id: "c3",
      role: "background",
      hex: "#ffffff",
      type: "solid",
      angle: 0,
      usecase: "",
    },
    {
      id: "c4",
      role: "text",
      hex: "#000000",
      type: "solid",
      angle: 0,
      usecase: "",
    },
    // no accent color: the palette should show an empty slot for it.
  ],
});

function makeActions(
  overrides: Partial<DesignKitCardActions> = {},
): DesignKitCardActions {
  return {
    active: false,
    applyMode: false,
    onActivate: vi.fn(),
    onDeactivate: vi.fn(),
    onEdit: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

type ElementProps = {
  children?: ReactNode;
  actions?: ReactNode;
  title?: ReactNode;
  [key: string]: unknown;
};

/** Finds every element reachable by following `children`, `actions`, and
 * `title` props — the three places DesignKitCard threads already-rendered
 * JSX (mirrors the walker pattern in tool-rail.test.tsx). */
function findAll(node: ReactNode): ReactElement<ElementProps>[] {
  if (Array.isArray(node)) return node.flatMap(findAll);
  if (!isValidElement<ElementProps>(node)) return [];
  return [
    node,
    ...findAll(node.props.children),
    ...findAll(node.props.actions),
    ...findAll(node.props.title),
  ];
}

describe("shared DesignKitCard", () => {
  it("renders a read-only display card with real artwork and no interactive wrappers", () => {
    const html = renderToStaticMarkup(<DesignKitCard kit={auroraKit} active />);
    expect(html).toContain("bk-preview-illustration");
    expect(html).toContain("card-hover-scale");
    expect(html).toContain("Get started");
    expect(html).toContain('class="bk-palette-role">Primary<');
    expect(html).toContain(">#112233<");
    expect(html).toContain("is-static");
    expect(html).toContain(" active");
    expect(html).not.toMatch(/<(?:button|input)\b/);
    expect(html).not.toContain('role="toolbar"');
    expect(html).not.toContain("data-tour");

    const wrapped = renderToStaticMarkup(
      <a href="/design-kit">
        <DesignKitCard kit={auroraKit} active />
      </a>,
    );
    expect(wrapped.match(/<a\b/g)).toHaveLength(1);
    expect(wrapped).not.toMatch(/<button\b/);
  });

  it("does not mark a display card active when `active` is false or omitted", () => {
    const html = renderToStaticMarkup(<DesignKitCard kit={auroraKit} />);
    expect(html).toContain("is-static");
    expect(html).not.toContain(" active");
  });

  it("renders an interactive card with the shared toolbar and real buttons", () => {
    const activeHtml = renderToStaticMarkup(
      withTooltips(
        <DesignKitCard kit={auroraKit} actions={makeActions({ active: true })} />,
      ),
    );
    expect(activeHtml).toContain('aria-pressed="true"');
    expect(activeHtml).toContain(">Applied<");
    expect(activeHtml).not.toContain("is-static");
    expect(activeHtml).toContain(" active");
    expect(activeHtml).toContain('data-tour="kit-card"');
    expect(activeHtml).toContain('role="toolbar"');

    const inactiveHtml = renderToStaticMarkup(
      withTooltips(<DesignKitCard kit={auroraKit} actions={makeActions()} />),
    );
    expect(inactiveHtml).toContain(">Apply<");
    expect(inactiveHtml).not.toContain(" active");
  });

  it("gives the active card a border in the kit's own primary color", () => {
    const activeHtml = renderToStaticMarkup(
      withTooltips(
        <DesignKitCard kit={auroraKit} actions={makeActions({ active: true })} />,
      ),
    );
    expect(activeHtml).toContain("--bk-active-border:#112233");

    const inactiveHtml = renderToStaticMarkup(
      withTooltips(<DesignKitCard kit={auroraKit} actions={makeActions()} />),
    );
    expect(inactiveHtml).not.toContain("--bk-active-border");

    const staticActiveHtml = renderToStaticMarkup(
      <DesignKitCard kit={auroraKit} active />,
    );
    expect(staticActiveHtml).toContain("--bk-active-border:#112233");

    const staticInactiveHtml = renderToStaticMarkup(
      <DesignKitCard kit={auroraKit} />,
    );
    expect(staticInactiveHtml).not.toContain("--bk-active-border");
  });

  it("renders the full showcase card with artwork and the interactive palette", () => {
    const actions = makeActions();
    const html = renderToStaticMarkup(
      withTooltips(<DesignKitCard kit={auroraKit} actions={actions} />),
    );
    expect(html).toContain("bk-showcase-card");
    expect(html.match(/class="bk-palette-slot(?: is-empty)?"/g)).toHaveLength(
      5,
    );
    expect(html).toContain('aria-label="Copy Primary #112233"');
    expect(html).toContain("Get started");
  });

  it("routes the empty palette slot to onEdit only when interactive", () => {
    const emptyKit = makeKit({ id: "kit-empty", name: "Empty", colors: [] });
    let nodes: ReactElement<ElementProps>[] = [];
    function Harness() {
      const tree = (
        <TooltipProvider>
          {DesignKitCard({ kit: emptyKit, actions: makeActions() })}
        </TooltipProvider>
      );
      nodes = findAll(tree);
      return tree;
    }
    renderToStaticMarkup(<Harness />);
    const emptySlot = nodes.find((node) =>
      String(node.props["className"] ?? "").includes("bk-palette-slot"),
    )!;
    expect(emptySlot.props["className"]).toContain("is-empty");
    expect(typeof emptySlot.props["onClick"]).toBe("function");

    const displayHtml = renderToStaticMarkup(
      <DesignKitCard kit={emptyKit} active />,
    );
    expect(displayHtml.match(/class="bk-palette-slot is-empty"/g)).toHaveLength(
      5,
    );
  });
});

describe("DesignKitSummary", () => {
  it("renders phrasing-only content with the kit's identity and colors", () => {
    const html = renderToStaticMarkup(<DesignKitSummary kit={auroraKit} />);
    expect(html).not.toMatch(/<(?:button|a|input)\b/);
    expect(html).toContain("Aurora");

    const gradientHtml = renderToStaticMarkup(
      <DesignKitSummary
        kit={makeKit({
          id: "kit-grad",
          name: "Grad",
          colors: [
            {
              id: "g1",
              role: "primary",
              type: "gradient",
              hex: "#123456",
              secondaryHex: "#abcdef",
              angle: 45,
              usecase: "",
            },
          ],
        })}
      />,
    );
    expect(gradientHtml).toContain("linear-gradient(45deg, #123456, #abcdef)");
    expect(
      brandKitColorPaint({ type: "gradient", hex: "#123456", angle: 45 }),
    ).toBe("linear-gradient(45deg, #123456, #123456)");
  });

  it("falls back to honest empty-state copy and colors when there is no kit", () => {
    const html = renderToStaticMarkup(<DesignKitSummary />);
    expect(html).toContain("Build your identity");
    expect(renderToStaticMarkup(<BrandKitSwatches colors={[]} />)).toContain(
      "No colors yet",
    );
  });

  it("works inside a <button> without creating nested interactive markup", () => {
    const html = renderToStaticMarkup(
      <button type="button">
        <DesignKitSummary kit={auroraKit} subtitle="Applied Design Kit" />
      </button>,
    );
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain("Applied Design Kit");
  });
});
