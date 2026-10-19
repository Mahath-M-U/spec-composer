import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssetsPanel } from "./assets-panel/AssetsPanel";
import { ASSET_CATALOG, roleOf, swapAlternatives } from "./asset-catalog";
import { assetPresetPatch } from "./asset-presets";
import { DescriptionTemplateControls } from "./description-template-controls";
import { renderDescriptionTemplate } from "./description-templates";
import { SelectionContextBar } from "./selection-context-bar";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import type { SpecElement } from "./types";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("./store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./store")>();
  type State = ReturnType<typeof actual.useEditorStore.getState>;
  const hook = <T = State>(selector?: (state: State) => T) => {
    const state = actual.useEditorStore.getState();
    return selector ? selector(state) : state;
  };
  return {
    ...actual,
    useEditorStore: Object.assign(hook, actual.useEditorStore),
  };
});

const model = (): SpecElement => ({
  id: "template-test",
  kind: "shape",
  name: "Model",
  x: 20,
  y: 30,
  width: 240,
  height: 360,
  rotation: 15,
  zIndex: 1,
  visible: true,
  locked: false,
  style: {},
  ...assetPresetPatch("model"),
});
const controls = (element: SpecElement) =>
  renderToStaticMarkup(createElement(DescriptionTemplateControls, { element }));

beforeEach(() => useEditorStore.setState({ doc: createDocument() }));

describe("description template UI", () => {
  it("offers six direct insertion tiles before compact shapes and text", () => {
    const html = renderToStaticMarkup(createElement(AssetsPanel));
    expect(html).toContain('aria-label="Scene elements"');
    for (const label of [
      "Person",
      "Product",
      "Display",
      "Backdrop",
      "Copy space",
      "Callout",
    ])
      expect(html).toContain(`<strong>${label}</strong>`);
    expect(html).toContain("Click or drag");
    expect(html).not.toContain("Choose a starter");
    expect(html).not.toContain("Add Model / person");
    expect(html).not.toContain("Description template");
    for (const shape of [
      "rectangle",
      "circle",
      "rounded rectangle",
      "ellipse",
      "triangle",
      "diamond",
      "line",
    ])
      expect(html).toContain(`data-shape="${shape}"`);
    expect(html).toContain('aria-label="Divider"');
    expect(html.match(/data-shape="/g)).toHaveLength(7);
    expect(html.match(/class="asset-text-preview"/g)).toHaveLength(9);
    for (const text of [
      "Headline",
      "Subheading",
      "Body copy",
      "Caption",
      "Eyebrow",
      "Offer",
      "Price",
      "Badge",
      "Call to action",
    ])
      expect(html).toContain(text);
    const addPanel = html
      .split('class="shape-palette"')[1]!
      .split("aria-labelledby=")[0]!;
    expect(addPanel).not.toContain('hidden=""');
    expect(html).not.toContain("compose-extra-options");
    expect(html).not.toContain("More shapes");
    expect(html).not.toContain("View all");
    expect(html).toContain("Selected element");
  });

  it("provides selected-element editing for single, multiple and empty selections", () => {
    const elements = [
      model(),
      { ...model(), id: "second", name: "Second model" },
    ];
    useEditorStore.setState({
      doc: { ...createDocument(), elements },
      selectedIds: [elements[0]!.id],
    });
    let html = renderToStaticMarkup(createElement(AssetsPanel));
    expect(html).toContain('aria-label="Edit Model / person"');
    expect(html).toContain('class="asset-role-badge">Subject</span>');
    useEditorStore.setState({
      selectedIds: elements.map((element) => element.id),
    });
    html = renderToStaticMarkup(createElement(AssetsPanel));
    expect(html).toContain("Edit 2 selected elements");
    useEditorStore.setState({ selectedIds: [] });
    html = renderToStaticMarkup(createElement(AssetsPanel));
    expect(html).toContain("Select an element on the canvas to edit it.");
  });

  it("labels unassigned shapes, images and text accurately in the selection footer", () => {
    for (const [kind, label] of [
      ["shape", "Shape"],
      ["heroImage", "Image"],
      ["body", "Text"],
    ] as const) {
      const element = { ...model(), kind, semanticRole: undefined };
      useEditorStore.setState({
        doc: { ...createDocument(), elements: [element] },
        selectedIds: [element.id],
      });
      const html = renderToStaticMarkup(createElement(AssetsPanel));
      expect(html).toContain(`class="asset-role-badge">${label}</span>`);
    }
  });

  it("shows bounded editable slots and a read-only generated description", () => {
    const element = model();
    const html = controls(element);
    for (const label of [
      "Person",
      "Wardrobe",
      "Pose",
      "Expression",
      "Generated description",
      "Blank fields use the suggested defaults",
    ])
      expect(html).toContain(label);
    expect(html.match(/maxLength="200"/g)).toHaveLength(4);
    expect(html).toContain('readOnly=""');
    expect(html).toContain("Preserve coherent adult anatomy");
    expect(html).not.toContain("Custom description");
    expect(html.indexOf('label="For subject"')).toBeLessThan(
      html.indexOf('label="Other templates"'),
    );
  });

  it("presents different-role templates clearly and retains a custom-description recovery action", () => {
    const element = model();
    element.descriptionDrafts = { custom: "My custom description" };
    const html = controls(element);
    expect(html).toContain("Product packshot");
    expect(html).toContain("Product");
    expect(html).toContain("Choosing another template may change this shape");
    expect(html).toContain("Restore previous custom description");
  });

  it("keeps unknown templates readable until an intentional switch to custom or another template", () => {
    const element = model();
    element.descriptionTemplate = {
      id: "future-template",
      values: { note: "retained" },
    };
    element.detail = "Saved fallback description";
    const html = controls(element);
    expect(html).toContain("Unavailable template");
    expect(html).toContain("Saved fallback description");
    expect(html).toContain('value="custom"');
    expect(html).not.toContain("Custom description");
    expect(element.descriptionTemplate.id).toBe("future-template");
  });

  it("allows bounded multiline custom descriptions and safely displays literal template field text", () => {
    const element = model();
    delete element.descriptionTemplate;
    element.detail = "Line one\nLine two";
    const html = controls(element);
    expect(html).toContain("Custom description");
    expect(html).toContain('maxLength="20000"');
    expect(html).toContain("Line one\nLine two");
    const templateElement = model();
    templateElement.descriptionTemplate!.values["person"] =
      "<script>literal</script>";
    const templateHtml = controls(templateElement);
    expect(templateHtml).toContain("&lt;script&gt;literal&lt;/script&gt;");
    expect(templateHtml).not.toContain("<script>");
  });

  it("protects template framing in the floating bar and provides a Design Inspector shortcut", () => {
    const el = model();
    el.detail = renderDescriptionTemplate("person-model", {}) ?? "";
    const html = renderToStaticMarkup(
      createElement(
        TooltipProvider,
        null,
        createElement(SelectionContextBar, {
          el,
          screenBox: { left: 0, top: 0, width: 240, height: 360 },
        }),
      ),
    );
    expect(html).toContain('aria-label="Open Design Inspector"');
    expect(html).not.toContain("Edit fields");
    expect(html).not.toContain("Person / model");
    expect(html).not.toContain("Saved description template");
    expect(html).not.toContain('aria-label="Region description"');
    expect(html).not.toContain('class="selection-context-bar"');
    expect(html).toContain('class="selection-context-bar is-side"');
    expect(html).toContain("left:252px;top:0");
    expect(html.match(/aria-label="Open Design Inspector"/g)).toHaveLength(1);
    delete el.descriptionTemplate;
    const custom = renderToStaticMarkup(
      createElement(
        TooltipProvider,
        null,
        createElement(SelectionContextBar, {
          el,
          screenBox: { left: 0, top: 0, width: 240, height: 360 },
        }),
      ),
    );
    expect(custom).toContain('aria-label="Region description"');
    expect(custom).toContain('class="selection-context-bar"');
    expect(custom).toContain('class="selection-context-bar is-side"');
    expect(custom).toContain("left:252px;top:0");
    expect(custom).toContain("left:0;top:388px");
    expect(custom.match(/aria-label="Open Design Inspector"/g)).toHaveLength(
      1,
    );
  });

  it("adds the side Design Inspector shortcut beside every selected asset, keeping the bottom bar", () => {
    const item = ASSET_CATALOG.find(
      (candidate) =>
        roleOf(candidate) === "headline" &&
        swapAlternatives(candidate).length > 0,
    );
    expect(item).toBeDefined();
    const element: SpecElement = {
      ...model(),
      id: "swap-test",
      kind: item!.kind,
      assetId: item!.id,
    };
    delete element.descriptionTemplate;
    delete element.semanticRole;
    delete element.detail;
    const html = renderToStaticMarkup(
      createElement(
        TooltipProvider,
        null,
        createElement(SelectionContextBar, {
          el: element,
          screenBox: { left: 0, top: 0, width: 240, height: 360 },
        }),
      ),
    );
    expect(html).toContain('aria-label="Swap asset"');
    expect(html).toContain('class="selection-context-bar"');
    expect(html).toContain('class="selection-context-bar is-side"');
    expect(html.match(/aria-label="Open Design Inspector"/g)).toHaveLength(1);
    expect(html).toContain("left:252px;top:0");
    expect(html).toContain("left:0;top:388px");
    expect(html).not.toContain("Region description");
  });

  it("adds the side Design Inspector shortcut beside a plain element with no bar content", () => {
    const element: SpecElement = { ...model(), kind: "title" };
    delete element.assetId;
    delete element.descriptionTemplate;
    delete element.semanticRole;
    delete element.slot;
    const html = renderToStaticMarkup(
      createElement(
        TooltipProvider,
        null,
        createElement(SelectionContextBar, {
          el: element,
          screenBox: { left: 0, top: 0, width: 240, height: 360 },
        }),
      ),
    );
    expect(html).toContain('class="selection-context-bar is-side"');
    expect(html).toContain("left:252px;top:0");
    expect(html).not.toContain('class="selection-context-bar"');
    expect(html).not.toContain("Swap asset");
    expect(html).not.toContain("Region description");
    expect(html.match(/aria-label="Open Design Inspector"/g)).toHaveLength(1);
  });
});
