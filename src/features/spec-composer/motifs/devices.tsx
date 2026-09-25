import type { Motif } from "./paints";
import { PhoneFrame } from "./parts";

/** Blank device chassis motifs: phone, tablet, desktop, smartwatch, browser
 * window and a two-device phone-plus-laptop scene. Every body paints
 * through `p.*` only, so PNG export keeps their colors. */
export const deviceMotifs = {
  "devices-phone-blank": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.soft} x="84" y="50" width="112" height="316" rx="14" />
      </PhoneFrame>
    ),
  },
  "devices-tablet": {
    viewBox: "0 0 360 420",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="180" cy="398" rx="118" ry="9" />
        <rect {...p.ink} x="40" y="24" width="280" height="360" rx="20" />
        <rect {...p.paper} x="58" y="42" width="244" height="324" rx="8" />
        <circle {...p.dim} cx="180" cy="24" r="0" />
        <circle {...p.dim} cx="180" cy="18" r="4" />
        <rect {...p.tint} x="76" y="60" width="208" height="90" rx="10" />
        <rect {...p.soft} x="76" y="164" width="98" height="76" rx="8" />
        <rect {...p.soft} x="186" y="164" width="98" height="76" rx="8" />
        <rect {...p.soft} x="76" y="252" width="208" height="14" rx="7" />
        <rect {...p.soft} x="76" y="274" width="150" height="14" rx="7" />
      </>
    ),
  },
  "devices-desktop-monitor": {
    viewBox: "0 0 400 320",
    body: (p) => (
      <>
        <rect {...p.ink} x="40" y="20" width="320" height="210" rx="14" />
        <rect {...p.paper} x="56" y="36" width="288" height="178" />
        <rect {...p.tint} x="72" y="52" width="256" height="70" rx="6" />
        <rect {...p.soft} x="72" y="132" width="120" height="12" rx="6" />
        <rect {...p.soft} x="72" y="152" width="180" height="12" rx="6" />
        <rect {...p.dim} x="184" y="230" width="32" height="34" />
        <rect {...p.ink} x="140" y="264" width="120" height="14" rx="7" />
      </>
    ),
  },
  "devices-smartwatch": {
    viewBox: "0 0 240 320",
    body: (p) => (
      <>
        <rect {...p.dim} x="96" y="8" width="48" height="46" rx="10" />
        <rect {...p.dim} x="96" y="266" width="48" height="46" rx="10" />
        <rect {...p.ink} x="66" y="72" width="108" height="176" rx="30" />
        <rect {...p.paper} x="82" y="88" width="76" height="144" rx="18" />
        <circle {...p.accent} cx="120" cy="122" r="16" />
        <rect {...p.soft} x="94" y="152" width="52" height="10" rx="5" />
        <rect {...p.soft} x="94" y="170" width="36" height="10" rx="5" />
        <rect {...p.tint} x="94" y="194" width="52" height="24" rx="8" />
        <circle {...p.dim} cx="176" cy="140" r="6" />
      </>
    ),
  },
  "devices-browser-blank": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <>
        <rect {...p.ink} x="6" y="6" width="408" height="288" rx="16" />
        <rect {...p.paper} x="10" y="40" width="400" height="250" />
        <circle {...p.dim} cx="28" cy="23" r="4" />
        <circle {...p.dim} cx="42" cy="23" r="4" />
        <circle {...p.dim} cx="56" cy="23" r="4" />
        <rect {...p.soft} x="80" y="16" width="220" height="14" rx="7" />
        <rect {...p.soft} x="30" y="60" width="360" height="200" rx="10" />
      </>
    ),
  },
  "devices-phone-laptop": {
    viewBox: "0 0 460 380",
    body: (p) => (
      <>
        <path {...p.dim} d="M60 300L100 340H420L400 300Z" />
        <rect {...p.ink} x="90" y="80" width="280" height="220" rx="10" />
        <rect {...p.paper} x="104" y="94" width="252" height="192" />
        <rect {...p.tint} x="118" y="108" width="130" height="60" rx="6" />
        <rect {...p.soft} x="118" y="180" width="180" height="12" rx="6" />
        <rect {...p.soft} x="118" y="200" width="130" height="12" rx="6" />
        <ellipse {...p.soft} cx="404" cy="330" rx="46" ry="7" />
        <rect {...p.ink} x="362" y="150" width="84" height="180" rx="16" />
        <rect {...p.paper} x="370" y="162" width="68" height="152" rx="8" />
        <circle {...p.accent} cx="404" cy="194" r="10" />
        <rect {...p.dim} x="384" y="216" width="40" height="6" rx="3" />
        <rect {...p.dim} x="384" y="230" width="30" height="6" rx="3" />
      </>
    ),
  },
} satisfies Record<string, Motif>;
