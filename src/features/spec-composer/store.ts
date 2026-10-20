import { findTextPreset } from "./assets-panel/text-presets";
import { contextualCreation } from "./contextual-editor/creation";
import { findPurpose } from "./contextual-editor/catalog";
import { remapReferences } from "./contextual-editor/references";
import {
  canonicalLayers,
  canGroupLayers,
  flattenLayers,
  layerGroups,
  layerAlignmentItems,
  movedLayers,
  pruneLayerGroups,
  selectedLayerIds,
  type LayerDestination,
} from "./layer-tree";
import {
  centeredCircle,
  isCircleShape,
  shapePatch,
  type ShapeType,
} from "./shape-workflow";
import { synchronizeStructuredOutput } from "./output-sync";
import {
  findDescriptionTemplate,
  resolveElementDetail,
  synchronizeElementDescriptions,
  type DescriptionTemplateId,
} from "./description-templates";
import { assetPresetPatch, type AssetPresetId } from "./asset-presets";
import {
  createStudioLight,
  createStudioPreset,
  MAX_STUDIO_LIGHTS,
  type StudioPresetId,
} from "./studio-lighting";
import {
  generationSettingsSchema,
  descriptionDraftsSchema,
  descriptionTemplateSelectionSchema,
  studioLightSchema,
  type StudioLight,
  shapeRoleSchema,
  type GenerationSettings,
  type ShapeRole,
  type ElementStyle,
} from "./types";
import { create } from "zustand";
import {
  type AlignEdge,
  alignOffsets,
  distributeOffsets,
  sameBox,
  validBox,
} from "./canvas-geometry";
import {
  isTextKind,
  type BrandKit,
  type ElementConstraint,
  type ElementKind,
  type ExternalToolRequirement,
  type Format,
  type PanelMode,
  type SpecDocument,
  type SpecElement,
  type StyleKit,
  type ToolMode,
} from "./types";
import { defaultExternalToolRequirement } from "./compiler";
import { applyElementText } from "./text-edit";
import { createElement } from "./registry";
import {
  elementRole,
  findAssetItem,
  ROLE_REPLACE,
  type AssetRole,
} from "./asset-catalog";
import {
  loadProjects,
  loadProjectVersion,
  saveProject,
  saveProjectConditional,
} from "./persistence";
import { ProjectConflictError } from "./storage/adapter";
import { toast } from "sonner";
import { reportStorageError } from "./storage/errors";
import { replaceDocumentContents, resizeDocument } from "./resize";
import {
  applyBrandKitToElement,
  applyBrandKitToDocument,
  loadBrandKits,
  loadDefaultBrandKitId,
  saveBrandKits,
  saveDefaultBrandKitId,
} from "./brand-kits";
import {
  brandKitFromMaterialKit,
  createStyleKit,
  loadMaterialStyleKits,
  saveMaterialStyleKits,
} from "./material-kits";
import {
  applyComposeLayout,
  applyTidy,
  defaultLayoutFor,
  isComposeLayout,
  roleZone,
  type Box,
  type ComposeLayout,
} from "./compose-layouts";

export type { Box, ComposeLayout } from "./compose-layouts";

export interface Guide {
  axis: "x" | "y";
  pos: number;
}

interface EditorState {
  setCreativePurpose: (id?: string) => void;
  addContextualElement: (id: string, point?: { x: number; y: number }, preset?: string) => void;
  doc?: SpecDocument | undefined;
  selectedIds: string[];
  selectedGroupIds: string[];
  backgroundSelected: boolean;
  panel: PanelMode;
  /** Which tab the Style panel shows; lifted out of local state so canvas
   * selection can force it open to Style. */
  styleTab: "style" | "layout";
  tool: ToolMode;
  zoom: number;
  pan: { x: number; y: number };
  past: SpecDocument[];
  future: SpecDocument[];
  saveStatus: "saved" | "saving" | "error";
  externallyModified: boolean;
  checkRemoteChange: () => Promise<void>;
  guides: Guide[];
  brandKits: BrandKit[];
  defaultBrandKitId?: string | undefined;
  materialKits: StyleKit[];
  /** True once kits have been loaded from storage. */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDocument: (doc: SpecDocument, token?: string | null) => void;
  applyTemplate: (template: SpecDocument, name: string) => void;
  /** Flushes a pending autosave and clears the open document. */
  closeDocument: () => void;
  mutate: (fn: (d: SpecDocument) => void, history?: boolean) => void;
  resizeCurrent: (format: Format) => boolean;
  select: (id?: string, add?: boolean) => void;
  selectMany: (ids: string[], add?: boolean) => void;
  selectLayers: (ids: string[]) => void;
  renameLayer: (id: string, name: string) => void;
  updateLayers: (
    ids: string[],
    patch: Partial<Pick<SpecElement, "visible" | "locked">>,
  ) => void;
  moveLayers: (ids: string[], destination: LayerDestination) => void;
  selectBackground: () => void;
  setPanel: (p: PanelMode) => void;
  setStyleTab: (tab: "style" | "layout") => void;
  setTool: (t: ToolMode) => void;
  setView: (zoom: number, pan?: { x: number; y: number }) => void;
  setGuides: (guides: Guide[]) => void;
  addTextPreset: (id: string, point?: { x: number; y: number }) => void;
  addShape: (type: ShapeType, point?: { x: number; y: number }) => void;
  addAssetPreset: (
    id: AssetPresetId,
    point?: { x: number; y: number },
    templateId?: DescriptionTemplateId,
  ) => void;
  setDescriptionTemplate: (id: string, templateId: DescriptionTemplateId) => void;
  updateDescriptionField: (id: string, field: string, value: string) => void;
  detachDescriptionTemplate: (id: string) => void;
  restoreCustomDescription: (id: string) => void;
  setShapeRole: (id: string, role: ShapeRole) => void;
  updateShapeAppearance: (id: string, patch: Partial<ElementStyle>) => void;
  updateGenerationSettings: (patch: Partial<GenerationSettings>) => void;
  addStudioLight: () => void;
  updateStudioLight: (id: string, patch: Partial<Omit<StudioLight, "id">>) => void;
  removeStudioLight: (id: string) => void;
  applyStudioPreset: (id: StudioPresetId) => void;
  resetStudioRig: () => void;
  addElement: (
    k: ElementKind,
    x?: number,
    y?: number,
    patch?: Partial<SpecElement>,
    options?: { atBack?: boolean; preservePatchStyle?: boolean },
  ) => void;
  /** Auto-slots a catalog asset of `role` into the document: replaces the
   * current occupant of that role (per ROLE_REPLACE), or — on a blank
   * canvas, the format's default Compose layout — places it in that
   * layout's zone for the role. One undo step. Returns the new element's
   * id, or undefined if there is no open document. */
  slotElement: (
    role: AssetRole,
    kind: ElementKind,
    patch: Partial<SpecElement>,
    options?: { atBack?: boolean },
  ) => string | undefined;
  /** Swaps a slotted element for a different catalog item of the same kind:
   * keeps its box, zIndex, lock, slot and detail, but refreshes its
   * catalog-sourced fields (name, assetId, art, prompt) and drops typed
   * copy unless both the old and new kind are text. Skips locked elements,
   * one undo step. */
  swapAsset: (
    id: string,
    kind: ElementKind,
    patch: Partial<SpecElement>,
  ) => void;
  updateElement: (id: string, patch: Partial<SpecElement>) => void;
  /** Sets a text (or text-like) element's content, dropping its frozen
   * prompt-section override so the live segment takes over. */
  setElementText: (id: string, content: string, history?: boolean) => void;
  /** Sets an element's subject detail (see compiler.ts), compiled into its
   * image-element prompt line. */
  setElementDetail: (id: string, value: string, history?: boolean) => void;
  commitCanvasTransform: (
    original: SpecDocument,
    boxes: Record<string, Box>,
  ) => void;
  updateElementConstraint: (
    id: string,
    patch: Partial<ElementConstraint>,
  ) => void;
  updateExternalTool: (patch: Partial<ExternalToolRequirement>) => void;
  deleteElements: (ids: string[]) => void;
  deleteSelected: () => void;
  duplicate: () => void;
  undo: () => void;
  redo: () => void;
  align: (a: AlignEdge) => void;
  distribute: (axis: "horizontal" | "vertical") => void;
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  group: () => void;
  ungroup: () => void;
  tidy: () => void;
  compose: (layout: ComposeLayout) => void;
  /** Element boxes from before the first compose() on the open document. */
  composeOrigin?: Record<string, Box> | undefined;
  /** Restores the boxes captured in composeOrigin. */
  resetCompose: () => void;
  transformGroup: (ids: string[], orig: Box, next: Box) => void;
  reorder: (ids: string[]) => void;
  /** Persists the open document now; resolves once the write settles. */
  saveNow: () => Promise<void>;
  createBrandKit: (name: string, draft?: BrandKitDraft) => string;
  updateBrandKit: (id: string, patch: Partial<BrandKit>) => void;
  deleteBrandKit: (id: string) => void;
  activateBrandKit: (id: string) => void;
  deactivateBrandKit: () => void;
  setDefaultBrandKit: (id: string) => void;
  clearDefaultBrandKit: () => void;
  createMaterialKit: (
    name: string,
    seedHex: string,
    draft?: BrandKitDraft,
  ) => string;
  deleteMaterialKit: (id: string) => void;
}

/** Fields the brand kit builder can prefill a new kit with; name and seed
 * color are passed separately since create/generate collect them differently. */
export type BrandKitDraft = Partial<
  Pick<BrandKit, "colors" | "emotions" | "style" | "typography" | "profile">
>;

function moveSelectedStack(
  state: EditorState,
  direction: "front" | "back" | "up" | "down",
) {
  const doc = state.doc;
  if (!doc) return;
  const nodes = canonicalLayers(
    doc,
    selectedLayerIds(doc, state.selectedIds, state.selectedGroupIds),
  );
  if (
    !nodes.length ||
    nodes.some((node) => node.parentId !== nodes[0]!.parentId)
  )
    return;
  const rows = flattenLayers(doc);
  const selected = new Set(nodes.map((node) => node.id));
  const siblings = rows.filter((node) => node.parentId === nodes[0]!.parentId);
  const up = direction === "front" || direction === "up";
  const index = up
    ? siblings.findIndex((node) => selected.has(node.id))
    : siblings.length -
      1 -
      [...siblings].reverse().findIndex((node) => selected.has(node.id));
  const target =
    direction === "front"
      ? siblings.find((node) => !selected.has(node.id))
      : direction === "back"
        ? [...siblings].reverse().find((node) => !selected.has(node.id))
        : siblings[index + (up ? -1 : 1)];
  if (target && !selected.has(target.id))
    state.moveLayers([...selected], {
      targetId: target.id,
      position: up ? "before" : "after",
    });
}

const clone = (d: SpecDocument): SpecDocument => structuredClone(d);

/** Preflight transitions, including bounded imported draft maps, before adding history. */
function prepareDescriptionChange(
  doc: SpecDocument | undefined,
  id: string,
  change: (el: SpecElement) => void,
): SpecElement | undefined {
  const original = doc?.elements.find((el) => el.id === id);
  if (!doc || !original || original.kind !== "shape" || original.locked)
    return undefined;
  const candidate = structuredClone(original);
  change(candidate);
  synchronizeElementDescriptions(
    { ...doc, elements: [original] },
    { ...doc, elements: [candidate] },
  );
  if (
    (candidate.descriptionTemplate &&
      !descriptionTemplateSelectionSchema.safeParse(
        candidate.descriptionTemplate,
      ).success) ||
    (candidate.descriptionDrafts &&
      !descriptionDraftsSchema.safeParse(candidate.descriptionDrafts)
        .success) ||
    (candidate.detail?.length ?? 0) > 20_000 ||
    [
      "detail",
      "semanticRole",
      "descriptionTemplate",
      "descriptionDrafts",
    ].every(
      (key) =>
        JSON.stringify(candidate[key as keyof SpecElement]) ===
        JSON.stringify(original[key as keyof SpecElement]),
    )
  )
    return undefined;
  return candidate;
}

function applyDescriptionChange(
  doc: SpecDocument,
  id: string,
  candidate: SpecElement,
) {
  const el = doc.elements.find((item) => item.id === id);
  if (!el) return;
  for (const key of [
    "detail",
    "descriptionTemplate",
    "descriptionDrafts",
    "semanticRole",
  ] as const) {
    if (key in candidate) Object.assign(el, { [key]: candidate[key] });
    else delete el[key];
  }
}

const historyLimit = (doc: SpecDocument) =>
  JSON.stringify(doc).length > 1_000_000 ? 10 : 75;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
/** Serializes project writes so an older revision can never land last. */
let writeQueue: Promise<unknown> = Promise.resolve();
let activeVersion:
  | {
      id: string;
      token: string | null;
      conflictCopy?: { id: string; token: string | null };
    }
  | undefined;

function enqueueWrite(write: () => Promise<void>) {
  const next = writeQueue.then(write);
  writeQueue = next.catch(() => undefined);
  return next;
}

/**
 * Rewrites stored projects other than the open one (which `mutate` saves).
 * Only the projects `update` returns are written.
 */
function rewriteStoredProjects(
  openId: string | undefined,
  update: (project: SpecDocument) => SpecDocument | undefined,
) {
  enqueueWrite(async () => {
    for (const project of await loadProjects()) {
      if (project.id === openId) continue;
      // Recompute on the latest saved version if another tab wins the race.
      for (let attempt = 0; attempt < 2; attempt++) {
        const current = await loadProjectVersion(project.id);
        if (!current) break;
        const next = update(current.doc);
        if (!next) break;
        try {
          await saveProjectConditional(next, current.token);
          break;
        } catch (error) {
          if (!(error instanceof ProjectConflictError) || attempt === 1)
            throw error;
        }
      }
    }
  }).catch((error: unknown) => reportStorageError(error, "rewrite-projects"));
}

function persistKits(write: Promise<void>, op: string) {
  write.catch((error: unknown) => reportStorageError(error, op));
}

function withRevision(d: SpecDocument) {
  d.revision += 1;
  d.updatedAt = new Date().toISOString();
}

export function boundsOf(elements: SpecElement[]): Box {
  if (!elements.length) return { x: 0, y: 0, width: 0, height: 0 };
  const first = elements[0]!;
  let minX = first.x;
  let minY = first.y;
  let maxX = first.x + first.width;
  let maxY = first.y + first.height;
  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** The mutate-body of `addElement`, factored out so `slotElement` can build
 * an element with identical behaviour (kit-before-patch ordering, the
 * no-drop-point clamp, atBack renumbering) before placing it itself. */
function insertElement(
  doc: SpecDocument,
  kit: BrandKit | undefined,
  kind: ElementKind,
  x: number | undefined,
  y: number | undefined,
  patch: Partial<SpecElement> | undefined,
  options?: { atBack?: boolean; preservePatchStyle?: boolean },
): SpecElement {
  const hasPoint = x !== undefined && y !== undefined;
  const el = createElement(kind, doc.format, doc.elements.length, x, y);
  if (kit && options?.preservePatchStyle) applyBrandKitToElement(el, kit);
  if (patch) {
    const { style, ...rest } = patch;
    Object.assign(el, rest);
    if (style) el.style = { ...el.style, ...style };
  }
  if (kit && !options?.preservePatchStyle) applyBrandKitToElement(el, kit);
  // A patch (e.g. from an asset preset) can resize the element after
  // createElement picked a default position, so without an explicit
  // drop point, clamp it inside the canvas using its final size.
  if (!hasPoint) {
    el.x = Math.max(0, Math.min(el.x, doc.format.width - el.width));
    el.y = Math.max(0, Math.min(el.y, doc.format.height - el.height));
  }
  if (options?.atBack) {
    doc.elements.unshift(el);
    doc.elements.forEach((e, i) => (e.zIndex = i + 1));
  } else {
    doc.elements.push(el);
  }
  return el;
}

/** Drops a constraint's `positiveConstraint` (a swapped-in item brings its
 * own) while keeping `lock`, `negativeConstraint` and `brandLocked`. */
function withoutPositiveConstraint(
  constraint: SpecElement["constraint"],
): SpecElement["constraint"] {
  if (!constraint) return undefined;
  const { positiveConstraint: _positiveConstraint, ...rest } = constraint;
  return rest;
}

/** Text kinds that stretch to a copy stack's full width when auto-slotted;
 * the rest (cta, badge, price) keep their own width, capped at the stack's
 * width. Mirrors compose-layouts.ts's FILL_TEXT_KINDS / stackCopy sizing
 * rule exactly, so a slotted element lands at the same width compose()
 * would give it. */
const SLOT_STACK_FILL_KINDS: readonly ElementKind[] = [
  "title",
  "subheading",
  "body",
  "eyebrow",
  "offer",
];

/** The AssetRoles stackCopy-style zones treat as copy, for the "largest
 * bottom" scan `slotElement` does when placing a new stack item below
 * whatever's already there. */
const STACK_ROLES: readonly AssetRole[] = ["headline", "offer", "cta"];

export const useEditorStore = create<EditorState>((set, get) => ({
  selectedIds: [],
  selectedGroupIds: [],
  backgroundSelected: false,
  panel: "assets",
  styleTab: "layout",
  tool: "select",
  zoom: 1,
  pan: { x: 0, y: 0 },
  past: [],
  future: [],
  saveStatus: "saved",
  externallyModified: false,
  guides: [],
  brandKits: [],
  defaultBrandKitId: undefined,
  materialKits: [],
  hydrated: false,

  hydrate: async () => {
    const [brandKits, materialKits] = await Promise.all([
      loadBrandKits(),
      loadMaterialStyleKits(),
    ]);
    set({
      brandKits,
      materialKits,
      defaultBrandKitId: loadDefaultBrandKitId(),
      hydrated: true,
    });
  },

  // A saved poster keeps its own brand kit and colors; the default kit only
  // applies when a document is created (see applyDefaultBrandKit).
  setDocument: (doc, token) => {
    activeVersion = { id: doc.id, token: token ?? null };
    set({
      doc: clone(doc),
      past: [],
      future: [],
      selectedIds: [],
      selectedGroupIds: [],
      backgroundSelected: false,
      saveStatus: "saved",
      externallyModified: false,
      composeOrigin: undefined,
    });
  },

  applyTemplate: (template, name) => {
    const current = get().doc;
    if (!current) return;
    const next = {
      ...clone(template),
      id: current.id,
      name,
      createdAt: current.createdAt,
      revision: current.revision,
    };
    const kit = get().brandKits.find(
      (value) => value.id === current.creativeDirection.brandKitId,
    );
    if (kit) applyBrandKitToDocument(next, kit);
    else delete next.creativeDirection.brandKitId;
    get().mutate((doc) => {
      delete doc.layout;
      delete doc.groups;
      Object.assign(doc, next);
    });
    set({ selectedIds: [], selectedGroupIds: [], backgroundSelected: false });
  },

  closeDocument: () => {
    if (saveTimer) void get().saveNow();
    activeVersion = undefined;
    set({
      doc: undefined,
      past: [],
      future: [],
      selectedIds: [],
      selectedGroupIds: [],
      backgroundSelected: false,
      saveStatus: "saved",
      externallyModified: false,
      composeOrigin: undefined,
    });
  },

  mutate: (fn, history = true) => {
    const current = get().doc;
    if (!current) return;
    const next = clone(current);
    fn(next);
    // Explicit source edits (including the unchanged Inspector) invalidate an old
    // contextual source reference unless it still resolves to the supplied pixels.
    next.elements.forEach((element) => {
      const sourceId = element.contextualProperties?.["asset.source"];
      if (typeof sourceId === "string" && next.referenceAssets?.[sourceId]?.source !== element.src)
        delete element.contextualProperties!["asset.source"];
    });
    synchronizeElementDescriptions(current, next);
    synchronizeStructuredOutput(current, next);
    withRevision(next);
    set((s) => ({
      doc: next,
      selectedIds: s.selectedIds.filter((id) =>
        next.elements.some((el) => el.id === id),
      ),
      selectedGroupIds: s.selectedGroupIds.filter((id) =>
        layerGroups(next).some((group) => group.id === id),
      ),
      past: history
        ? [...s.past.slice(1 - historyLimit(current)), clone(current)]
        : s.past,
      future: history ? [] : s.future,
      saveStatus: "saving",
    }));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void get().saveNow(), 500);
  },

  checkRemoteChange: async () => {
    const current = get().doc;
    const version = activeVersion;
    if (!current || version?.id !== current.id) return;
    const { loadProjectVersion } = await import("./persistence");
    const remote = await loadProjectVersion(current.id);
    if (get().doc?.id !== current.id) return;
    if (!remote || remote.token !== version.token) {
      set({ externallyModified: true });
      toast.warning("This design changed in another tab", {
        id: "remote-design-change",
        description:
          "If you save now, your edits will be kept as a separate copy.",
      });
    }
  },

  resizeCurrent: (format) => {
    const current = get().doc;
    if (!current) return false;
    if (
      current.format.width === format.width &&
      current.format.height === format.height
    )
      return false;
    const resized = resizeDocument(current, format);
    get().mutate((doc) => replaceDocumentContents(doc, resized));
    set({ composeOrigin: undefined });
    return true;
  },

  selectLayers: (ids) => {
    const doc = get().doc;
    if (!doc) return;
    const nodes = canonicalLayers(doc, ids);
    set({
      selectedIds: nodes.flatMap((node) => node.leaves.map((el) => el.id)),
      selectedGroupIds: nodes
        .filter((node) => !node.element)
        .map((node) => node.id),
      backgroundSelected: false,
    });
  },

  select: (id, add = false) => {
    const doc = get().doc;
    if (!doc || !id) {
      set({ selectedIds: [], selectedGroupIds: [], backgroundSelected: false });
      return;
    }
    if (add) {
      // Canvas modifiers operate on individual objects, even inside groups.
      get().selectMany(
        get().selectedIds.includes(id)
          ? get().selectedIds.filter((value) => value !== id)
          : [...get().selectedIds, id],
      );
      return;
    }
    const rows = flattenLayers(doc);
    let node = rows.find((row) => row.id === id);
    while (node?.parentId) node = rows.find((row) => row.id === node!.parentId);
    get().selectLayers(node ? [node.id] : []);
  },

  selectBackground: () =>
    set({ selectedIds: [], selectedGroupIds: [], backgroundSelected: true }),

  selectMany: (ids, add = false) => {
    const valid = new Set(get().doc?.elements.map((el) => el.id));
    set((s) => ({
      selectedIds: [...new Set(add ? [...s.selectedIds, ...ids] : ids)].filter(
        (id) => valid.has(id),
      ),
      selectedGroupIds: [],
      backgroundSelected: false,
    }));
  },

  renameLayer: (id, value) => {
    const name = value.trim().slice(0, 200);
    const doc = get().doc;
    const node = doc && flattenLayers(doc).find((row) => row.id === id);
    if (!doc || !node || !name || node.name === name) return;
    get().mutate((next) => {
      if (node.element) next.elements.find((el) => el.id === id)!.name = name;
      else {
        next.groups = layerGroups(next);
        next.groups.find((group) => group.id === id)!.name = name;
      }
    });
  },

  updateLayers: (ids, patch) => {
    const doc = get().doc;
    if (!doc) return;
    const leaves = new Set(
      canonicalLayers(doc, ids).flatMap((node) =>
        node.leaves.map((el) => el.id),
      ),
    );
    const values = Object.entries(patch).filter(
      ([key, value]) =>
        (key === "visible" || key === "locked") && typeof value === "boolean",
    );
    if (
      !values.length ||
      !doc.elements.some(
        (el) =>
          leaves.has(el.id) &&
          values.some(
            ([key, value]) => el[key as "visible" | "locked"] !== value,
          ),
      )
    )
      return;
    get().mutate((next) =>
      next.elements.forEach((el) => {
        if (leaves.has(el.id)) Object.assign(el, Object.fromEntries(values));
      }),
    );
  },

  moveLayers: (ids, destination) => {
    const doc = get().doc;
    const next = doc && movedLayers(doc, ids, destination);
    if (next)
      get().mutate((draft) => {
        draft.elements = next.elements;
        draft.groups = next.groups;
      });
  },

  setPanel: (panel) => set({ panel }),
  setStyleTab: (styleTab) => set({ styleTab }),
  setTool: (tool) => set({ tool }),
  setView: (zoom, pan) =>
    set((s) => ({ zoom: Math.min(3, Math.max(0.1, zoom)), pan: pan ?? s.pan })),
  setGuides: (guides) => set({ guides }),

  setCreativePurpose: (id) => {
    if (id && !findPurpose(id)) return;
    if (get().doc?.creativePurposeId === id) return;
    get().mutate((doc) => { doc.creativePurposeId = id; });
  },
  addContextualElement: (id, point, preset) => {
    if (point && (!Number.isFinite(point.x) || !Number.isFinite(point.y))) return;
    const creation = contextualCreation(id, preset);
    if (!creation) return;
    get().addElement(creation.kind, point?.x, point?.y, creation.patch, { preservePatchStyle: true });
  },
  addTextPreset: (id, point) => {
    const preset = findTextPreset(id);
    if (
      !preset ||
      (point && (!Number.isFinite(point.x) || !Number.isFinite(point.y)))
    )
      return;
    const catalogElementId = ({ title: "information.headline", subheading: "information.title", body: "information.body", eyebrow: "information.label", offer: "information.offer_value", price: "information.price", badge: "decoration.badge", cta: "actions.cta" })[preset.kind];
    get().addElement(preset.kind, point?.x, point?.y, { ...preset.patch, catalogElementId, ...(preset.kind === "price" || preset.kind === "offer" ? { content: "" } : {}) });
  },
  addShape: (type, point) => {
    get().addElement("shape", point?.x, point?.y, { ...shapePatch(type), catalogElementId: type === "line" ? "decoration.divider" : "decoration.shape" }, {
      preservePatchStyle: true,
    });
    if (get().panel !== "assets") set({ panel: "style", styleTab: "style" });
  },
  addAssetPreset: (id, point, templateId) => {
    const doc = get().doc;
    if (
      !doc ||
      (point && (!Number.isFinite(point.x) || !Number.isFinite(point.y)))
    )
      return;
    const patch = assetPresetPatch(id, templateId);
    if (!patch) return;
    patch.catalogElementId = ({ model: "subjects.person", product: "subjects.product", pedestal: "decoration.shape", backdrop: "subjects.background", label: "decoration.badge", "copy-space": undefined })[id];
    const scale = Math.min(
      1,
      doc.format.width / patch.width!,
      doc.format.height / patch.height!,
    );
    patch.width = patch.width! * scale;
    patch.height = patch.height! * scale;
    const x = point
      ? Math.max(0, Math.min(point.x, doc.format.width - patch.width))
      : undefined;
    const y = point
      ? Math.max(0, Math.min(point.y, doc.format.height - patch.height))
      : undefined;
    get().addElement("shape", x, y, patch, { preservePatchStyle: true });
    if (get().panel !== "assets") set({ panel: "style", styleTab: "style" });
  },
  setDescriptionTemplate: (id, templateId) => {
    const template = findDescriptionTemplate(templateId);
    const original = get().doc?.elements.find((el) => el.id === id);
    if (!template || original?.descriptionTemplate?.id === templateId) return;
    const candidate = prepareDescriptionChange(get().doc, id, (el) => {
      const values =
        el.descriptionDrafts?.templates?.[templateId]?.values ??
        Object.fromEntries(
          template.fields.map((field) => [field.id, field.defaultValue]),
        );
      el.descriptionTemplate = { id: templateId, values: { ...values } };
      el.semanticRole = template.role;
    });
    if (candidate)
      get().mutate((doc) => applyDescriptionChange(doc, id, candidate));
  },
  updateDescriptionField: (id, field, value) => {
    const original = get().doc?.elements.find((el) => el.id === id);
    const selection = original?.descriptionTemplate;
    if (
      !selection ||
      value.length > 200 ||
      !findDescriptionTemplate(selection.id)?.fields.some(
        (item) => item.id === field,
      )
    )
      return;
    const trimmed = value.trim();
    if (selection.values[field] === trimmed) return;
    const candidate = prepareDescriptionChange(get().doc, id, (el) => {
      el.descriptionTemplate!.values[field] = trimmed;
    });
    if (candidate)
      get().mutate((doc) => applyDescriptionChange(doc, id, candidate));
  },
  detachDescriptionTemplate: (id) => {
    if (!get().doc?.elements.find((el) => el.id === id)?.descriptionTemplate)
      return;
    const candidate = prepareDescriptionChange(get().doc, id, (el) => {
      el.detail = resolveElementDetail(el);
      delete el.descriptionTemplate;
    });
    if (candidate)
      get().mutate((doc) => applyDescriptionChange(doc, id, candidate));
  },
  restoreCustomDescription: (id) => {
    const original = get().doc?.elements.find((el) => el.id === id);
    const custom = original?.descriptionDrafts?.custom;
    if (custom === undefined) return;
    const candidate = prepareDescriptionChange(get().doc, id, (el) => {
      el.detail = custom;
      delete el.descriptionTemplate;
    });
    if (candidate)
      get().mutate((doc) => applyDescriptionChange(doc, id, candidate));
  },
  setShapeRole: (id, role) => {
    const el = get().doc?.elements.find((e) => e.id === id);
    if (
      !el ||
      el.kind !== "shape" ||
      el.locked ||
      el.semanticRole === role ||
      !shapeRoleSchema.safeParse(role).success
    )
      return;
    const candidate = prepareDescriptionChange(get().doc, id, (element) => {
      element.semanticRole = role;
    });
    if (candidate)
      get().mutate((doc) => applyDescriptionChange(doc, id, candidate));
  },
  updateShapeAppearance: (id, patch) => {
    const el = get().doc?.elements.find((e) => e.id === id);
    if (
      !el ||
      el.kind !== "shape" ||
      el.locked ||
      Object.entries(patch).every(
        ([key, value]) => el.style[key as keyof ElementStyle] === value,
      )
    )
      return;
    if (
      [patch.borderRadius, patch.opacity].some(
        (value) => value !== undefined && !Number.isFinite(value),
      )
    )
      return;
    const style = { ...el.style, ...patch };
    if (
      patch.shapeType === "rounded rectangle" &&
      el.style.shapeType !== patch.shapeType
    )
      style.borderRadius = 16;
    if (patch.shapeType === "rectangle") style.borderRadius = 0;
    if (["ellipse", "triangle", "diamond", "line"].includes(patch.shapeType ?? "")) style.borderRadius = 0;
    const box =
      patch.shapeType === "circle"
        ? {
            width: Math.min(el.width, el.height),
            height: Math.min(el.width, el.height),
          }
        : {};
    get().updateElement(id, { style, ...box });
  },
  updateGenerationSettings: (patch) => {
    const doc = get().doc;
    if (!doc) return;
    const includesLighting = [
      "lightType",
      "lightDirection",
      "lightIntensity",
      "shadows",
      "studioLights",
    ].some((key) => key in patch);
    const result = generationSettingsSchema.safeParse({
      ...doc.generationSettings,
      ...patch,
    });
    if (
      !result.success ||
      (JSON.stringify(result.data) ===
        JSON.stringify(doc.generationSettings ?? {}) &&
        !(includesLighting && !doc.promptOptions.lighting))
    )
      return;
    get().mutate((next) => {
      next.generationSettings = result.data;
      if ("cameraAngle" in patch) next.promptOptions.scene = true;
      if (includesLighting) next.promptOptions.lighting = true;
    });
  },
  addStudioLight: () => {
    const doc = get().doc;
    if (
      !doc ||
      (doc.generationSettings?.studioLights?.length ?? 0) >= MAX_STUDIO_LIGHTS
    )
      return;
    get().updateGenerationSettings({
      studioLights: [
        ...(doc.generationSettings?.studioLights ?? []),
        createStudioLight(),
      ],
    });
  },
  updateStudioLight: (id, patch) => {
    const lights = get().doc?.generationSettings?.studioLights;
    const current = lights?.find((light) => light.id === id);
    if (!current || !lights) return;
    const candidate = studioLightSchema.safeParse({
      ...current,
      ...patch,
      id: current.id,
    });
    if (
      !candidate.success ||
      JSON.stringify(candidate.data) === JSON.stringify(current)
    )
      return;
    get().mutate((doc) => {
      doc.generationSettings!.studioLights = lights.map((light) =>
        light.id === id ? candidate.data : light,
      );
    });
  },
  removeStudioLight: (id) => {
    const lights = get().doc?.generationSettings?.studioLights;
    if (!lights?.some((light) => light.id === id)) return;
    get().mutate((doc) => {
      doc.generationSettings!.studioLights = lights.filter(
        (light) => light.id !== id,
      );
    });
  },
  applyStudioPreset: (id) => {
    if (!get().doc || (id !== "portrait" && id !== "product")) return;
    get().updateGenerationSettings({ studioLights: createStudioPreset(id) });
  },
  resetStudioRig: () => {
    if (get().doc?.generationSettings?.studioLights === undefined) return;
    get().mutate((doc) => {
      delete doc.generationSettings!.studioLights;
    });
  },
  addElement: (kind, x, y, patch, options) => {
    const d = get().doc;
    if (!d) return;
    let id = "";
    get().mutate((doc) => {
      const activeKit = get().brandKits.find(
        (kit) => kit.id === doc.creativeDirection.brandKitId,
      );
      const el = insertElement(doc, activeKit, kind, x, y, patch, options);
      id = el.id;
    });
    set({ selectedIds: [id], selectedGroupIds: [], backgroundSelected: false });
  },

  slotElement: (role, kind, patch, options) => {
    const d = get().doc;
    if (!d) return undefined;
    let id = "";
    get().mutate((doc) => {
      // 1. Layout: keep the doc's own layout if it has one; otherwise, on a
      // blank canvas (nothing but background/decor elements), start the
      // format's default Compose layout so the first slot has geometry to
      // land in.
      let layout: ComposeLayout | undefined = isComposeLayout(doc.layout)
        ? doc.layout
        : undefined;
      if (!layout) {
        const isBlank = !doc.elements.some((e) => {
          const r = elementRole(e, findAssetItem, doc.format);
          return r !== "decor" && r !== "background";
        });
        if (isBlank) {
          layout = defaultLayoutFor(doc.format);
          doc.layout = layout;
        }
      }

      // 2. Target: the element this slot replaces, if any.
      const policy = ROLE_REPLACE[role];
      let target: SpecElement | undefined;
      if (policy !== "none") {
        target = doc.elements
          .filter(
            (e) =>
              e.visible &&
              !e.locked &&
              elementRole(e, findAssetItem, doc.format) === role &&
              (policy !== "kind" || e.kind === kind),
          )
          .reduce<SpecElement | undefined>((largest, e) => {
            if (!largest) return e;
            return e.width * e.height > largest.width * largest.height
              ? e
              : largest;
          }, undefined);
      }

      // 3. Build: insert like addElement, then tag the slot.
      const activeKit = get().brandKits.find(
        (kit) => kit.id === doc.creativeDirection.brandKitId,
      );
      const el = insertElement(doc, activeKit, kind, undefined, undefined, patch, {
        ...(options?.atBack !== undefined ? { atBack: options.atBack } : {}),
        preservePatchStyle: true,
      });
      el.slot = role;
      id = el.id;

      // 4. Keep typed copy: slotting over existing text keeps what the user
      // already typed, regardless of the new asset's own copy.
      if (
        target &&
        isTextKind(target.kind) &&
        isTextKind(el.kind) &&
        target.content !== undefined
      )
        el.content = target.content;

      // 5. Box.
      if (target) {
        el.x = target.x;
        el.y = target.y;
        el.width = target.width;
        el.rotation = target.rotation;
        if (!isTextKind(el.kind)) el.height = target.height;
        const elIndex = doc.elements.indexOf(el);
        doc.elements.splice(elIndex, 1);
        const targetIndex = doc.elements.indexOf(target);
        doc.elements.splice(targetIndex, 1, el);
        doc.elements.forEach((e, i) => (e.zIndex = i + 1));
      } else {
        const zone = roleZone(role, layout, doc.format);
        if (zone?.type === "box") {
          const scale = Math.min(
            zone.width / el.width,
            zone.height / el.height,
          );
          el.width = Math.round(el.width * scale);
          el.height = Math.round(el.height * scale);
          el.x = Math.round(zone.x + (zone.width - el.width) / 2);
          el.y = Math.round(zone.y + (zone.height - el.height) / 2);
        } else if (zone?.type === "stack") {
          const isFill = SLOT_STACK_FILL_KINDS.includes(el.kind);
          const itemWidth = isFill
            ? zone.width
            : Math.min(el.width, zone.width);
          el.width = Math.round(itemWidth);
          el.x =
            zone.align === "center" && itemWidth < zone.width
              ? Math.round(zone.x + (zone.width - itemWidth) / 2)
              : Math.round(zone.x);
          let maxBottom: number | undefined;
          for (const e of doc.elements) {
            if (e === el) continue;
            if (!STACK_ROLES.includes(elementRole(e, findAssetItem, doc.format)))
              continue;
            if (e.x >= zone.x + zone.width || e.x + e.width <= zone.x)
              continue;
            const bottom = e.y + e.height;
            if (maxBottom === undefined || bottom > maxBottom)
              maxBottom = bottom;
          }
          el.y = Math.round(
            maxBottom !== undefined ? maxBottom + zone.gap : zone.y,
          );
        } else if (zone?.type === "point") {
          el.x = zone.x;
          el.y = zone.y;
        } else if (zone?.type === "corner") {
          el.x =
            zone.corner === "tl" || zone.corner === "bl"
              ? zone.margin
              : doc.format.width - zone.margin - el.width;
          el.y =
            zone.corner === "tl" || zone.corner === "tr"
              ? zone.margin
              : doc.format.height - zone.margin - el.height;
        }
        // zone undefined: keep insertElement's default position.
      }

      // 6. Clamp inside canvas.
      el.x = Math.max(0, Math.min(el.x, doc.format.width - el.width));
      el.y = Math.max(0, Math.min(el.y, doc.format.height - el.height));
    });
    set({ selectedIds: [id], selectedGroupIds: [], backgroundSelected: false });
    return id;
  },

  swapAsset: (id, kind, patch) => {
    const original = get().doc?.elements.find((e) => e.id === id);
    if (!original || original.locked) return;
    get().mutate((doc) => {
      const el = doc.elements.find((e) => e.id === id);
      if (!el) return;
      const bothText = isTextKind(el.kind) && isTextKind(kind);
      const {
        x: _x,
        y: _y,
        width: _width,
        height: _height,
        rotation: _rotation,
        zIndex: _zIndex,
        groupId: _groupId,
        slot: _slot,
        detail: _detail,
        content: _content,
        style,
        constraint,
        ...rest
      } = patch;
      delete el.src;
      delete el.aiDescription;
      delete el.placeholderArt;
      if (!bothText) delete el.content;
      el.constraint = withoutPositiveConstraint(el.constraint);
      el.kind = kind;
      Object.assign(el, rest);
      if (style) el.style = { ...el.style, ...style };
      if (constraint?.positiveConstraint !== undefined)
        el.constraint = {
          ...el.constraint,
          positiveConstraint: constraint.positiveConstraint,
        };
    });
  },

  commitCanvasTransform: (original, boxes) => {
    const doc = get().doc;
    const entries = Object.entries(boxes);
    if (doc !== original || !entries.length) return;
    if (
      entries.some(([id, box]) => {
        const el = doc.elements.find((e) => e.id === id);
        return !el || el.locked || !el.visible || !validBox(box);
      })
    )
      return;
    if (
      entries.every(([id, box]) =>
        sameBox(
          doc.elements.find((e) => e.id === id)!,
          box,
        ),
      )
    )
      return;
    get().mutate((next) => {
      next.elements.forEach((el) => {
        if (boxes[el.id])
          Object.assign(
            el,
            isCircleShape(el) && el.semanticRole
              ? centeredCircle(boxes[el.id]!)
              : boxes[el.id],
          );
      });
    });
  },
  updateElement: (id, patch) => {
    const original = get().doc?.elements.find((el) => el.id === id);
    if (!original) return;
    if (
      original.locked &&
      (patch.semanticRole !== undefined || patch.style !== undefined)
    )
      return;
    if (
      isCircleShape(original) &&
      original.semanticRole &&
      (patch.width !== undefined || patch.height !== undefined)
    ) {
      const diameter = patch.width ?? patch.height!;
      patch = { ...patch, width: diameter, height: diameter };
    }
    const geometry = ["x", "y", "width", "height", "rotation"] as const;
    if (geometry.some((key) => patch[key] !== undefined)) {
      if (
        original.locked ||
        geometry.some(
          (key) => patch[key] !== undefined && !Number.isFinite(patch[key]),
        )
      )
        return;
      if (
        (patch.width !== undefined && patch.width < 1) ||
        (patch.height !== undefined && patch.height < 1)
      )
        return;
    }
    if (
      Object.entries(patch).every(
        ([key, value]) => original[key as keyof SpecElement] === value,
      )
    )
      return;
    get().mutate((doc) => {
      const e = doc.elements.find((v) => v.id === id);
      if (e) Object.assign(e, patch);
    });
  },

  setElementText: (id, content, history) => {
    const original = get().doc?.elements.find((el) => el.id === id);
    if (!original || original.locked) return;
    get().mutate((doc) => applyElementText(doc, id, content), history ?? true);
  },

  setElementDetail: (id, value, history) => {
    const original = get().doc?.elements.find((el) => el.id === id);
    if (
      !original ||
      original.locked ||
      value.length > 20_000 ||
      (original.detail === value && !original.descriptionTemplate)
    )
      return;
    if (original.kind === "shape") {
      const candidate = prepareDescriptionChange(get().doc, id, (el) => {
        el.detail = value;
        delete el.descriptionTemplate;
      });
      if (candidate)
        get().mutate(
          (doc) => applyDescriptionChange(doc, id, candidate),
          history ?? true,
        );
      return;
    }
    get().mutate((doc) => {
      const el = doc.elements.find((e) => e.id === id);
      if (el) el.detail = value;
    }, history ?? true);
  },
  updateElementConstraint: (id, patch) =>
    get().mutate((doc) => {
      const e = doc.elements.find((v) => v.id === id);
      if (e) e.constraint = { ...e.constraint, ...patch };
    }),

  updateExternalTool: (patch) =>
    get().mutate((doc) => {
      doc.externalToolRequirement = {
        ...(doc.externalToolRequirement ?? defaultExternalToolRequirement()),
        ...patch,
      };
      if (doc.visualEdit != null && doc.visualEditRevision === doc.revision)
        doc.visualEditRevision = doc.revision + 1;
    }),

  deleteElements: (ids) => {
    const doc = get().doc;
    if (!doc) return;
    const nodes = canonicalLayers(doc, ids);
    if (!nodes.length) return;
    const leaves = new Set(
      nodes.flatMap((node) => node.leaves.map((el) => el.id)),
    );
    const deletedGroups = new Set(
      flattenLayers(doc)
        .filter(
          (node) =>
            !node.element &&
            nodes.some(
              (parent) =>
                parent.id === node.id ||
                node.leaves.every((el) => leaves.has(el.id)),
            ),
        )
        .map((node) => node.id),
    );
    get().mutate((next) => {
      next.elements = next.elements.filter((el) => !leaves.has(el.id));
      next.elements.forEach((element) => remapReferences(element, new Map(), leaves));
      next.groups = layerGroups(next).filter(
        (group) => !deletedGroups.has(group.id),
      );
      pruneLayerGroups(next);
    });
    const current = get();
    get().selectLayers(
      selectedLayerIds(
        get().doc!,
        current.selectedIds,
        current.selectedGroupIds,
      ).filter((id) => !leaves.has(id) && !deletedGroups.has(id)),
    );
  },

  deleteSelected: () => {
    const state = get();
    if (state.doc)
      state.deleteElements(
        selectedLayerIds(state.doc, state.selectedIds, state.selectedGroupIds),
      );
  },

  duplicate: () => {
    const state = get(),
      doc = state.doc;
    if (!doc) return;
    const nodes = canonicalLayers(
      doc,
      selectedLayerIds(doc, state.selectedIds, state.selectedGroupIds),
    );
    if (!nodes.length) return;
    const leaves = new Set(
      nodes.flatMap((node) => node.leaves.map((el) => el.id)),
    );
    const rows = flattenLayers(doc);
    const selectedGroups = new Set(
      nodes.filter((node) => !node.element).map((node) => node.id),
    );
    const groups = layerGroups(doc).filter((group) => {
      let id: string | undefined = group.id;
      while (id) {
        if (selectedGroups.has(id)) return true;
        id = rows.find((row) => row.id === id)?.parentId;
      }
      return false;
    });
    const ids = new Map(
      [...groups.map((g) => g.id), ...leaves].map((id) => [
        id,
        `layer_${crypto.randomUUID().slice(0, 8)}`,
      ]),
    );
    const selection = nodes.map((node) => ids.get(node.id)!);
    get().mutate((next) => {
      next.groups = [
        ...layerGroups(next),
        ...groups.map((group) => ({
          ...group,
          id: ids.get(group.id)!,
          name: `${group.name.slice(0, 195)} copy`,
          parentId: ids.get(group.parentId ?? "") ?? group.parentId,
        })),
      ];
      const base = Math.max(0, ...next.elements.map((el) => el.zIndex));
      const copies = [...doc.elements]
        .filter((el) => leaves.has(el.id))
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((el, index) => ({
          ...structuredClone(el),
          id: ids.get(el.id)!,
          name: `${el.name} copy`,
          x: el.x + 24,
          y: el.y + 24,
          groupId: ids.get(el.groupId ?? "") ?? el.groupId,
          zIndex: base + index + 1,
        }));
      copies.forEach((element) => remapReferences(element, ids));
      next.elements.push(...copies);
      const originals = [...doc.elements]
        .sort((a, b) => b.zIndex - a.zIndex)
        .map((el) => el.id);
      const rootLeaves = new Set(
        nodes
          .filter((node) => !node.parentId)
          .flatMap((node) => node.leaves.map((el) => el.id)),
      );
      let ordered = [
        ...originals
          .filter((id) => rootLeaves.has(id))
          .map((id) => ids.get(id)!),
        ...originals,
      ];
      for (const node of nodes.filter((node) => node.parentId)) {
        const members = new Set(node.leaves.map((el) => el.id));
        const index = ordered.findIndex((id) => members.has(id));
        ordered.splice(
          index,
          0,
          ...originals
            .filter((id) => members.has(id))
            .map((id) => ids.get(id)!),
        );
      }
      const nextRows = flattenLayers(next);
      for (const parentId of new Set(
        nodes.flatMap((node) => (node.parentId ? [node.parentId] : [])),
      )) {
        const members = new Set(
          nextRows
            .find((node) => node.id === parentId)!
            .leaves.map((el) => el.id),
        );
        const first = ordered.findIndex((id) => members.has(id));
        const groupOrder = ordered.filter((id) => members.has(id));
        ordered = ordered.filter((id) => !members.has(id));
        ordered.splice(first, 0, ...groupOrder);
      }
      ordered.forEach((id, index) => {
        next.elements.find((el) => el.id === id)!.zIndex =
          ordered.length - index;
      });
    });
    get().selectLayers(selection);
  },

  undo: () => {
    const { doc, past } = get();
    if (!doc || !past.length) return;
    const prev = past[past.length - 1]!;
    set((s) => ({
      doc: clone(prev),
      past: s.past.slice(0, -1),
      future: [clone(doc), ...s.future].slice(0, historyLimit(doc)),
      selectedIds: [],
      selectedGroupIds: [],
      saveStatus: "saving",
    }));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void get().saveNow(), 500);
  },

  redo: () => {
    const { doc, future } = get();
    if (!doc || !future.length) return;
    const next = future[0]!;
    set((s) => ({
      doc: clone(next),
      past: [...s.past, clone(doc)].slice(-historyLimit(doc)),
      future: s.future.slice(1),
      selectedIds: [],
      selectedGroupIds: [],
      saveStatus: "saving",
    }));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void get().saveNow(), 500);
  },

  align: (a) => {
    const doc = get().doc;
    const ids = get().selectedIds;
    if (!doc || !ids.length) return;
    const moves = alignOffsets(
      layerAlignmentItems(doc, ids, get().selectedGroupIds),
      a,
      { x: 0, y: 0, width: doc.format.width, height: doc.format.height },
    );
    if (!Object.keys(moves).length) return;
    get().mutate((d) => {
      d.elements.forEach((e) => {
        const m = moves[e.id];
        if (m) {
          e.x = m.x;
          e.y = m.y;
        }
      });
    });
  },

  distribute: (axis) => {
    const doc = get().doc;
    const ids = get().selectedIds;
    if (!doc || !ids.length) return;
    const moves = distributeOffsets(
      layerAlignmentItems(doc, ids, get().selectedGroupIds),
      axis,
    );
    if (!Object.keys(moves).length) return;
    get().mutate((d) => {
      d.elements.forEach((e) => {
        const m = moves[e.id];
        if (m) {
          e.x = m.x;
          e.y = m.y;
        }
      });
    });
  },

  bringToFront: () => moveSelectedStack(get(), "front"),
  sendToBack: () => moveSelectedStack(get(), "back"),
  bringForward: () => moveSelectedStack(get(), "up"),
  sendBackward: () => moveSelectedStack(get(), "down"),

  group: () => {
    const state = get(),
      doc = state.doc;
    if (!doc) return;
    const ids = selectedLayerIds(
      doc,
      state.selectedIds,
      state.selectedGroupIds,
    );
    if (!canGroupLayers(doc, ids)) return;
    const nodes = canonicalLayers(doc, ids);
    const id = `group_${crypto.randomUUID().slice(0, 8)}`;
    get().mutate((next) => {
      next.groups = [
        ...layerGroups(next),
        {
          id,
          name: `Group ${layerGroups(next).length + 1}`,
          parentId: nodes[0]!.parentId,
        },
      ];
      for (const node of nodes) {
        const group = next.groups.find((value) => value.id === node.id);
        if (group) group.parentId = id;
        else next.elements.find((el) => el.id === node.id)!.groupId = id;
      }
      // Make only the new group contiguous at its highest selected sibling.
      const leaves = new Set(
        nodes.flatMap((node) => node.leaves.map((el) => el.id)),
      );
      const ordered = [...next.elements].sort((a, b) => b.zIndex - a.zIndex);
      const first = ordered.findIndex((el) => leaves.has(el.id));
      const members = ordered.filter((el) => leaves.has(el.id));
      const rest = ordered.filter((el) => !leaves.has(el.id));
      rest.splice(first, 0, ...members);
      rest.forEach((el, i) => {
        el.zIndex = rest.length - i;
      });
    });
    get().selectLayers([id]);
  },

  ungroup: () => {
    const state = get(),
      doc = state.doc;
    if (!doc) return;
    const nodes = canonicalLayers(doc, state.selectedGroupIds).filter(
      (node) => !node.element && !node.leaves.some((el) => el.locked),
    );
    if (!nodes.length) return;
    const children = nodes.flatMap((node) =>
      node.children.map((child) => child.id),
    );
    get().mutate((next) => {
      next.groups = layerGroups(next);
      for (const node of nodes) {
        for (const el of next.elements)
          if (el.groupId === node.id) el.groupId = node.parentId;
        for (const group of next.groups)
          if (group.parentId === node.id) group.parentId = node.parentId;
      }
      next.groups = next.groups.filter(
        (group) => !nodes.some((node) => node.id === group.id),
      );
    });
    get().selectLayers(children);
  },

  tidy: () => get().mutate((d) => applyTidy(d, get().selectedIds)),

  compose: (layout) => {
    const doc = get().doc;
    if (doc && !get().composeOrigin)
      set({
        composeOrigin: Object.fromEntries(
          doc.elements.map((e) => [
            e.id,
            { x: e.x, y: e.y, width: e.width, height: e.height },
          ]),
        ),
      });
    get().mutate((d) => {
      applyComposeLayout(d, layout, get().selectedIds);
      d.layout = layout;
    });
  },

  resetCompose: () => {
    const origin = get().composeOrigin;
    if (!origin) return;
    get().mutate((d) => {
      d.elements.forEach((e) => {
        const box = origin[e.id];
        if (box) Object.assign(e, box);
      });
      delete d.layout;
    });
    set({ composeOrigin: undefined });
  },

  transformGroup: (ids, orig, next) => {
    const doc = get().doc;
    if (
      !doc ||
      !validBox(orig) ||
      !validBox(next) ||
      sameBox(orig, next) ||
      ids.some((id) => {
        const el = doc.elements.find((e) => e.id === id);
        return (
          !el ||
          el.locked ||
          !el.visible ||
          (el.width * next.width) / orig.width < 1 ||
          (el.height * next.height) / orig.height < 1
        );
      })
    )
      return;
    get().mutate((d) => {
      if (orig.width <= 0 || orig.height <= 0) return;
      const scaleX = next.width / orig.width;
      const scaleY = next.height / orig.height;
      d.elements.forEach((e) => {
        if (!ids.includes(e.id)) return;
        const relX = e.x - orig.x;
        const relY = e.y - orig.y;
        e.x = Math.round(next.x + relX * scaleX);
        e.y = Math.round(next.y + relY * scaleY);
        e.width = Math.round(e.width * scaleX);
        e.height = Math.round(e.height * scaleY);
        if (isCircleShape(e) && e.semanticRole)
          Object.assign(e, centeredCircle(e));
      });
    });
  },

  reorder: (ids) =>
    get().mutate((d) => {
      const map = new Map(d.elements.map((e) => [e.id, e]));
      d.elements = ids.map((id, i) => {
        const el = map.get(id)!;
        return { ...el, zIndex: i + 1 };
      });
    }),

  saveNow: async () => {
    clearTimeout(saveTimer);
    saveTimer = undefined;
    const d = get().doc;
    if (!d) return;
    // Queued saves share this document session's token after navigation closes it.
    const version = activeVersion;
    // Only the write for the revision still on screen may settle the status.
    const isCurrent = () =>
      get().doc?.id === d.id && get().doc?.revision === d.revision;
    try {
      await enqueueWrite(async () => {
        if (!version || version.id !== d.id)
          throw new Error("Editor version is unavailable");
        if (version.conflictCopy) {
          const copy = {
            ...d,
            id: version.conflictCopy.id,
            name: `${d.name} (conflict copy)`,
          };
          version.conflictCopy.token = await saveProjectConditional(
            copy,
            version.conflictCopy.token,
          );
          return;
        }
        try {
          const nextToken = await saveProjectConditional(d, version.token);
          version.token = nextToken;
          if (get().doc?.id === d.id && activeVersion === version)
            set({ externallyModified: false });
        } catch (error) {
          if (!(error instanceof ProjectConflictError)) throw error;
          const copy = {
            ...d,
            id: crypto.randomUUID(),
            name: `${d.name} (conflict copy)`,
            createdAt: new Date().toISOString(),
          };
          await saveProject(copy);
          version.conflictCopy = {
            id: copy.id,
            token: (await (
              await import("./persistence")
            ).loadProjectVersion(copy.id))!.token,
          };
          toast.warning("Another tab changed this design", {
            description:
              "Your changes were saved as a separate conflict copy in My designs.",
            duration: 12000,
            action: {
              label: "Open copy",
              onClick: () => window.location.assign(`/design/${copy.id}`),
            },
          });
        }
      });
      if (isCurrent()) set({ saveStatus: "saved" });
    } catch (error) {
      if (isCurrent()) set({ saveStatus: "error" });
      if (!(error instanceof ProjectConflictError))
        reportStorageError(error, "save-project");
    }
  },

  createBrandKit: (name, draft) => {
    const now = new Date().toISOString();
    const kit: BrandKit = {
      id: `brandkit_${crypto.randomUUID().slice(0, 8)}`,
      name,
      colors: [
        {
          id: crypto.randomUUID().slice(0, 8),
          hex: "#C55454",
          angle: 135,
          type: "solid",
          role: "primary",
          usecase: "Headlines, Buttons",
        },
        {
          id: crypto.randomUUID().slice(0, 8),
          hex: "#D9A15B",
          angle: 135,
          type: "solid",
          role: "secondary",
          usecase: "Subheadings, Highlights",
        },
        {
          id: crypto.randomUUID().slice(0, 8),
          hex: "#EFE9DE",
          angle: 135,
          type: "solid",
          role: "background",
          usecase: "Canvas",
        },
        {
          id: crypto.randomUUID().slice(0, 8),
          hex: "#141413",
          angle: 135,
          type: "solid",
          role: "text",
          usecase: "Headings, Body text",
        },
      ],
      emotions: [],
      style: "Minimal",
      typography: "Manrope",
      createdAt: now,
      updatedAt: now,
      ...draft,
    };
    const brandKits = [kit, ...get().brandKits];
    set({ brandKits });
    persistKits(saveBrandKits(brandKits), "save-brand-kits");
    return kit.id;
  },

  updateBrandKit: (id, patch) => {
    const currentKit = get().brandKits.find((kit) => kit.id === id);
    if (!currentKit) return;
    const updatedKit = {
      ...currentKit,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const brandKits = get().brandKits.map((kit) =>
      kit.id === id ? updatedKit : kit,
    );
    set({ brandKits });
    persistKits(saveBrandKits(brandKits), "save-brand-kits");

    const changesDesign = [
      "colors",
      "emotions",
      "style",
      "typography",
      "profile",
    ].some((key) => key in patch);
    if (!changesDesign) return;

    // Only the poster open in the editor follows kit edits; saved posters keep
    // the colors they were saved with.
    if (get().doc?.creativeDirection.brandKitId === id) {
      get().mutate((doc) => applyBrandKitToDocument(doc, updatedKit));
    }
  },

  deleteBrandKit: (id) => {
    const brandKits = get().brandKits.filter((kit) => kit.id !== id);
    const isDefault = get().defaultBrandKitId === id;
    persistKits(saveBrandKits(brandKits), "save-brand-kits");
    if (isDefault) saveDefaultBrandKitId(undefined);
    rewriteStoredProjects(get().doc?.id, (project) => {
      if (project.creativeDirection.brandKitId !== id) return undefined;
      const next = clone(project);
      delete next.creativeDirection.brandKitId;
      return next;
    });
    set({
      brandKits,
      ...(isDefault ? { defaultBrandKitId: undefined } : null),
    });
    if (get().doc?.creativeDirection.brandKitId === id) {
      get().mutate((doc) => {
        delete doc.creativeDirection.brandKitId;
      });
    }
  },

  activateBrandKit: (id) => {
    const kit = get().brandKits.find((k) => k.id === id);
    if (!kit) return;
    get().mutate((doc) => applyBrandKitToDocument(doc, kit));
  },

  deactivateBrandKit: () => {
    get().mutate((doc) => {
      delete doc.creativeDirection.brandKitId;
      delete doc.creativeDirection.brandProfile;
    });
  },

  // The default kit is what new posters start with; existing posters keep
  // their own kit (switch it per poster with activateBrandKit).
  setDefaultBrandKit: (id) => {
    if (!get().brandKits.some((candidate) => candidate.id === id)) return;
    saveDefaultBrandKitId(id);
    set({ defaultBrandKitId: id });
  },

  clearDefaultBrandKit: () => {
    saveDefaultBrandKitId(undefined);
    set({ defaultBrandKitId: undefined });
  },

  createMaterialKit: (name, seedHex, draft) => {
    const styleKit = createStyleKit(name, seedHex);
    const brandKit = brandKitFromMaterialKit(styleKit, draft);
    const materialKits = [styleKit, ...get().materialKits];
    const brandKits = [brandKit, ...get().brandKits];
    set({ materialKits, brandKits });
    persistKits(saveMaterialStyleKits(materialKits), "save-material-kits");
    persistKits(saveBrandKits(brandKits), "save-brand-kits");
    return brandKit.id;
  },

  deleteMaterialKit: (id) => {
    const brandKit = get().brandKits.find((k) => k.id === id);
    const materialKits = get().materialKits.filter(
      (k) => k.id !== brandKit?.styleKitId,
    );
    set({ materialKits });
    persistKits(saveMaterialStyleKits(materialKits), "save-material-kits");
    get().deleteBrandKit(id);
  },
}));
