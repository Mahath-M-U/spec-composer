import { cos, sin, type Motif } from "./paints";

/** Chart placeholder motifs: bar, line, pie, donut, area and a big-number
 * KPI card with a mini sparkline. */
const wedge = (
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
) => {
  const a1 = (startDeg * Math.PI) / 180;
  const a2 = (endDeg * Math.PI) / 180;
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${cx} ${cy}L${cx + r * cos(a1)} ${cy + r * sin(a1)}A${r} ${r} 0 ${large} 1 ${cx + r * cos(a2)} ${cy + r * sin(a2)}Z`;
};

const DONUT_C = 2 * Math.PI * 80;

export const chartMotifs = {
  "chart-bar": {
    viewBox: "0 0 300 220",
    body: (p) => (
      <>
        <path {...p.strokeInk} strokeWidth="2" d="M30 190H270" />
        {[70, 110, 150, 90, 130].map((h, i) => (
          <rect
            key={i}
            {...(i === 2 ? p.accent : p.soft)}
            x={54 + i * 42}
            y={190 - h}
            width="30"
            height={h}
            rx="4"
          />
        ))}
      </>
    ),
  },
  "chart-line": {
    viewBox: "0 0 300 220",
    body: (p) => (
      <>
        <path {...p.strokeInk} strokeWidth="2" d="M30 190H270" />
        <polyline
          fill="none"
          stroke={p.accent.fill}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="40,150 90,110 140,140 190,80 240,100"
        />
        {[
          [40, 150],
          [90, 110],
          [140, 140],
          [190, 80],
          [240, 100],
        ].map(([x, y], i) => (
          <circle key={i} {...p.accent} cx={x} cy={y} r="5" />
        ))}
      </>
    ),
  },
  "chart-pie": {
    viewBox: "0 0 280 280",
    body: (p) => (
      <>
        <path {...p.accent} d={wedge(140, 140, 90, -90, 60)} />
        <path {...p.tint} d={wedge(140, 140, 90, 60, 200)} />
        <path {...p.soft} d={wedge(140, 140, 90, 200, 270)} />
      </>
    ),
  },
  "chart-donut": {
    viewBox: "0 0 280 280",
    body: (p) => (
      <>
        <circle
          fill="none"
          stroke={p.soft.fill}
          strokeWidth="28"
          cx="140"
          cy="140"
          r="80"
        />
        <circle
          fill="none"
          stroke={p.accent.fill}
          strokeWidth="28"
          cx="140"
          cy="140"
          r="80"
          strokeDasharray={`${DONUT_C * 0.45} ${DONUT_C}`}
          transform="rotate(-90 140 140)"
        />
        <circle
          fill="none"
          stroke={p.ink.fill}
          strokeWidth="28"
          cx="140"
          cy="140"
          r="80"
          strokeDasharray={`${DONUT_C * 0.2} ${DONUT_C}`}
          strokeDashoffset={-DONUT_C * 0.45}
          transform="rotate(-90 140 140)"
        />
      </>
    ),
  },
  "chart-area": {
    viewBox: "0 0 300 220",
    body: (p) => (
      <>
        <path
          {...p.tint}
          d="M30 190L30 140L80 120L130 150L180 90L230 110L270 70L270 190Z"
        />
        <polyline
          fill="none"
          stroke={p.accent.fill}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="30,140 80,120 130,150 180,90 230,110 270,70"
        />
        <path {...p.strokeInk} strokeWidth="2" d="M30 190H270" />
      </>
    ),
  },
  "chart-kpi": {
    viewBox: "0 0 260 180",
    body: (p) => (
      <>
        <rect {...p.dim} x="30" y="30" width="120" height="20" rx="8" />
        <path {...p.accent} d="M186 30l14 -20l14 20h-10v20h-8V30Z" />
        <polyline
          fill="none"
          stroke={p.accent.fill}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="30,140 70,120 110,132 150,100 190,110 230,80"
        />
        <rect {...p.soft} x="30" y="152" width="90" height="10" rx="5" />
      </>
    ),
  },
} satisfies Record<string, Motif>;
