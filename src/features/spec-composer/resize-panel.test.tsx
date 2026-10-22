import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResizePanel } from "./resize-panel";
import { RESIZE_PRESET_GROUPS, makeResizeFormat } from "./resize";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";

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

const presets = RESIZE_PRESET_GROUPS.flatMap((group) =>
  group.presets.map((preset) => ({ group: group.label, preset })),
);
const render = () => renderToStaticMarkup(<ResizePanel />);
const cards = (markup: string) =>
  markup.match(
    /<button\b[^>]*class="resize-format-card[^"]*"[\s\S]*?<\/button>/g,
  ) ?? [];

beforeEach(() => {
  const doc = createDocument();
  doc.format = makeResizeFormat(1080, 1080);
  useEditorStore.setState({ doc });
});

describe("ResizePanel gallery presentation", () => {
  it("keeps every size and the custom card in the gallery", () => {
    const markup = render();
    expect(cards(markup)).toHaveLength(presets.length + 1);
    expect(markup).toContain('aria-label="Available sizes"');
    expect(markup).toContain('aria-label="Search sizes"');
    expect(markup).toContain("Resize design");
  });

  it.each(presets)(
    "renders $preset.id title, ratio, and dimensions in one footer",
    ({ group, preset }) => {
      const card = cards(render()).find((item) =>
        item.includes(`data-resize-art="${preset.id}"`),
      );
      expect(card).toBeDefined();
      const title = `${group} ${preset.label}`;
      const ratio = makeResizeFormat(
        preset.width,
        preset.height,
        preset,
      ).subtitle;
      const footer = card!.slice(
        card!.indexOf('<span class="resize-card-details">'),
      );
      expect(footer.match(/class="resize-card-details"/g)).toHaveLength(1);
      expect(footer).toContain(`title="${title}"`);
      expect(footer).toContain(`title="Aspect ratio ${ratio}"`);
      expect(footer).toContain(`title="${preset.width} × ${preset.height} px"`);
      expect(footer).toContain(`<span>${title}</span>`);
      expect(footer).toContain(`<span>${ratio}</span>`);
      expect(footer).toContain(`<span>${preset.width}×${preset.height}</span>`);
      expect(footer.indexOf('class="resize-card-title"')).toBeLessThan(
        footer.indexOf('class="resize-card-ratio"'),
      );
      expect(footer.indexOf('class="resize-card-ratio"')).toBeLessThan(
        footer.indexOf('class="resize-card-meta"'),
      );
      expect(footer.match(/aria-hidden="true"/g)).toHaveLength(2);
      expect(footer.match(/width="8" height="8"/g)).toHaveLength(2);
      expect(card).toContain(
        `aria-label="Select ${title}, ${preset.width} by ${preset.height} pixels`,
      );
      expect(card).toContain(`viewBox="0 0 ${preset.width} ${preset.height}"`);
    },
  );

  it("keeps custom size's full title and description in its compact footer", () => {
    const custom = cards(render()).find((card) =>
      card.includes('aria-label="Enter a custom size"'),
    );
    expect(custom).toContain(
      'class="resize-card-details resize-card-details--custom"',
    );
    expect(custom).toContain('title="Custom size"');
    expect(custom).toContain('title="Enter width and height"');
    expect(custom).toContain("Enter width and height</span>");
    expect(custom).toContain(
      'class="preset-card-art preset-create-art" aria-hidden="true"',
    );
    expect(custom).toContain('aria-pressed="false"');
  });

  it("preserves current-size labels and badges", () => {
    const currentCards = cards(render()).filter((card) =>
      card.includes(", current size"),
    );
    expect(currentCards).toHaveLength(
      presets.filter(
        ({ preset }) => preset.width === 1080 && preset.height === 1080,
      ).length,
    );
    for (const card of currentCards) {
      expect(card).toContain('class="resize-card-current">Current</span>');
    }
  });
});
