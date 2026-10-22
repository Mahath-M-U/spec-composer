import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BrandKitSummary,
  BrandKitSwatches,
  brandKitColorPaint,
} from "./brand-kit-summary";
import { brandKitPaint } from "./brand-kit-panel";
import type { BrandKit } from "./types";

const kit: BrandKit = {
  id: "fern",
  name: "Studio Fern",
  typography: "Fraunces",
  style: "Editorial",
  emotions: ["Calm"],
  createdAt: "",
  updatedAt: "",
  colors: [
    {
      id: "a",
      role: "primary",
      type: "gradient",
      hex: "#123456",
      secondaryHex: "#abcdef",
      angle: 45,
      usecase: "",
    },
    {
      id: "b",
      role: "background",
      type: "solid",
      hex: "#ffffff",
      angle: 0,
      usecase: "",
    },
    {
      id: "c",
      role: "text",
      type: "solid",
      hex: "#000000",
      angle: 0,
      usecase: "",
    },
  ],
};

describe("shared brand kit summary", () => {
  it("renders real kit identity and gradient swatches without interactive wrappers", () => {
    const before = JSON.stringify(kit);
    const html = renderToStaticMarkup(<BrandKitSummary kit={kit} />);
    expect(html).toContain("Studio Fern");
    expect(html).toContain("Fraunces · Editorial · Calm");
    expect(html).toContain("linear-gradient(45deg, #123456, #abcdef)");
    expect(html).toContain("background:#ffffff;color:#000000");
    expect(html).not.toMatch(/<(?:button|a|input)\b/);
    expect(JSON.stringify(kit)).toBe(before);
    expect(brandKitPaint(kit.colors[0]!)).toBe(
      brandKitColorPaint(kit.colors[0]!),
    );
  });
  it("supports navigation copy without replacing actual colors or adding actions", () => {
    const html = renderToStaticMarkup(
      <button type="button">
        <BrandKitSummary
          kit={kit}
          variant="sidebar"
          title="Design kits"
          subtitle="Applied Design Kit"
        />
      </button>,
    );
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain("Applied Design Kit");
    expect(html).toContain("#abcdef");
    expect(html).not.toContain('role="toolbar"');
  });
  it("keeps caller-owned title/actions and handles missing kits and colors honestly", () => {
    const html = renderToStaticMarkup(
      <BrandKitSummary
        kit={{ ...kit, colors: [] }}
        title={<input aria-label="Kit name" defaultValue={kit.name} />}
        actions={<button type="button">Edit</button>}
        showSwatches={false}
      />,
    );
    expect(html).toContain('aria-label="Kit name"');
    expect(html).toContain('role="toolbar" aria-label="Studio Fern actions"');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(renderToStaticMarkup(<BrandKitSummary />)).toContain(
      "Build your identity",
    );
    expect(renderToStaticMarkup(<BrandKitSwatches colors={[]} />)).toContain(
      "No colors yet",
    );
    expect(
      brandKitColorPaint({ type: "gradient", hex: "#123456", angle: 45 }),
    ).toBe("linear-gradient(45deg, #123456, #123456)");
  });
});
