import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandKitPanel, BrandKitPreview } from "./brand-kit-panel";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import type { BrandKit } from "./types";

vi.mock("./store", async (importOriginal) => {
  const original = await importOriginal<typeof import("./store")>();
  type State = ReturnType<typeof original.useEditorStore.getState>;
  return {
    ...original,
    useEditorStore: Object.assign(
      <T = State,>(selector?: (state: State) => T) =>
        selector
          ? selector(original.useEditorStore.getState())
          : original.useEditorStore.getState(),
      original.useEditorStore,
    ),
  };
});

function renderPanel(
  props: Partial<{
    standalone: boolean;
    pageView: boolean;
    cardVariant: "portrait" | "row";
  }> = {},
) {
  function Capture() {
    return BrandKitPanel(props);
  }
  return renderToStaticMarkup(
    createElement(TooltipProvider, null, createElement(Capture)),
  );
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

const nightfallKit = makeKit({ id: "kit-nightfall", name: "Nightfall" });

// A kit whose primary and secondary are both too close to white to read as
// a mark or a title color, so both should fall back to the readable text
// color instead.
const paleKit = makeKit({
  id: "kit-pale",
  name: "Pale Kit",
  colors: [
    {
      id: "p1",
      role: "primary",
      hex: "#F5E6E6",
      type: "solid",
      angle: 0,
      usecase: "",
    },
    {
      id: "p2",
      role: "secondary",
      hex: "#F5E6E6",
      type: "solid",
      angle: 0,
      usecase: "",
    },
    {
      id: "p3",
      role: "background",
      hex: "#FFFFFF",
      type: "solid",
      angle: 0,
      usecase: "",
    },
    {
      id: "p4",
      role: "text",
      hex: "#000000",
      type: "solid",
      angle: 0,
      usecase: "",
    },
  ],
});

beforeEach(() => {
  useEditorStore.setState({
    doc: createDocument(),
    brandKits: [],
    defaultBrandKitId: undefined,
  });
});

describe("BrandKitPanel", () => {
  it("renders compact DesignKitCard rows on Home with standalone default-kit actions", () => {
    useEditorStore.setState({
      brandKits: [auroraKit],
      defaultBrandKitId: auroraKit.id,
    });
    const html = renderPanel({ standalone: true, cardVariant: "row" });
    expect(html).toContain("design-kit-card--row");
    expect(html).not.toContain("bk-showcase-card");
    expect(html).not.toContain("bk-preview-illustration");
    expect(html).not.toContain("bk-palette-slot");
    expect(html).toContain("Aurora");
    expect(html).toContain("Fraunces · Minimal");
    expect(html).toContain('aria-label="Remove Aurora as default"');
    expect(html).toContain('aria-label="Edit Aurora"');
    expect(html).toContain('aria-label="More actions for Aurora"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain(">Applied<");
    expect(html).not.toContain("Set as default");
    expect(html).not.toContain(">Default<");
  });

  it("keeps the full portrait showcase card on the Design kits page", () => {
    useEditorStore.setState({
      brandKits: [auroraKit],
      defaultBrandKitId: auroraKit.id,
    });
    const html = renderPanel({ standalone: true, pageView: true });
    expect(html).not.toContain("design-kit-card--row");
    expect(html).toContain("bk-showcase-card");
    expect(html).toContain("bk-preview-illustration");
    expect(html).toContain("bk-preview-type-specimen");
    expect(html).toContain("Aurora");
    expect(html).toContain("Fraunces");
    expect(html).toContain("Minimal");
    expect(html).toContain('aria-label="Remove Aurora as default"');
    expect(html).toContain('aria-label="Edit Aurora"');
    expect(html).toContain('aria-label="More actions for Aurora"');
    expect(html).toContain('aria-label="Copy Primary #112233"');
    expect(html.match(/class="bk-palette-slot(?: is-empty)?"/g)).toHaveLength(
      5,
    );
    expect(html).not.toContain("bk-compact-card");
    expect(html).not.toContain("brand-kit-summary");
    expect(html).toContain(">Applied<");
    expect(html).not.toContain("Set as default");
    expect(html).not.toContain(">Default<");
  });

  it("shows Apply (not Set as default) for an inactive kit on Home", () => {
    useEditorStore.setState({
      brandKits: [auroraKit],
      defaultBrandKitId: undefined,
    });
    const html = renderPanel({ standalone: true, cardVariant: "row" });
    expect(html).toContain(">Apply<");
    expect(html).toContain('aria-label="Apply Aurora as default"');
  });
  it("uses honest, non-AI wording for creating and generating kits", () => {
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [nightfallKit],
    });
    const html = renderPanel();
    expect(html).toContain("Create kit");
    expect(html).not.toContain("New design kit");
    expect(html).toContain('aria-label="Generate kit from a seed color"');
  });

  it("renders the applied kit first, marked Applied and not Apply", () => {
    const doc = createDocument();
    doc.creativeDirection.brandKitId = auroraKit.id;
    useEditorStore.setState({
      doc,
      brandKits: [nightfallKit, auroraKit],
    });
    const html = renderPanel();

    // Each card starts at its data-tour="kit-card" marker, in render order.
    const cards = html.split('data-tour="kit-card"').slice(1);
    expect(cards).toHaveLength(2);

    expect(cards[0]).toContain(">Aurora<");
    expect(cards[0]).toContain(">Applied<");
    expect(cards[0]).not.toContain(">Apply<");
    expect(cards[0]).toContain('aria-pressed="true"');
    expect(cards[0]).toContain("bk-default-toggle bk-toolbar-btn active");

    expect(cards[1]).toContain(">Nightfall<");
    expect(cards[1]).toContain(">Apply<");
    expect(cards[1]).toContain('aria-pressed="false"');
  });

  it("gives the edit action and the overflow menu trigger accessible labels", () => {
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [auroraKit],
    });
    const html = renderPanel();
    expect(html).toContain('aria-label="Edit Aurora"');
    expect(html).toContain('data-tour="kit-edit"');
    expect(html).toContain('aria-label="More actions for Aurora"');
  });

  it("renders all five palette slots with short labels, hex values, and an empty accent slot", () => {
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [auroraKit],
    });
    const html = renderPanel();

    const slotPattern =
      /<button type="button" class="(bk-palette-slot(?: is-empty)?)"[^>]*>[\s\S]*?<span class="bk-palette-role">([^<]*)<\/span><code>([^<]*)<\/code><\/button>/g;
    const slots = [...html.matchAll(slotPattern)];
    expect(slots).toHaveLength(5);

    expect(slots.map((match) => match[2])).toEqual([
      "Primary",
      "Secondary",
      "Canvas",
      "Text",
      "Accent",
    ]);
    expect(slots.map((match) => match[3])).toEqual([
      "#112233",
      "#223344",
      "#FFFFFF",
      "#000000",
      "—",
    ]);
    expect(
      slots.filter((match) => match[1]!.includes("is-empty")),
    ).toHaveLength(1);
    expect(slots.find((match) => match[1]!.includes("is-empty"))![2]).toBe(
      "Accent",
    );
  });

  it("shows the kit's font family inside the preview, with no legacy typography row", () => {
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [auroraKit],
    });
    const html = renderPanel();
    const previewIndex = html.indexOf('class="bk-preview');
    expect(previewIndex).toBeGreaterThan(-1);
    expect(html.indexOf("Fraunces")).toBeGreaterThan(previewIndex);
    expect(html).not.toContain("bk-type-row");
    expect(html).not.toMatch(/>(Heading|Body)\b/);
    const typeBlock =
      html.match(/<div class="bk-preview-type">[\s\S]*?<\/div>/)?.[0] ?? "";
    expect(typeBlock).not.toContain(auroraKit.style);
  });

  it("shows an honest empty state when the library has no kits", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [] });
    const html = renderPanel();
    expect(html).toContain("No design kits yet");
  });

  it("shows a Creative Style chip with the kit's own style", () => {
    const techKit = makeKit({
      id: "kit-tech",
      name: "Tech Kit",
      style: "Tech",
      typography: "Fraunces",
    });
    useEditorStore.setState({ doc: createDocument(), brandKits: [techKit] });
    const html = renderPanel();
    expect(html).toContain('class="sr-only">Creative style: <');
    expect(html).toContain('class="bk-preview-chip-value">Tech<');
    expect(html).not.toContain("bk-preview-chip-label");
    expect(html).not.toContain("bk-preview-pill");
    expect(html).not.toContain(">Minimal<");
  });

  it("renders no Creative Style chip, and no chips row at all, when the kit has no style", () => {
    const noStyleKit = makeKit({
      id: "kit-no-style",
      name: "No Style Kit",
      style: "",
    });
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [noStyleKit],
    });
    const html = renderPanel();
    expect(html).not.toContain("Creative style");
    expect(html).not.toContain("bk-preview-chips");
  });

  it("shows a Positioning chip with the kit's positioning tier label on every card, not just the applied one", () => {
    const premiumKit = makeKit({
      id: "kit-premium",
      name: "Premium Kit",
      profile: { positioningTier: "premium" },
    });
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [nightfallKit, premiumKit],
    });
    const html = renderPanel();
    const cards = html.split('data-tour="kit-card"').slice(1);
    expect(cards).toHaveLength(2);
    expect(cards[1]).toContain('class="sr-only">Positioning: <');
    expect(cards[1]).toContain('class="bk-preview-chip-value">Premium<');
  });

  it("shows the Positioning chip on standalone design kit pages too", () => {
    const premiumKit = makeKit({
      id: "kit-premium",
      name: "Premium Kit",
      profile: { positioningTier: "premium" },
    });
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [premiumKit],
    });
    const html = renderPanel({ standalone: true });
    expect(html).toContain('class="sr-only">Positioning: <');
    expect(html).toContain('class="bk-preview-chip-value">Premium<');
  });

  it("renders no Positioning chip when the kit has no positioning tier set", () => {
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [nightfallKit],
    });
    const html = renderPanel();
    expect(html).not.toContain("Positioning");
  });

  it("never shows a Theme or Light/Dark chip", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [auroraKit] });
    const html = renderPanel();
    expect(html).not.toContain("Theme");
    expect(html).not.toContain(">Light<");
    expect(html).not.toContain(">Dark<");
  });

  it("renders the kit name once and the 'Aa' type specimen once per card", () => {
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [nightfallKit, auroraKit],
    });
    const html = renderPanel();
    expect(html.split(">Aurora<")).toHaveLength(2);
    expect(html.split(">Aa<")).toHaveLength(3);
  });

  it("moves the apply toggle, edit, and overflow menu into a floating toolbar on the preview", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [auroraKit] });
    const html = renderPanel();
    const toolbarIndex = html.indexOf('class="bk-preview-actions"');
    expect(toolbarIndex).toBeGreaterThan(-1);
    expect(html.indexOf('aria-label="Edit Aurora"')).toBeGreaterThan(
      toolbarIndex,
    );
    expect(
      html.indexOf('aria-label="More actions for Aurora"'),
    ).toBeGreaterThan(toolbarIndex);
    expect(html).not.toContain("bk-face-top");
  });

  it("renders the apply toggle, edit, and overflow trigger as three separate controls, not a shared capsule", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [auroraKit] });
    const html = renderPanel();
    expect(html).toContain('class="bk-preview-top"');

    const actionsMatch = html.match(
      /<div class="bk-preview-actions" role="toolbar" aria-label="Aurora actions">([\s\S]*?)<\/div>/,
    );
    expect(actionsMatch).not.toBeNull();
    const actionsHtml = actionsMatch![1] ?? "";

    const toggleIndex = actionsHtml.indexOf('data-tour="kit-default-toggle"');
    const editIndex = actionsHtml.indexOf('data-tour="kit-edit"');
    const moreIndex = actionsHtml.indexOf(
      'aria-label="More actions for Aurora"',
    );
    expect(toggleIndex).toBeGreaterThan(-1);
    expect(editIndex).toBeGreaterThan(toggleIndex);
    expect(moreIndex).toBeGreaterThan(editIndex);

    // Three independent <button> elements, not one shared toolbar button group.
    expect(actionsHtml.match(/<button/g)).toHaveLength(3);
  });

  it("shows an Image style chip with the document's resolved image style on the applied card only", () => {
    const doc = createDocument();
    doc.creativeDirection.brandKitId = auroraKit.id;
    doc.imageStyle = "cinematic";
    useEditorStore.setState({ doc, brandKits: [nightfallKit, auroraKit] });
    const html = renderPanel();

    const cards = html.split('data-tour="kit-card"').slice(1);
    expect(cards).toHaveLength(2);

    expect(cards[0]).toContain('class="sr-only">Image style: <');
    expect(cards[0]).toContain('class="bk-preview-chip-value">Cinematic<');
    expect(cards[0]).not.toContain("bk-preview-chip-label");
    expect(cards[1]).not.toContain("Image style");
  });

  it('omits the Image style chip when the document\'s image style is "none"', () => {
    const doc = createDocument();
    doc.creativeDirection.brandKitId = auroraKit.id;
    doc.imageStyle = "none";
    useEditorStore.setState({ doc, brandKits: [auroraKit] });
    const html = renderPanel();
    expect(html).not.toContain("Image style");
  });

  it("never shows an Image style chip on the standalone design kit pages", () => {
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [auroraKit],
      defaultBrandKitId: auroraKit.id,
    });
    const html = renderPanel({ standalone: true });
    expect(html).not.toContain("Image style");
  });

  it("renders the design.md illustration as the card artwork, colored by the kit", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [auroraKit] });
    const html = renderPanel();
    expect(html).toContain(
      'class="bk-preview-illustration" aria-hidden="true"',
    );
    expect(html).toContain('class="bk-preview-art bk-preview-curve"');
    expect(html).toContain('class="bk-preview-art bk-preview-sun"');
    expect(html).toContain('class="bk-preview-art bk-preview-leaves"');
    expect(html).toContain('fill="#112233"');
    expect(html).toContain('fill="#223344"');
    expect(html).not.toContain("data-variant");
  });

  it("sets kit-driven CSS custom properties for the canvas, primary, and the applied-pill mark color", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [auroraKit] });
    const html = renderPanel();
    const previewMatch = html.match(/<div class="bk-preview" style="([^"]*)"/);
    expect(previewMatch).not.toBeNull();
    const previewStyle = previewMatch![1] ?? "";
    expect(previewStyle.startsWith("background:#ffffff")).toBe(true);
    expect(previewStyle).toContain("--bk-primary:#112233");
    expect(previewStyle).toContain("--bk-canvas:#ffffff");
    // #112233 on #ffffff clears the 3:1 mark threshold, so the mark uses it.
    expect(previewStyle).toContain("--bk-mark:#112233");
  });

  it("falls back the applied-pill mark color to the readable text color when the kit's primary is too pale to read", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [paleKit] });
    const html = renderPanel();
    const previewMatch = html.match(/<div class="bk-preview" style="([^"]*)"/);
    expect(previewMatch).not.toBeNull();
    expect(previewMatch![1] ?? "").toContain("--bk-mark:#000000");
  });

  it("uses the kit's secondary color as the title color when it stays readable on the canvas", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [auroraKit] });
    const html = renderPanel();
    // #223344 on #ffffff clears the 4.5:1 title threshold.
    expect(html).toContain("font-family:Fraunces;color:#223344");
  });

  it("falls back the title color to the readable text color when the kit's secondary is too pale to read", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [paleKit] });
    const html = renderPanel();
    expect(html).not.toContain("color:#F5E6E6");
    expect(html).toContain("color:#000000");
  });

  it("adds an arrow icon to the card's Get started CTA", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [auroraKit] });
    const html = renderPanel();
    const ctaMatch = html.match(/<span class="bk-preview-cta"[\s\S]*?<\/span>/);
    expect(ctaMatch).not.toBeNull();
    expect(ctaMatch![0]).toContain("lucide-arrow-right");
  });

  it("keeps the builder preview free of the card-only CSS custom properties", () => {
    const html = renderToStaticMarkup(
      createElement(BrandKitPreview, { kit: auroraKit, variant: "builder" }),
    );
    expect(html).not.toContain("--bk-");
  });
});
