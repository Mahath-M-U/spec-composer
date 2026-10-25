import type { Motif } from "./paints";
import { TextLines } from "./parts";

/**
 * Scene starter motifs: inline art for the Assets panel's six direct
 * insertion presets (asset-presets.ts), so each dropped region shows
 * relevant artwork instead of a flat filled rectangle.
 */
export const sceneStarterMotifs = {
  "scene-pedestal": {
    viewBox: "0 0 320 80",
    body: (p) => (
      <>
        <ellipse {...p.shade} cx="160" cy="74" rx="124" ry="5" />
        <rect {...p.soft} x="56" y="26" width="208" height="42" rx="4" />
        <rect {...p.dim} x="56" y="54" width="208" height="14" rx="4" />
        <ellipse {...p.paper} {...p.edge} cx="160" cy="26" rx="104" ry="14" />
      </>
    ),
  },
  "scene-backdrop": {
    viewBox: "0 0 480 320",
    body: (p) => (
      <>
        <rect {...p.tint} x="0" y="0" width="480" height="230" />
        <path {...p.soft} d="M0 230Q240 192 480 230V320H0Z" />
        <circle {...p.soft} cx="150" cy="100" r="86" />
        <circle {...p.soft} cx="356" cy="64" r="56" />
        <path {...p.soft} d="M60 150Q240 112 420 150Q240 132 60 150Z" />
      </>
    ),
  },
  "scene-copy-space": {
    viewBox: "0 0 320 180",
    body: (p) => (
      <>
        <rect
          {...p.strokeInk}
          strokeOpacity={0.35}
          strokeWidth="3"
          strokeDasharray="10 8"
          x="12"
          y="12"
          width="296"
          height="156"
          rx="10"
        />
        <rect {...p.ink} x="36" y="40" width="140" height="16" rx="8" />
        <TextLines p={p} x={36} y={78} width={248} lines={4} gap={20} height={9} />
      </>
    ),
  },
  "scene-callout": {
    viewBox: "0 0 240 80",
    body: (p) => (
      <>
        <path
          {...p.paper}
          {...p.edge}
          d="M32 8H208Q220 8 220 20V42Q220 54 208 54H64L44 76L48 54H32Q20 54 20 42V20Q20 8 32 8Z"
        />
        <circle {...p.accent} cx="20" cy="18" r="7" />
        <TextLines p={p} x={40} y={24} width={160} lines={2} gap={16} height={8} />
      </>
    ),
  },
} satisfies Record<string, Motif>;
