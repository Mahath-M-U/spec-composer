import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { createElement as createSpecElement } from "../registry";
import { createDocument } from "../templates";
import { GarmentReference, ModelHeadArtwork, ModelPortrait } from "./ModelArtwork";
import { previewCapability } from "./preview-capabilities";

const element = () => ({ ...createSpecElement("humanModelImage", createDocument().format, 0), catalogElementId: "subjects.person" });
it("composes reviewed source heads/faces at their original offsets without losing fill defaults", () => {
  const html = renderToStaticMarkup(createElement(ModelHeadArtwork, { element: element(), skin: "#ac7251", hair: "#343139" }));
  expect(html).toContain('data-artwork="croods"');
  expect(html).toContain('fill="none"');
  expect(html).toContain('transform="translate(106 40)"');
  expect(html).toContain('transform="translate(184 127)"');
  expect(html).toContain('M146.228 273.987'); // Preserved sourced head outline.
  expect(html).toContain('M167.244 203.292'); // Preserved sourced face.
  expect(html).toContain("Vijay Verma");
  expect(html).toContain("CC BY 4.0");
});
it("applies skin/hair through escaped styles while retaining white teeth and source artwork", () => {
  const subject = element();
  const html = renderToStaticMarkup(createElement(ModelHeadArtwork, { element: subject, expression: "happy", skin: "#815236", hair: '#123456\"><script>bad</script>' }));
  expect(html).toContain("--model-skin:#815236");
  expect(html).toContain('fill="var(--model-skin)"');
  expect(html).toContain('fill="var(--model-hair)"');
  expect(html).toContain('fill="white"');
  expect(html).toContain('data-expression="happy"');
  expect(html).not.toContain("<script");
});
it("maps authored hairstyles/expressions and leaves unimplemented wardrobe/framing as specification only", () => {
  const subject = { ...element(), contextualProperties: { "model.appearance.hairStyle": "bun", "model.expression.expression": "sad" } };
  const html = renderToStaticMarkup(createElement(ModelPortrait, { element: subject }));
  expect(html).toContain('data-hairstyle="bun"'); expect(html).toContain('data-expression="sad"');
  expect(html).toContain('aria-hidden="true"');
  expect(previewCapability(subject, "model.appearance.hairStyle").mode).toBe("simplified");
  expect(previewCapability(subject, "model.outfit.garmentPreset").mode).toBe("spec_only");
  expect(previewCapability(subject, "model.framing.shot").mode).toBe("spec_only");
});
it("gives each identity a distinct default hairstyle while preserving explicit supported choices",()=>{
 for(const [identity,head]of Object.entries({man:'normal',woman:'long',boy:'pixie',girl:'bun'})){
  const subject={...element(),contextualProperties:{'model.identity.modelPreset':identity,'model.appearance.hairStyle':'side_part'}};
  expect(renderToStaticMarkup(createElement(ModelPortrait,{element:subject}))).toContain(`data-hairstyle="${head}"`);
  expect(renderToStaticMarkup(createElement(ModelPortrait,{element:{...subject,contextualProperties:{...subject.contextualProperties,'model.appearance.hairStyle':'unspecified'}}}))).toContain(`data-hairstyle="${head}"`);
  expect(renderToStaticMarkup(createElement(ModelPortrait,{element:{...subject,contextualProperties:{...subject.contextualProperties,'model.appearance.hairStyle':'pixie'}}}))).toContain('data-hairstyle="pixie"');
 }
});
it.each(["T-shirt", "Shirt", "Hoodie"] as const)("keeps %s artwork noninteractive and recolorable", (name) => {
  const html = renderToStaticMarkup(createElement(GarmentReference, { name, element: element() }));
  expect(html).toContain('data-artwork-part="upperbody"');
  expect(html).toContain('fill="none"'); expect(html).toContain('fill="var(--model-garment)"');
  expect(html).toContain(`<figcaption>${name}</figcaption>`); expect(html).not.toContain("<button");
});
it("bundles ten standalone SVG sources without scripts or external references", () => {
  const directory = new URL("./assets/croods/", import.meta.url);
  const files = readdirSync(directory).filter(name => name.endsWith(".svg")); expect(files).toHaveLength(10);
  for (const name of files) {
    const svg = readFileSync(new URL(name, directory), "utf8");
    expect(svg).toMatch(/^<svg\b[^>]*viewBox=/); expect(svg).toContain('fill="none"');
    expect(svg).not.toMatch(/<script|<foreignObject|\son\w+=|(?:href|src)=|<!DOCTYPE/i);
  }
});
