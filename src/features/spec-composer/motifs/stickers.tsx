import type { Motif } from "./paints";

/** Tier C sticker motifs: bold, white-outlined glyphs for the icons category. */
export const stickerMotifs = {
  "sticker-star": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <path
        fill={p.accent.fill}
        stroke="#fff"
        strokeWidth="8"
        strokeLinejoin="round"
        d="M150 50L172 115H240L185 155L206 220L150 180L94 220L115 155L60 115H128Z"
      />
    ),
  },
  "sticker-heart": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <path
        fill={p.accent.fill}
        stroke="#fff"
        strokeWidth="8"
        strokeLinejoin="round"
        d="M150 220C70 170 50 110 95 80C120 63 150 85 150 110C150 85 180 63 205 80C250 110 230 170 150 220Z"
      />
    ),
  },
  "sticker-check": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <circle
          fill={p.accent.fill}
          stroke="#fff"
          strokeWidth="8"
          cx="150"
          cy="150"
          r="90"
        />
        <path
          fill="none"
          stroke="#fff"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M110 155L140 185L195 120"
        />
      </>
    ),
  },
  "sticker-arrow": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <circle
          fill={p.accent.fill}
          stroke="#fff"
          strokeWidth="8"
          cx="150"
          cy="150"
          r="90"
        />
        <path
          fill="none"
          stroke="#fff"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M110 150H190M160 120L190 150L160 180"
        />
      </>
    ),
  },
  "sticker-bolt": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <path
        fill={p.accent.fill}
        stroke="#fff"
        strokeWidth="8"
        strokeLinejoin="round"
        d="M170 50L90 170H140L130 250L215 120H160Z"
      />
    ),
  },
  "sticker-fire": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <path
        fill={p.accent.fill}
        stroke="#fff"
        strokeWidth="8"
        strokeLinejoin="round"
        d="M150 60C120 110 90 130 100 180C108 216 135 240 150 240C165 240 192 216 200 180C210 130 180 110 150 60Z"
      />
    ),
  },
  "sticker-crown": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <path
        fill={p.accent.fill}
        stroke="#fff"
        strokeWidth="8"
        strokeLinejoin="round"
        d="M70 200L60 110L110 150L150 90L190 150L240 110L230 200Z"
      />
    ),
  },
  "sticker-thumbs-up": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <path
        fill={p.accent.fill}
        stroke="#fff"
        strokeWidth="8"
        strokeLinejoin="round"
        d="M110 140V230H90V140ZM130 140L150 70Q160 60 170 75L165 130H210Q225 130 220 150L205 210Q198 225 180 225H130V140Z"
      />
    ),
  },
} satisfies Record<string, Motif>;
