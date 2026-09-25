import type { Motif } from "./paints";
import { Avatar, Sparkle } from "./parts";

/** Social media surface motifs: a feed post card, a story frame, a reel
 * frame, a profile grid and a floating-reaction card. */
export const socialMotifs = {
  "social-post": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect
          {...p.paper}
          {...p.edge}
          x="20"
          y="20"
          width="260"
          height="260"
          rx="14"
        />
        <circle {...p.tint} cx="46" cy="46" r="14" />
        <rect {...p.dim} x="68" y="40" width="70" height="10" rx="5" />
        <rect {...p.tint} x="30" y="70" width="240" height="140" />
        <circle {...p.accent} cx="46" cy="234" r="10" />
        <circle {...p.soft} cx="76" cy="234" r="10" />
        <circle {...p.soft} cx="106" cy="234" r="10" />
        <rect {...p.soft} x="30" y="254" width="160" height="8" rx="4" />
      </>
    ),
  },
  "social-story": {
    viewBox: "0 0 220 360",
    body: (p) => (
      <>
        <rect {...p.ink} x="14" y="14" width="192" height="332" rx="20" />
        <rect {...p.paper} x="22" y="42" width="176" height="290" rx="10" />
        <rect {...p.soft} x="30" y="24" width="52" height="4" rx="2" />
        <rect {...p.accent} x="86" y="24" width="52" height="4" rx="2" />
        <rect {...p.soft} x="142" y="24" width="52" height="4" rx="2" />
        <Avatar p={p} cx={46} cy={60} r={12} />
        <rect {...p.dim} x="64" y="54" width="60" height="10" rx="5" />
        <rect {...p.soft} x="30" y="300" width="140" height="12" rx="6" />
      </>
    ),
  },
  "social-reel": {
    viewBox: "0 0 220 360",
    body: (p) => (
      <>
        <rect {...p.ink} x="14" y="14" width="192" height="332" rx="20" />
        <rect {...p.tint} x="22" y="22" width="176" height="316" rx="12" />
        <circle {...p.paper} cx="110" cy="180" r="30" />
        <path {...p.accent} d="M100 165l40 15l-40 15Z" />
        <circle {...p.soft} cx="186" cy="230" r="12" />
        <circle {...p.soft} cx="186" cy="264" r="12" />
        <circle {...p.soft} cx="186" cy="298" r="12" />
      </>
    ),
  },
  "social-profile": {
    viewBox: "0 0 300 340",
    body: (p) => (
      <>
        <Avatar p={p} cx={150} cy={60} r={30} />
        <rect {...p.dim} x="120" y="100" width="60" height="10" rx="5" />
        <rect {...p.soft} x="70" y="122" width="34" height="16" rx="4" />
        <rect {...p.soft} x="133" y="122" width="34" height="16" rx="4" />
        <rect {...p.soft} x="196" y="122" width="34" height="16" rx="4" />
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              {...p.tint}
              x={60 + col * 66}
              y={158 + row * 56}
              width="56"
              height="48"
              rx="6"
            />
          )),
        )}
      </>
    ),
  },
  "social-reactions": {
    viewBox: "0 0 260 220",
    body: (p) => (
      <>
        <rect {...p.soft} x="20" y="20" width="220" height="180" rx="16" />
        <circle {...p.accent} cx="70" cy="70" r="24" />
        <path
          fill="#fff"
          d="M70 60c-6-8-20-4-20 6c0 12 20 22 20 22s20-10 20-22c0-10-14-14-20-6Z"
        />
        <circle {...p.tint} cx="150" cy="58" r="20" />
        <Sparkle x={150} y={58} size={11} fill={p.accent.fill} />
        <circle {...p.dim} cx="204" cy="92" r="18" />
        <path
          fill="#fff"
          d="M197 92l5 5l9 -11"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
} satisfies Record<string, Motif>;
