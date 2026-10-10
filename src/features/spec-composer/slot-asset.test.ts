import "fake-indexeddb/auto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createDocument } from "./templates";
import { useEditorStore } from "./store";
import {
  findAssetItem,
  kindFamily,
  roleOf,
  swapAlternatives,
} from "./asset-catalog";
import { addCatalogAsset, swapCatalogAsset } from "./assets-panel/add-asset";
import { layoutZones } from "./compose-layouts";
import { createElement } from "./registry";
import { compileVisualPrompt } from "./compiler";
import type { BrandKit } from "./types";

beforeAll(() => {
  vi.stubGlobal("window", globalThis);
  const memory = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
  });
});

/** Shared doc getter: every test opens its own document, so the current one
 * is always what the previous action left behind. */
const doc = () => useEditorStore.getState().doc!;

describe("slotElement / auto-slot on click", () => {
  it("two subject clicks leave one subject, one undo step each, and undo restores the first", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));
    const pastBefore = useEditorStore.getState().past.length;

    addCatalogAsset(findAssetItem("people-woman")!);
    expect(doc().elements.filter((e) => e.slot === "subject")).toHaveLength(1);
    expect(useEditorStore.getState().past.length).toBe(pastBefore + 1);
    expect(doc().elements.find((e) => e.assetId === "people-woman")).toBeDefined();

    addCatalogAsset(findAssetItem("people-man")!);
    expect(doc().elements.filter((e) => e.slot === "subject")).toHaveLength(1);
    expect(useEditorStore.getState().past.length).toBe(pastBefore + 2);
    expect(doc().elements.find((e) => e.assetId === "people-man")).toBeDefined();

    useEditorStore.getState().undo();
    expect(doc().elements.filter((e) => e.slot === "subject")).toHaveLength(1);
    expect(doc().elements.find((e) => e.assetId === "people-woman")).toBeDefined();
    useEditorStore.getState().closeDocument();
  });

  it("slotting the upload patch into a doc with a subject replaces it in one history step and keeps src", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));
    addCatalogAsset(findAssetItem("people-woman")!);
    const pastBefore = useEditorStore.getState().past.length;

    const id = useEditorStore.getState().slotElement("subject", "heroImage", {
      src: "data:image/png;base64,AAAA",
      name: "Your photo",
      slot: "subject",
      aiDescription: "the subject shown in the attached reference image",
    });

    expect(doc().elements.filter((e) => e.slot === "subject")).toHaveLength(1);
    expect(useEditorStore.getState().past.length).toBe(pastBefore + 1);
    const el = doc().elements.find((e) => e.id === id)!;
    expect(el.src).toBe("data:image/png;base64,AAAA");
    useEditorStore.getState().closeDocument();
  });

  it("a title then a body both remain (headline replaces by kind, not role)", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));

    addCatalogAsset(findAssetItem("text-heading-bold")!);
    addCatalogAsset(findAssetItem("text-body")!);

    const headline = doc().elements.filter((e) => e.slot === "headline");
    expect(headline).toHaveLength(2);
    expect(headline.map((e) => e.kind).sort()).toEqual(["body", "title"]);
    useEditorStore.getState().closeDocument();
  });

  it("slotting a different title keeps content the user already typed", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));

    addCatalogAsset(findAssetItem("text-heading-bold")!);
    const title = doc().elements.find((e) => e.kind === "title")!;
    useEditorStore.getState().updateElement(title.id, { content: "Summer Sale" });

    addCatalogAsset(findAssetItem("text-editorial-serif")!);
    const titles = doc().elements.filter((e) => e.kind === "title");
    expect(titles).toHaveLength(1);
    expect(titles[0]!.content).toBe("Summer Sale");
    useEditorStore.getState().closeDocument();
  });

  it("two badges leave two badges (badges are always free-float)", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));

    addCatalogAsset(findAssetItem("promo-free-shipping")!);
    addCatalogAsset(findAssetItem("promo-limited-edition")!);

    expect(doc().elements.filter((e) => e.kind === "badge")).toHaveLength(2);
    useEditorStore.getState().closeDocument();
  });

  it("decor adds and replaces nothing", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));

    addCatalogAsset(findAssetItem("ai-sparkle")!);
    addCatalogAsset(findAssetItem("ai-sparkle")!);

    expect(doc().elements.filter((e) => e.slot === "decor")).toHaveLength(2);
    useEditorStore.getState().closeDocument();
  });

  it("a blank 1080x1920 doc gets the split-top default layout, with the subject inside its visual zone", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-story"));
    expect(doc().elements).toHaveLength(0);

    addCatalogAsset(findAssetItem("people-woman")!);

    expect(doc().layout).toBe("split-top");
    const subject = doc().elements.find((e) => e.slot === "subject")!;
    const zone = layoutZones("split-top", doc().format).visual!;
    expect(subject.x).toBeGreaterThanOrEqual(zone.x - 1);
    expect(subject.y).toBeGreaterThanOrEqual(zone.y - 1);
    expect(subject.x + subject.width).toBeLessThanOrEqual(zone.x + zone.width + 1);
    expect(subject.y + subject.height).toBeLessThanOrEqual(zone.y + zone.height + 1);
    useEditorStore.getState().closeDocument();
  });

  it("a slotted background ends at index 0, full-canvas, and survives select() + compose('copy-left')", () => {
    useEditorStore
      .getState()
      .setDocument(createDocument("instagram-post", "Product Launch"));

    addCatalogAsset(findAssetItem("backgrounds-abstract")!);

    const format = doc().format;
    expect(doc().elements[0]!.assetId).toBe("backgrounds-abstract");
    expect(doc().elements[0]).toMatchObject({
      slot: "background",
      x: 0,
      y: 0,
      width: format.width,
      height: format.height,
    });

    useEditorStore.getState().select();
    useEditorStore.getState().compose("copy-left");
    const bg = doc().elements.find((e) => e.assetId === "backgrounds-abstract")!;
    expect(bg).toMatchObject({ x: 0, y: 0, width: format.width, height: format.height });
    useEditorStore.getState().closeDocument();
  });

  it("an active brand kit doesn't override a slotted asset's style.color, same as addElement", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));
    const kit: BrandKit = {
      id: "kit-1",
      name: "Kit",
      colors: [
        {
          id: "c1",
          hex: "#111111",
          angle: 0,
          type: "solid",
          role: "text",
          usecase: "",
        },
      ],
      emotions: [],
      style: "",
      typography: "Inter",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useEditorStore.setState({ brandKits: [kit] });
    useEditorStore
      .getState()
      .mutate((d) => {
        d.creativeDirection.brandKitId = kit.id;
      }, false);

    const slottedId = useEditorStore
      .getState()
      .slotElement("headline", "title", { style: { color: "#FF00FF" } });
    const slotted = doc().elements.find((e) => e.id === slottedId)!;
    expect(slotted.style.color).toBe("#FF00FF");

    useEditorStore
      .getState()
      .addElement("title", undefined, undefined, { style: { color: "#FF00FF" } }, {
        preservePatchStyle: true,
      });
    const added = doc().elements.at(-1)!;
    expect(added.style.color).toBe("#FF00FF");
    useEditorStore.getState().closeDocument();
  });

  it("slotting a role/kind with no existing match uses the default position and leaves doc.layout unset", () => {
    const template = createDocument("instagram-post", "Flash Sale");
    useEditorStore.getState().setDocument(template);
    const indexBeforeInsert = doc().elements.length;
    // "price" has no existing match in Flash Sale (it has an "offer"-kind
    // element, not a "price"-kind one), so ROLE_REPLACE.offer's "kind"
    // policy finds no target.
    const id = useEditorStore.getState().slotElement("offer", "price", {});

    expect(doc().layout).toBeUndefined();
    const el = doc().elements.find((e) => e.id === id)!;
    const expected = createElement("price", template.format, indexBeforeInsert);
    const clampedX = Math.max(
      0,
      Math.min(expected.x, template.format.width - expected.width),
    );
    const clampedY = Math.max(
      0,
      Math.min(expected.y, template.format.height - expected.height),
    );
    expect(el.x).toBe(clampedX);
    expect(el.y).toBe(clampedY);
    expect(el.width).toBe(expected.width);
    expect(el.height).toBe(expected.height);
    useEditorStore.getState().closeDocument();
  });
});

describe("swapAsset / selection context bar", () => {
  it("keeps box and zIndex, changes assetId/name/placeholderArt, and adds exactly one history entry", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));
    addCatalogAsset(findAssetItem("people-woman")!);
    const before = doc().elements.find((e) => e.assetId === "people-woman")!;
    const box = { x: before.x, y: before.y, width: before.width, height: before.height };
    const pastBefore = useEditorStore.getState().past.length;

    swapCatalogAsset(before.id, findAssetItem("people-man")!);

    expect(useEditorStore.getState().past.length).toBe(pastBefore + 1);
    const after = doc().elements.find((e) => e.id === before.id)!;
    expect(after).toMatchObject(box);
    expect(after.zIndex).toBe(before.zIndex);
    expect(after.assetId).toBe("people-man");
    expect(after.name).toBe("Man");
    expect(after.placeholderArt).toBe("person-man");
    useEditorStore.getState().closeDocument();
  });

  it("text→image swap leaves no content", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));
    addCatalogAsset(findAssetItem("text-heading-bold")!);
    const title = doc().elements.find((e) => e.kind === "title")!;
    expect(title.content).not.toBe(undefined);

    useEditorStore.getState().swapAsset(title.id, "heroImage", {});

    const swapped = doc().elements.find((e) => e.id === title.id)!;
    expect(swapped.kind).toBe("heroImage");
    expect(swapped.content).toBeUndefined();
    useEditorStore.getState().closeDocument();
  });

  it("title→title swap keeps user content", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));
    addCatalogAsset(findAssetItem("text-heading-bold")!);
    const title = doc().elements.find((e) => e.kind === "title")!;
    useEditorStore.getState().updateElement(title.id, { content: "Summer Sale" });

    swapCatalogAsset(title.id, findAssetItem("text-editorial-serif")!);

    const swapped = doc().elements.find((e) => e.id === title.id)!;
    expect(swapped.kind).toBe("title");
    expect(swapped.content).toBe("Summer Sale");
    useEditorStore.getState().closeDocument();
  });

  it("compileVisualPrompt contains 'specifically red sneakers' after setElementDetail on an image element", () => {
    useEditorStore.getState().setDocument(createDocument("instagram-post"));
    addCatalogAsset(findAssetItem("fashion-bag")!);
    const product = doc().elements.find((e) => e.kind === "productImage")!;

    useEditorStore.getState().setElementDetail(product.id, "red sneakers");

    expect(compileVisualPrompt(doc())).toContain("specifically red sneakers");
    useEditorStore.getState().closeDocument();
  });
});

describe("swapAlternatives", () => {
  it("returns at most 6 items, all the same role and kind family, and never the item itself", () => {
    const item = findAssetItem("people-woman")!;
    const alternatives = swapAlternatives(item);

    expect(alternatives.length).toBeLessThanOrEqual(6);
    expect(alternatives.some((alt) => alt.id === item.id)).toBe(false);
    for (const alt of alternatives) {
      expect(roleOf(alt)).toBe(roleOf(item));
      expect(kindFamily(alt.kind)).toBe(kindFamily(item.kind));
    }
  });
});
