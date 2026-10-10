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
  doc?: SpecDocument | undefined;
  selectedIds: string[];
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
  selectBackground: () => void;
  setPanel: (p: PanelMode) => void;
  setStyleTab: (tab: "style" | "layout") => void;
  setTool: (t: ToolMode) => void;
  setView: (zoom: number, pan?: { x: number; y: number }) => void;
  setGuides: (guides: Guide[]) => void;
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

const clone = (d: SpecDocument): SpecDocument => structuredClone(d);
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
      Object.assign(doc, next);
    });
  },

  closeDocument: () => {
    if (saveTimer) void get().saveNow();
    activeVersion = undefined;
    set({
      doc: undefined,
      past: [],
      future: [],
      selectedIds: [],
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
    withRevision(next);
    set((s) => ({
      doc: next,
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

  select: (id, add = false) => {
    if (!id) {
      set({ selectedIds: [], backgroundSelected: false });
      return;
    }
    const doc = get().doc;
    const el = doc?.elements.find((e) => e.id === id);
    if (add) {
      set((s) => ({
        selectedIds: s.selectedIds.includes(id)
          ? s.selectedIds.filter((v) => v !== id)
          : [...s.selectedIds, id],
        backgroundSelected: false,
      }));
      return;
    }
    const groupId = el?.groupId;
    const ids = groupId
      ? (doc?.elements
          .filter((e) => e.groupId === groupId)
          .map((e) => e.id) ?? [id])
      : [id];
    set({
      selectedIds: ids,
      backgroundSelected: false,
    });
  },

  selectBackground: () =>
    set({
      selectedIds: [],
      backgroundSelected: true,
    }),

  selectMany: (ids, add = false) =>
    set((s) => ({
      selectedIds: add ? Array.from(new Set([...s.selectedIds, ...ids])) : ids,
      backgroundSelected: false,
    })),

  setPanel: (panel) => set({ panel }),
  setStyleTab: (styleTab) => set({ styleTab }),
  setTool: (tool) => set({ tool }),
  setView: (zoom, pan) =>
    set((s) => ({ zoom: Math.min(3, Math.max(0.1, zoom)), pan: pan ?? s.pan })),
  setGuides: (guides) => set({ guides }),

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
    set({ selectedIds: [id], backgroundSelected: false });
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
    set({ selectedIds: [id], backgroundSelected: false });
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
        if (boxes[el.id]) Object.assign(el, boxes[el.id]);
      });
    });
  },
  updateElement: (id, patch) => {
    const original = get().doc?.elements.find((el) => el.id === id);
    if (!original) return;
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
    if (!original || original.locked) return;
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
    if (!ids.length) return;
    get().mutate((d) => {
      d.elements = d.elements.filter((e) => !ids.includes(e.id));
    });
    set((s) => ({
      selectedIds: s.selectedIds.filter((id) => !ids.includes(id)),
    }));
  },

  deleteSelected: () => get().deleteElements(get().selectedIds),

  duplicate: () => {
    const ids = get().selectedIds;
    const nextIds: string[] = [];
    get().mutate((d) => {
      const base = d.elements.length;
      const copies = d.elements
        .filter((e) => ids.includes(e.id))
        .map((e, i) => {
          const copy: SpecElement = {
            ...structuredClone(e),
            id: `${e.kind}_${crypto.randomUUID().slice(0, 8)}`,
            name: `${e.name} copy`,
            x: e.x + 24,
            y: e.y + 24,
            zIndex: base + i + 1,
          };
          nextIds.push(copy.id);
          return copy;
        });
      d.elements.push(...copies);
    });
    set({ selectedIds: nextIds });
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
      doc.elements.filter((e) => ids.includes(e.id)),
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
      doc.elements.filter((e) => ids.includes(e.id)),
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

  bringToFront: () => {
    const ids = get().selectedIds;
    if (!ids.length) return;
    get().mutate((d) => {
      const rest = d.elements.filter((e) => !ids.includes(e.id));
      const moved = d.elements.filter((e) => ids.includes(e.id));
      d.elements = [...rest, ...moved];
      d.elements.forEach((e, i) => (e.zIndex = i + 1));
    });
  },

  sendToBack: () => {
    const ids = get().selectedIds;
    if (!ids.length) return;
    get().mutate((d) => {
      const moved = d.elements.filter((e) => ids.includes(e.id));
      const rest = d.elements.filter((e) => !ids.includes(e.id));
      d.elements = [...moved, ...rest];
      d.elements.forEach((e, i) => (e.zIndex = i + 1));
    });
  },

  bringForward: () => {
    const ids = get().selectedIds;
    if (!ids.length) return;
    get().mutate((d) => {
      const ordered = [...d.elements].sort((a, b) => a.zIndex - b.zIndex);
      for (let i = ordered.length - 2; i >= 0; i--) {
        const cur = ordered[i]!;
        const nextEl = ordered[i + 1]!;
        if (ids.includes(cur.id) && !ids.includes(nextEl.id)) {
          ordered[i] = nextEl;
          ordered[i + 1] = cur;
        }
      }
      ordered.forEach((e, i) => (e.zIndex = i + 1));
      d.elements = ordered;
    });
  },

  sendBackward: () => {
    const ids = get().selectedIds;
    if (!ids.length) return;
    get().mutate((d) => {
      const ordered = [...d.elements].sort((a, b) => a.zIndex - b.zIndex);
      for (let i = 1; i < ordered.length; i++) {
        const cur = ordered[i]!;
        const prevEl = ordered[i - 1]!;
        if (ids.includes(cur.id) && !ids.includes(prevEl.id)) {
          ordered[i] = prevEl;
          ordered[i - 1] = cur;
        }
      }
      ordered.forEach((e, i) => (e.zIndex = i + 1));
      d.elements = ordered;
    });
  },

  group: () => {
    const ids = get().selectedIds;
    if (ids.length < 2) return;
    const groupId = `group_${crypto.randomUUID().slice(0, 6)}`;
    get().mutate((d) =>
      d.elements.forEach((e) => {
        if (ids.includes(e.id)) e.groupId = groupId;
      }),
    );
  },

  ungroup: () => {
    const ids = get().selectedIds;
    get().mutate((d) =>
      d.elements.forEach((e) => {
        if (ids.includes(e.id)) delete e.groupId;
      }),
    );
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
