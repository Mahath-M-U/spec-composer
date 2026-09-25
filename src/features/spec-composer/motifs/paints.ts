import type { ReactNode, SVGProps } from "react";

/**
 * Shared paint palette and geometry primitives for placeholder motifs. Paint
 * is set as SVG attributes with concrete colors, never CSS classes or
 * variables: html-to-image clones an <svg> subtree without inlining its
 * children's computed styles, so stylesheet paint would be lost in PNG
 * export. Every motif body must paint through `p.*` only for that reason.
 */

export interface ArtColors {
  accent: string;
  ink: string;
}

type Paint = SVGProps<SVGElement>;

export function paints({ accent, ink }: ArtColors) {
  return {
    accent: { fill: accent },
    ink: { fill: ink },
    dim: { fill: ink, fillOpacity: 0.45 },
    tint: { fill: accent, fillOpacity: 0.26 },
    soft: { fill: ink, fillOpacity: 0.12 },
    shade: { fill: "#000", fillOpacity: 0.14 },
    paper: { fill: "#fff" },
    shine: { fill: "#fff", fillOpacity: 0.6 },
    skin: { fill: "#E7B48F" },
    /** Fixed deep skin tone (illustrations.tsx SKIN.deep), for figures described as dark-skinned. */
    skinDeep: { fill: "#8D5524" },
    /** Fixed opaque near-black, for iron, dark glass and other unlit-but-solid detail. */
    deep: { fill: "#1B1B1E" },
    /** Fixed near-black hair, distinct from `dim`/`shade` which follow the ink. */
    hair: { fill: "#2B2118" },
    /** Fixed brown hair (illustrations.tsx HAIR.brown), for figures described as brown-haired. */
    hairBrown: { fill: "#6B4226" },
    /** Fixed denim colors: brand kits recolor the environment, not clothing fabric. */
    denim: { fill: "#8FA6C2" },
    denimShade: { fill: "#6F87A6" },
    edge: { stroke: ink, strokeOpacity: 0.18, strokeWidth: 2 },
    strokeInk: { fill: "none", stroke: ink, strokeLinecap: "round" },
    crowdBack: { fill: ink, fillOpacity: 0.45 },
    crowdFront: { fill: ink, fillOpacity: 0.85 },
    steam: {
      fill: "none",
      stroke: ink,
      strokeOpacity: 0.35,
      strokeLinecap: "round",
    },
    accentStroke: { fill: "none", stroke: accent, strokeLinecap: "round" },
    limb: {
      fill: "none",
      stroke: ink,
      strokeWidth: 20,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    skinLimb: {
      fill: "none",
      stroke: "#E7B48F",
      strokeWidth: 14,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    string: {
      fill: "none",
      stroke: "#fff",
      strokeOpacity: 0.7,
      strokeWidth: 1.5,
    },
  } satisfies Record<string, Paint>;
}

export type Paints = ReturnType<typeof paints>;

// Trig results can differ in the last bits between the server and browser
// engines; rounding keeps server-rendered SVG attributes identical on hydration.
export const cos = (rad: number) => Math.round(Math.cos(rad) * 1e4) / 1e4;
export const sin = (rad: number) => Math.round(Math.sin(rad) * 1e4) / 1e4;

export interface Motif {
  viewBox: string;
  /**
   * `uid` namespaces any `<defs>` id (gradients, clip paths, filters) to the
   * motif instance: the same motif can render more than once on one page
   * (the Assets tiles and the canvas, or a contact sheet), so a literal id
   * would collide and one instance's gradient would silently paint another's
   * shape. Always write `id={uid("name")}` and reference it as
   * `` `url(#${uid("name")})` ``, never a bare string.
   */
  body: (p: Paints, uid: (name: string) => string) => ReactNode;
}
