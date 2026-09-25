import type { Motif } from "./paints";

/**
 * Scene motif: follow the "Scene style guide" in docs/template-vectors/
 * README.md (5-25 opaque flat shapes, see-through only for light and shadow).
 * A lakeside park at sunrise for the Movement Club template, drawn as
 * separate flat pieces: the backdrop (sky, skyline, lake, lawn, path and the
 * leaf masses that reach the frame's rounded corners), the hedge and stone
 * wall, and the athlete in two poses. Sage activewear follows the accent; the
 * lawn is pale and the hedge and wall are dark so the leggings read.
 */
export const parkMotifs = {
  "park-lakeside": {
    viewBox: "0 0 720 1005",
    body: (p) => (
      <>
        {/* Sunrise sky, sun and a pale skyline. */}
        <rect x="0" y="0" width="720" height="1005" fill="#FCEFD9" />
        <circle cx="598" cy="131" r="62" fill="#FBEBB8" />
        <rect x="245" y="90" width="72" height="230" rx="6" fill="#8FA3AA" />
        <rect x="158" y="200" width="56" height="130" rx="6" fill="#9BADB2" />
        <rect x="440" y="190" width="70" height="140" rx="6" fill="#8FA3AA" />
        <rect x="570" y="170" width="94" height="160" rx="6" fill="#9BADB2" />
        {/* Far tree line, darker than the park tree in front of it. */}
        <path
          d="M0 340 Q60 300 120 330 Q180 296 250 328 Q330 292 410 326 Q490 296 570 330 Q650 300 720 336 L720 470 L0 470 Z"
          {...p.accent}
        />
        <path
          d="M0 340 Q60 300 120 330 Q180 296 250 328 Q330 292 410 326 Q490 296 570 330 Q650 300 720 336 L720 470 L0 470 Z"
          fill="#000"
          fillOpacity={0.3}
        />
        {/* Lake with a strip of sun glint. */}
        <rect x="0" y="437" width="720" height="122" fill="#6FA09D" />
        <rect x="548" y="450" width="34" height="100" rx="12" fill="#FFF3D6" />
        {/* Pale lawn, so the sage leggings read against it. */}
        <rect x="0" y="559" width="720" height="260" {...p.paper} />
        <rect x="0" y="559" width="720" height="260" {...p.tint} />
        {/* Gravel path. */}
        <rect x="0" y="815" width="720" height="190" {...p.paper} />
        <rect
          x="0"
          y="815"
          width="720"
          height="190"
          {...p.ink}
          fillOpacity={0.2}
        />
        {/* Overhead leaf masses in both top corners. */}
        <circle cx="50" cy="50" r="120" {...p.accent} />
        <circle cx="190" cy="28" r="90" {...p.accent} />
        <circle cx="250" cy="120" r="66" {...p.accent} />
        <circle cx="30" cy="190" r="78" {...p.accent} />
        <circle cx="690" cy="60" r="120" {...p.accent} />
        <circle cx="560" cy="24" r="86" {...p.accent} />
        <circle cx="500" cy="110" r="64" {...p.accent} />
        <circle cx="690" cy="200" r="76" {...p.accent} />
      </>
    ),
  },

  "park-stone-wall": {
    viewBox: "0 0 720 281",
    body: (p) => (
      <>
        {/* Dark hedge along the top. */}
        <path
          d="M0 40 Q30 6 70 26 Q110 -4 160 22 Q210 0 260 26 Q310 2 360 24 Q410 -2 460 24 Q510 2 560 26 Q610 0 660 22 Q700 8 720 30 L720 140 L0 140 Z"
          {...p.ink}
        />
        <rect
          x="0"
          y="52"
          width="720"
          height="70"
          {...p.accent}
          fillOpacity={0.2}
        />
        {/* Low stone wall: dark joints, lighter blocks. */}
        <rect x="0" y="112" width="720" height="169" {...p.ink} />
        <rect
          x="0"
          y="122"
          width="196"
          height="150"
          rx="14"
          {...p.paper}
          fillOpacity={0.3}
        />
        <rect
          x="206"
          y="132"
          width="236"
          height="140"
          rx="14"
          {...p.paper}
          fillOpacity={0.3}
        />
        <rect
          x="452"
          y="122"
          width="150"
          height="150"
          rx="14"
          {...p.paper}
          fillOpacity={0.3}
        />
        <rect
          x="612"
          y="116"
          width="108"
          height="156"
          rx="14"
          {...p.paper}
          fillOpacity={0.3}
        />
      </>
    ),
  },

  "person-stretch": {
    viewBox: "0 0 380 1010",
    body: (p) => (
      <>
        {/* Ponytail. */}
        <ellipse cx="80" cy="120" rx="38" ry="86" {...p.hairBrown} />
        {/* Standing leg and shoe. */}
        <path
          d="M84 395 L228 395 L220 560 L212 900 L142 900 L134 640 Z"
          {...p.accent}
        />
        <rect x="112" y="898" width="140" height="60" rx="28" {...p.paper} />
        {/* Bent leg: thigh and the shin swung up behind, a step darker; the shoe is held. */}
        <path
          d="M150 400 L272 400 L284 690 L186 706 Z M200 690 L280 516 L330 540 L262 716 Z"
          {...p.accent}
        />
        <path
          d="M150 400 L272 400 L284 690 L186 706 Z M200 690 L280 516 L330 540 L262 716 Z"
          {...p.shade}
        />
        <path d="M268 506 L350 462 L370 516 L306 556 Z" {...p.paper} />
        {/* Torso: skin, sports top with straps, midriff and waistband. */}
        <path d="M56 186 Q150 158 246 180 L250 340 L52 340 Z" {...p.skin} />
        <path d="M62 252 L242 246 L248 340 L56 340 Z" {...p.accent} />
        <path d="M84 196 L124 194 L128 262 L90 266 Z" {...p.accent} />
        <path d="M184 186 L226 184 L230 252 L188 256 Z" {...p.accent} />
        <path d="M58 335 L246 328 L244 382 L62 388 Z" {...p.skin} />
        <path d="M58 374 L246 374 L238 424 L66 424 Z" {...p.accent} />
        {/* Rounded shoulders, left arm hanging, right arm reaching back to the foot. */}
        <circle cx="74" cy="206" r="34" {...p.skin} />
        <circle cx="228" cy="200" r="34" {...p.skin} />
        <path d="M50 196 L108 194 L62 560 L12 554 Z" {...p.skin} />
        <circle cx="36" cy="582" r="26" {...p.skin} />
        <path
          d="M206 200 L248 184 L322 364 L350 460 L318 472 L280 380 Z"
          {...p.skin}
        />
        <circle cx="336" cy="468" r="24" {...p.skin} />
        {/* Neck, head and hair. */}
        <rect x="134" y="148" width="60" height="64" {...p.skin} />
        <circle cx="162" cy="94" r="64" {...p.skin} />
        <path
          d="M96 94 C92 6 232 6 228 94 Q204 48 162 48 Q122 48 96 94 Z"
          {...p.hairBrown}
        />
      </>
    ),
  },

  "bust-athlete": {
    viewBox: "0 0 380 900",
    body: (p) => (
      <>
        {/* Loose ponytail. */}
        <ellipse cx="54" cy="160" rx="50" ry="100" {...p.hairBrown} />
        {/* Leggings: two legs planted wide, the far one a step darker. */}
        <path d="M40 555 L372 545 L380 900 L30 900 Z" {...p.accent} />
        <path d="M216 548 L372 545 L380 900 L196 900 Z" {...p.shade} />
        {/* Shoulders, sports top and midriff. */}
        <path d="M16 290 Q190 232 356 300 L306 528 L84 528 Z" {...p.skin} />
        <path d="M90 268 L270 262 L280 522 L86 522 Z" {...p.accent} />
        <path d="M86 522 L280 522 L286 560 L80 560 Z" {...p.skin} />
        {/* Rounded shoulders, then arms straight down to the knees. */}
        <circle cx="46" cy="310" r="46" {...p.skin} />
        <circle cx="330" cy="314" r="46" {...p.skin} />
        <path d="M2 286 L86 292 L126 770 L70 786 Z" {...p.skin} />
        <path d="M290 296 L362 286 L380 780 L322 796 Z" {...p.skin} />
        <circle cx="98" cy="784" r="36" {...p.skin} />
        <circle cx="350" cy="796" r="34" {...p.skin} />
        {/* Neck, head, hair and a big smile. */}
        <rect x="146" y="214" width="84" height="76" {...p.skin} />
        <circle cx="188" cy="152" r="88" {...p.skin} />
        <path
          d="M100 150 C94 38 282 38 276 150 Q250 86 190 86 Q130 86 100 150 Z"
          {...p.hairBrown}
        />
        <path d="M142 196 Q190 250 238 196 Z" {...p.paper} />
      </>
    ),
  },
} satisfies Record<string, Motif>;
