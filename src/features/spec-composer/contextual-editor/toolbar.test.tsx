import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement as createSpecElement } from "../registry";
import { createDocument } from "../templates";
import { useEditorStore } from "../store";
import { getElementFields, CONTROL_TYPES } from "./schema";
import { writeProperty } from "./properties";
import { toolbarControls } from "./toolbar-controls";
import {
  FloatingContextualToolbar,
  LayerOrderControl,
} from "./FloatingContextualToolbar";
import { ContextualField } from "./ContextualField";
import { catalogIds } from "./catalog";
import { inspectorContext } from "../inspector-properties";
import { contextualCreation } from "./creation";
import { ModelPopover } from "./ModelPopover";
import { ModelSvg } from "./ModelSvg";
import { ElementContent } from "../static-render";
import { commitContextualEdit } from "./store";
import type { ContextualValue } from "../types";

vi.mock("../store", async (importOriginal) => {
  const original = await importOriginal<typeof import("../store")>();
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

describe("model option artwork matches the committed canvas", () => {
  const selected = () => useEditorStore.getState().doc!.elements[0]!;
  function setup(properties: Record<string, ContextualValue>, source?: string) {
    useEditorStore.getState().addContextualElement("subjects.person");
    useEditorStore.getState().mutate(doc => {
      const element = doc.elements[0]!;
      element.contextualProperties = { ...element.contextualProperties, ...properties };
      if (source) element.src = source;
      element.x = 37; element.y = 51; element.width = 193; element.height = 321; element.rotation = 13;
    });
  }
  function option(value: string) {
    const before = JSON.stringify({ doc: useEditorStore.getState().doc, past: useEditorStore.getState().past, future: useEditorStore.getState().future });
    const html = renderToStaticMarkup(createElement(ModelPopover, { elements: [selected()], fields: [], context: inspectorContext() }));
    expect(JSON.stringify({ doc: useEditorStore.getState().doc, past: useEditorStore.getState().past, future: useEditorStore.getState().future })).toBe(before);
    return html.match(new RegExp(`<button[^>]*aria-label="Model ${value}"[\\s\\S]*?</button>`))![0];
  }
  const withoutFraming = (svg: string) => svg.replace(/\sviewBox="[^"]*"/, "");
  const layerBox = () => { const { id, x, y, width, height, rotation, zIndex } = selected(); return { id, x, y, width, height, rotation, zIndex }; };

  it.each(["side_part", "bun"])("preserves %s styling, running/fine pose and colors with identity-appropriate artwork", hair => {
    setup({ "model.identity.modelPreset": "girl", "model.identity.ageGroup": "child", "model.appearance.hairStyle": hair, "model.pose_action.action": "running", "model.pose_action.runningVariation": "dynamic", "model.pose_action.arms": "crossed", "model.appearance.skinTone": "deep", "model.expression.expression": "happy", "model.outfit.palette": ["#ea6845", "#24334a"] });
    const before = structuredClone(selected().contextualProperties), box = layerBox(), preview = option("woman");
    expect(preview).toContain(`data-hairstyle="${hair === "bun" ? "bun" : "long"}"`);
    expect(preview).toContain("Editable vector model, running"); expect(preview).not.toContain('disabled=""');
    const svg = preview.match(/<svg\b[\s\S]*<\/svg>/)![0];
    expect(commitContextualEdit(inspectorContext(), "model.identity.modelPreset", "woman")).toBe(true);
    expect(withoutFraming(svg)).toBe(withoutFraming(renderToStaticMarkup(createElement(ModelSvg, { element: selected() }))));
    expect(selected().contextualProperties).toEqual({ ...before, "model.identity.modelPreset": "woman", "model.identity.ageGroup": "adult" });
    expect(layerBox()).toEqual(box);
  });

  it.each([["girl", "woman", "child", "adult"], ["woman", "girl", "adult", "child"]])("previews normalized age proportions when changing %s to %s", (from, to, age, nextAge) => {
    setup({ "model.identity.modelPreset": from!, "model.identity.ageGroup": age!, "model.appearance.hairStyle": "bun", "model.pose_action.action": "sitting", "model.pose_action.sittingVariation": "cross_legged" });
    const svg = option(to!).match(/<svg\b[\s\S]*<\/svg>/)![0];
    expect(commitContextualEdit(inspectorContext(), "model.identity.modelPreset", to!)).toBe(true);
    expect(selected().contextualProperties!["model.identity.ageGroup"]).toBe(nextAge);
    expect(withoutFraming(svg)).toBe(withoutFraming(renderToStaticMarkup(createElement(ModelSvg, { element: selected() }))));
  });

  it.each(["data:image/png;base64,provided", "data:image/svg+xml;base64,provided"])("preserves supplied pixels in the option and canvas for %s", source => {
    setup({ "model.identity.modelPreset": "man", "model.appearance.hairStyle": "bun" }, source);
    const preview = option("woman"); expect(preview).toContain(`src="${source}"`); expect(preview).not.toContain("<svg");
    expect(preview).toContain('alt=""'); expect(preview).toContain("object-fit:contain");
    expect(commitContextualEdit(inspectorContext(), "model.identity.modelPreset", "woman")).toBe(true);
    expect(selected().src).toBe(source); expect(renderToStaticMarkup(createElement(ElementContent, { el: selected() }))).toContain(`src="${source}"`);
  });

  it.each(["model.identity.ageGroup", "model.identity.modelPreset"])("disables a candidate rejected by %s lock without changing the document", field => {
    setup({ "model.identity.modelPreset": "girl", "model.identity.ageGroup": "child", "model.references.lockFields": [field] });
    const before = structuredClone(selected()); expect(option("woman")).toContain('disabled=""');
    expect(commitContextualEdit(inspectorContext(), "model.identity.modelPreset", "woman")).toBe(false); expect(selected()).toEqual(before);
  });
  it.each(Object.entries({man:"normal",woman:"long",boy:"pixie",girl:"bun"}))("shows the selected %s appearance in the actual canvas and matching toolbar option", (identity, hairstyle) => {
    setup({"model.identity.modelPreset":"man","model.appearance.hairStyle":"side_part","model.pose_action.action":"running","model.outfit.palette":["#ea6845","#24334a"]});
    const svg=option(identity).match(/<svg\b[\s\S]*<\/svg>/)![0];expect(svg).toContain(`data-hairstyle="${hairstyle}"`);
    expect(commitContextualEdit(inspectorContext(),"model.identity.modelPreset",identity)).toBe(identity!=="man");
    const canvas=renderToStaticMarkup(createElement(ElementContent,{el:selected()}));expect(canvas).toContain(`data-hairstyle="${hairstyle}"`);expect(withoutFraming(svg)).toBe(withoutFraming(canvas));
  });

  function framing(label: string) {
    const html = renderToStaticMarkup(createElement(ModelPopover, { elements: [selected()], fields: [], context: inspectorContext() }));
    return html.match(new RegExp(`<button[^>]*aria-label="Framing ${label}"[\\s\\S]*?</button>`))![0];
  }
  it("toggles between full avatar and portrait framing as one undoable edit, and respects a framing lock", () => {
    setup({ "model.identity.modelPreset": "man" });
    expect(framing("Full avatar")).toContain('aria-pressed="true"');
    expect(framing("Portrait")).toContain('aria-pressed="false"');
    const before = structuredClone(useEditorStore.getState().past);
    expect(commitContextualEdit(inspectorContext(), "model.framing.shot", "headshot")).toBe(true);
    expect(useEditorStore.getState().past.length).toBe(before.length + 1);
    expect(framing("Full avatar")).toContain('aria-pressed="false"');
    expect(framing("Portrait")).toContain('aria-pressed="true"');
    useEditorStore.getState().mutate(doc => {
      doc.elements[0]!.contextualProperties = { ...doc.elements[0]!.contextualProperties, "model.references.lockFields": ["model.framing.shot"] };
    });
    expect(framing("Full avatar")).toContain('disabled=""');
    expect(framing("Portrait")).toContain('disabled=""');
    expect(commitContextualEdit(inspectorContext(), "model.framing.shot", "full_body")).toBe(false);
  });
});
beforeEach(() => {
  vi.useFakeTimers();
  const doc = createDocument();
  doc.elements = [];
  useEditorStore.setState({
    doc,
    selectedIds: [],
    selectedGroupIds: [],
    backgroundSelected: false,
    past: [],
    future: [],
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
const model = () => ({
  ...createSpecElement("humanModelImage", createDocument().format, 0),
  catalogElementId: "subjects.person",
});
describe("adaptive contextual toolbar", () => {
  it("offers every existing layer order action in a compact accessible control", () => {
    const html = renderToStaticMarkup(createElement(LayerOrderControl));
    for (const label of [
      "Layer order",
      "Bring to front",
      "Bring forward",
      "Send backward",
      "Send to back",
    ])
      expect(html).toContain(label);
  });
  it("selects composed model slots and refills only with applicable fields", () => {
    const element = model();
    writeProperty(element, "model.pose_action.action", "standing");
    let controls = toolbarControls([element]);
    expect(controls.primary).toHaveLength(5);
    expect(controls.primary.map((control) => control.label)).toEqual([
      "Model",
      "Pose",
      "Variation",
      "Outfit",
      "Look",
    ]);
    expect(controls.primary[2]!.field.key).toContain("standingVariation");
    writeProperty(element, "model.pose_action.action", "sitting");
    controls = toolbarControls([element]);
    expect(controls.primary[2]!.field.key).toContain("sittingVariation");
    expect(
      [
        ...controls.primary.flatMap((control) => control.fields),
        ...controls.overflow,
      ].some((field) => field.key.includes("standingVariation")),
    ).toBe(false);
  });
  it("provides up to five quick controls and all other fields for every catalog identity", () => {
    for (const id of catalogIds) {
      const creation = contextualCreation(id)!;
      const element = {
        ...createSpecElement(creation.kind, createDocument().format, 0),
        ...creation.patch,
      };
      const controls = toolbarControls([element]);
      expect(controls.primary.length).toBeGreaterThan(0);
      expect(controls.primary.length).toBeLessThanOrEqual(5);
      const keys = [
        ...controls.primary.map((control) => control.field.key),
        ...controls.overflow.map((field) => field.key),
      ];
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
  it("intersects compatible fields for mixed selections", () => {
    const text = createSpecElement("title", createDocument().format, 0),
      image = model();
    const controls = toolbarControls([text, image]);
    expect(
      controls.primary.some((control) => control.field.key === "type.content"),
    ).toBe(false);
    expect(
      [
        ...controls.primary.map((control) => control.field),
        ...controls.overflow,
      ].some((field) => field.key === "transform.x"),
    ).toBe(true);
  });
  it("renders accessible floating quick controls plus separate Inspector action", () => {
    const element = model();
    useEditorStore.setState({
      selectedIds: [element.id],
      doc: { ...createDocument(), elements: [element] },
    });
    const html = renderToStaticMarkup(
      createElement(FloatingContextualToolbar, {
        elements: [element],
        screenBox: { left: 200, top: 200, width: 100, height: 100 },
      }),
    );
    expect(html).toContain('role="toolbar"');
    expect(html).toContain("More controls");
    expect(html).toContain("Open Design Inspector");
    expect(
      html.match(/class="ui-toolbar-button contextual-quick"/g),
    ).toHaveLength(5);
  });
  it("renders every configured control without a raw JSON fallback", () => {
    const examples = new Map(
      CONTROL_TYPES.map((control) => [
        control,
        undefined as
          | { id: string; field: ReturnType<typeof getElementFields>[number] }
          | undefined,
      ]),
    );
    for (const id of catalogIds)
      for (const field of getElementFields(id))
        examples.set(field.control, { id, field });
    for (const [control, example] of examples) {
      expect(example, control).toBeDefined();
      const creation = contextualCreation(example!.id)!;
      const element = {
        ...createSpecElement(creation.kind, createDocument().format, 0),
        ...creation.patch,
      };
      useEditorStore.setState({
        selectedIds: [element.id],
        doc: { ...createDocument(), elements: [element] },
      });
      const html = renderToStaticMarkup(
        createElement(ContextualField, {
          field: example!.field,
          elements: [element],
          context: inspectorContext(),
        }),
      );
      expect(html).toContain("contextual-field");
      expect(html).not.toContain("JSON");
    }
  });
});
