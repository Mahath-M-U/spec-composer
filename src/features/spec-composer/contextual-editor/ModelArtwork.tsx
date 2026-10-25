import type { CSSProperties } from "react";
import type { SpecElement } from "../types";
import { modelGeometry, modelValue } from "./model-preview";
import normalHead from "./assets/croods/head-normal.svg?raw";
import longHairHead from "./assets/croods/head-long-hair.svg?raw";
import bunHead from "./assets/croods/head-bun.svg?raw";
import pixieHead from "./assets/croods/head-pixie.svg?raw";
import normalFace from "./assets/croods/face-normal.svg?raw";
import happyFace from "./assets/croods/face-happy.svg?raw";
import sadFace from "./assets/croods/face-sad.svg?raw";
import tShirt from "./assets/croods/upperbody-t-shirt.svg?raw";
import shirt from "./assets/croods/upperbody-shirt.svg?raw";
import hoodie from "./assets/croods/upperbody-hoodie.svg?raw";

export const artworkAttribution = "Adapted from Croods by Vijay Verma / illlustrations.co. CC BY 4.0, https://creativecommons.org/licenses/by/4.0/.";

// Only reviewed bundled constants enter raw markup. User colors are supplied
// through React style properties, never interpolated into SVG source strings.
function artwork(source: string, red: "hair" | "garment", skin = true) {
  return source.replace(/^<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "")
    .replace(/fill="#FF0000"/g, `fill="var(--model-${red})"`)
    .replace(/fill="#FFE900"/g, 'fill="var(--model-garment)"')
    .replace(/fill="white"/g, skin ? 'fill="var(--model-skin)"' : 'fill="white"');
}
const heads = { normal: artwork(normalHead, "hair"), long: artwork(longHairHead, "hair"), bun: artwork(bunHead, "hair"), pixie: artwork(pixieHead, "hair") };
const faces = { normal: artwork(normalFace, "hair", false), happy: artwork(happyFace, "hair", false), sad: artwork(sadFace, "hair", false) };
const garments = { "T-shirt": artwork(tShirt, "garment"), Shirt: artwork(shirt, "garment"), Hoodie: artwork(hoodie, "garment") };
export const supportedHairStyles = ["unspecified", "loose", "pixie", "side_part", "bun", "updo"];
export const supportedExpressions = ["neutral", "happy", "smiling", "serious", "confident", "thoughtful", "sad"];
function headStyle(element: SpecElement): keyof typeof heads {
  const style = element.contextualProperties?.["model.appearance.hairStyle"], identity = modelValue(element, "model.identity.modelPreset");
  const defaults: Record<string, keyof typeof heads> = {man:"normal",woman:"long",boy:"pixie",girl:"bun"};
  return style === "bun" || style === "updo" ? "bun" : style === "pixie" ? "pixie" : style === "loose" ? "long" : defaults[String(identity)] ?? "normal";
}
function faceStyle(expression: string): keyof typeof faces {
  return ["happy", "smiling", "confident"].includes(expression) ? "happy" : expression === "sad" ? "sad" : "normal";
}
function colors(skin: string, hair: string, garment?: string): CSSProperties {
  return { "--model-skin": skin, "--model-hair": hair, "--model-garment": garment } as CSSProperties;
}
export function ModelHeadArtwork({ element, expression, skin, hair }: { element: SpecElement; expression?: string; skin: string; hair: string }) {
  const head = headStyle(element), face = faceStyle(expression ?? String(modelValue(element, "model.expression.expression")));
  return <g data-artwork="croods" data-hairstyle={head} data-expression={face} fill="none" style={colors(skin, hair)}>
    <desc>{artworkAttribution}</desc>
    <g data-artwork-part="head" transform="translate(106 40)" dangerouslySetInnerHTML={{ __html: heads[head] }} />
    <g data-artwork-part="face" transform="translate(184 127)" dangerouslySetInnerHTML={{ __html: faces[face] }} />
  </g>;
}
export function ModelPortrait({ element, expression }: { element: SpecElement; expression?: string }) {
  const model = modelGeometry(element);
  return <svg className="model-artwork-portrait" xmlns="http://www.w3.org/2000/svg" viewBox="100 35 420 410" width="96" height="112" aria-hidden="true"><ModelHeadArtwork element={element} {...(expression === undefined ? {} : { expression })} skin={model.skin} hair={model.hair} /></svg>;
}
export function GarmentReference({ name, element }: { name: keyof typeof garments; element: SpecElement }) {
  const model = modelGeometry(element);
  return <figure><svg xmlns="http://www.w3.org/2000/svg" viewBox="240 0 500 620" width="76" height="88" aria-hidden="true" fill="none" style={colors(model.skin, model.hair, model.primary)}><desc>{artworkAttribution}</desc><g data-artwork-part="upperbody" dangerouslySetInnerHTML={{ __html: garments[name] }} /></svg><figcaption>{name}</figcaption></figure>;
}
