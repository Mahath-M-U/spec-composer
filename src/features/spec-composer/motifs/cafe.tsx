import type { Motif } from "./paints";

/**
 * Scene motif: follow the "Scene style guide" in docs/template-vectors/
 * README.md (5-25 opaque flat shapes, see-through only for light and shadow).
 * A sunlit cafe window seat for the Cafe Morning template: the interior (with
 * the window and table that reach the frame's rounded corners drawn inside
 * it), a hanging plant, the man in a rust knit and his mug. Skin and hair are
 * fixed paints; the knit follows the accent.
 */
export const cafeMotifs = {
  "cafe-interior": {
    viewBox: "0 0 1000 900",
    body: (p) => (
      <>
        {/* Wall, then the dark back wall on the left. */}
        <rect x="0" y="0" width="1000" height="900" {...p.paper} />
        <rect x="0" y="0" width="290" height="830" {...p.ink} />
        {/* Pale wall panel behind the head, so dark hair reads. */}
        <rect x="290" y="0" width="390" height="830" {...p.paper} />
        <rect
          x="290"
          y="0"
          width="390"
          height="830"
          {...p.tint}
          fillOpacity={0.14}
        />
        {/* Pendant lamp glow and a blank chalkboard on the dark wall. */}
        <circle cx="150" cy="205" r="48" fill="#F2C879" fillOpacity={0.35} />
        <circle cx="150" cy="205" r="20" fill="#F2C879" />
        <rect x="0" y="100" width="94" height="184" {...p.accent} />
        <rect x="0" y="112" width="82" height="160" {...p.deep} />
        {/* Window: bright street view with a black frame, top right. */}
        <rect x="680" y="0" width="320" height="830" fill="#F3E6C9" />
        <circle cx="880" cy="110" r="95" fill="#D9C25A" />
        <rect
          x="900"
          y="250"
          width="100"
          height="250"
          {...p.accent}
          fillOpacity={0.5}
        />
        <rect x="670" y="0" width="120" height="567" {...p.deep} />
        <rect x="670" y="504" width="330" height="63" {...p.deep} />
        {/* Sill. */}
        <rect x="670" y="567" width="330" height="20" {...p.ink} />
        {/* Wooden table. */}
        <rect x="0" y="819" width="1000" height="81" {...p.ink} />
        <rect
          x="0"
          y="819"
          width="1000"
          height="14"
          fill="#fff"
          fillOpacity={0.14}
        />
      </>
    ),
  },

  "hanging-plant": {
    viewBox: "0 0 200 340",
    body: (p) => (
      <>
        {/* Trailing stems from the top edge. */}
        <path d="M40 0 L52 0 L64 330 L54 330 Z" fill="#4F7A47" />
        <path d="M98 0 L110 0 L132 250 L124 250 Z" fill="#4F7A47" />
        <path d="M150 0 L160 0 L146 200 L138 200 Z" fill="#4F7A47" />
        {/* Leaves. */}
        <ellipse cx="34" cy="70" rx="24" ry="14" fill="#6F9A62" />
        <ellipse cx="68" cy="130" rx="24" ry="14" fill="#8DB27A" />
        <ellipse cx="40" cy="200" rx="24" ry="14" fill="#6F9A62" />
        <ellipse cx="66" cy="280" rx="24" ry="14" fill="#8DB27A" />
        <ellipse cx="118" cy="60" rx="24" ry="14" fill="#8DB27A" />
        <ellipse cx="138" cy="150" rx="24" ry="14" fill="#6F9A62" />
        <ellipse cx="150" cy="80" rx="22" ry="13" fill="#6F9A62" />
        <ellipse cx="128" cy="230" rx="22" ry="13" fill="#8DB27A" />
      </>
    ),
  },

  "person-cafe": {
    viewBox: "0 0 1000 942",
    body: (p) => (
      <>
        {/* Rust knit: torso and shoulders. */}
        <path
          d="M0 942 L0 640 C0 520 70 470 200 440 C320 410 400 388 462 378 L668 366 C790 356 900 372 950 470 C1000 560 1000 700 1000 942 Z"
          {...p.accent}
        />
        {/* Neck and V collar. */}
        <rect x="512" y="330" width="116" height="80" rx="22" {...p.skin} />
        <path d="M462 378 L668 366 L575 480 Z" {...p.skin} />
        {/* Sideburn, face, stubble and top hair. */}
        <ellipse cx="418" cy="215" rx="70" ry="110" {...p.hair} />
        <ellipse cx="585" cy="232" rx="146" ry="167" {...p.skin} />
        <path
          d="M459 315 A146 167 0 0 0 711 315 Q585 345 459 315 Z"
          {...p.hair}
          fillOpacity={0.6}
        />
        <ellipse cx="560" cy="70" rx="205" ry="76" {...p.hair} />
        <circle cx="700" cy="110" r="62" {...p.hair} />
        {/* Raised arm: darker upper sleeve, forearm sleeve, wrist and hand toward the mug. */}
        <path
          d="M0 600 C0 500 120 450 200 470 L300 620 L260 850 L0 900 Z"
          fill="#000"
          fillOpacity={0.14}
        />
        <path d="M150 830 L330 610 L440 690 L300 900 Z" {...p.accent} />
        <path d="M150 830 L330 610 L440 690 L300 900 Z" {...p.shade} />
        <path
          d="M380 660 L450 570 C500 500 590 470 640 520 L640 600 C600 660 500 720 430 720 Z"
          {...p.skin}
        />
        {/* Resting forearm along the table, cuff, and hand. */}
        <rect x="520" y="770" width="480" height="172" rx="40" {...p.accent} />
        <rect x="520" y="770" width="480" height="172" rx="40" {...p.shade} />
        <ellipse cx="450" cy="905" rx="72" ry="34" {...p.skin} />
      </>
    ),
  },

  "mug-ceramic": {
    viewBox: "0 0 140 130",
    body: (p) => (
      <>
        {/* Handle on the left, where the fingers wrap. */}
        <path
          d="M34 40 C0 36 0 98 34 94 L34 82 C14 84 14 52 34 52 Z"
          fill="#EFE2CB"
        />
        <path
          d="M34 40 C0 36 0 98 34 94 L34 82 C14 84 14 52 34 52 Z"
          {...p.shade}
        />
        {/* Speckled cream body with a brown rim and foot. */}
        <rect x="30" y="12" width="92" height="106" rx="14" fill="#EFE2CB" />
        <rect x="30" y="12" width="26" height="106" rx="12" {...p.shade} />
        <rect x="30" y="12" width="92" height="12" rx="6" {...p.ink} />
        <rect x="34" y="106" width="84" height="12" rx="6" {...p.ink} />
      </>
    ),
  },
} satisfies Record<string, Motif>;
