import "fake-indexeddb/auto";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import { compileCopyText } from "./copy-output";
import { compileVisualPrompt, buildJsonExport } from "./compiler";
import { compileDesignSkill } from "./design-md";
import { resolveEditorText } from "./output-sync";
import { saveProject, loadProjectVersion } from "./persistence";
import {
  createStudioLight,
  LIGHT_SOURCE_PRESETS,
  MAX_STUDIO_LIGHTS,
} from "./studio-lighting";
import { ASSET_PRESETS, type AssetPresetId } from "./asset-presets";
import { resolveElementDetail } from "./description-templates";
import { validateWritableDocument } from "./types";

beforeAll(() => {
  vi.stubGlobal("window", globalThis);
  const memory = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  });
});
const state = () => useEditorStore.getState();
const doc = () => state().doc!;
const el = () => doc().elements[0]!;
beforeEach(() => {
  state().setDocument(createDocument());
  state().setPanel("style");
});
afterEach(() => state().closeDocument());

describe("scene starters and description transitions", () => {
  it("adds every starter in one undo transaction without replacing existing subjects or selection semantics", () => {
    for (const preset of ASSET_PRESETS) {
      const count = doc().elements.length,
        history = state().past.length;
      state().addAssetPreset(preset.id, { x: 40, y: 50 });
      expect(doc().elements).toHaveLength(count + 1);
      expect(state().past.length).toBe(history + 1);
      const added = doc().elements[count]!;
      expect(added).toMatchObject({
        x: 40,
        y: 50,
        semanticRole: preset.role,
        descriptionTemplate: { id: preset.templateId },
      });
      expect(added.detail).toBe(resolveElementDetail(added));
      expect(added.slot).toBeUndefined();
      expect(added.assetId).toBeUndefined();
      expect(state().selectedIds).toEqual([added.id]);
      expect(state()).toMatchObject({ panel: "style", styleTab: "style" });
    }
    state().addAssetPreset("model");
    expect(
      doc().elements.filter((item) => item.semanticRole === "subject"),
    ).toHaveLength(2);
    state().undo();
    expect(doc().elements).toHaveLength(6);
    const before = doc();
    state().addAssetPreset("unknown" as AssetPresetId);
    expect(doc()).toBe(before);
  });

  it("keeps Compose open for repeated preset and shape insertions with one selected insertion and undo entry", () => {
    state().setPanel("assets");
    const insertions = [
      () => state().addAssetPreset("product"),
      () => state().addShape("triangle"),
    ];
    for (const insert of insertions) {
      const count = doc().elements.length,
        history = state().past.length;
      insert();
      expect(state().panel).toBe("assets");
      expect(doc().elements).toHaveLength(count + 1);
      expect(state().selectedIds).toEqual([doc().elements.at(-1)!.id]);
      expect(state().past).toHaveLength(history + 1);
    }
  });

  it("fits proportional preset bounds and clamps an edge drop into a tiny canvas", () => {
    const small = createDocument();
    small.format = { ...small.format, width: 64, height: 64 };
    state().setDocument(small);
    for (const preset of ASSET_PRESETS) {
      state().addAssetPreset(preset.id, { x: 63, y: -20 });
      const added = doc().elements.at(-1)!;
      expect(added.width / added.height).toBeCloseTo(
        preset.width / preset.height,
      );
      expect(added.x).toBeGreaterThanOrEqual(0);
      expect(added.y).toBeGreaterThanOrEqual(0);
      expect(added.x + added.width).toBeLessThanOrEqual(64);
      expect(added.y + added.height).toBeLessThanOrEqual(64);
      expect(() => validateWritableDocument(doc())).not.toThrow();
    }
  });

  it("switches templates and restores independent slot drafts and original custom text without changing geometry", () => {
    state().addShape("rounded rectangle");
    state().setElementDetail(el().id, "My original custom text");
    state().updateElement(el().id, {
      x: 37,
      y: 52,
      width: 123,
      height: 321,
      rotation: 24,
      groupId: "g",
      zIndex: 9,
    });
    const geometry = { ...el() },
      selection = state().selectedIds;
    state().setDescriptionTemplate(el().id, "person-model");
    state().updateDescriptionField(
      el().id,
      "wardrobe",
      "  a green linen suit  ",
    );
    state().setDescriptionTemplate(el().id, "product-packshot");
    state().updateDescriptionField(el().id, "product", "A ceramic cup");
    state().setDescriptionTemplate(el().id, "person-model");
    expect(el().detail).toContain("a green linen suit");
    expect(el()).toMatchObject({
      x: geometry.x,
      y: geometry.y,
      width: geometry.width,
      height: geometry.height,
      rotation: geometry.rotation,
      groupId: geometry.groupId,
      zIndex: geometry.zIndex,
    });
    expect(state().selectedIds).toEqual(selection);
    const active = doc();
    state().setDescriptionTemplate(el().id, "person-model");
    expect(doc()).toBe(active);
    state().detachDescriptionTemplate(el().id);
    expect(el().descriptionTemplate).toBeUndefined();
    expect(el().detail).toContain("a green linen suit");
    state().setDescriptionTemplate(el().id, "product-packshot");
    expect(el().detail).toContain("A ceramic cup");
    expect(el().descriptionDrafts?.custom).toBe("My original custom text");
    state().restoreCustomDescription(el().id);
    expect(el().detail).toBe("My original custom text");
    expect(el().descriptionTemplate).toBeUndefined();
  });

  it("detaches an incompatible role or explicit custom edit while preserving rendered and saved drafts", () => {
    state().addShape("rectangle");
    state().setElementDetail(el().id, "Original custom");
    state().setDescriptionTemplate(el().id, "product-packshot");
    state().updateDescriptionField(el().id, "product", "A red vase");
    const rendered = el().detail,
      before = structuredClone(doc()),
      history = state().past.length;
    state().setShapeRole(el().id, "text_area");
    expect(el().descriptionTemplate).toBeUndefined();
    expect(el().detail).toBe(rendered);
    expect(
      el().descriptionDrafts?.templates?.["product-packshot"]?.rendered,
    ).toBe(rendered);
    expect(el().descriptionDrafts?.custom).toBe("Original custom");
    expect(state().past.length).toBe(history + 1);
    state().undo();
    expect(doc()).toEqual(before);
    state().setElementDetail(el().id, "Explicit new custom");
    expect(el().descriptionTemplate).toBeUndefined();
    expect(el().detail).toBe("Explicit new custom");
    expect(el().descriptionDrafts?.custom).toBe("Original custom");
    state().undo();
    state().mutate((d) => {
      d.elements[0]!.detail = "Direct section edit";
    });
    expect(el().descriptionTemplate).toBeUndefined();
    expect(el().detail).toBe("Direct section edit");
    expect(
      el().descriptionDrafts?.templates?.["product-packshot"]?.values[
        "product"
      ],
    ).toBe("A red vase");
  });

  it("guards locks, fields, limits and unchanged edits without history or stale-template restoration", () => {
    state().addAssetPreset("model");
    state().updateDescriptionField(el().id, "wardrobe", "a navy jacket");
    const before = doc(),
      history = state().past.length;
    state().setDescriptionTemplate(el().id, "person-model");
    state().setDescriptionTemplate("missing", "person-model");
    state().updateDescriptionField(el().id, "unknown", "value");
    state().updateDescriptionField(el().id, "person", "x".repeat(201));
    state().updateDescriptionField(el().id, "wardrobe", "  a navy jacket  ");
    expect(doc()).toBe(before);
    expect(state().past.length).toBe(history);
    expect(el().detail).toContain("a navy jacket");
    state().updateElement(el().id, { locked: true });
    const locked = doc();
    state().setDescriptionTemplate(el().id, "product-packshot");
    state().updateDescriptionField(el().id, "person", "another model");
    state().detachDescriptionTemplate(el().id);
    state().restoreCustomDescription(el().id);
    state().setElementDetail(el().id, "custom");
    expect(doc()).toBe(locked);
  });

  it("rejects transitions that would overflow ten imported drafts without losing current text or metadata", () => {
    state().addAssetPreset("model");
    state().mutate((d) => {
      d.elements[0]!.descriptionDrafts = {
        custom: "Original",
        templates: Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => [
            `future-${i}`,
            { values: {}, rendered: `Future text ${i}` },
          ]),
        ),
      };
    });
    state().updateDescriptionField(el().id, "wardrobe", "a red coat");
    const before = doc();
    state().detachDescriptionTemplate(el().id);
    state().setDescriptionTemplate(el().id, "product-packshot");
    state().setShapeRole(el().id, "decorative");
    expect(doc()).toBe(before);
    expect(el().detail).toContain("a red coat");
    state().mutate((d) => {
      d.elements[0]!.detail = "Direct change at capacity";
    });
    expect(el().descriptionTemplate).toEqual(
      before.elements[0]?.descriptionTemplate,
    );
    expect(el().detail).toBe(before.elements[0]?.detail);
    expect(() => validateWritableDocument(doc())).not.toThrow();
  });

  it("updates cached/output descriptions atomically, recovers full custom output, and persists drafts", async () => {
    state().addAssetPreset("product");
    state().mutate((d) => {
      d.visualEdit = "My handwritten prompt";
      d.designEdit = "My handwritten design";
      d.promptParts = {
        [`el:${el().id}`]: "STALE",
        [`skill:el:${el().id}`]: "STALE",
        "skill:components": "STALE",
      };
    });
    const before = structuredClone(doc()),
      history = state().past.length;
    state().updateDescriptionField(el().id, "product", "A cobalt bottle");
    expect(state().past.length).toBe(history + 1);
    expect(el().detail).toBe(resolveElementDetail(el()));
    expect(doc().savedCustomText).toEqual({
      visual: "My handwritten prompt",
      design: "My handwritten design",
    });
    expect(compileVisualPrompt(doc())).toContain("A cobalt bottle");
    expect(compileDesignSkill(doc())).not.toContain("STALE");
    state().undo();
    expect(doc()).toEqual(before);
    state().redo();
    state().detachDescriptionTemplate(el().id);
    await saveProject(doc());
    const restored = (await loadProjectVersion(doc().id))!.doc;
    expect(restored.elements[0]?.descriptionDrafts).toEqual(
      el().descriptionDrafts,
    );
    expect(restored.elements[0]?.detail).toBe(el().detail);
    expect(compileCopyText(restored, undefined, "prompt")).toBe(
      buildJsonExport(restored).prompt,
    );
  });
});

describe("studio light store actions", () => {
  it("replaces a studio rig with each named source atomically and undo restores the rig", () => {
    for (const preset of LIGHT_SOURCE_PRESETS) {
      state().applyStudioPreset("product");
      const before = structuredClone(doc()),
        history = state().past.length;
      state().updateGenerationSettings({
        ...preset.settings,
        studioLights: undefined,
      });
      expect(state().past).toHaveLength(history + 1);
      expect(doc().generationSettings?.studioLights).toBeUndefined();
      expect(doc().generationSettings).toMatchObject(preset.settings);
      expect(doc().promptOptions.lighting).toBe(true);
      for (const output of [
        compileVisualPrompt(doc()),
        compileDesignSkill(doc()),
      ]) {
        expect(output).toContain(preset.label);
        expect(output).toContain(`Shadows: ${preset.settings.shadows}`);
        expect(output).not.toContain("Product key");
      }
      state().undo();
      expect(doc()).toEqual(before);
    }
  });

  it("reselects the current source to enable output in one undoable transaction", () => {
    const preset = LIGHT_SOURCE_PRESETS[0];
    state().updateGenerationSettings({
      ...preset.settings,
      studioLights: undefined,
    });
    state().mutate((d) => {
      d.promptOptions.lighting = false;
    });
    const before = structuredClone(doc()),
      history = state().past.length;
    state().updateGenerationSettings({
      ...preset.settings,
      studioLights: undefined,
    });
    expect(doc().promptOptions.lighting).toBe(true);
    expect(state().past).toHaveLength(history + 1);
    expect(compileVisualPrompt(doc())).toContain(preset.label);
    state().undo();
    expect(doc()).toEqual(before);
  });

  it("adds at most six sources and skips the over-limit action without changing history/custom output", () => {
    for (let i = 0; i < MAX_STUDIO_LIGHTS; i++) state().addStudioLight();
    expect(doc().generationSettings?.studioLights).toHaveLength(6);
    expect(doc().promptOptions.lighting).toBe(true);
    state().mutate((d) => {
      d.visualEdit = "Keep handwritten output";
    });
    const before = doc(),
      history = state().past.length;
    state().addStudioLight();
    expect(doc()).toBe(before);
    expect(state().past.length).toBe(history);
    expect(doc().savedCustomText).toBeUndefined();
  });

  it("applies/undoes a preset in one transaction while preserving scene/camera/geometry/selection", () => {
    state().addShape("circle", { x: 50, y: 60 });
    state().mutate((d) => {
      d.scene = "Existing environment";
      d.imageStyle = "cinematic";
      d.generationSettings = { cameraAngle: "Low angle", lightType: "Ambient" };
      d.visualEdit = "Original prompt";
      d.designEdit = "Original design";
    });
    const before = structuredClone(doc()),
      selection = state().selectedIds,
      history = state().past.length;
    state().applyStudioPreset("product");
    expect(state().past.length).toBe(history + 1);
    expect(doc().elements).toEqual(before.elements);
    expect(state().selectedIds).toEqual(selection);
    expect(doc()).toMatchObject({
      scene: before.scene,
      imageStyle: before.imageStyle,
      generationSettings: { cameraAngle: "Low angle", lightType: "Ambient" },
      savedCustomText: { visual: "Original prompt", design: "Original design" },
    });
    expect(doc().generationSettings?.studioLights).toHaveLength(4);
    state().undo();
    expect(doc()).toEqual(before);
    state().redo();
    expect(doc().generationSettings?.studioLights).toHaveLength(4);
  });

  it("normalizes edits, rejects invalid/missing/unchanged values, and preserves disabled inclusion", () => {
    state().addStudioLight();
    const id = doc().generationSettings!.studioLights![0]!.id;
    state().mutate((d) => {
      d.promptOptions.lighting = false;
    });
    const before = doc();
    for (const patch of [
      { name: "   " },
      { name: "  Key light  " },
      { temperature: 10001 },
      { intensity: -1 },
      { diffusion: Infinity },
    ])
      state().updateStudioLight(id, patch);
    state().updateStudioLight("missing", { name: "Missing" });
    expect(doc()).toBe(before);
    const history = state().past.length;
    state().updateStudioLight(id, {
      name: "  New softbox  ",
      intensity: 0,
      enabled: false,
    });
    expect(state().past.length).toBe(history + 1);
    expect(doc().generationSettings?.studioLights?.[0]).toMatchObject({
      id,
      name: "New softbox",
      intensity: 0,
      enabled: false,
    });
    expect(doc().promptOptions.lighting).toBe(false);
  });

  it("retains an empty rig after removing the last source and resets to the saved legacy values", () => {
    state().updateGenerationSettings({
      lightType: "Studio",
      lightDirection: "Left",
      lightIntensity: 30,
    });
    state().addStudioLight();
    const id = doc().generationSettings!.studioLights![0]!.id;
    state().mutate((d) => {
      d.promptOptions.lighting = false;
    });
    state().removeStudioLight(id);
    expect(doc().generationSettings?.studioLights).toEqual([]);
    expect(doc().promptOptions.lighting).toBe(false);
    const empty = doc();
    state().removeStudioLight(id);
    expect(doc()).toBe(empty);
    state().resetStudioRig();
    expect(doc().generationSettings).toEqual({
      lightType: "Studio",
      lightDirection: "Left",
      lightIntensity: 30,
    });
    expect(doc().promptOptions.lighting).toBe(false);
    const reset = doc();
    state().resetStudioRig();
    expect(doc()).toBe(reset);
    state().undo();
    expect(doc().generationSettings?.studioLights).toEqual([]);
  });

  it("validates and normalizes rigs through the general settings action and persists disabled sources", async () => {
    const light = createStudioLight({
      name: "Disabled source",
      enabled: false,
    });
    const before = doc();
    state().updateGenerationSettings({ studioLights: [light, light] });
    expect(doc()).toBe(before);
    state().updateGenerationSettings({
      studioLights: [{ ...light, name: "  Disabled source  " }],
    });
    expect(doc().generationSettings?.studioLights?.[0]?.name).toBe(
      "Disabled source",
    );
    await saveProject(doc());
    expect(
      (await loadProjectVersion(doc().id))?.doc.generationSettings
        ?.studioLights,
    ).toEqual([light]);
  });
});

describe("shape store actions", () => {
  it("enables structured lighting once and supports undo, disabling without discarding values", () => {
    const history = state().past.length;
    state().updateGenerationSettings({ lightIntensity: 0, shadows: "Soft" });
    expect(state().past.length).toBe(history + 1);
    expect(doc().promptOptions.lighting).toBe(true);
    const configured = doc();
    state().updateGenerationSettings({ lightIntensity: 0, shadows: "Soft" });
    expect(doc()).toBe(configured);
    state().mutate((d) => {
      d.promptOptions.lighting = false;
    });
    expect(doc().generationSettings).toEqual({
      lightIntensity: 0,
      shadows: "Soft",
    });
    state().undo();
    expect(doc().promptOptions.lighting).toBe(true);
    state().undo();
    expect(doc().generationSettings).toBeUndefined();
  });

  it("recovers custom output even when document resize clears the active edit fields", () => {
    state().addShape("circle");
    state().mutate((d) => {
      d.visualEdit = "Resize writing";
      d.designEdit = "Resize design";
    });
    state().resizeCurrent({ ...doc().format, height: 1920 });
    expect(doc().savedCustomText).toEqual({
      visual: "Resize writing",
      design: "Resize design",
    });
    state().updateElement(el().id, { x: el().x + 10 });
    expect(doc().savedCustomText?.visual).toBe("Resize writing");
  });

  it("inserts multiple shapes with the same role without slotting or replacement", () => {
    state().addShape("rectangle", { x: 17, y: 43 });
    const first = el();
    state().setShapeRole(first.id, "subject");
    state().addShape("circle");
    const second = doc().elements[1]!;
    state().setShapeRole(second.id, "subject");
    expect(doc().elements).toHaveLength(2);
    expect(first).toMatchObject({
      x: 17,
      y: 43,
      rotation: 0,
      style: { borderRadius: 0, opacity: 1 },
    });
    expect(second.width).toBe(second.height);
    expect(doc().elements.every((e) => !e.slot)).toBe(true);
    expect(state().selectedIds).toEqual([second.id]);
    expect(state()).toMatchObject({ panel: "style", styleTab: "style" });
  });

  it("changes only role and output state, preserving selection and geometry; one undo restores all", () => {
    state().addShape("rounded rectangle");
    state().updateElement(el().id, {
      x: 49,
      y: 81,
      width: 321,
      height: 123,
      rotation: 37,
      zIndex: 7,
      groupId: "group",
    });
    const before = structuredClone(doc());
    const selection = state().selectedIds;
    const history = state().past.length;
    state().setShapeRole(el().id, "product");
    expect(el()).toEqual({ ...before.elements[0], semanticRole: "product" });
    expect(state().selectedIds).toEqual(selection);
    expect(state().past.length).toBe(history + 1);
    state().undo();
    expect(doc()).toEqual(before);
    state().redo();
    expect(el().semanticRole).toBe("product");
  });

  it("ignores locked, missing, unchanged and invalid role/settings changes without history", () => {
    state().addShape("circle");
    const before = doc();
    state().setShapeRole(el().id, "decorative");
    state().setShapeRole("missing", "subject");
    state().updateGenerationSettings({ lightIntensity: 101 });
    expect(doc()).toBe(before);
    state().updateElement(el().id, { locked: true });
    const locked = doc();
    state().setShapeRole(el().id, "subject");
    state().updateShapeAppearance(el().id, { shapeType: "rectangle" });
    expect(doc()).toBe(locked);
  });

  it("keeps circle numeric/group transforms circular and type changes preserve position and rotation", () => {
    state().addShape("circle", { x: 50, y: 60 });
    state().updateElement(el().id, { width: 150, rotation: 23 });
    expect(el()).toMatchObject({ width: 150, height: 150, x: 50, y: 60 });
    state().updateElement(el().id, { height: 100 });
    expect(el()).toMatchObject({ width: 100, height: 100 });
    state().transformGroup(
      [el().id],
      { x: el().x, y: el().y, width: el().width, height: el().height },
      { x: 50, y: 60, width: 200, height: 100 },
    );
    expect(el()).toMatchObject({ width: 100, height: 100, x: 100, y: 60 });
    state().updateShapeAppearance(el().id, { shapeType: "rounded rectangle" });
    expect(el()).toMatchObject({
      x: 100,
      y: 60,
      rotation: 23,
      style: { borderRadius: 16 },
    });
    state().updateShapeAppearance(el().id, { shapeType: "rectangle" });
    expect(el().style.borderRadius).toBe(0);
  });

  it("recovers handwritten text and invalidates both output modes atomically on role edits", () => {
    state().addShape("rectangle");
    state().mutate((d) => {
      d.visualEdit = "MY PROMPT";
      d.designEdit = "MY DESIGN";
      d.promptParts = {
        [`el:${el().id}`]: "OLD SLOT",
        [`skill:el:${el().id}`]: "OLD SLOT",
        "skill:components": "OLD COMPONENT",
        "skill:spacing": "OLD RADIUS",
        colors: "MY COLORS",
      };
    });
    const before = structuredClone(doc());
    state().setShapeRole(el().id, "product");
    expect(doc().savedCustomText).toEqual({
      visual: "MY PROMPT",
      design: "MY DESIGN",
    });
    expect(doc().visualEdit).toBeUndefined();
    expect(doc().designEdit).toBeUndefined();
    expect(doc().promptParts).toEqual({ colors: "MY COLORS" });
    expect(compileCopyText(doc(), undefined, "design")).toBe(
      resolveEditorText(doc(), "design_skill", compileDesignSkill(doc())),
    );
    expect(compileCopyText(doc(), undefined, "prompt")).toBe(
      buildJsonExport(doc()).prompt,
    );
    expect(buildJsonExport(doc()).prompt).toContain(
      "product content placeholder",
    );
    state().undo();
    expect(doc()).toEqual(before);
  });

  it("invalidates stale semantic geometry/detail sections through direct UI mutation routes", () => {
    state().addShape("rectangle");
    state().mutate((d) => {
      d.promptParts = {
        [`el:${el().id}`]: "OLD",
        [`skill:el:${el().id}`]: "OLD",
      };
    });
    state().mutate((d) => {
      d.elements[0]!.width = 333;
    });
    expect(compileVisualPrompt(doc())).toContain("333");
    expect(compileDesignSkill(doc())).not.toContain("OLD");
    state().setElementDetail(el().id, "New detail");
    expect(compileVisualPrompt(doc())).toContain("New detail");
  });

  it("persists roles, structured settings and recovered custom output without migration", async () => {
    state().addShape("circle");
    state().setShapeRole(el().id, "subject");
    state().mutate((d) => {
      d.visualEdit = "Recover me";
    });
    state().updateGenerationSettings({ lightIntensity: 0, shadows: "Soft" });
    await saveProject(doc());
    const loaded = await loadProjectVersion(doc().id);
    expect(loaded?.doc).toMatchObject({
      generationSettings: { lightIntensity: 0, shadows: "Soft" },
      savedCustomText: { visual: "Recover me" },
      elements: [{ semanticRole: "subject" }],
    });
  });
});
