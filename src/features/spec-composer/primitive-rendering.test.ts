import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ElementContent, StaticDocument, StaticElement } from "./static-render";
import { createDocument } from "./templates";
import type { SpecElement } from "./types";
import { specDocumentSchema } from "./types";
import { buildJsonExport } from "./compiler";
import { createElement as createSpecElement } from "./registry";

const shape = (
  shapeType: "triangle" | "diamond" | "ellipse" | "line",
): SpecElement => ({
  id: `render-${shapeType}`,
  kind: "shape",
  name: "Primitive",
  x: 20,
  y: 30,
  width: 240,
  height: shapeType === "line" ? 4 : 120,
  rotation: 25,
  zIndex: 2,
  visible: true,
  locked: false,
  semanticRole: "decorative",
  style: {
    shapeType,
    background: "linear-gradient(90deg, #ff0000, #0000ff)",
    borderColor: "#123456",
    borderWidth: 3,
    borderRadius: 18,
    opacity: 0.6,
  },
});

describe("expanded primitive rendering", () => {
  it("removes the polygon stroke when border width is zero and border color is cleared", () => {
    const el = shape("triangle");
    el.style.borderWidth = 0;
    delete el.style.borderColor;
    const html = renderToStaticMarkup(createElement(ElementContent, { el }));
    expect(html).not.toContain("canvas-polygon-stroke");
    expect(html).not.toContain("stroke-width");
    expect(html).toContain("opacity:0.6");
    expect(html).toContain("linear-gradient(90deg, #ff0000, #0000ff)");
  });

  it("round-trips alpha text colors through schema/JSON and renders them independently of layer opacity", () => {
    const document = createDocument();
    const el = createSpecElement("title", document.format, 0);
    el.style = {
      ...el.style,
      color: "#12345680",
      background: "#abcdef40",
      opacity: 0.375,
    };
    document.elements = [el];
    const roundTrip = specDocumentSchema.parse(
      JSON.parse(JSON.stringify(buildJsonExport(document).spec)),
    );
    expect(roundTrip.elements[0]!.style).toMatchObject({
      color: "#12345680",
      background: "#abcdef40",
      opacity: 0.375,
    });
    let html = renderToStaticMarkup(
      createElement(StaticDocument, { doc: roundTrip }),
    );
    expect(html).toContain("color:#12345680");
    expect(html).toContain("background:#abcdef40");
    expect(html).toContain("opacity:0.375");
    delete roundTrip.elements[0]!.style.background;
    html = renderToStaticMarkup(
      createElement(ElementContent, { el: roundTrip.elements[0]! }),
    );
    expect(html).not.toContain("background:");
    expect(html).toContain("opacity:0.375");
    expect(html).toContain("color:#12345680");
  });
  it.each(["triangle", "diamond"] as const)(
    "renders %s with gradient fill and a clipped polygon stroke",
    (type) => {
      const html = renderToStaticMarkup(
        createElement(ElementContent, { el: shape(type) }),
      );
      expect(html).toContain(`data-shape="${type}"`);
      expect(html).toContain("linear-gradient(90deg, #ff0000, #0000ff)");
      expect(html).toContain("clip-path:polygon(");
      expect(html).toContain("opacity:0.6");
      expect(html).toContain('viewBox="0 0 240 120"');
      expect(html).toContain('stroke="#123456"');
      expect(html).toContain('stroke-width="6"');
      expect(html).toContain('fill="none"');
      expect(html).toContain("<clipPath");
      expect(html).toContain('aria-hidden="true"');
      expect(html).not.toContain("border-radius:18");
    },
  );

  it("uses true ellipse geometry without squaring its bounds", () => {
    const html = renderToStaticMarkup(
      createElement(StaticElement, { el: shape("ellipse") }),
    );
    expect(html).toContain("width:240px;height:120px");
    expect(html).toContain("border-radius:50%");
    expect(html).toContain("rotate(25deg)");
    expect(html).toContain("border-color:#123456");
  });

  it("renders a thin divider with square corners", () => {
    const html = renderToStaticMarkup(
      createElement(StaticElement, { el: shape("line") }),
    );
    expect(html).toContain("width:240px;height:4px");
    expect(html).toContain("border-radius:0");
    expect(html).toContain("rotate(25deg)");
  });

  it("preserves corner styling in existing divider-kind documents", () => {
    const el = shape("line");
    el.kind = "divider";
    delete el.style.shapeType;
    delete el.semanticRole;
    el.style.borderRadius = 18;
    const html = renderToStaticMarkup(createElement(ElementContent, { el }));
    expect(html).toContain("border-radius:18px");
  });

  it("shares polygon content with PNG rendering without editor role annotations", () => {
    const doc = createDocument();
    doc.elements = [shape("triangle"), shape("diamond")];
    const html = renderToStaticMarkup(createElement(StaticDocument, { doc }));
    expect(html.match(/class="canvas-polygon-stroke"/g)).toHaveLength(2);
    expect(html.match(/<clipPath id="([^"]+)"/g)).toHaveLength(2);
    expect(
      new Set(
        Array.from(
          html.matchAll(/<clipPath id="([^"]+)"/g),
          (match) => match[1],
        ),
      ).size,
    ).toBe(2);
    expect(html).not.toContain("shape-role-label");
    expect(html).not.toContain("Decorative element");
    expect(html).toContain("rotate(25deg)");
  });
});
