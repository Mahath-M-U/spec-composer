import type { Motif } from "./paints";
import { Avatar, BrowserFrame } from "./parts";

/** Web page motifs: a browser chassis (`BrowserFrame`) with a schematic page
 * layout drawn inside its content area, one per common site pattern. */
export const webUiMotifs = {
  "browser-landing": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        <rect {...p.dim} x="30" y="60" width="180" height="14" rx="7" />
        <rect {...p.soft} x="30" y="84" width="140" height="10" rx="5" />
        <rect {...p.accent} x="30" y="108" width="90" height="22" rx="11" />
        <rect {...p.tint} x="230" y="60" width="160" height="150" rx="8" />
      </BrowserFrame>
    ),
  },
  "browser-pricing": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        <rect {...p.soft} x="30" y="70" width="110" height="180" rx="10" />
        <rect {...p.accent} x="155" y="56" width="110" height="208" rx="10" />
        <rect {...p.soft} x="280" y="70" width="110" height="180" rx="10" />
        <rect {...p.paper} x="175" y="76" width="70" height="14" rx="7" />
        <rect {...p.paper} x="185" y="100" width="50" height="20" rx="6" />
      </BrowserFrame>
    ),
  },
  "browser-features": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        {[30, 150, 270].map((x, i) => (
          <g key={i}>
            <circle {...p.tint} cx={x + 40} cy={82} r="20" />
            <rect {...p.soft} x={x} y={114} width="90" height="10" rx="5" />
            <rect {...p.soft} x={x} y={130} width="70" height="8" rx="4" />
          </g>
        ))}
      </BrowserFrame>
    ),
  },
  "browser-testimonial": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        <rect {...p.tint} x="110" y="60" width="200" height="90" rx="10" />
        <Avatar p={p} cx={210} cy={182} r={18} />
        <rect {...p.soft} x="190" y="208" width="40" height="8" rx="4" />
      </BrowserFrame>
    ),
  },
  "browser-dashboard": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        <rect {...p.soft} x="10" y="40" width="70" height="250" />
        <rect {...p.tint} x="98" y="60" width="80" height="50" rx="6" />
        <rect {...p.tint} x="188" y="60" width="80" height="50" rx="6" />
        <rect {...p.tint} x="278" y="60" width="112" height="50" rx="6" />
        <rect {...p.soft} x="98" y="124" width="292" height="140" rx="8" />
      </BrowserFrame>
    ),
  },
  "browser-blog": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        <rect {...p.dim} x="30" y="56" width="200" height="16" rx="8" />
        <rect {...p.soft} x="30" y="88" width="240" height="8" rx="4" />
        <rect {...p.soft} x="30" y="102" width="240" height="8" rx="4" />
        <rect {...p.soft} x="30" y="116" width="180" height="8" rx="4" />
        <rect {...p.tint} x="300" y="56" width="90" height="100" rx="8" />
      </BrowserFrame>
    ),
  },
  "browser-404": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        <rect {...p.dim} x="140" y="70" width="140" height="46" rx="8" />
        <rect {...p.soft} x="150" y="132" width="120" height="10" rx="5" />
        <rect {...p.accent} x="170" y="158" width="80" height="22" rx="11" />
      </BrowserFrame>
    ),
  },
  "browser-signup": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        <rect
          {...p.paper}
          {...p.edge}
          x="130"
          y="56"
          width="160"
          height="200"
          rx="10"
        />
        <rect {...p.dim} x="150" y="72" width="80" height="12" rx="6" />
        <rect {...p.soft} x="150" y="100" width="120" height="20" rx="6" />
        <rect {...p.soft} x="150" y="128" width="120" height="20" rx="6" />
        <rect {...p.accent} x="150" y="160" width="120" height="22" rx="11" />
      </BrowserFrame>
    ),
  },
  "browser-store": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        {[
          [30, 60],
          [140, 60],
          [250, 60],
          [30, 170],
          [140, 170],
          [250, 170],
        ].map(([x, y], i) => (
          <g key={i}>
            <rect {...p.tint} x={x} y={y} width="100" height="80" rx="6" />
            <rect
              {...p.soft}
              x={x}
              y={(y ?? 0) + 88}
              width="60"
              height="8"
              rx="4"
            />
          </g>
        ))}
      </BrowserFrame>
    ),
  },
  "browser-portfolio": {
    viewBox: "0 0 420 300",
    body: (p) => (
      <BrowserFrame p={p}>
        <rect {...p.tint} x="30" y="56" width="110" height="90" rx="6" />
        <rect {...p.tint} x="150" y="56" width="110" height="140" rx="6" />
        <rect {...p.tint} x="270" y="56" width="120" height="60" rx="6" />
        <rect {...p.tint} x="30" y="156" width="110" height="90" rx="6" />
        <rect {...p.tint} x="270" y="126" width="120" height="120" rx="6" />
      </BrowserFrame>
    ),
  },
} satisfies Record<string, Motif>;
