import type { Motif } from "./paints";

/**
 * Scene motif: follow the "Scene style guide" in docs/template-vectors/
 * README.md (5-25 opaque flat shapes, see-through only for light and shadow).
 * A quiet European city street drawn as separate flat vector pieces, one
 * catalog item each. Every piece paints through `p.*` or a fixed paint
 * (`p.deep`, `p.hair`, `p.denim`, `p.denimShade`) so brand kits recolor the
 * environment while skin, hair, iron and denim stay put. Depth comes from a
 * tone laid over an opaque base; the only gradients are the sunlight and the
 * long shadows. Every `<defs>` id is namespaced with `uid(...)`, since a motif
 * can render more than once on one page (the Assets tiles, the canvas, a
 * contact sheet).
 */
export const streetMotifs = {
  "street-crossing": {
    viewBox: "0 0 1080 1350",
    body: (p) => (
      <>
        {/* Pale pavement and building base, receding toward the upper right. */}
        <rect x="0" y="0" width="1080" height="1350" {...p.ink} />
        {/* A slightly deeper tone on the pavement band and kerb. */}
        <path d="M0 590 L1080 520 L1080 622 L0 702 Z" {...p.shade} />
        {/* Asphalt: the same ink, darkened, so it follows the palette. */}
        <path d="M0 702 L1080 622 L1080 1350 L0 1350 Z" {...p.ink} />
        <path
          d="M0 702 L1080 622 L1080 1350 L0 1350 Z"
          fill="#000"
          fillOpacity={0.74}
        />
        {/* Single crossing stripe, kept from the source photo. */}
        <path d="M0 872 L1080 812 L1080 862 L0 930 Z" {...p.ink} />
      </>
    ),
  },

  "street-shadows": {
    viewBox: "0 0 1080 650",
    body: (p, uid) => (
      <>
        <defs>
          <linearGradient id={uid("shadow-fade")} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0} />
            <stop offset="0.25" stopColor="#000" stopOpacity={0.35} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path
          d="M150 0 L250 0 L60 650 L-40 650 Z"
          fill={`url(#${uid("shadow-fade")})`}
        />
        <path
          d="M480 0 L570 0 L400 650 L310 650 Z"
          fill={`url(#${uid("shadow-fade")})`}
        />
        <path
          d="M840 0 L930 0 L790 650 L700 650 Z"
          fill={`url(#${uid("shadow-fade")})`}
        />
      </>
    ),
  },

  "street-shopfront": {
    viewBox: "0 0 520 560",
    body: (p) => (
      <>
        {/* Building, darker than the facade so it recedes. */}
        <rect x="0" y="60" width="520" height="440" rx="10" {...p.ink} />
        <rect
          x="0"
          y="60"
          width="520"
          height="440"
          rx="10"
          fill="#000"
          fillOpacity={0.62}
        />
        {/* Dark-glazed corner cafe front and its awning. */}
        <rect x="40" y="150" width="300" height="280" rx="8" {...p.deep} />
        <path d="M20 140 L370 140 L346 186 L44 186 Z" {...p.accent} />
        {/* Two shrubs. */}
        <circle cx="430" cy="470" r="46" {...p.accent} />
        <circle cx="472" cy="492" r="30" {...p.accent} />
        <circle cx="472" cy="492" r="30" {...p.shade} />
      </>
    ),
  },

  "street-facade": {
    viewBox: "0 0 600 600",
    body: (p) => (
      <>
        {/* Limestone: the ink darkened to an opaque mid tone. */}
        <rect x="0" y="0" width="600" height="600" {...p.ink} />
        <rect
          x="0"
          y="0"
          width="600"
          height="600"
          fill="#000"
          fillOpacity={0.45}
        />
        {/* Heavy plinth and two pilasters. */}
        <rect x="0" y="520" width="600" height="80" {...p.shade} />
        <rect x="40" y="0" width="36" height="520" {...p.shade} />
        <rect x="524" y="0" width="36" height="520" {...p.shade} />
        {/* Three tall dark windows. */}
        <rect x="112" y="90" width="90" height="260" rx="12" {...p.deep} />
        <rect x="255" y="90" width="90" height="260" rx="12" {...p.deep} />
        <rect x="398" y="90" width="90" height="260" rx="12" {...p.deep} />
      </>
    ),
  },

  "street-sunbeams": {
    viewBox: "0 0 1080 1080",
    body: (p, uid) => (
      <>
        <defs>
          <radialGradient id={uid("sun-glow")} cx="0.94" cy="0.06" r="0.55">
            <stop offset="0" stopColor={p.accent.fill} stopOpacity={0.35} />
            <stop offset="1" stopColor={p.accent.fill} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={uid("sun-beam")} x1="1" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor={p.accent.fill} stopOpacity={0.3} />
            <stop offset="1" stopColor={p.accent.fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width="1080"
          height="1080"
          fill={`url(#${uid("sun-glow")})`}
        />
        <path
          d="M1080 0 L1080 190 L680 900 L580 850 Z"
          fill={`url(#${uid("sun-beam")})`}
        />
      </>
    ),
  },

  "street-lamp": {
    viewBox: "0 0 100 520",
    body: (p) => (
      <>
        <rect x="30" y="480" width="40" height="30" rx="4" {...p.deep} />
        <rect x="44" y="120" width="12" height="380" {...p.deep} />
        <rect x="14" y="84" width="42" height="10" rx="5" {...p.deep} />
        <rect x="6" y="40" width="46" height="54" rx="10" {...p.deep} />
        <rect x="14" y="48" width="30" height="38" rx="6" {...p.accent} />
        <path d="M6 40 L52 40 L29 18 Z" {...p.deep} />
      </>
    ),
  },

  "street-tree": {
    viewBox: "0 0 490 560",
    body: (p) => (
      <>
        {/* Trunk. */}
        <rect x="225" y="320" width="42" height="240" rx="10" {...p.hair} />
        {/* Canopy: five full-colour discs. */}
        <circle cx="150" cy="205" r="88" {...p.accent} />
        <circle cx="260" cy="120" r="100" {...p.accent} />
        <circle cx="350" cy="215" r="82" {...p.accent} />
        <circle cx="245" cy="235" r="80" {...p.accent} />
        <circle cx="110" cy="290" r="66" {...p.accent} />
        {/* Shade crescent on the lower left, highlight on the upper right. */}
        <path
          d="M48 313 A66 66 0 0 0 121 355 A90 90 0 0 1 48 313 Z"
          fill="#000"
          fillOpacity={0.24}
        />
        <path
          d="M294 26 A100 100 0 0 1 358 137 A130 130 0 0 0 294 26 Z"
          {...p.paper}
          fillOpacity={0.25}
        />
      </>
    ),
  },

  "street-railing": {
    viewBox: "0 0 110 170",
    body: (p) => (
      <>
        <rect x="0" y="10" width="110" height="8" {...p.deep} />
        <rect x="0" y="140" width="110" height="8" {...p.deep} />
        <rect x="6" y="10" width="6" height="134" {...p.deep} />
        <rect x="26" y="10" width="6" height="134" {...p.deep} />
        <rect x="52" y="10" width="6" height="134" {...p.deep} />
        <rect x="78" y="10" width="6" height="134" {...p.deep} />
        <rect x="98" y="10" width="6" height="134" {...p.deep} />
      </>
    ),
  },

  "street-planter": {
    viewBox: "0 0 150 240",
    body: (p) => (
      <>
        <rect x="15" y="140" width="120" height="90" rx="8" {...p.ink} />
        <rect
          x="15"
          y="140"
          width="120"
          height="90"
          rx="8"
          fill="#000"
          fillOpacity={0.5}
        />
        <circle cx="52" cy="128" r="34" {...p.accent} />
        <circle cx="98" cy="122" r="38" {...p.accent} />
        <circle cx="75" cy="96" r="32" {...p.accent} />
        <circle cx="52" cy="128" r="34" {...p.shade} />
      </>
    ),
  },

  "street-cast-shadow": {
    viewBox: "0 0 560 150",
    body: (p, uid) => (
      <>
        <defs>
          <radialGradient id={uid("cast-shadow")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#000" stopOpacity={0.32} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse
          cx="280"
          cy="75"
          rx="260"
          ry="46"
          fill={`url(#${uid("cast-shadow")})`}
          transform="skewX(-18)"
        />
      </>
    ),
  },

  "person-walking": {
    viewBox: "0 0 360 1030",
    body: (p) => (
      <>
        {/* Shoulder bag on the viewer's left, hanging behind the hip, clear of both hands. */}
        <rect x="24" y="486" width="88" height="140" rx="16" {...p.deep} />
        <path d="M24 486 L112 486 L104 530 L32 530 Z" {...p.shade} />
        {/* Back leg, in shade; with the front leg it makes an inverted V. */}
        <path d="M104 596 L196 596 L134 984 L44 984 Z" {...p.denimShade} />
        <rect x="28" y="974" width="112" height="30" rx="15" {...p.paper} />
        {/* Front leg, forward stride, lit. */}
        <path d="M172 596 L258 596 L340 1002 L252 1002 Z" {...p.denim} />
        <rect x="246" y="1000" width="110" height="30" rx="15" {...p.paper} />
        {/* Tee, seen between the open blazer fronts. */}
        <path d="M146 196 Q180 222 214 196 L202 610 L158 610 Z" {...p.paper} />
        {/* Blazer fronts, with a darker tone along each lapel. */}
        <path
          d="M92 214 Q128 196 152 204 L174 424 L164 612 L88 612 L82 256 Z"
          {...p.accent}
        />
        <path
          d="M268 214 Q232 196 208 204 L186 424 L196 612 L272 612 L278 256 Z"
          {...p.accent}
        />
        <path d="M152 204 L174 424 L164 612 L134 612 L132 300 Z" {...p.shade} />
        <path d="M208 204 L186 424 L196 612 L226 612 L228 300 Z" {...p.shade} />
        {/* Far sleeve, hand resting at the pocket. */}
        <path
          d="M262 206 Q296 214 296 250 L306 534 Q306 566 282 566 L256 566 L258 290 Z"
          {...p.accent}
        />
        <circle cx="278" cy="584" r="19" {...p.skin} />
        {/* Strap from the shoulder to the bag, held at chest height. */}
        <path d="M126 202 L140 206 L78 488 L64 486 Z" {...p.deep} />
        {/* Near arm, in shade: upper arm out to the elbow, forearm back up to the strap. */}
        <path
          d="M72 228 L116 236 L86 366 L108 326 L136 352 L84 424 L62 442 L38 405 Z"
          {...p.accent}
        />
        <path
          d="M72 228 L116 236 L86 366 L108 326 L136 352 L84 424 L62 442 L38 405 Z"
          fill="#000"
          fillOpacity={0.24}
        />
        <circle cx="122" cy="338" r="18" {...p.skin} />
        {/* Shoulder yoke, neck, head and bob. */}
        <path
          d="M92 214 Q180 172 268 214 L262 240 Q180 214 98 240 Z"
          {...p.accent}
        />
        <rect x="164" y="140" width="32" height="76" rx="10" {...p.skin} />
        <circle cx="180" cy="102" r="58" {...p.skin} />
        <path
          d="M118 122C110 6 250 6 242 122L248 196Q212 184 220 130Q212 86 180 84Q148 86 140 130Q148 184 112 196Z"
          {...p.hair}
        />
      </>
    ),
  },
} satisfies Record<string, Motif>;
