import { useId } from "react";
import type { ImageKind } from "./types";
import {
  type ArtColors,
  type Motif,
  type Paints,
  cos,
  paints,
  sin,
} from "./motifs/paints";
import { Sparkle } from "./motifs/parts";
import type { MotifKey } from "./motif-keys";
import { deviceMotifs } from "./motifs/devices";
import { mobileUiMotifs } from "./motifs/mobile-ui";
import { webUiMotifs } from "./motifs/web-ui";
import { aiMotifs } from "./motifs/ai";
import { socialMotifs } from "./motifs/social";
import { chartMotifs } from "./motifs/charts";
import { objectMotifs } from "./motifs/objects";
import { stickerMotifs } from "./motifs/stickers";
import { streetMotifs } from "./motifs/street";
import { bathroomMotifs } from "./motifs/bathroom";
import { cafeMotifs } from "./motifs/cafe";
import { parkMotifs } from "./motifs/park";
import { coastMotifs } from "./motifs/coast";

/**
 * Placeholder motifs for empty image slots. They are flat, single-accent
 * vector drawings painted from the document's primary (ink) and secondary
 * (accent) colors, so brand kits and color edits apply to them. They are
 * presentation only: prompts describe the slot via `aiDescription`.
 *
 * Paint is set as SVG attributes with concrete colors, never CSS classes or
 * variables: html-to-image clones an <svg> subtree without inlining its
 * children's computed styles, so stylesheet paint would be lost in PNG export.
 */

export type { ArtColors };

const crowd = [
  { x: 44, row: 0 },
  { x: 112, row: 0 },
  { x: 180, row: 0 },
  { x: 248, row: 0 },
  { x: 316, row: 0 },
  { x: 384, row: 0 },
  { x: 452, row: 0 },
  { x: 10, row: 1 },
  { x: 78, row: 1 },
  { x: 146, row: 1 },
  { x: 214, row: 1 },
  { x: 282, row: 1 },
  { x: 350, row: 1 },
  { x: 418, row: 1 },
  { x: 486, row: 1 },
];

/* ---------------------------------------------------------------- */
/* People: one parametric figure, varied by skin, hair, and clothes. */
/* ---------------------------------------------------------------- */

const SKIN = {
  light: "#F3CFB3",
  warm: "#E7B48F",
  medium: "#C68642",
  deep: "#8D5524",
} as const;

const HAIR = {
  dark: "#2B2118",
  brown: "#6B4226",
  auburn: "#A0522D",
  grey: "#CFCFCF",
} as const;

const DENIM = "#3B4A6B";

interface Fill {
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

type HairStyle = "short" | "long" | "bun" | "curly" | "bald";

function HairShape({ style, color }: { style: HairStyle; color: string }) {
  const h = { fill: color };
  switch (style) {
    case "long":
      return (
        <path
          {...h}
          d="M-32 -346C-36 -390 36 -390 32 -346L36 -300Q20 -306 26 -346Q20 -368 0 -370Q-20 -368 -26 -346Q-20 -306 -36 -300Z"
        />
      );
    case "bun":
      return (
        <>
          <circle {...h} cx="0" cy="-390" r="13" />
          <path
            {...h}
            d="M-29 -350C-33 -392 33 -392 29 -350Q25 -372 0 -374Q-25 -372 -29 -350Z"
          />
        </>
      );
    case "curly":
      return (
        <>
          <circle {...h} cx="-20" cy="-372" r="14" />
          <circle {...h} cx="0" cy="-382" r="15" />
          <circle {...h} cx="20" cy="-372" r="14" />
          <circle {...h} cx="-29" cy="-354" r="10" />
          <circle {...h} cx="29" cy="-354" r="10" />
        </>
      );
    case "bald":
      return (
        <>
          <path {...h} d="M-29 -342Q-33 -360 -25 -366L-22 -342Z" />
          <path {...h} d="M29 -342Q33 -360 25 -366L22 -342Z" />
        </>
      );
    default:
      return (
        <path
          {...h}
          d="M-29 -350C-33 -392 33 -392 29 -350Q25 -372 0 -374Q-25 -372 -29 -350Z"
        />
      );
  }
}

/** A standing person with feet at (x, ground); about 390 units tall at scale 1. */
function Figure({
  x,
  ground,
  scale = 1,
  headScale = 1,
  skin,
  hair,
  hairColor = HAIR.dark,
  top,
  bottom,
  dress = false,
  shorts = false,
  beard = false,
  tie = false,
  cane = false,
}: {
  x: number;
  ground: number;
  scale?: number;
  headScale?: number;
  skin: string;
  hair: HairStyle;
  hairColor?: string;
  top: Fill;
  bottom: Fill;
  dress?: boolean;
  shorts?: boolean;
  beard?: boolean;
  tie?: boolean;
  cane?: boolean;
}) {
  const s = { fill: skin };
  const shoe = { fill: HAIR.dark };
  return (
    <g transform={`translate(${x} ${ground}) scale(${scale})`}>
      {cane && (
        <path
          fill="none"
          stroke={HAIR.dark}
          strokeWidth="6"
          strokeLinecap="round"
          d="M64 -160L70 -2M52 -164Q60 -178 70 -162"
        />
      )}
      {dress || shorts ? (
        <>
          <rect {...s} x="-20" y="-150" width="15" height="144" rx="6" />
          <rect {...s} x="5" y="-150" width="15" height="144" rx="6" />
        </>
      ) : (
        <>
          <rect {...bottom} x="-22" y="-152" width="19" height="146" rx="4" />
          <rect {...bottom} x="3" y="-152" width="19" height="146" rx="4" />
        </>
      )}
      {shorts && (
        <rect {...bottom} x="-26" y="-160" width="52" height="60" rx="8" />
      )}
      <rect {...shoe} x="-32" y="-14" width="30" height="14" rx="7" />
      <rect {...shoe} x="2" y="-14" width="30" height="14" rx="7" />
      {hair === "long" && (
        <path
          fill={hairColor}
          transform={`translate(0 -352) scale(${headScale}) translate(0 352)`}
          d="M-34 -350Q-40 -290 -30 -272L30 -272Q40 -290 34 -350Z"
        />
      )}
      <path
        {...top}
        d="M-38 -294Q-58 -228 -60 -164L-44 -160Q-40 -226 -26 -282Z"
      />
      <path {...top} d="M38 -294Q58 -228 60 -164L44 -160Q40 -226 26 -282Z" />
      <circle {...s} cx="-52" cy="-154" r="9" />
      <circle {...s} cx="52" cy="-154" r="9" />
      {dress ? (
        <path {...top} d="M-38 -300Q0 -314 38 -300L62 -104Q0 -92 -62 -104Z" />
      ) : (
        <path {...top} d="M-40 -300Q0 -316 40 -300L44 -146Q0 -136 -44 -146Z" />
      )}
      <rect {...s} x="-8" y="-334" width="16" height="38" rx="5" />
      {tie && (
        <>
          <path fill="#fff" d="M-15 -304L0 -286L15 -304Z" />
          <path fill={HAIR.dark} d="M0 -290L-6 -280L0 -236L6 -280Z" />
        </>
      )}
      <g transform={`translate(0 -352) scale(${headScale}) translate(0 352)`}>
        <circle {...s} cx="0" cy="-352" r="28" />
        <HairShape style={hair} color={hairColor} />
        {beard && (
          <path
            fill={hairColor}
            d="M-27 -348Q-24 -316 0 -313Q24 -316 27 -348Q16 -328 0 -327Q-16 -328 -27 -348Z"
          />
        )}
      </g>
    </g>
  );
}

/** Mid-jump athlete with raised arms. */
function ActivePose({
  p,
  skin,
  hair,
}: {
  p: Paints;
  skin: string;
  hair: "ponytail" | "short";
}) {
  const limb = {
    fill: "none",
    stroke: skin,
    strokeWidth: 14,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const h = { fill: HAIR.dark };
  return (
    <>
      <ellipse {...p.soft} cx="130" cy="506" rx="86" ry="9" />
      <path {...p.limb} d="M118 330L102 410L90 488" />
      <path {...p.limb} d="M142 330L162 398L204 436" />
      <ellipse {...p.accent} cx="92" cy="494" rx="22" ry="9" />
      <ellipse
        {...p.accent}
        cx="212"
        cy="442"
        rx="20"
        ry="9"
        transform="rotate(-40 212 442)"
      />
      <path {...limb} d="M104 212L74 152L68 96" />
      <path {...limb} d="M156 212L188 152L196 96" />
      <circle fill={skin} cx="68" cy="90" r="9" />
      <circle fill={skin} cx="196" cy="90" r="9" />
      <path
        {...p.accent}
        d="M100 200Q130 186 160 200L154 338Q130 346 106 338Z"
      />
      <rect fill={skin} x="121" y="168" width="18" height="28" rx="6" />
      <circle fill={skin} cx="130" cy="160" r="25" />
      {hair === "ponytail" ? (
        <>
          <path
            {...h}
            d="M106 160C102 124 158 124 154 158Q142 142 130 142Q114 144 106 160Z"
          />
          <ellipse
            {...h}
            cx="160"
            cy="148"
            rx="10"
            ry="24"
            transform="rotate(34 160 148)"
          />
        </>
      ) : (
        <path
          {...h}
          d="M105 158C101 126 159 126 155 158Q150 140 130 140Q110 140 105 158Z"
        />
      )}
      <path {...p.steam} strokeWidth="4" d="M34 250h30M26 280h30M40 310h22" />
    </>
  );
}

/** Head-and-shoulders portrait with a quote bubble. */
function Portrait({
  p,
  skin,
  hair,
  hairColor,
  beard = false,
}: {
  p: Paints;
  skin: string;
  hair: "long" | "short";
  hairColor: string;
  beard?: boolean;
}) {
  const h = { fill: hairColor };
  return (
    <>
      <path {...p.accent} d="M58 300Q58 212 150 206Q242 212 242 300Z" />
      <path {...p.paper} d="M130 208L150 238L170 208Z" />
      <rect fill={skin} x="138" y="168" width="24" height="42" rx="8" />
      <circle fill={skin} cx="150" cy="138" r="42" />
      {hair === "long" ? (
        <>
          <path
            {...h}
            d="M106 142C98 82 202 82 194 142Q186 108 150 106Q116 108 106 142Z"
          />
          <path {...h} d="M106 142Q102 172 112 188L118 150Z" />
        </>
      ) : (
        <path
          {...h}
          d="M108 136C102 86 198 86 192 136Q186 110 150 108Q114 110 108 136Z"
        />
      )}
      {beard && (
        <path
          {...h}
          d="M110 150Q112 192 150 196Q188 192 190 150Q178 178 150 179Q122 178 110 150Z"
        />
      )}
      <rect
        {...p.paper}
        {...p.edge}
        x="200"
        y="36"
        width="76"
        height="54"
        rx="16"
      />
      <path {...p.paper} d="M214 88l-6 16 20-16Z" />
      <circle {...p.accent} cx="226" cy="64" r="7" />
      <circle {...p.accent} cx="250" cy="64" r="7" />
    </>
  );
}

const arch = (p: Paints) => (
  <>
    <ellipse {...p.soft} cx="120" cy="506" rx="84" ry="9" />
  </>
);

/**
 * Head-and-shoulders figure that fills its 400 × 500 frame edge to edge, so
 * "cover" slots can crop it like a portrait photo.
 */
function Bust({
  p,
  skin,
  hair,
  hairColor = HAIR.dark,
  top,
  beard = false,
  blazer = false,
  earrings = false,
  glasses = false,
}: {
  p: Paints;
  skin: string;
  hair: HairStyle;
  hairColor?: string;
  top: Fill;
  beard?: boolean;
  blazer?: boolean;
  earrings?: boolean;
  glasses?: boolean;
}) {
  const s = { fill: skin };
  const h = { fill: hairColor };
  return (
    <>
      {hair === "long" && (
        <path
          {...h}
          d="M108 214C96 120 146 90 200 90C254 90 304 120 292 214L312 396Q276 418 246 388V280H154V388Q124 418 88 396Z"
        />
      )}
      {hair === "bun" && <circle {...h} cx="200" cy="92" r="36" />}
      <path
        {...top}
        d="M18 500Q22 392 118 364L162 350Q200 372 238 350L282 364Q378 392 382 500Z"
      />
      {blazer && (
        <>
          <path {...p.shade} d="M150 356L198 432L174 500H112Z" />
          <path {...p.shade} d="M250 356L202 432L226 500H288Z" />
        </>
      )}
      <rect {...s} x="170" y="262" width="60" height="104" rx="24" />
      <path {...s} d="M164 350L200 408L236 350Z" />
      <path {...p.shade} d="M170 300Q200 324 230 300V286H170Z" />
      <ellipse {...s} cx="122" cy="214" rx="13" ry="22" />
      <ellipse {...s} cx="278" cy="214" rx="13" ry="22" />
      <ellipse {...s} cx="200" cy="204" rx="78" ry="92" />
      {beard && (
        <path
          {...h}
          d="M124 214Q128 300 200 314Q272 300 276 214Q258 262 200 266Q142 262 124 214Z"
        />
      )}
      {hair === "long" && (
        <path
          {...h}
          d="M122 214C114 124 158 100 200 100C242 100 286 124 278 214Q262 150 214 140Q226 170 176 176Q148 180 122 214Z"
        />
      )}
      {(hair === "short" || hair === "bun") && (
        <path
          {...h}
          d="M124 196C118 120 162 102 200 102C238 102 282 120 276 196Q266 146 232 138Q200 132 168 138Q134 146 124 196Z"
        />
      )}
      {hair === "curly" &&
        Array.from({ length: 9 }, (_, i) => {
          const a = ((190 + i * 20) * Math.PI) / 180;
          return (
            <circle
              key={i}
              {...h}
              cx={200 + 94 * cos(a)}
              cy={196 + 100 * sin(a)}
              r="32"
            />
          );
        })}
      {earrings && (
        <>
          <circle {...p.accent} cx="122" cy="248" r="9" />
          <circle {...p.accent} cx="278" cy="248" r="9" />
        </>
      )}
      {glasses && (
        <path
          fill="none"
          stroke={HAIR.dark}
          strokeWidth="6"
          d="M146 214a24 20 0 1 0 48 0a24 20 0 1 0 -48 0M206 214a24 20 0 1 0 48 0a24 20 0 1 0 -48 0M194 212h12"
        />
      )}
    </>
  );
}

const peopleMotifs: Record<
  | "person-man"
  | "person-child"
  | "person-elder"
  | "family"
  | "person-active-man"
  | "person-wheelchair"
  | "portrait-man",
  Motif
> = {
  "person-man": {
    viewBox: "0 0 240 520",
    body: (p) => (
      <>
        {arch(p)}
        <Figure
          x={120}
          ground={502}
          skin={SKIN.medium}
          hair="short"
          top={p.accent}
          bottom={p.ink}
          tie
        />
      </>
    ),
  },
  "person-child": {
    viewBox: "0 0 240 520",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="112" cy="504" rx="70" ry="8" />
        <path {...p.strokeInk} strokeWidth="2" d="M142 404Q172 320 180 236" />
        <ellipse {...p.accent} cx="180" cy="190" rx="34" ry="42" />
        <path {...p.accent} d="M175 230h10l-5 7Z" />
        <ellipse
          {...p.shine}
          cx="168"
          cy="174"
          rx="7"
          ry="13"
          transform="rotate(20 168 174)"
        />
        <Figure
          x={110}
          ground={502}
          scale={0.62}
          headScale={1.35}
          skin={SKIN.light}
          hair="curly"
          hairColor={HAIR.auburn}
          top={p.accent}
          bottom={{ fill: DENIM }}
          shorts
        />
        <Sparkle x={52} y={260} size={10} fill={p.accent.fill} />
      </>
    ),
  },
  "person-elder": {
    viewBox: "0 0 240 520",
    body: (p) => (
      <>
        {arch(p)}
        <Figure
          x={112}
          ground={502}
          skin={SKIN.warm}
          hair="bald"
          hairColor={HAIR.grey}
          top={p.accent}
          bottom={{ fill: DENIM }}
          beard
          cane
        />
      </>
    ),
  },
  family: {
    viewBox: "0 0 440 520",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="220" cy="504" rx="190" ry="10" />
        <Figure
          x={120}
          ground={502}
          scale={0.92}
          skin={SKIN.deep}
          hair="long"
          top={p.accent}
          bottom={p.ink}
          dress
        />
        <Figure
          x={322}
          ground={502}
          scale={0.96}
          skin={SKIN.light}
          hair="short"
          hairColor={HAIR.brown}
          top={p.dim}
          bottom={{ fill: DENIM }}
          beard
        />
        <Figure
          x={222}
          ground={502}
          scale={0.56}
          headScale={1.35}
          skin={SKIN.medium}
          hair="bun"
          top={p.paper}
          bottom={p.accent}
          dress
        />
      </>
    ),
  },
  "person-active-man": {
    viewBox: "0 0 260 520",
    body: (p) => <ActivePose p={p} skin={SKIN.deep} hair="short" />,
  },
  "person-wheelchair": {
    viewBox: "0 0 280 520",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="140" cy="506" rx="112" ry="9" />
        <path {...p.strokeInk} strokeWidth="10" d="M88 244V392H196" />
        <path {...p.strokeInk} strokeWidth="8" d="M196 392L214 470H242" />
        <path
          {...p.accent}
          d="M96 236Q124 222 152 236L150 372Q124 380 100 372Z"
        />
        <rect fill={DENIM} x="104" y="360" width="104" height="30" rx="12" />
        <rect fill={DENIM} x="184" y="372" width="26" height="94" rx="10" />
        <rect fill={HAIR.dark} x="186" y="456" width="46" height="16" rx="8" />
        <rect fill={SKIN.deep} x="116" y="200" width="16" height="32" rx="5" />
        <circle fill={SKIN.deep} cx="124" cy="190" r="26" />
        <circle fill={HAIR.dark} cx="124" cy="158" r="11" />
        <path
          fill={HAIR.dark}
          d="M97 190C93 152 155 152 151 190Q146 170 124 168Q102 170 97 190Z"
        />
        <circle {...p.strokeInk} strokeWidth="10" cx="118" cy="420" r="74" />
        <path
          {...p.strokeInk}
          strokeWidth="3"
          d="M44 420H192M81 356L155 484M155 356L81 484"
        />
        <circle {...p.ink} cx="118" cy="420" r="8" />
        <circle {...p.strokeInk} strokeWidth="6" cx="222" cy="488" r="14" />
        <path
          fill="none"
          stroke={SKIN.deep}
          strokeWidth="14"
          strokeLinecap="round"
          d="M140 250Q164 300 152 348"
        />
        <circle fill={SKIN.deep} cx="152" cy="352" r="9" />
      </>
    ),
  },
  "portrait-man": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <Portrait
        p={p}
        skin={SKIN.deep}
        hair="short"
        hairColor={HAIR.dark}
        beard
      />
    ),
  },
};

const motifs: Record<MotifKey, Motif> = {
  ...peopleMotifs,
  "product-bottle": {
    viewBox: "0 0 300 420",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="150" cy="398" rx="118" ry="12" />
        <rect {...p.tint} x="72" y="302" width="156" height="94" rx="6" />
        <rect {...p.accent} x="60" y="290" width="180" height="18" rx="5" />
        <rect {...p.ink} x="138" y="26" width="24" height="42" rx="12" />
        <rect {...p.ink} x="124" y="60" width="52" height="46" rx="9" />
        <rect
          {...p.paper}
          {...p.edge}
          x="132"
          y="102"
          width="36"
          height="34"
          rx="5"
        />
        <rect
          {...p.paper}
          {...p.edge}
          x="100"
          y="128"
          width="100"
          height="162"
          rx="24"
        />
        <rect {...p.shine} x="112" y="146" width="10" height="112" rx="5" />
        <rect {...p.accent} x="126" y="188" width="62" height="64" rx="5" />
        <rect {...p.paper} x="138" y="204" width="38" height="6" rx="3" />
        <rect {...p.paper} x="138" y="218" width="26" height="6" rx="3" />
        <Sparkle x={252} y={84} size={16} fill={p.accent.fill} />
        <Sparkle x={50} y={138} size={10} fill={p.accent.fill} />
        <Sparkle x={236} y={246} size={8} fill={p.accent.fill} />
      </>
    ),
  },
  "product-bag": {
    viewBox: "0 0 320 400",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="160" cy="376" rx="116" ry="12" />
        <path
          {...p.strokeInk}
          d="M112 150C112 76 208 76 208 150"
          strokeWidth="12"
        />
        <path
          {...p.accent}
          d="M72 140H248L270 356Q271 366 261 366H59Q49 366 50 356Z"
        />
        <path {...p.shade} d="M72 140H248L251 168H69Z" />
        <circle {...p.ink} cx="112" cy="158" r="7" />
        <circle {...p.ink} cx="208" cy="158" r="7" />
        <g transform="rotate(14 222 236)">
          <rect
            {...p.paper}
            {...p.edge}
            x="198"
            y="206"
            width="48"
            height="64"
            rx="6"
          />
          <circle {...p.accent} cx="222" cy="220" r="5" />
          <circle {...p.ink} cx="213" cy="240" r="5" />
          <circle {...p.ink} cx="231" cy="258" r="5" />
          <path {...p.strokeInk} d="M232 238L212 260" strokeWidth="4" />
        </g>
        <Sparkle x={276} y={92} size={15} fill={p.accent.fill} />
        <Sparkle x={44} y={118} size={10} fill={p.accent.fill} />
      </>
    ),
  },
  "person-standing": {
    viewBox: "0 0 240 520",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="120" cy="506" rx="84" ry="9" />
        <rect {...p.ink} x="97" y="372" width="19" height="124" rx="4" />
        <rect {...p.ink} x="124" y="372" width="19" height="124" rx="4" />
        <rect {...p.ink} x="84" y="488" width="34" height="13" rx="6.5" />
        <rect {...p.ink} x="122" y="488" width="34" height="13" rx="6.5" />
        <path {...p.accent} d="M84 180Q76 262 64 336L84 340Q98 266 104 196Z" />
        <path
          {...p.accent}
          d="M156 180Q164 262 176 336L156 340Q142 266 136 196Z"
        />
        <circle {...p.skin} cx="73" cy="346" r="10" />
        <circle {...p.skin} cx="167" cy="346" r="10" />
        <path
          {...p.accent}
          d="M80 172Q120 156 160 172L176 404Q120 418 64 404Z"
        />
        <path {...p.shade} d="M120 176L106 254L120 408L134 254Z" />
        <rect {...p.shade} x="72" y="282" width="96" height="11" rx="3" />
        <rect {...p.skin} x="111" y="136" width="18" height="30" rx="6" />
        <rect
          {...p.paper}
          {...p.edge}
          x="100"
          y="158"
          width="40"
          height="20"
          rx="8"
        />
        <circle {...p.skin} cx="120" cy="116" r="28" />
        <path
          fill={HAIR.dark}
          d="M88 122C84 80 156 80 152 122L156 156Q140 150 146 122Q140 102 120 100Q100 102 94 122Q100 150 84 156Z"
        />
      </>
    ),
  },
  "event-stage": {
    viewBox: "0 0 520 300",
    body: (p) => (
      <>
        <path {...p.tint} d="M112 16H138L204 212H40Z" />
        <path {...p.tint} d="M382 16H408L480 212H316Z" />
        <rect {...p.ink} x="36" y="10" width="448" height="7" rx="3.5" />
        <circle {...p.accent} cx="125" cy="20" r="9" />
        <circle {...p.accent} cx="260" cy="20" r="9" />
        <circle {...p.accent} cx="395" cy="20" r="9" />
        <rect {...p.soft} x="156" y="44" width="208" height="116" rx="8" />
        <rect {...p.accent} x="176" y="66" width="96" height="12" rx="6" />
        <rect {...p.dim} x="176" y="88" width="148" height="7" rx="3.5" />
        <rect {...p.dim} x="176" y="102" width="118" height="7" rx="3.5" />
        <rect {...p.accent} x="40" y="206" width="440" height="14" rx="3" />
        <rect {...p.ink} x="316" y="166" width="34" height="40" rx="3" />
        <circle {...p.skin} cx="286" cy="160" r="9" />
        <rect {...p.accent} x="276" y="170" width="20" height="36" rx="6" />
        {crowd.map(({ x, row }) => {
          const top = row ? 262 : 244;
          return (
            <g key={`${row}-${x}`} {...(row ? p.crowdFront : p.crowdBack)}>
              <circle cx={x} cy={top} r="13" />
              <path d={`M${x - 24} 300a24 ${row ? 26 : 34} 0 0 1 48 0Z`} />
            </g>
          );
        })}
      </>
    ),
  },
  "logo-mark": {
    viewBox: "0 0 240 80",
    body: (p) => (
      <>
        <circle {...p.accent} cx="40" cy="40" r="30" />
        <path {...p.ink} d="M40 22L56 50H24Z" />
        <rect {...p.ink} x="84" y="24" width="128" height="15" rx="7.5" />
        <rect {...p.dim} x="84" y="47" width="84" height="10" rx="5" />
      </>
    ),
  },
  "brand-wordmark": {
    viewBox: "0 0 240 80",
    body: (p) => (
      <text
        {...p.ink}
        x="120"
        y="54"
        fontFamily="Manrope, sans-serif"
        fontSize="46"
        fontWeight="800"
        textAnchor="middle"
        letterSpacing="-2"
      >
        BRAND
      </text>
    ),
  },
  "brand-app-icon": {
    viewBox: "0 0 120 120",
    body: (p) => (
      <>
        <rect {...p.ink} x="8" y="8" width="104" height="104" rx="25" />
        <path {...p.paper} d="M34 82L60 34L86 82H73L67 70H53L47 82Z" />
        <path {...p.ink} d="M56 59H64L60 50Z" />
      </>
    ),
  },
  landscape: {
    viewBox: "0 0 500 300",
    body: (p) => (
      <>
        <rect {...p.tint} x="0" y="0" width="500" height="300" />
        <circle {...p.accent} cx="378" cy="92" r="40" />
        <path {...p.dim} d="M0 244L128 112L226 204L318 128L500 252V300H0Z" />
        <path {...p.ink} d="M0 262Q148 204 282 252T500 244V300H0Z" />
        <path {...p.strokeInk} strokeWidth="3" d="M138 78q9-9 18 0q9-9 18 0" />
        <path {...p.strokeInk} strokeWidth="3" d="M192 56q7-7 14 0q7-7 14 0" />
      </>
    ),
  },
  "photo-frame": {
    viewBox: "0 0 320 260",
    body: (p) => (
      <>
        <rect
          {...p.paper}
          {...p.edge}
          x="20"
          y="16"
          width="280"
          height="228"
          rx="14"
        />
        <rect {...p.tint} x="38" y="34" width="244" height="164" rx="6" />
        <circle {...p.accent} cx="232" cy="82" r="18" />
        <path {...p.ink} d="M38 198L118 114L172 168L214 132L282 198Z" />
        <rect {...p.dim} x="38" y="212" width="120" height="10" rx="5" />
      </>
    ),
  },
  "brand-mark": {
    viewBox: "0 0 120 120",
    body: (p) => (
      <>
        <circle {...p.accent} cx="60" cy="60" r="54" />
        <path {...p.ink} d="M60 24L88 60L60 96L32 60Z" />
        <circle {...p.paper} cx="60" cy="60" r="10" />
      </>
    ),
  },
  "food-bowl": {
    viewBox: "0 0 320 300",
    body: (p) => (
      <>
        <path {...p.steam} strokeWidth="5" d="M126 110q-12-18 0-36t0-36" />
        <path {...p.steam} strokeWidth="5" d="M162 100q-12-18 0-36t0-36" />
        <path {...p.steam} strokeWidth="5" d="M198 110q-12-18 0-36t0-36" />
        <ellipse {...p.paper} {...p.edge} cx="160" cy="232" rx="134" ry="26" />
        <path {...p.accent} d="M58 166H262Q258 250 160 256Q62 250 58 166Z" />
        <ellipse {...p.paper} cx="160" cy="166" rx="102" ry="16" />
        <circle {...p.skin} cx="118" cy="156" r="20" />
        <circle {...p.dim} cx="160" cy="150" r="22" />
        <circle {...p.accent} cx="198" cy="158" r="15" />
        <ellipse
          {...p.ink}
          cx="210"
          cy="148"
          rx="18"
          ry="8"
          transform="rotate(-24 210 148)"
        />
        <ellipse
          {...p.ink}
          cx="138"
          cy="146"
          rx="14"
          ry="6"
          transform="rotate(20 138 146)"
        />
        <path
          {...p.shade}
          d="M70 196Q160 216 250 196Q246 230 160 238Q74 230 70 196Z"
        />
      </>
    ),
  },
  balloons: {
    viewBox: "0 0 320 320",
    body: (p) => (
      <>
        <path {...p.strokeInk} strokeWidth="2" d="M118 176Q130 244 166 306" />
        <path {...p.strokeInk} strokeWidth="2" d="M206 150Q192 232 166 306" />
        <path {...p.strokeInk} strokeWidth="2" d="M168 226Q172 266 166 306" />
        <ellipse {...p.ink} cx="206" cy="92" rx="44" ry="54" />
        <path {...p.ink} d="M200 144h12l-6 8Z" />
        <ellipse {...p.accent} cx="118" cy="116" rx="48" ry="58" />
        <path {...p.accent} d="M112 172h12l-6 8Z" />
        <ellipse {...p.paper} {...p.edge} cx="168" cy="176" rx="40" ry="48" />
        <path {...p.paper} d="M162 222h12l-6 8Z" />
        <ellipse
          {...p.shine}
          cx="100"
          cy="92"
          rx="10"
          ry="18"
          transform="rotate(20 100 92)"
        />
        <ellipse
          {...p.shine}
          cx="190"
          cy="70"
          rx="8"
          ry="15"
          transform="rotate(20 190 70)"
        />
        <rect
          {...p.accent}
          x="46"
          y="226"
          width="12"
          height="6"
          rx="2"
          transform="rotate(30 52 229)"
        />
        <rect
          {...p.ink}
          x="256"
          y="196"
          width="12"
          height="6"
          rx="2"
          transform="rotate(-40 262 199)"
        />
        <rect
          {...p.accent}
          x="262"
          y="60"
          width="10"
          height="5"
          rx="2"
          transform="rotate(60 267 62)"
        />
        <circle {...p.dim} cx="52" cy="72" r="5" />
        <circle {...p.accent} cx="276" cy="262" r="5" />
      </>
    ),
  },
  "laptop-screen": {
    viewBox: "0 0 400 300",
    body: (p) => (
      <>
        <rect {...p.ink} x="70" y="40" width="260" height="172" rx="12" />
        <rect {...p.paper} x="82" y="52" width="236" height="146" rx="6" />
        <rect {...p.tint} x="94" y="64" width="102" height="64" rx="5" />
        <rect {...p.tint} x="204" y="64" width="102" height="64" rx="5" />
        <circle {...p.skin} cx="145" cy="88" r="12" />
        <path {...p.accent} d="M125 128a20 18 0 0 1 40 0Z" />
        <circle {...p.skin} cx="255" cy="88" r="12" />
        <path {...p.ink} d="M235 128a20 18 0 0 1 40 0Z" />
        <rect {...p.soft} x="94" y="136" width="212" height="52" rx="5" />
        <rect {...p.accent} x="106" y="148" width="118" height="9" rx="4.5" />
        <rect {...p.dim} x="106" y="166" width="84" height="7" rx="3.5" />
        <path
          {...p.ink}
          d="M40 216H360L378 236Q380 246 370 246H30Q20 246 22 236Z"
        />
        <rect {...p.dim} x="170" y="222" width="60" height="6" rx="3" />
      </>
    ),
  },
  house: {
    viewBox: "0 0 400 320",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="200" cy="288" rx="170" ry="12" />
        <circle {...p.dim} cx="62" cy="214" r="32" />
        <rect {...p.ink} x="58" y="236" width="8" height="48" rx="3" />
        <circle {...p.dim} cx="344" cy="228" r="24" />
        <rect {...p.ink} x="340" y="246" width="8" height="38" rx="3" />
        <rect {...p.ink} x="248" y="86" width="22" height="48" rx="2" />
        <rect
          {...p.paper}
          {...p.edge}
          x="100"
          y="148"
          width="200"
          height="136"
        />
        <path {...p.accent} d="M80 158L200 68L320 158Z" />
        <rect {...p.ink} x="180" y="206" width="40" height="78" rx="4" />
        <circle {...p.paper} cx="212" cy="246" r="3" />
        <rect {...p.tint} x="122" y="178" width="40" height="36" rx="3" />
        <rect {...p.tint} x="238" y="178" width="40" height="36" rx="3" />
        <rect
          {...p.edge}
          fill="none"
          x="122"
          y="178"
          width="40"
          height="36"
          rx="3"
        />
        <rect
          {...p.edge}
          fill="none"
          x="238"
          y="178"
          width="40"
          height="36"
          rx="3"
        />
      </>
    ),
  },
  "person-active": {
    viewBox: "0 0 260 520",
    body: (p) => <ActivePose p={p} skin={SKIN.warm} hair="ponytail" />,
  },
  "person-meditate": {
    viewBox: "0 0 320 300",
    body: (p) => (
      <>
        <Sparkle x={72} y={70} size={10} fill={p.accent.fill} />
        <Sparkle x={250} y={58} size={14} fill={p.accent.fill} />
        <rect {...p.accent} x="46" y="262" width="228" height="14" rx="7" />
        <ellipse {...p.ink} cx="160" cy="248" rx="96" ry="22" />
        <path
          {...p.accent}
          d="M128 150Q160 136 192 150L198 244Q160 254 122 244Z"
        />
        <path {...p.skinLimb} d="M130 160Q106 202 100 236" />
        <path {...p.skinLimb} d="M190 160Q214 202 220 236" />
        <circle {...p.skin} cx="100" cy="240" r="9" />
        <circle {...p.skin} cx="220" cy="240" r="9" />
        <rect {...p.skin} x="151" y="118" width="18" height="30" rx="6" />
        <circle {...p.skin} cx="160" cy="112" r="24" />
        <path
          fill={HAIR.dark}
          d="M136 112C132 80 188 80 184 112Q176 96 160 96Q144 96 136 112Z"
        />
        <circle fill={HAIR.dark} cx="160" cy="80" r="12" />
      </>
    ),
  },
  microphone: {
    viewBox: "0 0 300 340",
    body: (p) => (
      <>
        <path {...p.accentStroke} strokeWidth="7" d="M64 108Q46 142 64 176" />
        <path
          {...p.accentStroke}
          strokeWidth="7"
          d="M236 108Q254 142 236 176"
        />
        <path {...p.steam} strokeWidth="6" d="M38 92Q14 142 38 192" />
        <path {...p.steam} strokeWidth="6" d="M262 92Q286 142 262 192" />
        <path
          {...p.strokeInk}
          strokeWidth="12"
          d="M86 132V150Q86 214 150 214Q214 214 214 150V132"
        />
        <rect {...p.ink} x="112" y="46" width="76" height="134" rx="38" />
        <rect {...p.shine} x="126" y="76" width="48" height="5" rx="2.5" />
        <rect {...p.shine} x="126" y="92" width="48" height="5" rx="2.5" />
        <rect {...p.shine} x="126" y="108" width="48" height="5" rx="2.5" />
        <rect {...p.accent} x="106" y="136" width="88" height="14" rx="4" />
        <rect {...p.ink} x="144" y="214" width="12" height="62" />
        <rect {...p.ink} x="102" y="274" width="96" height="14" rx="7" />
      </>
    ),
  },
  "person-portrait": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <Portrait p={p} skin={SKIN.warm} hair="long" hairColor={HAIR.brown} />
    ),
  },
  gift: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="150" cy="276" rx="104" ry="10" />
        <rect {...p.accent} x="70" y="140" width="160" height="132" rx="8" />
        <rect {...p.shade} x="70" y="140" width="160" height="16" />
        <rect {...p.accent} x="58" y="108" width="184" height="40" rx="8" />
        <rect {...p.paper} x="140" y="108" width="20" height="164" />
        <ellipse
          {...p.paper}
          {...p.edge}
          cx="124"
          cy="94"
          rx="28"
          ry="16"
          transform="rotate(-24 124 94)"
        />
        <ellipse
          {...p.paper}
          {...p.edge}
          cx="176"
          cy="94"
          rx="28"
          ry="16"
          transform="rotate(24 176 94)"
        />
        <circle {...p.paper} {...p.edge} cx="150" cy="104" r="11" />
        <Sparkle x={250} y={70} size={14} fill={p.accent.fill} />
        <Sparkle x={52} y={96} size={9} fill={p.accent.fill} />
      </>
    ),
  },
  florals: {
    viewBox: "0 0 320 320",
    body: (p) => (
      <>
        <circle {...p.steam} strokeWidth="3" cx="160" cy="160" r="104" />
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i * 20 * Math.PI) / 180;
          const x = 160 + 104 * cos(a);
          const y = 160 + 104 * sin(a);
          return (
            <ellipse
              key={i}
              {...(i % 2 ? p.ink : p.dim)}
              cx={x}
              cy={y}
              rx="17"
              ry="7"
              transform={`rotate(${i * 20 + 60} ${x} ${y})`}
            />
          );
        })}
        {[35, 150, 250, 320].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const x = 160 + 104 * cos(a);
          const y = 160 + 104 * sin(a);
          return (
            <g key={deg}>
              {[0, 72, 144, 216, 288].map((petal) => (
                <circle
                  key={petal}
                  {...p.accent}
                  cx={x + 11 * cos((petal * Math.PI) / 180)}
                  cy={y + 11 * sin((petal * Math.PI) / 180)}
                  r="10"
                />
              ))}
              <circle {...p.paper} cx={x} cy={y} r="7" />
            </g>
          );
        })}
        <circle {...p.accentStroke} strokeWidth="7" cx="146" cy="166" r="24" />
        <circle {...p.accentStroke} strokeWidth="7" cx="176" cy="166" r="24" />
      </>
    ),
  },
  "moon-cloud": {
    viewBox: "0 0 320 300",
    body: (p) => (
      <>
        <circle {...p.accent} cx="196" cy="106" r="52" />
        <circle {...p.shade} cx="180" cy="92" r="9" />
        <circle {...p.shade} cx="214" cy="124" r="6" />
        <circle {...p.shade} cx="206" cy="84" r="4" />
        <Sparkle x={80} y={70} size={12} fill={p.accent.fill} />
        <Sparkle x={272} y={180} size={9} fill={p.accent.fill} />
        <circle {...p.dim} cx="110" cy="120" r="4" />
        <circle {...p.dim} cx="262" cy="56" r="4" />
        <ellipse {...p.soft} cx="150" cy="262" rx="110" ry="10" />
        <circle {...p.paper} cx="104" cy="212" r="32" />
        <circle {...p.paper} cx="142" cy="194" r="40" />
        <circle {...p.paper} cx="184" cy="214" r="30" />
        <rect {...p.paper} x="80" y="212" width="130" height="36" rx="18" />
        <circle {...p.paper} cx="238" cy="236" r="18" />
        <rect {...p.paper} x="220" y="236" width="52" height="20" rx="10" />
      </>
    ),
  },
  "graduation-cap": {
    viewBox: "0 0 320 300",
    body: (p) => (
      <>
        <path {...p.ink} d="M92 146V200Q160 236 228 200V146L160 172Z" />
        <path {...p.shade} d="M92 146V200Q160 236 228 200V146L160 172Z" />
        <path {...p.ink} d="M160 70L290 120L160 170L30 120Z" />
        <path {...p.accentStroke} strokeWidth="5" d="M160 120L262 152V212" />
        <rect {...p.accent} x="254" y="208" width="16" height="36" rx="4" />
        <circle {...p.accent} cx="160" cy="120" r="8" />
        <g transform="rotate(-12 150 252)">
          <rect
            {...p.paper}
            {...p.edge}
            x="64"
            y="238"
            width="176"
            height="30"
            rx="15"
          />
          <rect {...p.accent} x="142" y="238" width="16" height="30" />
        </g>
        <Sparkle x={62} y={72} size={10} fill={p.accent.fill} />
      </>
    ),
  },
  "holiday-tree": {
    viewBox: "0 0 300 340",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="150" cy="318" rx="118" ry="10" />
        <path {...p.accent} d="M150 150L260 272H40Z" />
        <path {...p.accent} d="M150 96L236 206H64Z" />
        <path {...p.accent} d="M150 46L214 142H86Z" />
        <rect {...p.ink} x="136" y="272" width="28" height="38" />
        <Sparkle x={150} y={42} size={18} fill={p.ink.fill} />
        <circle {...p.ink} cx="122" cy="126" r="7" />
        <circle {...p.paper} cx="176" cy="170" r="7" />
        <circle {...p.ink} cx="110" cy="232" r="8" />
        <circle {...p.paper} cx="192" cy="246" r="7" />
        <circle {...p.ink} cx="160" cy="210" r="6" />
        <rect {...p.ink} x="54" y="278" width="52" height="38" rx="3" />
        <rect {...p.paper} x="76" y="278" width="8" height="38" />
        <rect {...p.dim} x="196" y="284" width="46" height="32" rx="3" />
        <rect {...p.paper} x="215" y="284" width="8" height="32" />
      </>
    ),
  },
  fireworks: {
    viewBox: "0 0 400 300",
    body: (p) => (
      <>
        {[
          { cx: 128, cy: 116, r: 70, rays: 14, paint: p.accentStroke },
          { cx: 284, cy: 92, r: 56, rays: 12, paint: p.steam },
          { cx: 262, cy: 212, r: 40, rays: 10, paint: p.accentStroke },
        ].map(({ cx, cy, r, rays, paint }) => (
          <g key={`${cx}-${cy}`}>
            {Array.from({ length: rays }, (_, i) => {
              const a = (i * 2 * Math.PI) / rays;
              return (
                <path
                  key={i}
                  {...paint}
                  strokeWidth="5"
                  d={`M${cx + r * 0.35 * cos(a)} ${cy + r * 0.35 * sin(a)}L${cx + r * cos(a)} ${cy + r * sin(a)}`}
                />
              );
            })}
            <circle {...p.accent} cx={cx} cy={cy} r="6" />
          </g>
        ))}
        <path {...p.steam} strokeWidth="3" d="M128 296Q122 240 128 190" />
        <path {...p.steam} strokeWidth="3" d="M262 296Q268 270 262 256" />
        <Sparkle x={52} y={232} size={10} fill={p.accent.fill} />
        <Sparkle x={360} y={180} size={12} fill={p.accent.fill} />
      </>
    ),
  },
  guitar: {
    viewBox: "0 0 260 400",
    body: (p) => (
      <>
        <rect {...p.ink} x="120" y="46" width="20" height="170" />
        <rect {...p.ink} x="110" y="18" width="40" height="42" rx="7" />
        <circle {...p.paper} cx="104" cy="30" r="5" />
        <circle {...p.paper} cx="104" cy="48" r="5" />
        <circle {...p.paper} cx="156" cy="30" r="5" />
        <circle {...p.paper} cx="156" cy="48" r="5" />
        <circle {...p.accent} cx="130" cy="210" r="54" />
        <circle {...p.accent} cx="130" cy="290" r="72" />
        <circle {...p.ink} cx="130" cy="244" r="20" />
        <rect {...p.ink} x="108" y="306" width="44" height="9" rx="3" />
        <path {...p.string} d="M125 40V310M130 40V310M135 40V310" />
        <ellipse
          {...p.accent}
          cx="220"
          cy="110"
          rx="12"
          ry="9"
          transform="rotate(-20 220 110)"
        />
        <rect {...p.accent} x="229" y="62" width="4" height="48" />
        <path {...p.accent} d="M233 62q16 6 12 24q-2-12-12-14Z" />
        <ellipse
          {...p.dim}
          cx="36"
          cy="160"
          rx="10"
          ry="8"
          transform="rotate(-20 36 160)"
        />
        <rect {...p.dim} x="43" y="120" width="4" height="40" />
      </>
    ),
  },
  "book-stack": {
    viewBox: "0 0 320 320",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="160" cy="292" rx="120" ry="10" />
        <rect {...p.ink} x="60" y="248" width="200" height="36" rx="4" />
        <rect {...p.accent} x="76" y="212" width="176" height="36" rx="4" />
        <rect {...p.dim} x="66" y="176" width="186" height="36" rx="4" />
        <rect {...p.shine} x="84" y="262" width="60" height="6" rx="3" />
        <rect {...p.shine} x="96" y="226" width="44" height="6" rx="3" />
        <path
          {...p.paper}
          {...p.edge}
          d="M160 170Q120 146 72 154V74Q120 66 160 90Z"
        />
        <path
          {...p.paper}
          {...p.edge}
          d="M160 170Q200 146 248 154V74Q200 66 160 90Z"
        />
        <rect {...p.dim} x="92" y="96" width="50" height="5" rx="2.5" />
        <rect {...p.dim} x="92" y="110" width="44" height="5" rx="2.5" />
        <rect {...p.dim} x="178" y="96" width="50" height="5" rx="2.5" />
        <rect {...p.accent} x="178" y="110" width="36" height="5" rx="2.5" />
      </>
    ),
  },
  "chart-growth": {
    viewBox: "0 0 400 300",
    body: (p) => (
      <>
        <rect
          {...p.paper}
          {...p.edge}
          x="40"
          y="30"
          width="320"
          height="236"
          rx="16"
        />
        <rect {...p.dim} x="64" y="52" width="90" height="10" rx="5" />
        <rect {...p.tint} x="84" y="184" width="38" height="52" rx="4" />
        <rect {...p.tint} x="144" y="154" width="38" height="82" rx="4" />
        <rect {...p.tint} x="204" y="124" width="38" height="112" rx="4" />
        <rect {...p.accent} x="264" y="84" width="38" height="152" rx="4" />
        <rect {...p.dim} x="70" y="236" width="256" height="3" />
        <path
          {...p.strokeInk}
          strokeWidth="5"
          d="M103 168L163 138L223 108L283 70"
        />
        <circle {...p.paper} {...p.edge} cx="103" cy="168" r="7" />
        <circle {...p.paper} {...p.edge} cx="163" cy="138" r="7" />
        <circle {...p.paper} {...p.edge} cx="223" cy="108" r="7" />
        <path {...p.ink} d="M296 58L276 64L290 80Z" />
      </>
    ),
  },
  "product-boxes": {
    viewBox: "0 0 320 320",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="160" cy="290" rx="130" ry="10" />
        <path {...p.accent} d="M60 160L100 132H222L182 160Z" />
        <path {...p.shine} d="M60 160L100 132H222L182 160Z" />
        <rect {...p.accent} x="60" y="160" width="122" height="122" />
        <path {...p.accent} d="M182 160L222 132V254L182 282Z" />
        <path {...p.shade} d="M182 160L222 132V254L182 282Z" />
        <rect {...p.paper} x="112" y="160" width="18" height="122" />
        <rect
          {...p.paper}
          {...p.edge}
          x="78"
          y="236"
          width="46"
          height="30"
          rx="3"
        />
        <path {...p.ink} d="M200 226L222 212H270L248 226Z" />
        <rect {...p.ink} x="200" y="226" width="48" height="56" />
        <path {...p.ink} d="M248 226L270 212V268L248 282Z" />
        <path {...p.shade} d="M248 226L270 212V268L248 282Z" />
        <rect
          {...p.paper}
          {...p.edge}
          x="236"
          y="84"
          width="34"
          height="56"
          rx="10"
        />
        <rect {...p.ink} x="244" y="70" width="18" height="16" rx="3" />
      </>
    ),
  },
  "heart-hands": {
    viewBox: "0 0 320 300",
    body: (p) => (
      <>
        <path
          {...p.accent}
          d="M160 222C58 154 92 72 160 114C228 72 262 154 160 222Z"
        />
        <path {...p.shine} d="M114 118Q126 100 144 108Q128 112 120 128Z" />
        <path {...p.skin} d="M52 262Q86 204 152 236L150 266Q98 262 58 280Z" />
        <path
          {...p.skin}
          d="M268 262Q234 204 168 236L170 266Q222 262 262 280Z"
        />
        <rect {...p.ink} x="16" y="252" width="52" height="40" rx="10" />
        <rect {...p.ink} x="252" y="252" width="52" height="40" rx="10" />
        <Sparkle x={70} y={70} size={11} fill={p.accent.fill} />
        <Sparkle x={258} y={58} size={14} fill={p.accent.fill} />
      </>
    ),
  },
  lightbulb: {
    viewBox: "0 0 300 340",
    body: (p) => (
      <>
        {[-150, -120, -90, -60, -30, 0, 180].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return (
            <path
              key={deg}
              {...p.accentStroke}
              strokeWidth="7"
              d={`M${150 + 90 * cos(a)} ${140 + 90 * sin(a)}L${150 + 114 * cos(a)} ${140 + 114 * sin(a)}`}
            />
          );
        })}
        <circle {...p.paper} {...p.edge} cx="150" cy="140" r="68" />
        <path {...p.paper} {...p.edge} d="M118 194L124 232H176L182 194Z" />
        <path
          {...p.accentStroke}
          strokeWidth="5"
          d="M130 196L138 142L150 162L162 142L170 196"
        />
        <rect {...p.ink} x="122" y="232" width="56" height="13" rx="4" />
        <rect {...p.ink} x="126" y="249" width="48" height="13" rx="4" />
        <rect {...p.ink} x="140" y="266" width="20" height="11" rx="5" />
        <path {...p.shine} d="M112 118Q120 90 146 84Q126 100 122 124Z" />
      </>
    ),
  },
  "phone-app": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="140" cy="396" rx="80" ry="9" />
        <rect {...p.ink} x="74" y="36" width="132" height="344" rx="24" />
        <rect {...p.paper} x="84" y="50" width="112" height="316" rx="14" />
        <rect {...p.dim} x="124" y="42" width="32" height="5" rx="2.5" />
        <rect {...p.accent} x="98" y="68" width="60" height="10" rx="5" />
        <rect {...p.tint} x="98" y="90" width="84" height="70" rx="10" />
        <circle {...p.accent} cx="118" cy="114" r="11" />
        <rect {...p.dim} x="134" y="108" width="38" height="6" rx="3" />
        <rect {...p.dim} x="112" y="140" width="56" height="6" rx="3" />
        <rect {...p.accent} x="98" y="174" width="38" height="38" rx="10" />
        <rect {...p.tint} x="144" y="174" width="38" height="38" rx="10" />
        <rect {...p.tint} x="98" y="220" width="38" height="38" rx="10" />
        <rect {...p.accent} x="144" y="220" width="38" height="38" rx="10" />
        <rect {...p.soft} x="98" y="272" width="84" height="12" rx="6" />
        <rect {...p.soft} x="98" y="292" width="60" height="12" rx="6" />
        <rect {...p.accent} x="162" y="112" width="96" height="40" rx="14" />
        <rect {...p.paper} x="176" y="124" width="52" height="6" rx="3" />
        <rect {...p.shine} x="176" y="136" width="36" height="5" rx="2.5" />
        <Sparkle x={52} y={96} size={12} fill={p.accent.fill} />
      </>
    ),
  },
  champagne: {
    viewBox: "0 0 300 340",
    body: (p) => (
      <>
        <g transform="rotate(-14 110 200)">
          <path
            {...p.paper}
            {...p.edge}
            d="M84 82H136L128 194Q110 206 92 194Z"
          />
          <path {...p.accent} d="M88 114H132L126 192Q110 202 94 192Z" />
          <circle {...p.shine} cx="104" cy="150" r="4" />
          <circle {...p.shine} cx="116" cy="170" r="3" />
          <rect
            {...p.paper}
            {...p.edge}
            x="107"
            y="200"
            width="6"
            height="84"
          />
          <ellipse {...p.paper} {...p.edge} cx="110" cy="286" rx="28" ry="6" />
        </g>
        <g transform="rotate(14 190 200)">
          <path
            {...p.paper}
            {...p.edge}
            d="M164 82H216L208 194Q190 206 172 194Z"
          />
          <path {...p.accent} d="M168 114H212L206 192Q190 202 174 192Z" />
          <circle {...p.shine} cx="186" cy="146" r="4" />
          <circle {...p.shine} cx="196" cy="168" r="3" />
          <rect
            {...p.paper}
            {...p.edge}
            x="187"
            y="200"
            width="6"
            height="84"
          />
          <ellipse {...p.paper} {...p.edge} cx="190" cy="286" rx="28" ry="6" />
        </g>
        <Sparkle x={150} y={56} size={18} fill={p.accent.fill} />
        <Sparkle x={112} y={40} size={8} fill={p.ink.fill} />
        <Sparkle x={190} y={36} size={9} fill={p.ink.fill} />
      </>
    ),
  },
  team: {
    viewBox: "0 0 440 300",
    body: (p) => (
      <>
        {[
          {
            cx: 110,
            s: 0.85,
            shirt: p.dim,
            skin: SKIN.light,
            hairColor: HAIR.auburn,
            hair: "M-40 -4C-46-64 46-64 40-4Q32-36 0-38Q-32-36-40-4Z",
          },
          {
            cx: 330,
            s: 0.85,
            shirt: p.ink,
            skin: SKIN.medium,
            hairColor: HAIR.dark,
            hair: "M-40 -4C-44-58 44-58 40-4Q36-30 0-32Q-36-30-40-4ZM-40-4Q-44 30-30 44L-26 0Z",
          },
          {
            cx: 220,
            s: 1,
            shirt: p.accent,
            skin: SKIN.deep,
            hairColor: HAIR.dark,
            hair: "M-40 -4C-44-62 44-62 40-4Q30-40 0-40Q-30-40-40-4Z",
          },
        ].map(({ cx, s, shirt, skin, hairColor, hair }) => (
          <g
            key={cx}
            transform={`translate(${cx} ${290 - 150 * s}) scale(${s})`}
          >
            <path {...shirt} d="M-88 150Q-88 66 0 60Q88 66 88 150Z" />
            <rect fill={skin} x="-13" y="28" width="26" height="36" rx="9" />
            <circle fill={skin} cx="0" cy="0" r="40" />
            <path fill={hairColor} d={hair} />
          </g>
        ))}
      </>
    ),
  },
  "bust-woman": {
    viewBox: "0 0 400 500",
    body: (p) => (
      <Bust p={p} skin={SKIN.deep} hair="long" top={p.accent} earrings />
    ),
  },
  "bust-man": {
    viewBox: "0 0 400 500",
    body: (p) => (
      <Bust p={p} skin={SKIN.medium} hair="short" top={p.ink} beard blazer />
    ),
  },
  "bust-woman-2": {
    viewBox: "0 0 400 500",
    body: (p) => (
      <Bust
        p={p}
        skin={SKIN.light}
        hair="bun"
        hairColor={HAIR.auburn}
        top={p.accent}
        glasses
      />
    ),
  },
  "bust-curly": {
    viewBox: "0 0 400 500",
    body: (p) => (
      <Bust
        p={p}
        skin={SKIN.warm}
        hair="curly"
        hairColor={HAIR.brown}
        top={p.accent}
        earrings
      />
    ),
  },
  profile: {
    viewBox: "0 0 400 500",
    body: (p) => (
      <>
        <path
          {...p.ink}
          d="M60 500L100 430Q120 390 112 360Q58 320 62 240Q66 140 150 104Q240 72 310 130Q336 160 334 200L338 216Q350 238 362 262Q366 274 352 278L344 280Q348 294 340 302Q348 312 338 322Q342 344 322 350Q296 356 286 364L290 420Q346 444 400 462V500Z"
        />
        <circle {...p.accentStroke} strokeWidth="7" cx="168" cy="318" r="16" />
      </>
    ),
  },
  perfume: {
    viewBox: "0 0 320 420",
    body: (p) => (
      <>
        <rect {...p.tint} x="50" y="330" width="220" height="90" />
        <ellipse {...p.accent} cx="160" cy="330" rx="110" ry="18" />
        <ellipse {...p.shade} cx="160" cy="330" rx="70" ry="9" />
        <rect {...p.accent} x="92" y="150" width="136" height="176" rx="24" />
        <rect {...p.shade} x="92" y="286" width="136" height="40" rx="18" />
        <rect {...p.shine} x="106" y="166" width="12" height="128" rx="6" />
        <rect {...p.paper} x="128" y="214" width="64" height="44" rx="4" />
        <rect {...p.dim} x="140" y="228" width="40" height="5" rx="2.5" />
        <rect {...p.dim} x="146" y="240" width="28" height="4" rx="2" />
        <rect {...p.paper} {...p.edge} x="144" y="126" width="32" height="28" />
        <rect {...p.ink} x="122" y="64" width="76" height="66" rx="10" />
        <rect {...p.shine} x="132" y="74" width="10" height="44" rx="5" />
        <Sparkle x={262} y={120} size={16} fill={p.accent.fill} />
        <Sparkle x={58} y={200} size={10} fill={p.accent.fill} />
      </>
    ),
  },
  headphones: {
    viewBox: "0 0 360 360",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="180" cy="330" rx="130" ry="12" />
        <path
          {...p.strokeInk}
          strokeWidth="26"
          d="M76 214Q72 64 180 62Q288 64 284 214"
        />
        <rect {...p.accent} x="40" y="188" width="78" height="118" rx="34" />
        <rect {...p.accent} x="242" y="188" width="78" height="118" rx="34" />
        <rect {...p.ink} x="104" y="202" width="24" height="90" rx="12" />
        <rect {...p.ink} x="232" y="202" width="24" height="90" rx="12" />
        <rect {...p.shine} x="54" y="206" width="10" height="70" rx="5" />
        <path {...p.steam} strokeWidth="6" d="M20 214Q6 246 20 278" />
        <path {...p.steam} strokeWidth="6" d="M340 214Q354 246 340 278" />
      </>
    ),
  },
  cocktail: {
    viewBox: "0 0 300 400",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="150" cy="352" rx="96" ry="10" />
        <path {...p.strokeInk} strokeWidth="7" d="M196 34L164 170" />
        <path
          {...p.paper}
          {...p.edge}
          d="M54 118H246Q236 214 150 218Q64 214 54 118Z"
        />
        <path {...p.accent} d="M66 136H234Q222 204 150 206Q78 204 66 136Z" />
        <rect
          {...p.paper}
          {...p.edge}
          x="145"
          y="216"
          width="10"
          height="118"
        />
        <ellipse {...p.paper} {...p.edge} cx="150" cy="336" rx="62" ry="11" />
        <circle fill="#F6C945" cx="228" cy="116" r="30" />
        <circle fill="#FFF4C2" cx="228" cy="116" r="22" />
        <path
          fill="none"
          stroke="#F6C945"
          strokeWidth="3"
          d="M228 94V138M206 116H250M212 100L244 132M244 100L212 132"
        />
        <circle {...p.shine} cx="112" cy="160" r="5" />
        <circle {...p.shine} cx="134" cy="178" r="4" />
        <circle {...p.shine} cx="178" cy="164" r="3" />
        <Sparkle x={62} y={62} size={12} fill={p.accent.fill} />
      </>
    ),
  },
  "vase-set": {
    viewBox: "0 0 400 360",
    body: (p) => (
      <>
        <ellipse {...p.soft} cx="200" cy="340" rx="170" ry="12" />
        <path {...p.strokeInk} strokeWidth="3" d="M140 114Q150 60 196 26" />
        <ellipse
          {...p.dim}
          cx="160"
          cy="70"
          rx="14"
          ry="6"
          transform="rotate(-40 160 70)"
        />
        <ellipse
          {...p.dim}
          cx="176"
          cy="46"
          rx="14"
          ry="6"
          transform="rotate(-20 176 46)"
        />
        <ellipse
          {...p.ink}
          cx="150"
          cy="92"
          rx="14"
          ry="6"
          transform="rotate(-60 150 92)"
        />
        <path
          {...p.accent}
          d="M120 330Q96 250 112 190Q124 150 116 110H164Q156 150 168 190Q184 250 160 330Z"
        />
        <rect {...p.shine} x="126" y="180" width="8" height="110" rx="4" />
        <rect {...p.ink} x="206" y="196" width="28" height="28" rx="4" />
        <path
          {...p.ink}
          d="M200 330Q160 320 164 270Q170 222 220 218Q270 222 276 270Q280 320 240 330Z"
        />
        <path {...p.paper} {...p.edge} d="M292 330L286 280H344L338 330Z" />
        <rect {...p.accent} x="286" y="292" width="58" height="8" />
        <rect {...p.dim} x="60" y="330" width="300" height="8" rx="4" />
      </>
    ),
  },
  "city-skyline": {
    viewBox: "0 0 500 300",
    body: (p) => (
      <>
        <rect {...p.tint} x="0" y="0" width="500" height="300" />
        <circle {...p.accent} cx="384" cy="82" r="38" />
        {[
          [0, 60, 140],
          [55, 50, 180],
          [100, 70, 120],
          [170, 40, 200],
          [205, 60, 150],
          [260, 50, 220],
          [305, 70, 130],
          [370, 45, 190],
          [410, 90, 160],
        ].map(([x, w, h]) => (
          <rect
            key={`b${x}`}
            {...p.dim}
            x={x}
            y={300 - h!}
            width={w}
            height={h}
          />
        ))}
        {[
          [0, 80, 90],
          [75, 45, 130],
          [118, 60, 100],
          [175, 35, 150],
          [208, 70, 110],
          [275, 40, 160],
          [312, 60, 95],
          [370, 50, 140],
          [418, 82, 105],
        ].map(([x, w, h], b) => (
          <g key={`f${x}`}>
            <rect {...p.ink} x={x} y={300 - h!} width={w} height={h} />
            {Array.from({ length: Math.floor((h! - 20) / 20) }, (_, row) =>
              Array.from({ length: Math.floor((w! - 8) / 14) }, (_, col) =>
                (row * 3 + col + b) % 4 === 0 ? null : (
                  <rect
                    key={`${row}-${col}`}
                    {...p.accent}
                    fillOpacity={0.75}
                    x={x! + 8 + col * 14}
                    y={300 - h! + 14 + row * 20}
                    width="6"
                    height="9"
                  />
                ),
              ),
            )}
          </g>
        ))}
      </>
    ),
  },
  "gold-frame": {
    viewBox: "0 0 400 500",
    body: (p) => (
      <>
        <rect
          {...p.accentStroke}
          strokeWidth="5"
          x="12"
          y="12"
          width="376"
          height="476"
        />
        <rect
          {...p.accentStroke}
          strokeWidth="1.5"
          x="26"
          y="26"
          width="348"
          height="448"
        />
        {[
          "",
          "translate(400 0) scale(-1 1)",
          "translate(0 500) scale(1 -1)",
          "translate(400 500) scale(-1 -1)",
        ].map((transform) => (
          <g key={transform || "tl"} transform={transform || undefined}>
            <path {...p.accent} d="M26 12L40 26L26 40L12 26Z" />
            <path
              {...p.accentStroke}
              strokeWidth="2.5"
              d="M26 86Q26 26 86 26"
            />
            <path
              {...p.accentStroke}
              strokeWidth="1.5"
              d="M42 110Q42 42 110 42"
            />
            <circle {...p.accent} cx="64" cy="64" r="4" />
          </g>
        ))}
        <path {...p.accent} d="M200 4L212 12L200 20L188 12Z" />
        <path {...p.accent} d="M200 480L212 488L200 496L188 488Z" />
      </>
    ),
  },
  "floral-frame": {
    viewBox: "0 0 400 500",
    body: (p) => (
      <>
        <rect
          {...p.accentStroke}
          strokeWidth="2"
          x="28"
          y="28"
          width="344"
          height="444"
        />
        {["", "translate(400 500) scale(-1 -1)"].map((transform) => (
          <g key={transform || "tl"} transform={transform || undefined}>
            {[
              [30, 96, 70],
              [58, 70, 40],
              [96, 34, 20],
              [130, 22, 0],
              [20, 140, 90],
            ].map(([x, y, a]) => (
              <ellipse
                key={`${x}-${y}`}
                {...(x! % 2 ? p.dim : p.ink)}
                cx={x}
                cy={y}
                rx="26"
                ry="10"
                transform={`rotate(${a} ${x} ${y})`}
              />
            ))}
            {[
              [40, 40, 22],
              [86, 58, 15],
              [54, 94, 13],
            ].map(([x, y, r]) => (
              <g key={`${x}-${y}`}>
                {[0, 72, 144, 216, 288].map((deg) => (
                  <circle
                    key={deg}
                    {...p.accent}
                    cx={x! + r! * 0.8 * cos((deg * Math.PI) / 180)}
                    cy={y! + r! * 0.8 * sin((deg * Math.PI) / 180)}
                    r={r! * 0.7}
                  />
                ))}
                <circle {...p.paper} cx={x} cy={y} r={r! * 0.42} />
              </g>
            ))}
          </g>
        ))}
      </>
    ),
  },
  laurel: {
    viewBox: "0 0 360 300",
    body: (p) => (
      <>
        {[-1, 1].map((side) => (
          <g key={side}>
            <path
              {...p.accentStroke}
              strokeWidth="4"
              d={`M${180 + side * 22} 276Q${180 + side * 150} 250 ${180 + side * 138} 60`}
            />
            {Array.from({ length: 9 }, (_, i) => {
              const a =
                ((side < 0 ? 100 + i * 17 : 80 - i * 17) * Math.PI) / 180;
              const x = 180 + 128 * cos(a);
              const y = 160 + 116 * sin(a);
              const deg = side < 0 ? 100 + i * 17 + 60 : 80 - i * 17 - 60;
              return (
                <ellipse
                  key={i}
                  {...(i % 2 ? p.accent : p.dim)}
                  cx={x}
                  cy={y}
                  rx="24"
                  ry="9"
                  transform={`rotate(${deg} ${x} ${y})`}
                />
              );
            })}
          </g>
        ))}
        <path {...p.accent} d="M180 268L160 292L180 284L200 292Z" />
        <circle {...p.accent} cx="180" cy="270" r="9" />
      </>
    ),
  },
  abstract: {
    viewBox: "0 0 320 320",
    body: (p) => (
      <>
        <path
          {...p.accent}
          d="M142 54C212 30 290 66 286 150C282 214 262 262 214 266C168 270 164 226 128 210C86 192 64 164 74 118C82 84 104 66 142 54Z"
        />
        <circle {...p.strokeInk} cx="96" cy="206" r="54" strokeWidth="3" />
        <Sparkle x={250} y={262} size={12} fill={p.accent.fill} />
      </>
    ),
  },

  // Tier A: devices, mobile and web screens, AI, social and charts.
  ...deviceMotifs,
  ...mobileUiMotifs,
  ...webUiMotifs,
  ...aiMotifs,
  ...socialMotifs,
  ...chartMotifs,

  // Tier B and C: objects, abstract/background fills and stickers.
  ...objectMotifs,
  ...stickerMotifs,

  // Street scene: separate flat vector pieces for the Street Style Fit
  // Check template (motifs/street.tsx).
  ...streetMotifs,
  ...bathroomMotifs,
  ...cafeMotifs,
  ...parkMotifs,
  ...coastMotifs,
};

/** Picker labels, in display order. */
export const PLACEHOLDER_ART_OPTIONS = (
  [
    ["photo-frame", "Photo", "People & photo"],
    ["landscape", "Landscape", "People & photo"],
    ["person-standing", "Woman", "People & photo"],
    ["person-man", "Man", "People & photo"],
    ["person-child", "Child", "People & photo"],
    ["person-elder", "Older adult", "People & photo"],
    ["family", "Family", "People & photo"],
    ["person-active", "Woman, active", "People & photo"],
    ["person-active-man", "Man, active", "People & photo"],
    ["person-meditate", "Person, seated", "People & photo"],
    ["person-wheelchair", "Wheelchair user", "People & photo"],
    ["bust-woman", "Half-body, woman", "People & photo"],
    ["bust-man", "Half-body, man", "People & photo"],
    ["bust-woman-2", "Half-body, glasses", "People & photo"],
    ["bust-curly", "Half-body, curly hair", "People & photo"],
    ["profile", "Profile silhouette", "People & photo"],
    ["person-standing:silhouette", "Woman, silhouette", "People & photo"],
    ["person-man:silhouette", "Man, silhouette", "People & photo"],
    [
      "person-active-man:silhouette",
      "Man active, silhouette",
      "People & photo",
    ],
    ["bust-woman:silhouette", "Half-body woman, silhouette", "People & photo"],
    ["bust-man:silhouette", "Half-body man, silhouette", "People & photo"],
    ["person-portrait", "Portrait, woman", "People & photo"],
    ["portrait-man", "Portrait, man", "People & photo"],
    ["team", "Team", "People & photo"],
    ["person-walking", "Woman, walking", "People & photo"],
    ["bust-skincare", "Half-body, skincare", "People & photo"],
    ["person-cafe", "Man, cafe", "People & photo"],
    ["person-stretch", "Woman, stretching", "People & photo"],
    ["bust-athlete", "Half-body, athlete", "People & photo"],
    ["person-linen-dress", "Woman, linen dress", "People & photo"],

    ["street-crossing", "Street scene", "Street scene"],
    ["street-shadows", "Tree shadows", "Street scene"],
    ["street-shopfront", "Back street", "Street scene"],
    ["street-facade", "Stone facade", "Street scene"],
    ["street-sunbeams", "Sunlight", "Street scene"],
    ["street-lamp", "Street lamp", "Street scene"],
    ["street-tree", "Plane tree", "Street scene"],
    ["street-railing", "Iron railing", "Street scene"],
    ["street-planter", "Planter", "Street scene"],
    ["street-cast-shadow", "Cast shadow", "Street scene"],

    ["bathroom-wall", "Bathroom", "Bathroom scene"],
    ["bathroom-towel", "Towel on hook", "Bathroom scene"],
    ["plant-vase", "Plant in vase", "Bathroom scene"],

    ["cafe-interior", "Cafe interior", "Cafe scene"],
    ["hanging-plant", "Hanging plant", "Cafe scene"],

    ["park-lakeside", "Lakeside park", "Park scene"],
    ["park-stone-wall", "Hedge and stone wall", "Park scene"],

    ["coast-promenade", "Seaside promenade", "Coast scene"],
    ["coast-terrace", "Stone terrace", "Coast scene"],

    ["product-bottle", "Product bottle", "Products & objects"],
    ["product-bag", "Shopping bag", "Products & objects"],
    ["product-boxes", "Packaged goods", "Products & objects"],
    ["perfume", "Perfume", "Products & objects"],
    ["skincare-pump", "Pump bottle", "Products & objects"],
    ["mug-ceramic", "Ceramic mug", "Products & objects"],
    ["headphones", "Headphones", "Products & objects"],
    ["cocktail", "Cocktail", "Products & objects"],
    ["vase-set", "Ceramics", "Products & objects"],
    ["phone-app", "Phone app", "Devices & scenes"],
    ["laptop-screen", "Laptop", "Devices & scenes"],
    ["food-bowl", "Food", "Products & objects"],
    ["house", "House", "Devices & scenes"],
    ["city-skyline", "City skyline", "Devices & scenes"],
    ["event-stage", "Event stage", "Devices & scenes"],
    ["microphone", "Microphone", "Products & objects"],
    ["guitar", "Guitar", "Products & objects"],
    ["book-stack", "Books", "Products & objects"],
    ["chart-growth", "Growth chart", "Charts"],
    ["lightbulb", "Idea", "Products & objects"],
    ["gift", "Gift", "Products & objects"],
    ["balloons", "Balloons", "Products & objects"],
    ["champagne", "Celebration", "Products & objects"],
    ["fireworks", "Fireworks", "Products & objects"],
    ["florals", "Florals", "Products & objects"],
    ["holiday-tree", "Holiday tree", "Products & objects"],
    ["moon-cloud", "Moon and clouds", "Products & objects"],
    ["graduation-cap", "Graduation", "Products & objects"],
    ["heart-hands", "Heart", "Products & objects"],
    ["abstract", "Abstract shapes", "Products & objects"],
    ["gold-frame", "Gold frame", "Frames & brand"],
    ["floral-frame", "Floral frame", "Frames & brand"],
    ["laurel", "Laurel wreath", "Frames & brand"],
    ["logo-mark", "Logo", "Frames & brand"],
    ["brand-mark", "Brand mark", "Frames & brand"],
    ["brand-wordmark", "Wordmark", "Frames & brand"],
    ["brand-app-icon", "App icon", "Frames & brand"],

    ["devices-phone-blank", "Phone, blank", "Devices & scenes"],
    ["devices-tablet", "Tablet", "Devices & scenes"],
    ["devices-desktop-monitor", "Desktop monitor", "Devices & scenes"],
    ["devices-smartwatch", "Smartwatch", "Devices & scenes"],
    ["devices-browser-blank", "Browser, blank", "Devices & scenes"],
    ["devices-phone-laptop", "Phone and laptop", "Devices & scenes"],

    ["phone-onboarding", "Phone, onboarding", "Mobile app"],
    ["phone-login", "Phone, login", "Mobile app"],
    ["phone-dashboard", "Phone, dashboard", "Mobile app"],
    ["phone-chat", "Phone, chat", "Mobile app"],
    ["phone-product", "Phone, product", "Mobile app"],
    ["phone-checkout", "Phone, checkout", "Mobile app"],
    ["phone-profile", "Phone, profile", "Mobile app"],
    ["phone-map", "Phone, map", "Mobile app"],
    ["phone-music", "Phone, music", "Mobile app"],
    ["phone-fitness", "Phone, fitness", "Mobile app"],
    ["phone-wallet", "Phone, wallet", "Mobile app"],
    ["phone-notifications", "Phone, notifications", "Mobile app"],

    ["browser-landing", "Browser, landing page", "Web page"],
    ["browser-pricing", "Browser, pricing", "Web page"],
    ["browser-features", "Browser, features", "Web page"],
    ["browser-testimonial", "Browser, testimonial", "Web page"],
    ["browser-dashboard", "Browser, dashboard", "Web page"],
    ["browser-blog", "Browser, blog", "Web page"],
    ["browser-404", "Browser, 404 page", "Web page"],
    ["browser-signup", "Browser, sign-up", "Web page"],
    ["browser-store", "Browser, store", "Web page"],
    ["browser-portfolio", "Browser, portfolio", "Web page"],

    ["ai-chat-window", "AI chat window", "AI"],
    ["ai-robot", "AI robot", "AI"],
    ["ai-sparkle", "AI sparkle burst", "AI"],
    ["ai-prompt-bar", "AI prompt bar", "AI"],
    ["ai-copilot", "AI assistant sidebar", "AI"],
    ["ai-node-graph", "AI node graph", "AI"],
    ["ai-voice-wave", "AI voice wave", "AI"],
    ["ai-chat-bubbles", "AI chat bubbles", "AI"],
    ["ai-chip", "AI chip", "AI"],
    ["ai-image-grid", "AI image grid", "AI"],
    ["ai-task-list", "AI task list", "AI"],
    ["ai-agents-network", "AI agents network", "AI"],

    ["social-post", "Social post", "Social"],
    ["social-story", "Social story", "Social"],
    ["social-reel", "Social reel", "Social"],
    ["social-profile", "Social profile", "Social"],
    ["social-reactions", "Social reactions", "Social"],

    ["chart-bar", "Bar chart", "Charts"],
    ["chart-line", "Line chart", "Charts"],
    ["chart-pie", "Pie chart", "Charts"],
    ["chart-donut", "Donut chart", "Charts"],
    ["chart-area", "Area chart", "Charts"],
    ["chart-kpi", "KPI stat", "Charts"],
  ] satisfies [string, string, string][]
).map(([key, label, group]) => ({ key, label, group }));

/** Motif an empty slot of each visual kind starts with. */
export const DEFAULT_PLACEHOLDER_ART: Record<ImageKind, string> = {
  heroImage: "landscape",
  productImage: "product-bottle",
  humanModelImage: "person-standing",
  supportingImage: "photo-frame",
  logo: "logo-mark",
  brandMark: "brand-mark",
};

/**
 * An art key is a motif name, optionally suffixed with ":silhouette" to draw
 * the whole motif in the document's ink as a single flat shape.
 */
function parseArt(key: string) {
  const [name = "", variant] = key.split(":");
  const lookup = motifs as Record<string, Motif | undefined>;
  return { motif: lookup[name], silhouette: variant === "silhouette" };
}

export function hasPlaceholderArt(key: string | undefined): key is string {
  return !!key && !!parseArt(key).motif;
}

const alignOf = (focal: number) =>
  focal < 0.34 ? "Min" : focal > 0.66 ? "Max" : "Mid";

export function PlaceholderArt({
  art,
  colors,
  fit = "contain",
  focalX = 0.5,
  focalY = 0.5,
}: {
  art: string;
  colors: ArtColors;
  /** Mirrors the slot's object-fit: "cover" crops the motif like a photo. */
  fit?: "cover" | "contain";
  focalX?: number;
  focalY?: number;
}) {
  const filterId = `art-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { motif, silhouette } = parseArt(art);
  if (!motif) return null;
  const align = `x${alignOf(focalX)}Y${alignOf(focalY)}`;
  return (
    <svg
      className="placeholder-art"
      viewBox={motif.viewBox}
      preserveAspectRatio={`${align} ${fit === "cover" ? "slice" : "meet"}`}
      aria-hidden="true"
      focusable="false"
    >
      {silhouette && (
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feFlood floodColor={colors.ink} />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      )}
      <g filter={silhouette ? `url(#${filterId})` : undefined}>
        {motif.body(paints(colors), (name) => `${filterId}-${name}`)}
      </g>
    </svg>
  );
}
