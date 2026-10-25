import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Image as ImageIcon } from "lucide-react";
import { SectionHeading } from "./section-heading";

describe("section heading", () => {
  it("renders the title in an h3 by default with the shared title class", () => {
    const html = renderToStaticMarkup(
      createElement(SectionHeading, { title: "Selected element" }),
    );
    expect(html).toContain('<h3 class="ui-section-heading-title">Selected element</h3>');
  });

  it("renders the title in an h4 when as is set", () => {
    const html = renderToStaticMarkup(
      createElement(SectionHeading, { title: "Selected element", as: "h4" }),
    );
    expect(html).toContain('<h4 class="ui-section-heading-title">Selected element</h4>');
    expect(html).not.toContain("<h3");
  });

  it("omits eyebrow, icon and meta when not provided", () => {
    const html = renderToStaticMarkup(
      createElement(SectionHeading, { title: "Selected element" }),
    );
    expect(html).not.toContain("ui-section-heading-eyebrow");
    expect(html).not.toContain("ui-section-heading-icon");
    expect(html).not.toContain("ui-section-heading-meta");
  });

  it("renders eyebrow, icon and meta only when provided", () => {
    const html = renderToStaticMarkup(
      createElement(SectionHeading, {
        title: "Assets",
        eyebrow: "Library",
        icon: ImageIcon,
        meta: createElement("span", { className: "asset-role-badge" }, "Text"),
      }),
    );
    expect(html).toContain('class="ui-section-heading-eyebrow"');
    expect(html).toContain("Library");
    expect(html).toContain("ui-section-heading-icon");
    expect(html).toContain(
      '<span class="ui-section-heading-meta"><span class="asset-role-badge">Text</span></span>',
    );
  });
});
