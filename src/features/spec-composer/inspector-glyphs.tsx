import type { ReactElement, SVGProps } from "react";

/** Shared wrapper for every inspector glyph: monochrome, 16x16, no text. */
function Svg({ children }: { children: ReactElement | ReactElement[] }) {
  const props: SVGProps<SVGSVGElement> = {
    viewBox: "0 0 16 16",
    width: 14,
    height: 14,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
    className: "inspector-glyph",
  };
  return <svg {...props}>{children}</svg>;
}

const GLYPHS = {
  // --- Sections -----------------------------------------------------------
  transform: (
    <Svg>
      <rect x="3.5" y="3.5" width="9" height="9" rx="1" />
      <path d="M3.5 5.5v-2h2M12.5 5.5v-2h-2M3.5 10.5v2h2M12.5 10.5v2h-2" />
    </Svg>
  ),
  appearance: (
    <Svg>
      <circle cx="8" cy="8" r="5" />
      <path d="M8 3a5 5 0 0 1 0 10Z" fill="currentColor" stroke="none" />
    </Svg>
  ),
  material: (
    <Svg>
      <rect x="3" y="3" width="10" height="10" rx="1" />
      <path d="M3 7h10M3 10h10M7 3v10M10 3v10" />
    </Svg>
  ),
  content: (
    <Svg>
      <path d="M3.5 4.5h9M3.5 8h9M3.5 11.5h6" />
    </Svg>
  ),
  background: (
    <Svg>
      <rect x="3" y="6" width="8" height="7" rx="1" />
      <path d="M5 4.5h8v7" />
    </Svg>
  ),
  // --- Field prefixes ------------------------------------------------------
  rotation: (
    <Svg>
      <path d="M12.3 5.2A4.8 4.8 0 1 0 13 8" />
      <path d="M12.3 2.4v3.2h-3.2" />
    </Svg>
  ),
  opacity: (
    <Svg>
      <circle cx="8" cy="8" r="5" />
      <path d="M8 3a5 5 0 0 1 0 10Z" fill="currentColor" stroke="none" />
    </Svg>
  ),
  "line-height": (
    <Svg>
      <path d="M4.5 4h4M4.5 12h4" />
      <path d="M11.5 3.5v9M9.8 5.2 11.5 3.5l1.7 1.7M9.8 10.8l1.7 1.7 1.7-1.7" />
    </Svg>
  ),
  "letter-spacing": (
    <Svg>
      <path d="M5.5 4v8M10.5 4v8" />
      <path d="M2.5 8h2.2M11.3 8h2.2M3.7 6.8 2.5 8l1.2 1.2M12.3 6.8 13.5 8l-1.2 1.2" />
    </Svg>
  ),
  "border-width": (
    <Svg>
      <rect x="3" y="3" width="10" height="10" rx="1" strokeWidth={1.4} />
      <path d="M3 3h10" strokeWidth={3} />
    </Svg>
  ),
  "corner-radius": (
    <Svg>
      <path d="M13 13H9a5 5 0 0 1-5-5V4" />
      <path d="M3 8V4h4" />
    </Svg>
  ),
  angle: (
    <Svg>
      <path d="M3.5 12.5h9M3.5 12.5 10 3.5" />
      <path d="M6.5 12.5a3.5 3.5 0 0 1 1.4-2.8" />
    </Svg>
  ),
  // --- Selection kinds -----------------------------------------------------
  "kind-text": (
    <Svg>
      <path d="M4 4.5h8M8 4.5v7" />
    </Svg>
  ),
  "kind-image": (
    <Svg>
      <rect x="2.5" y="3" width="11" height="10" rx="1" />
      <circle cx="6" cy="6.5" r="1.1" />
      <path d="M3.5 11.5 7 8l2 2 2.5-3 1 1.5" />
    </Svg>
  ),
  "kind-shape": (
    <Svg>
      <circle cx="6" cy="6" r="3.3" />
      <rect x="8.2" y="8.2" width="5" height="5" rx="1" />
    </Svg>
  ),
  "kind-mixed": (
    <Svg>
      <rect x="4" y="2.5" width="8" height="5" rx="1" />
      <rect x="2.5" y="8.5" width="11" height="5" rx="1" />
    </Svg>
  ),
} as const;

export type InspectorGlyphName = keyof typeof GLYPHS;

export function InspectorGlyph({ name }: { name: InspectorGlyphName }) {
  return GLYPHS[name];
}
