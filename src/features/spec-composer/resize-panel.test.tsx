import { renderToStaticMarkup } from "react-dom/server";
import {
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PresetCard } from "./preset-card";
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
  markup.match(/<button\b[^>]*class="preset-card[^"]*"[\s\S]*?<\/button>/g) ??
  [];

type ElementProps = { children?: ReactNode; [key: string]: unknown };
function inspect(tree: ReactNode) {
  const elements = (node: ReactNode): ReactElement<ElementProps>[] => {
    if (Array.isArray(node)) return node.flatMap(elements);
    return isValidElement<ElementProps>(node)
      ? [node, ...elements(node.props.children)]
      : [];
  };
  return elements(tree);
}
type View = ReturnType<typeof inspect>;
// Render-phase updates preserve the panel's real local state between actions.
function interact(actions: Array<(view: View) => void>) {
  let view: View;
  function Interaction() {
    const [step, setStep] = useState(0);
    const tree = ResizePanel();
    view = inspect(tree);
    if (step < actions.length) {
      actions[step]!(view);
      setStep(step + 1);
    }
    return tree;
  }
  const html = renderToStaticMarkup(<Interaction />);
  return { html, view: view! };
}
const find = (
  view: View,
  predicate: (node: ReactElement<ElementProps>) => boolean,
) => {
  const node = view.find(predicate);
  expect(node).toBeDefined();
  return node!;
};
const click = (node: ReactElement<ElementProps>) =>
  (node.props["onClick"] as () => void)();
const customCard = (view: View) =>
  find(
    view,
    (node) => node.type === PresetCard && node.props["mode"] === "create",
  );
const presetCard = (view: View, current = false) =>
  find(
    view,
    (node) => node.type === PresetCard && node.props["current"] === current,
  );
const resizeAction = (view: View) =>
  view.find(
    (node) => node.type === "button" && node.props.children === "Resize design",
  );

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
    expect(markup).not.toContain("resize-action-bar");
    expect(markup).not.toContain("Resize design");
  });

  it.each(presets)(
    "renders $preset.id ratio and dimension chips beneath its title",
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
        card!.indexOf('<span class="preset-card-details">'),
      );
      expect(footer.match(/class="preset-card-details"/g)).toHaveLength(1);
      expect(footer).toContain(`title="${title}"`);
      const preview = card!.slice(
        0,
        card!.indexOf('<span class="preset-card-details">'),
      );
      const chips = footer.slice(
        footer.indexOf('<span class="preset-card-metadata">'),
      );
      expect(chips).toContain(`title="Aspect ratio ${ratio}"`);
      expect(chips).toContain(`title="${preset.width} × ${preset.height} px"`);
      expect(preview).toContain('<span class="preset-card-art">');
      expect(preview).not.toContain("preset-card-metadata");
      expect(footer.indexOf('class="preset-card-title"')).toBeLessThan(
        footer.indexOf('class="preset-card-metadata"'),
      );
      expect(card!.match(/class="preset-card-metadata"/g)).toHaveLength(1);
      expect(footer).toContain(`title="${title}">${title}</span>`);
      expect(chips).toContain(`<span>${ratio}</span>`);
      expect(chips).toContain(`<span>${preset.width}×${preset.height}</span>`);
      expect(chips.indexOf('class="preset-card-ratio"')).toBeLessThan(
        chips.indexOf('class="preset-card-meta"'),
      );
      expect(chips.match(/<svg\b[^>]*aria-hidden="true"/g)).toHaveLength(2);
      expect(chips.match(/width="10" height="10"/g)).toHaveLength(2);
      expect(card).toContain(
        `aria-label="Select ${title}, ${preset.width} by ${preset.height} pixels`,
      );
      expect(card).toContain(`viewBox="0 0 ${preset.width} ${preset.height}"`);
    },
  );

  it("keeps custom size's title and description inside a single card", () => {
    const custom = cards(render()).find((card) =>
      card.includes('aria-label="Enter a custom size"'),
    );
    expect(custom).toContain('title="Custom size"');
    expect(custom).toContain('title="Enter width and height"');
    expect(custom).toContain("Enter width and height</span>");
    expect(custom).not.toContain("preset-card-art");
    expect(custom).not.toContain("preset-card-details");
    expect(custom!.match(/<svg\b[^>]*aria-hidden="true"[^>]*>/g)).toHaveLength(
      1,
    );
    expect(custom!.match(/<svg/g)).toHaveLength(1);
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
      expect(card).toContain('class="preset-card-current">Current</span>');
    }
  });
});

describe("ResizePanel contextual action", () => {
  it("shows the action for a selected preset and hides it after deselection", () => {
    const result = interact([
      (view) => {
        expect(resizeAction(view)).toBeUndefined();
        click(presetCard(view));
      },
      (view) => {
        expect(resizeAction(view)?.props["disabled"]).toBe(false);
        expect(presetCard(view).props["selected"]).toBe(true);
        click(presetCard(view));
      },
    ]);
    expect(resizeAction(result.view)).toBeUndefined();
    expect(result.html).not.toContain("resize-action-bar");
  });

  it("hides the custom action when the card is toggled off or the form is closed", () => {
    const result = interact([
      (view) => click(customCard(view)),
      (view) => {
        expect(resizeAction(view)?.props["disabled"]).toBe(true);
        click(customCard(view));
      },
      (view) => {
        expect(resizeAction(view)).toBeUndefined();
        click(customCard(view));
      },
      (view) => {
        expect(resizeAction(view)).toBeDefined();
        click(
          find(
            view,
            (node) => node.props["aria-label"] === "Close custom size",
          ),
        );
      },
    ]);
    expect(resizeAction(result.view)).toBeUndefined();
    expect(result.html).not.toContain("resize-action-bar");
  });

  it("keeps the action visible while switching between preset and custom cards", () => {
    const result = interact([
      (view) => click(presetCard(view)),
      (view) => click(customCard(view)),
      (view) => {
        expect(resizeAction(view)).toBeDefined();
        expect(customCard(view).props["selected"]).toBe(true);
        expect(presetCard(view).props["selected"]).toBe(false);
        click(presetCard(view));
      },
    ]);
    expect(resizeAction(result.view)?.props["disabled"]).toBe(false);
    expect(customCard(result.view).props["selected"]).toBe(false);
    expect(result.html).not.toContain('aria-label="Close custom size"');
  });

  it("keeps the action disabled when a current-size preset is selected", () => {
    const result = interact([(view) => click(presetCard(view, true))]);
    expect(resizeAction(result.view)?.props["disabled"]).toBe(true);
    expect(result.html).toContain("The design is already this size.");
  });

  it("validates custom dimensions while keeping the selected action visible", () => {
    const changeWidth = (view: View, value: string) =>
      (
        find(view, (node) => node.props["id"] === "resize-width").props[
          "onChange"
        ] as (event: { target: { value: string } }) => void
      )({ target: { value } });
    const result = interact([
      (view) => click(customCard(view)),
      (view) => changeWidth(view, "0"),
      (view) => {
        expect(resizeAction(view)?.props["disabled"]).toBe(true);
        expect(view.some((node) => node.props["role"] === "alert")).toBe(true);
        changeWidth(view, "1200");
      },
    ]);
    expect(resizeAction(result.view)?.props["disabled"]).toBe(false);
    expect(result.view.some((node) => node.props["role"] === "alert")).toBe(
      false,
    );
  });
});
