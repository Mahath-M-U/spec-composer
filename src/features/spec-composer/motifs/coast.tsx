import type { Motif } from "./paints";

/**
 * Scene motif: follow the "Scene style guide" in docs/template-vectors/
 * README.md (5-25 opaque flat shapes, see-through only for light and shadow).
 * A seaside promenade at golden hour for the Coastal Weekend template: the
 * backdrop (sky, headland, sea, rocks, paving and the parapet that reaches the
 * frame's bottom-right corner), the hillside town, the stone terrace and the
 * woman in a linen dress (fixed deep skin and dark curls, as described).
 */
export const coastMotifs = {
  "coast-promenade": {
    viewBox: "0 0 920 1000",
    body: (p) => (
      <>
        {/* Golden-hour sky and sun. */}
        <rect x="0" y="0" width="920" height="1000" fill="#F6D9B0" />
        <rect x="0" y="150" width="920" height="110" fill="#FAE6C4" />
        <circle cx="900" cy="112" r="56" fill="#FFF0C8" />
        {/* Headland on the right. */}
        <path
          d="M520 250 Q600 200 700 215 Q800 195 920 215 L920 300 L520 300 Z"
          fill="#B99A86"
        />
        <path
          d="M600 250 L630 150 L700 118 L770 160 L790 250 Z"
          fill="#A8806B"
        />
        {/* Sea and three rocks. */}
        <rect x="150" y="230" width="770" height="330" {...p.ink} />
        <ellipse cx="706" cy="392" rx="96" ry="30" fill="#4F5F69" />
        <ellipse cx="708" cy="466" rx="72" ry="36" fill="#4F5F69" />
        <ellipse cx="838" cy="516" rx="32" ry="22" fill="#4F5F69" />
        {/* Promenade paving, warm clay over paper, with three joints. */}
        <path
          d="M120 360 L590 420 L600 660 L690 860 L830 1000 L0 1000 Z"
          {...p.paper}
        />
        <path
          d="M120 360 L590 420 L600 660 L690 860 L830 1000 L0 1000 Z"
          {...p.accent}
          fillOpacity={0.45}
        />
        <path
          d="M300 384 L312 384 L214 1000 L190 1000 Z"
          {...p.accent}
          fillOpacity={0.4}
        />
        <path
          d="M420 400 L432 400 L470 1000 L446 1000 Z"
          {...p.accent}
          fillOpacity={0.4}
        />
        <path
          d="M40 640 L600 660 L600 674 L30 660 Z"
          {...p.accent}
          fillOpacity={0.4}
        />
        {/* Stone parapet, reaching the bottom-right corner. */}
        <path
          d="M590 420 L920 545 L920 1000 L830 1000 L690 860 L600 660 Z"
          {...p.accent}
        />
        <path
          d="M590 420 L920 545 L920 1000 L830 1000 L690 860 L600 660 Z"
          fill="#fff"
          fillOpacity={0.22}
        />
        <path
          d="M590 420 L920 545 L920 578 L604 462 Z"
          fill="#fff"
          fillOpacity={0.3}
        />
      </>
    ),
  },

  "coast-town": {
    viewBox: "0 0 900 400",
    body: (p) => (
      <>
        {/* Left hillside and its houses. */}
        <path
          d="M0 400 L0 200 Q120 120 250 60 Q340 30 400 70 L420 400 Z"
          fill="#D2B196"
        />
        <rect x="30" y="230" width="70" height="90" fill="#F3E6D3" />
        <rect x="110" y="200" width="80" height="110" fill="#EAD3B8" />
        <rect x="200" y="150" width="70" height="120" fill="#F3E6D3" />
        <rect x="280" y="110" width="60" height="110" fill="#EAD3B8" />
        <rect x="60" y="300" width="90" height="80" fill="#F3E6D3" />
        <rect x="170" y="290" width="100" height="90" fill="#EAD3B8" />
        <rect x="300" y="260" width="80" height="120" fill="#F3E6D3" />
        <path d="M22 232 L65 200 L108 232 Z" {...p.accent} />
        <path d="M102 202 L150 168 L198 202 Z" {...p.accent} />
        <path d="M192 152 L235 118 L278 152 Z" {...p.accent} />
        <path d="M292 262 L340 226 L388 262 Z" {...p.accent} />
        {/* Bell tower. */}
        <rect x="340" y="50" width="32" height="90" fill="#F3E6D3" />
        <path d="M336 52 L356 20 L376 52 Z" {...p.accent} />
        {/* Headland buildings on the right. */}
        <path
          d="M600 400 L640 250 Q760 190 900 210 L900 400 Z"
          fill="#C9A38A"
        />
        <rect x="700" y="240" width="90" height="70" fill="#EAD3B8" />
        <rect x="800" y="215" width="80" height="90" fill="#F3E6D3" />
        <path d="M796 217 L840 186 L884 217 Z" {...p.accent} />
      </>
    ),
  },

  "coast-terrace": {
    viewBox: "0 0 300 1100",
    body: (p) => (
      <>
        {/* Limestone terrace wall with joints, a coping and a step. */}
        <rect x="0" y="330" width="300" height="770" {...p.paper} />
        <rect
          x="0"
          y="330"
          width="300"
          height="770"
          {...p.accent}
          fillOpacity={0.3}
        />
        <rect
          x="0"
          y="330"
          width="300"
          height="32"
          {...p.accent}
          fillOpacity={0.35}
        />
        <rect
          x="0"
          y="470"
          width="300"
          height="10"
          {...p.accent}
          fillOpacity={0.3}
        />
        <rect
          x="0"
          y="620"
          width="300"
          height="10"
          {...p.accent}
          fillOpacity={0.3}
        />
        <rect
          x="0"
          y="780"
          width="300"
          height="10"
          {...p.accent}
          fillOpacity={0.3}
        />
        <rect x="0" y="930" width="300" height="170" {...p.shade} />
        {/* Shrubs with a few pink blossoms. */}
        <circle cx="70" cy="240" r="100" fill="#4F6F4A" />
        <circle cx="190" cy="190" r="80" fill="#5C7F55" />
        <circle cx="240" cy="290" r="60" fill="#4F6F4A" />
        <circle cx="60" cy="300" r="12" fill="#D96F8C" />
        <circle cx="120" cy="260" r="10" fill="#D96F8C" />
        <circle cx="200" cy="230" r="11" fill="#D96F8C" />
        {/* Terracotta pot with a plant. */}
        <path d="M70 700 L150 700 L138 790 L82 790 Z" {...p.accent} />
        <circle cx="110" cy="670" r="46" fill="#5C7F55" />
      </>
    ),
  },

  "person-linen-dress": {
    viewBox: "0 0 500 1300",
    body: (p) => (
      <>
        {/* Dark curls behind the face. */}
        <circle cx="120" cy="70" r="72" {...p.hair} />
        <circle cx="205" cy="10" r="76" {...p.hair} />
        <circle cx="300" cy="0" r="82" {...p.hair} />
        <circle cx="390" cy="50" r="72" {...p.hair} />
        <circle cx="440" cy="140" r="64" {...p.hair} />
        <circle cx="90" cy="150" r="64" {...p.hair} />
        <circle cx="120" cy="225" r="58" {...p.hair} />
        {/* Neck, shoulders and chest. */}
        <rect x="266" y="150" width="68" height="110" rx="20" {...p.skinDeep} />
        <path
          d="M96 252 Q290 190 470 252 L452 342 L120 342 Z"
          {...p.skinDeep}
        />
        {/* Left arm hanging, right arm raised with the hand at the ear. */}
        <path d="M96 246 L152 244 L84 730 L28 722 Z" {...p.skinDeep} />
        <circle cx="54" cy="742" r="30" {...p.skinDeep} />
        <path
          d="M426 254 L474 246 L494 368 L446 376 Z M451 379 L373 167 L411 153 L489 365 Z"
          {...p.skinDeep}
        />
        <circle cx="392" cy="150" r="30" {...p.skinDeep} />
        {/* Face and front curls. */}
        <ellipse cx="296" cy="100" rx="62" ry="78" {...p.skinDeep} />
        <circle cx="240" cy="44" r="46" {...p.hair} />
        <circle cx="352" cy="40" r="44" {...p.hair} />
        {/* Linen dress: skirt, slit showing a leg, flap, bodice with straps and a soft fold. */}
        <path
          d="M150 440 L440 440 Q470 700 500 1030 L110 1030 Q130 700 150 440 Z"
          {...p.paper}
        />
        <path d="M196 706 L300 690 L332 1030 L236 1030 Z" {...p.skinDeep} />
        <path d="M300 690 L470 720 L494 1030 L332 1030 Z" {...p.paper} />
        <path
          d="M156 250 L180 250 L192 300 Q296 340 400 300 L414 250 L438 250 L450 452 L152 452 Z"
          {...p.paper}
        />
        <path
          d="M330 452 L440 452 Q470 700 494 1030 L420 1030 Q400 700 330 452 Z"
          {...p.shade}
        />
        {/* Straw bag on a strap, hanging clear of both hands. */}
        <path d="M400 250 L414 250 L432 430 L412 434 Z" {...p.accent} />
        <path
          d="M395 430 Q462 418 470 500 Q476 600 430 640 Q390 640 384 560 Q380 480 395 430 Z"
          {...p.accent}
        />
        <path
          d="M395 430 Q462 418 470 500 Q476 600 430 640 Q390 640 384 560 Q380 480 395 430 Z"
          {...p.shade}
        />
      </>
    ),
  },
} satisfies Record<string, Motif>;
