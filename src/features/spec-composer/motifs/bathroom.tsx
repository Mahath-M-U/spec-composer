import type { Motif } from "./paints";

/**
 * Scene motif: follow the "Scene style guide" in docs/template-vectors/
 * README.md (5-25 opaque flat shapes, see-through only for light and shadow).
 * A bright bathroom and the woman in it, as separate flat pieces (one catalog
 * item each) for the Everyday Skincare template. The wall carries the pieces
 * that reach the frame's rounded corners (window, cabinet); the towel, vase
 * and pump bottle are their own layers. Skin and hair are fixed paints.
 */
export const bathroomMotifs = {
  "bathroom-wall": {
    viewBox: "0 0 1000 934",
    body: (p) => (
      <>
        {/* Near-white wall with a breath of accent. */}
        <rect x="0" y="0" width="1000" height="934" {...p.paper} />
        <rect
          x="0"
          y="0"
          width="1000"
          height="934"
          {...p.tint}
          fillOpacity={0.08}
        />
        {/* Shower recess on the left. */}
        <rect x="0" y="0" width="140" height="590" {...p.soft} />
        {/* Black-framed window with a green view, top right. */}
        <rect x="880" y="0" width="120" height="440" {...p.deep} />
        <rect x="908" y="0" width="92" height="412" fill="#A9BF8F" />
        <rect x="880" y="196" width="120" height="14" {...p.deep} />
        <rect x="790" y="436" width="210" height="30" {...p.soft} />
        {/* Vanity counter and wooden cabinet, bottom right. */}
        <rect x="760" y="694" width="240" height="46" {...p.soft} />
        <rect x="760" y="740" width="240" height="194" {...p.accent} />
        <rect x="760" y="740" width="240" height="194" {...p.shade} />
        <rect x="760" y="740" width="240" height="14" {...p.shade} />
      </>
    ),
  },

  "bathroom-towel": {
    viewBox: "0 0 130 450",
    body: (p) => (
      <>
        {/* Hook. */}
        <rect x="55" y="0" width="20" height="30" rx="8" {...p.accent} />
        <circle cx="65" cy="34" r="12" {...p.accent} />
        {/* Towel: white, shaded a step darker so it reads on the wall. */}
        <path d="M14 30 L116 30 L124 440 L6 440 Z" {...p.paper} />
        <path d="M14 30 L116 30 L124 440 L6 440 Z" {...p.shade} />
        <path d="M14 30 L60 30 L44 440 L6 440 Z" {...p.soft} />
      </>
    ),
  },

  "plant-vase": {
    viewBox: "0 0 200 470",
    body: (p) => (
      <>
        {/* Stems. */}
        <path d="M100 330 L58 96 L66 92 L108 330 Z" fill="#5F8562" />
        <path d="M100 330 L150 120 L158 124 L112 330 Z" fill="#5F8562" />
        <path d="M100 330 L100 40 L110 40 L112 330 Z" fill="#5F8562" />
        {/* Leaves. */}
        <ellipse cx="46" cy="130" rx="26" ry="16" fill="#7EA27A" />
        <ellipse cx="70" cy="60" rx="24" ry="15" fill="#7EA27A" />
        <ellipse cx="146" cy="88" rx="26" ry="16" fill="#7EA27A" />
        <ellipse cx="164" cy="160" rx="24" ry="15" fill="#5F8562" />
        <ellipse cx="88" cy="196" rx="28" ry="17" fill="#5F8562" />
        <ellipse cx="128" cy="250" rx="26" ry="16" fill="#7EA27A" />
        <ellipse cx="106" cy="30" rx="22" ry="16" fill="#7EA27A" />
        {/* Speckled ceramic vase. */}
        <path
          d="M56 330 L144 330 Q170 380 158 440 Q150 470 100 470 Q50 470 42 440 Q30 380 56 330 Z"
          {...p.accent}
        />
        <path
          d="M56 330 L144 330 Q170 380 158 440 Q150 470 100 470 Q50 470 42 440 Q30 380 56 330 Z"
          fill="#fff"
          fillOpacity={0.4}
        />
      </>
    ),
  },

  "skincare-pump": {
    viewBox: "0 0 60 180",
    body: (p) => (
      <>
        {/* Blank label: the source bottle's text is illegible, so none is drawn. */}
        <rect x="8" y="66" width="44" height="108" rx="10" {...p.accent} />
        <rect x="14" y="98" width="32" height="50" rx="4" {...p.paper} />
        <rect x="22" y="48" width="16" height="20" rx="3" {...p.deep} />
        <rect x="26" y="20" width="8" height="30" rx="3" {...p.deep} />
        <rect x="14" y="8" width="34" height="16" rx="6" {...p.deep} />
      </>
    ),
  },

  "bust-skincare": {
    viewBox: "0 0 870 1000",
    body: (p) => (
      <>
        {/* Bare shoulders and arms. */}
        <path
          d="M0 1000 L0 690 C0 590 50 535 130 520 C230 510 330 540 405 590 L560 590 C640 520 690 470 750 466 C820 466 870 540 870 640 L870 1000 Z"
          {...p.skin}
        />
        {/* Neck, with a soft shadow under the jaw. */}
        <rect x="402" y="400" width="160" height="220" rx="30" {...p.skin} />
        <ellipse cx="482" cy="450" rx="80" ry="28" {...p.shade} />
        {/* Towel wrap. */}
        <path
          d="M296 872 Q470 850 646 872 L706 1000 L226 1000 Z"
          {...p.paper}
        />
        <path
          d="M296 872 Q470 850 646 872 L652 898 Q470 876 290 898 Z"
          {...p.soft}
        />
        {/* Curly hair behind the face. */}
        <circle cx="250" cy="200" r="105" {...p.hairBrown} />
        <circle cx="150" cy="300" r="70" {...p.hairBrown} />
        <circle cx="262" cy="336" r="78" {...p.hairBrown} />
        <circle cx="340" cy="60" r="110" {...p.hairBrown} />
        <circle cx="490" cy="20" r="115" {...p.hairBrown} />
        <circle cx="640" cy="50" r="110" {...p.hairBrown} />
        <circle cx="716" cy="180" r="100" {...p.hairBrown} />
        <circle cx="704" cy="330" r="82" {...p.hairBrown} />
        <circle cx="620" cy="280" r="100" {...p.hairBrown} />
        <circle cx="370" cy="250" r="95" {...p.hairBrown} />
        {/* Face. */}
        <ellipse cx="495" cy="250" rx="155" ry="205" {...p.skin} />
        {/* Front curls at the forehead. */}
        <circle cx="400" cy="92" r="78" {...p.hairBrown} />
        <circle cx="590" cy="96" r="80" {...p.hairBrown} />
        {/* Raised forearm and hand at the cheek, a step darker than the face. */}
        <path
          d="M110 1000 L215 1000 L332 700 L236 664 Z M212 700 C176 560 208 400 288 250 C314 208 386 214 382 270 C378 340 372 470 340 706 Z"
          {...p.skin}
        />
        <path
          d="M110 1000 L215 1000 L332 700 L236 664 Z M212 700 C176 560 208 400 288 250 C314 208 386 214 382 270 C378 340 372 470 340 706 Z"
          fill="#000"
          fillOpacity={0.12}
        />
        {/* Moisturizer dab on the cheek. */}
        <ellipse cx="396" cy="232" rx="26" ry="16" {...p.paper} />
      </>
    ),
  },
} satisfies Record<string, Motif>;
