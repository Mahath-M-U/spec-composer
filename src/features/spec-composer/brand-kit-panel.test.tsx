import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandKitPanel } from "./brand-kit-panel";
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
  props: Partial<{ standalone: boolean; pageView: boolean }> = {},
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

beforeEach(() => {
  useEditorStore.setState({
    doc: createDocument(),
    brandKits: [],
    defaultBrandKitId: undefined,
  });
});

describe("BrandKitPanel", () => {
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

    const auroraIndex = html.indexOf(">Aurora<");
    const nightfallIndex = html.indexOf(">Nightfall<");
    expect(auroraIndex).toBeGreaterThan(-1);
    expect(nightfallIndex).toBeGreaterThan(-1);
    expect(auroraIndex).toBeLessThan(nightfallIndex);

    // The active kit's card (everything up to the next card) shows "Applied"
    // and does not also offer a plain "Apply" action.
    const auroraSegment = html.slice(auroraIndex, nightfallIndex);
    expect(auroraSegment).toContain(">Applied<");
    expect(auroraSegment).not.toContain(">Apply<");
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

  it("shows the typography row with the kit's font family and no legacy edit button", () => {
    useEditorStore.setState({
      doc: createDocument(),
      brandKits: [auroraKit],
    });
    const html = renderPanel();
    expect(html).toContain("Fraunces");
    expect(html).not.toContain("bk-edit-button");
  });

  it("shows an honest empty state when the library has no kits", () => {
    useEditorStore.setState({ doc: createDocument(), brandKits: [] });
    const html = renderPanel();
    expect(html).toContain("No design kits yet");
  });
});
