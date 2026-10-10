import { describe, expect, it } from "vitest";
import {
  applyComposeLayout,
  applyTidy,
  composePool,
  defaultLayoutFor,
  isComposeAvailable,
  isComposeLayout,
  isFullBleed,
  layoutZones,
  planComposeBoxes,
  roleZone,
  COMPOSE_LAYOUTS,
  COMPOSE_LAYOUT_IDS,
  type Box,
  type ComposeLayout,
} from "./compose-layouts";
import { createElement } from "./registry";
import { createDocument } from "./templates";
import type { ElementKind, Format, SpecDocument } from "./types";

const FORMAT_PORTRAIT: Format = {
  id: "test-1080x1350",
  label: "Test portrait",
  subtitle: "",
  width: 1080,
  height: 1350,
  category: "Test",
};
const FORMAT_LANDSCAPE: Format = {
  id: "test-1920x1080",
  label: "Test landscape",
  subtitle: "",
  width: 1920,
  height: 1080,
  category: "Test",
};
const FORMATS = [FORMAT_PORTRAIT, FORMAT_LANDSCAPE];

/** The representative pool compose() is designed around: a headline block,
 * a CTA, a logo and a product shot — same kinds the Layout tab ships with. */
const DEFAULT_KINDS: ElementKind[] = [
  "title",
  "subheading",
  "body",
  "cta",
  "logo",
  "productImage",
];

function buildDoc(format: Format, kinds: ElementKind[] = DEFAULT_KINDS): SpecDocument {
  const doc = createDocument(format);
  doc.elements = kinds.map((kind, i) => createElement(kind, format, i));
  return doc;
}

/** Plans every compose layout for `doc`/`ids` and reduces each to the boxes
 * for `doc.elements` in element-index order (not id — ids are random) so the
 * snapshot is a stable fingerprint of every placement function's geometry. */
function plan(doc: SpecDocument, ids: string[]) {
  return Object.fromEntries(
    COMPOSE_LAYOUTS.map((l) => [
      l.id,
      doc.elements.map((e) => planComposeBoxes(doc, l.id, ids)[e.id] ?? null),
    ]),
  );
}

describe("compose regression snapshot", () => {
  it("instagram-post Product Launch, no selection", () => {
    const doc = createDocument("instagram-post", "Product Launch", {
      brandKit: false,
    });
    expect(plan(doc, [])).toMatchSnapshot();
  });

  it("instagram-post Product Launch, title + cta selected", () => {
    const doc = createDocument("instagram-post", "Product Launch", {
      brandKit: false,
    });
    const title = doc.elements.find((e) => e.kind === "title")!;
    const cta = doc.elements.find((e) => e.kind === "cta")!;
    expect(plan(doc, [title.id, cta.id])).toMatchSnapshot();
  });

  it("blank portrait with the default kind pool", () => {
    const doc = buildDoc(FORMAT_PORTRAIT);
    expect(plan(doc, [])).toMatchSnapshot();
  });

  it("blank landscape with an extended kind pool", () => {
    const doc = buildDoc(FORMAT_LANDSCAPE, [
      ...DEFAULT_KINDS,
      "supportingImage",
      "badge",
      "eyebrow",
      "offer",
    ]);
    expect(plan(doc, [])).toMatchSnapshot();
  });
});

/** Layouts whose planned boxes are expected to stay fully on-canvas for the
 * default pool. stack-center and diagonal stack the full pool (not just
 * text) in a single unclamped column — same as the compose() they replace —
 * so a six-element pool can run past the bottom edge; collage and spotlight
 * dedicate a fixed-size image area that, together with a wide-landscape
 * format, can leave too little room below for three or four lines of copy.
 * All four get their own, looser assertions below. */
const BOUNDED_LAYOUTS: ComposeLayout[] = COMPOSE_LAYOUTS.map((l) => l.id).filter(
  (id) =>
    id !== "stack-center" &&
    id !== "diagonal" &&
    id !== "collage" &&
    id !== "spotlight",
);

function expectOnCanvas(boxes: Record<string, Box>, w: number, h: number) {
  const entries = Object.values(boxes);
  expect(entries.length).toBeGreaterThan(0);
  for (const box of entries) {
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(w + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(h + 1);
  }
}

describe("planComposeBoxes bounds", () => {
  for (const format of FORMATS) {
    for (const layoutId of BOUNDED_LAYOUTS) {
      it(`keeps ${layoutId} on the ${format.width}x${format.height} canvas`, () => {
        const doc = buildDoc(format);
        const boxes = planComposeBoxes(doc, layoutId, []);
        expectOnCanvas(boxes, format.width, format.height);
      });
    }
  }
});

describe("stack-center and diagonal", () => {
  for (const format of FORMATS) {
    it(`stack-center centers every box horizontally on ${format.width}x${format.height}`, () => {
      const doc = buildDoc(format);
      const boxes = planComposeBoxes(doc, "stack-center", []);
      for (const el of doc.elements) {
        if (el.kind === "logo") continue; // pinned to a corner, not centered
        const box = boxes[el.id]!;
        expect(box.width).toBe(el.width);
        expect(box.height).toBe(el.height);
        expect(Math.abs(box.x - (format.width - el.width) / 2)).toBeLessThanOrEqual(1);
      }
    });

    it(`diagonal cascades left to right on ${format.width}x${format.height}`, () => {
      const doc = buildDoc(format);
      const boxes = planComposeBoxes(doc, "diagonal", []);
      const nonLogo = doc.elements
        .filter((e) => e.kind !== "logo")
        .map((e) => boxes[e.id]!)
        .sort((a, b) => a.y - b.y);
      for (let i = 1; i < nonLogo.length; i++)
        expect(nonLogo[i]!.x).toBeGreaterThan(nonLogo[i - 1]!.x);
    });
  }
});

describe("collage", () => {
  for (const format of FORMATS) {
    it(`fills the top 60% with the image grid and starts copy below it on ${format.width}x${format.height}`, () => {
      const doc = buildDoc(format, [
        "title",
        "cta",
        "logo",
        "productImage",
        "supportingImage",
      ]);
      const boxes = planComposeBoxes(doc, "collage", []);
      const bandH = Math.round(format.height * 0.6);
      const images = doc.elements.filter((e) =>
        ["productImage", "supportingImage"].includes(e.kind),
      );
      for (const img of images) {
        const box = boxes[img.id]!;
        expect(box.x).toBeGreaterThanOrEqual(-1);
        expect(box.y).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width).toBeLessThanOrEqual(format.width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(bandH + 1);
      }
      const title = doc.elements.find((e) => e.kind === "title")!;
      expect(boxes[title.id]!.y).toBeGreaterThanOrEqual(bandH - 1);
    });
  }
});

describe("spotlight", () => {
  for (const format of FORMATS) {
    it(`centers a square visual between the headline and details on ${format.width}x${format.height}`, () => {
      const doc = buildDoc(format);
      const boxes = planComposeBoxes(doc, "spotlight", []);
      const visual = doc.elements.find((e) => e.kind === "productImage")!;
      const title = doc.elements.find((e) => e.kind === "title")!;
      const visualBox = boxes[visual.id]!;
      const s = Math.round(Math.min(format.width, format.height) * 0.5);
      expect(visualBox.width).toBe(s);
      expect(visualBox.height).toBe(s);
      expect(Math.abs(visualBox.x - (format.width - s) / 2)).toBeLessThanOrEqual(1);
      // headline sits above the visual, details start at or below its bottom
      expect(boxes[title.id]!.y + boxes[title.id]!.height).toBeLessThanOrEqual(
        visualBox.y + 1,
      );
      const rest = doc.elements.filter(
        (e) => e.kind === "subheading" || e.kind === "body" || e.kind === "cta",
      );
      for (const e of rest)
        expect(boxes[e.id]!.y).toBeGreaterThanOrEqual(visualBox.y + visualBox.height - 1);
    });
  }
});

describe("compose pool and placement rules", () => {
  it("leaves locked elements untouched", () => {
    const doc = buildDoc(FORMAT_PORTRAIT);
    const title = doc.elements.find((e) => e.kind === "title")!;
    title.locked = true;
    const before = { x: title.x, y: title.y, width: title.width, height: title.height };
    applyComposeLayout(doc, "copy-left", []);
    expect(title).toMatchObject(before);
  });

  it("keeps logo at its own size and caps cta width to the column on copy-left", () => {
    const doc = buildDoc(FORMAT_PORTRAIT);
    const logo = doc.elements.find((e) => e.kind === "logo")!;
    const cta = doc.elements.find((e) => e.kind === "cta")!;
    const title = doc.elements.find((e) => e.kind === "title")!;
    const boxes = planComposeBoxes(doc, "copy-left", []);
    expect(boxes[logo.id]).toMatchObject({ width: logo.width, height: logo.height });
    // cta never stretches to the fill-text column width (the pre-refactor
    // bug this fixes) — it keeps its own width, capped only if the column
    // (here, the same width given to the fill-text title) is narrower.
    const columnWidth = boxes[title.id]!.width;
    expect(boxes[cta.id]!.width).toBe(Math.min(cta.width, columnWidth));
    expect(boxes[cta.id]!.height).toBe(cta.height);
  });

  it("stacks copy in reading order (y then x), not creation order", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const title = { ...createElement("title", format, 0), y: 800 };
    const subheading = { ...createElement("subheading", format, 1), y: 200 };
    const body = { ...createElement("body", format, 2), y: 500 };
    const image = createElement("productImage", format, 3);
    doc.elements = [title, subheading, body, image];
    const boxes = planComposeBoxes(doc, "copy-left", []);
    expect(boxes[subheading.id]!.y).toBeLessThan(boxes[body.id]!.y);
    expect(boxes[body.id]!.y).toBeLessThan(boxes[title.id]!.y);
  });

  it("disables collage with fewer than two images", () => {
    const doc = buildDoc(FORMAT_PORTRAIT);
    const pool = composePool(doc, []);
    expect(isComposeAvailable("collage", pool)).toBe(false);
  });

  it("disables copy-left with no image", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    doc.elements = [createElement("title", format, 0)];
    const pool = composePool(doc, []);
    expect(isComposeAvailable("copy-left", pool)).toBe(false);
  });

  it("only moves selected elements when a selection is given", () => {
    const doc = buildDoc(FORMAT_PORTRAIT);
    const title = doc.elements.find((e) => e.kind === "title")!;
    const subheading = doc.elements.find((e) => e.kind === "subheading")!;
    const before = {
      x: subheading.x,
      y: subheading.y,
      width: subheading.width,
      height: subheading.height,
    };
    applyComposeLayout(doc, "copy-left", [title.id]);
    expect(subheading).toMatchObject(before);
    expect(title.x !== before.x || title.y !== before.y).toBe(true);
  });
});

describe("tidy", () => {
  const W = FORMAT_PORTRAIT.width;
  const H = FORMAT_PORTRAIT.height;
  const margin = Math.round((Math.min(W, H) * 0.06) / 4) * 4;

  describe("isFullBleed", () => {
    it("is true for a box matching the canvas exactly", () => {
      expect(isFullBleed({ x: 0, y: 0, width: W, height: H }, W, H)).toBe(true);
    });

    it("is true for a box that overflows every edge", () => {
      expect(
        isFullBleed({ x: -40, y: -40, width: W + 80, height: H + 80 }, W, H),
      ).toBe(true);
    });

    it("is true for a box covering 92% of both axes", () => {
      const width = Math.round(W * 0.92);
      const height = Math.round(H * 0.92);
      expect(
        isFullBleed(
          { x: (W - width) / 2, y: (H - height) / 2, width, height },
          W,
          H,
        ),
      ).toBe(true);
    });

    it("is true for a full-width band that doesn't reach the top or bottom", () => {
      expect(isFullBleed({ x: 0, y: 400, width: W, height: 300 }, W, H)).toBe(
        true,
      );
    });

    it("is false for a box that only touches one edge", () => {
      expect(
        isFullBleed({ x: -30, y: 200, width: 400, height: 100 }, W, H),
      ).toBe(false);
    });

    it("is false for a normal title box", () => {
      const title = createElement("title", FORMAT_PORTRAIT, 0);
      expect(isFullBleed(title, W, H)).toBe(false);
    });
  });

  it("leaves a full-bleed hero untouched and still tidies a normal title", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const hero = {
      ...createElement("heroImage", format, 0),
      x: 0,
      y: 0,
      width: format.width,
      height: format.height,
    };
    // Off-grid and past the margin, so the 4px snap lands inside the clamp
    // range instead of being pulled back to the margin itself.
    const title = { ...createElement("title", format, 1), x: 101, y: 40 };
    doc.elements = [hero, title];
    applyTidy(doc, []);
    expect(hero).toMatchObject({
      x: 0,
      y: 0,
      width: format.width,
      height: format.height,
    });
    expect(title.x % 4).toBe(0);
    expect(title.x).toBeGreaterThanOrEqual(margin);
  });

  it("leaves an overflowing hero and a full-width band completely unchanged", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const hero = {
      ...createElement("heroImage", format, 0),
      x: -40,
      y: -40,
      width: format.width + 80,
      height: format.height + 80,
    };
    const band = {
      ...createElement("productImage", format, 1),
      x: 0,
      y: 400,
      width: format.width,
      height: 300,
    };
    const heroBefore = { ...hero };
    const bandBefore = { ...band };
    doc.elements = [hero, band];
    applyTidy(doc, []);
    expect(hero).toMatchObject(heroBefore);
    expect(band).toMatchObject(bandBefore);
  });

  it("clamps an off-canvas image to the margin (regression)", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const image = {
      ...createElement("productImage", format, 0),
      x: -30,
      width: 300,
    };
    doc.elements = [image];
    applyTidy(doc, []);
    expect(image.x).toBe(margin);
  });

  it("spaces stacked titles by the loose headline gap", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const titleA = { ...createElement("title", format, 0), x: 40, y: 100 };
    const titleB = { ...createElement("title", format, 1), x: 40, y: 105 };
    doc.elements = [titleA, titleB];
    applyTidy(doc, []);
    expect(titleB.y - titleA.y).toBe(titleA.height + 48);
  });

  it("only tidies selected elements when a selection is given", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const titleA = { ...createElement("title", format, 0), x: 13, y: 40 };
    const titleB = { ...createElement("title", format, 1), x: 17, y: 400 };
    const hero = {
      ...createElement("heroImage", format, 2),
      x: 0,
      y: 0,
      width: format.width,
      height: format.height,
    };
    const titleABefore = { ...titleA };
    const titleBBefore = { ...titleB };
    const heroBefore = { ...hero };
    doc.elements = [titleA, titleB, hero];
    applyTidy(doc, [titleA.id, hero.id]);
    expect(titleA).not.toMatchObject(titleABefore);
    expect(titleB).toMatchObject(titleBBefore);
    expect(hero).toMatchObject(heroBefore);
  });

  it("gives role-aware gaps: tight after eyebrow/badge, loose after title, cta-sized before a cta", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const eyebrow = { ...createElement("eyebrow", format, 0), x: 64, y: 100 };
    const title = { ...createElement("title", format, 1), x: 64, y: 110 };
    const body = { ...createElement("body", format, 2), x: 64, y: 120 };
    const cta = { ...createElement("cta", format, 3), x: 64, y: 130 };
    doc.elements = [eyebrow, title, body, cta];
    applyTidy(doc, []);
    expect(title.y - (eyebrow.y + eyebrow.height)).toBe(16);
    expect(body.y - (title.y + title.height)).toBe(48);
    expect(cta.y - (body.y + body.height)).toBe(44);
  });

  it("only pushes text apart — never pulls an already-generous gap closer", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const title = { ...createElement("title", format, 0), x: 64, y: 100 };
    const body = { ...createElement("body", format, 1), x: 64, y: 600 };
    doc.elements = [title, body];
    applyTidy(doc, []);
    expect(body.y).toBe(600);
  });

  it("leaves a gap alone once it clears the push tolerance, even below the full required gap", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const title = { ...createElement("title", format, 0), x: 64, y: 100 };
    const body = { ...createElement("body", format, 1), x: 64, y: 308 };
    doc.elements = [title, body];
    applyTidy(doc, []);
    expect(body.y).toBe(308);
  });

  it("scales margin and gaps to the format's shorter side", () => {
    const format: Format = {
      id: "test-540x540",
      label: "Test square",
      subtitle: "",
      width: 540,
      height: 540,
      category: "Test",
    };
    const doc = createDocument(format);
    const titleA = { ...createElement("title", format, 0), x: 40, y: 100 };
    const titleB = { ...createElement("title", format, 1), x: 40, y: 104 };
    const image = { ...createElement("productImage", format, 2), x: -30 };
    doc.elements = [titleA, titleB, image];
    applyTidy(doc, []);
    expect(titleB.y - titleA.y).toBe(titleA.height + 24);
    expect(image.x).toBe(32);
  });

  it("clusters text into columns by horizontal overlap and only chains gaps within a column", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const title = {
      ...createElement("title", format, 0),
      x: 64,
      y: 100,
      width: 952,
    };
    const leftBody = { ...createElement("body", format, 1), x: 64, y: 400 };
    const rightBody = { ...createElement("body", format, 2), x: 584, y: 404 };
    const leftSub = {
      ...createElement("subheading", format, 3),
      x: 64,
      y: 420,
    };
    doc.elements = [title, leftBody, rightBody, leftSub];
    applyTidy(doc, []);
    expect(rightBody).toMatchObject({ x: 584, y: 404 });
    expect(leftSub.y).toBe(leftBody.y + leftBody.height + 32);
    expect(leftSub.x).toBe(64);
  });

  it("excludes locked elements whether or not a selection is given", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const title = {
      ...createElement("title", format, 0),
      x: 13,
      y: 40,
      locked: true,
    };
    const body = { ...createElement("body", format, 1), x: 64, y: 400 };
    doc.elements = [title, body];
    const titleBefore = { ...title };
    applyTidy(doc, []);
    expect(title).toMatchObject(titleBefore);
    applyTidy(doc, [title.id, body.id]);
    expect(title).toMatchObject(titleBefore);
  });

  it("shifts an overflowing column up as a whole, keeping its internal gaps", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const bodies = [1100, 1110, 1120].map((y, i) => ({
      ...createElement("body", format, i),
      x: 64,
      y,
      height: 100,
    }));
    doc.elements = bodies;
    applyTidy(doc, []);
    const [first, second, third] = bodies;
    expect(first!.y).toBe(922);
    expect(second!.y - (first!.y + first!.height)).toBe(32);
    expect(third!.y - (second!.y + second!.height)).toBe(32);
    expect(third!.y + third!.height).toBe(format.height - margin);
  });

  it("compresses only the gaps above the 4px minimum when a shift alone can't fit the column", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const bodies = [100, 104, 108, 112].map((y, i) => ({
      ...createElement("body", format, i),
      x: 64,
      y,
      height: 290,
    }));
    doc.elements = bodies;
    applyTidy(doc, []);
    expect(bodies[0]!.y).toBe(64);
    const last = bodies[3]!;
    expect(last.y + last.height).toBeLessThanOrEqual(format.height - margin);
    for (let i = 1; i < bodies.length; i++) {
      const gap = bodies[i]!.y - (bodies[i - 1]!.y + bodies[i - 1]!.height);
      expect(gap).toBeGreaterThanOrEqual(8);
      expect(gap).toBeLessThanOrEqual(32);
      expect(gap).toBe(20);
    }
  });
});

describe("slot-aware composePool / placement", () => {
  it("excludes a full-canvas heroImage slotted 'background' and gives the layout's visual zone to the product image instead", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const hero = {
      ...createElement("heroImage", format, 0),
      x: 0,
      y: 0,
      width: format.width,
      height: format.height,
      slot: "background",
    };
    const product = createElement("productImage", format, 1);
    doc.elements = [hero, product];
    const boxes = planComposeBoxes(doc, "copy-left", []);
    expect(boxes[hero.id]).toBeUndefined();
    expect(boxes[product.id]).toEqual(layoutZones("copy-left", format).visual);
  });

  it("excludes a supportingImage slotted 'decor' from the plan", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const product = createElement("productImage", format, 0);
    const decor = { ...createElement("supportingImage", format, 1), slot: "decor" };
    doc.elements = [product, decor];
    const boxes = planComposeBoxes(doc, "copy-left", []);
    expect(boxes[decor.id]).toBeUndefined();
  });

  it("gives the visual box to the later image once it's slotted 'subject'", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const product = createElement("productImage", format, 0);
    const subject = { ...createElement("supportingImage", format, 1), slot: "subject" };
    doc.elements = [product, subject];
    const boxes = planComposeBoxes(doc, "copy-left", []);
    expect(boxes[subject.id]).toEqual(layoutZones("copy-left", format).visual);
    expect(boxes[product.id]).toBeUndefined();
  });

  it("pins a body element slotted 'brand' to the layout's logo corner at its own size", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const product = createElement("productImage", format, 0);
    const brandBody = { ...createElement("body", format, 1), slot: "brand" };
    doc.elements = [product, brandBody];
    const boxes = planComposeBoxes(doc, "copy-left", []); // copy-left pins logos "br"
    const w = format.width;
    const h = format.height;
    const m = layoutZones("copy-left", format).margin;
    expect(boxes[brandBody.id]).toEqual({
      x: w - m - brandBody.width,
      y: h - m - brandBody.height,
      width: brandBody.width,
      height: brandBody.height,
    });
  });

  it("stacks a slot:'cta' element after a slot:'headline' element regardless of array/y order", () => {
    const format = FORMAT_PORTRAIT;
    const doc = createDocument(format);
    const product = createElement("productImage", format, 0);
    const cta = { ...createElement("cta", format, 1), y: 100, slot: "cta" };
    const title = { ...createElement("title", format, 2), y: 900, slot: "headline" };
    doc.elements = [product, cta, title];
    const boxes = planComposeBoxes(doc, "copy-left", []);
    expect(boxes[cta.id]!.y).toBeGreaterThanOrEqual(
      boxes[title.id]!.y + boxes[title.id]!.height,
    );
  });
});

describe("layout zones and role zones", () => {
  it("isComposeLayout accepts every COMPOSE_LAYOUT_IDS entry and rejects an unknown string", () => {
    for (const id of COMPOSE_LAYOUT_IDS) expect(isComposeLayout(id)).toBe(true);
    expect(isComposeLayout("nope")).toBe(false);
  });

  it("places the product image exactly at roleZone('subject')'s box for every layout that has one (collage excluded)", () => {
    const format = FORMAT_PORTRAIT;
    const doc = buildDoc(format);
    const product = doc.elements.find((e) => e.kind === "productImage")!;
    for (const layout of COMPOSE_LAYOUT_IDS) {
      if (layout === "collage") continue; // collage tiles multiple images into a grid, not a single visual box
      const zone = roleZone("subject", layout, format);
      if (!zone || zone.type !== "box") continue; // stack-center, diagonal, corner-badge have no subject box
      const boxes = planComposeBoxes(doc, layout, []);
      expect(boxes[product.id], layout).toEqual({
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height,
      });
    }
  });

  it("returns undefined for roles a layout doesn't place", () => {
    const format = FORMAT_PORTRAIT;
    expect(roleZone("headline", "stack-center", format)).toBeUndefined();
    expect(roleZone("decor", "copy-left", format)).toBeUndefined();
  });

  it("background is always the full canvas, even with no layout", () => {
    const format = FORMAT_PORTRAIT;
    expect(roleZone("background", undefined, format)).toEqual({
      type: "box",
      x: 0,
      y: 0,
      width: format.width,
      height: format.height,
    });
  });

  it("corner-badge: offer is the badge point, cta is the bottom-right corner", () => {
    const format = FORMAT_PORTRAIT;
    const m = layoutZones("corner-badge", format).margin;
    expect(roleZone("offer", "corner-badge", format)).toEqual({
      type: "point",
      x: m,
      y: m,
    });
    expect(roleZone("cta", "corner-badge", format)).toEqual({
      type: "corner",
      corner: "br",
      margin: m,
    });
  });

  it("defaultLayoutFor picks copy-left for wide formats, split-top otherwise", () => {
    expect(defaultLayoutFor({ width: 1920, height: 1080 })).toBe("copy-left");
    expect(defaultLayoutFor({ width: 1080, height: 1920 })).toBe("split-top");
    expect(defaultLayoutFor({ width: 1080, height: 1080 })).toBe("split-top");
  });
});
