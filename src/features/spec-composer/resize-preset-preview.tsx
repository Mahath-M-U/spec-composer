import type { ReactNode } from "react";
import type { ResizePreset } from "./resize";
import "./resize-preset-preview.css";

const palette = {
  cream: "#EFE9DE",
  paper: "#F8F4EC",
  coral: "#C55454",
  burgundy: "#652F3F",
  sage: "#929F87",
  forest: "#394D43",
  ochre: "#C6A46B",
  ink: "#302E2B",
  blush: "#DFC1B5",
};
const sans = 'Manrope, "Helvetica Neue", Arial, sans-serif';
const serif = '"Instrument Serif", Georgia, serif';

function Headline({
  lines,
  x,
  y,
  size,
  leading = 1.05,
  fill = palette.ink,
  elegant = false,
}: {
  lines: readonly string[];
  x: number;
  y: number;
  size: number;
  leading?: number;
  fill?: string;
  elegant?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontFamily={elegant ? serif : sans}
      fontSize={size}
      fontWeight={elegant ? 400 : 800}
      letterSpacing={elegant ? -0.6 : -1.5}
    >
      {lines.map((line, index) => (
        <tspan key={line} x={x} dy={index ? size * leading : 0}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function Caption({
  children,
  x = 26,
  y = 30,
  fill = palette.ink,
  size = 8,
}: {
  children: ReactNode;
  x?: number;
  y?: number;
  fill?: string;
  size?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontFamily={sans}
      fontWeight={600}
      fontSize={size}
      letterSpacing={1.3}
    >
      {children}
    </text>
  );
}

function Botanical({
  transform,
  fill = palette.forest,
  opacity = 1,
}: {
  transform: string;
  fill?: string;
  opacity?: number;
}) {
  return (
    <g transform={transform} fill={fill} opacity={opacity}>
      <path d="M0 110 Q18 55 65 4" fill="none" stroke={fill} strokeWidth="2" />
      <path d="M13 79 Q-15 55 3 33 Q28 49 13 79ZM27 57 Q15 20 38 10 Q52 37 27 57ZM43 34 Q45 5 70 0 Q72 25 43 34ZM12 83 Q43 53 57 71 Q45 96 12 83ZM30 52 Q60 27 74 44 Q60 66 30 52Z" />
    </g>
  );
}

function Arch({
  transform,
  fill = palette.sage,
}: {
  transform: string;
  fill?: string;
}) {
  return (
    <path
      transform={transform}
      d="M0 160V64a64 64 0 0 1 128 0v96Z"
      fill={fill}
    />
  );
}

function Play({
  transform,
  fill = palette.cream,
}: {
  transform: string;
  fill?: string;
}) {
  return (
    <g transform={transform}>
      <circle r="27" fill={fill} />
      <path d="m-6-11 19 11-19 11Z" fill={palette.burgundy} />
    </g>
  );
}

function InstagramPost() {
  return (
    <>
      <rect
        x="17"
        y="17"
        width="286"
        height="286"
        fill="none"
        stroke={palette.burgundy}
      />
      <Caption x={33} y={43}>
        THE CREATIVE EDIT / 01
      </Caption>
      <circle cx="233" cy="200" r="64" fill={palette.burgundy} />
      <circle cx="222" cy="190" r="39" fill={palette.blush} />
      <Headline
        lines={["Ideas", "take shape."]}
        x={31}
        y={106}
        size={47}
        elegant
      />
      <path
        d="m46 190 12 19 22-2-12 18 8 21-21-6-17 14-1-23-18-12 21-7Z"
        fill={palette.coral}
      />
      <Caption x={33} y={280}>
        A LITTLE SPACE. A NEW PERSPECTIVE.
      </Caption>
    </>
  );
}

function InstagramStory() {
  return (
    <>
      <Caption y={39}>ROOM TO CREATE / VOL. 02</Caption>
      <circle cx="245" cy="119" r="47" fill={palette.coral} />
      <Headline
        lines={["MAKE", "ROOM", "FOR", "MORE."]}
        x={24}
        y={198}
        size={58}
        leading={1.03}
      />
      <path
        d="M127 521v-38h38v-38h38v-38h38v-38h55v152Z"
        fill={palette.burgundy}
      />
      <path
        d="M150 521v-24h38v-38h38v-38h38v-38h32"
        fill="none"
        stroke={palette.blush}
        strokeWidth="2"
      />
      <Caption y={543}>LET YOUR NEXT IDEA IN.</Caption>
    </>
  );
}

function InstagramAd() {
  return (
    <>
      <Caption y={31}>SUNDAY / SLOW LIVING</Caption>
      <Arch transform="translate(166 104) scale(.99 1.2)" />
      <path d="M208 296V175a22 22 0 0 1 44 0v121Z" fill={palette.cream} />
      <Botanical transform="translate(204 175) rotate(-16) scale(1.05)" />
      <Headline
        lines={["A slower", "kind of", "living."]}
        x={25}
        y={91}
        size={43}
        elegant
      />
      <Caption x={26} y={280} size={7}>
        FIND YOUR EVERYDAY CALM
      </Caption>
      <path d="M26 291h102" stroke={palette.coral} strokeWidth="2" />
    </>
  );
}

function FacebookLandscape() {
  return (
    <>
      <path d="M214 19a74 74 0 0 1 0 148Z" fill={palette.coral} />
      <Botanical
        transform="translate(213 49) rotate(17) scale(1.04)"
        opacity={0.13}
      />
      <Caption x={21} y={28} size={7}>
        NOTES ON CREATIVITY
      </Caption>
      <Headline
        lines={["Good things", "take shape."]}
        x={20}
        y={77}
        size={33}
        elegant
      />
      <Caption x={22} y={147} size={6}>
        THOUGHTFULLY MADE. EVERY DAY.
      </Caption>
    </>
  );
}

function FacebookSquare() {
  return (
    <>
      <rect y="167" width="320" height="153" fill={palette.burgundy} />
      <circle cx="230" cy="260" r="45" fill={palette.coral} />
      <circle cx="264" cy="260" r="30" fill={palette.blush} />
      <Caption y={33}>THE EVERYDAY SERIES</Caption>
      <Headline
        lines={["MAKE", "EVERY"]}
        x={25}
        y={98}
        size={38}
        leading={1.15}
      />
      <Headline
        lines={["DAY COUNT."]}
        x={25}
        y={210}
        size={35}
        fill={palette.cream}
      />
      <Caption x={26} y={245} fill={palette.cream}>
        MAKE IT MATTER.
      </Caption>
    </>
  );
}

function FacebookCover() {
  return (
    <>
      <rect x="182" width="138" height="119" fill={palette.blush} />
      <circle cx="270" cy="30" r="15" fill={palette.coral} />
      <path d="M178 119V78l47-34v75Z" fill={palette.sage} />
      <Arch
        transform="translate(227 43) scale(.59 .55)"
        fill={palette.burgundy}
      />
      <path d="M249 119V85a15 15 0 0 1 30 0v34" fill={palette.cream} />
      <path
        d="M183 112h27v-12h22v-12h19"
        fill="none"
        stroke={palette.ochre}
        strokeWidth="5"
      />
      <Caption x={17} y={21} size={6}>
        OPEN HOUSE / CREATIVE SPACES
      </Caption>
      <Headline
        lines={["Space for new", "perspectives."]}
        x={16}
        y={57}
        size={24}
        elegant
      />
      <Caption x={18} y={103} size={5}>
        LOOK A LITTLE FURTHER.
      </Caption>
    </>
  );
}

function YoutubeThumbnail() {
  return (
    <>
      <rect width="182" height="180" fill={palette.burgundy} />
      <rect x="194" y="16" width="111" height="112" fill={palette.ochre} />
      <rect x="214" y="37" width="91" height="91" fill={palette.coral} />
      <rect x="230" y="54" width="75" height="74" fill={palette.blush} />
      <Play transform="translate(249 89)" />
      <Caption x={17} y={24} fill={palette.blush} size={6}>
        THE DESIGN WORKSHOP
      </Caption>
      <Headline
        lines={["BUILD", "BETTER", "IDEAS."]}
        x={16}
        y={65}
        size={34}
        fill={palette.cream}
      />
      <Caption x={198} y={156} size={7}>
        WATCH & CREATE
      </Caption>
    </>
  );
}

function YoutubeChannel() {
  return (
    <>
      <rect x="15" y="15" width="290" height="150" fill={palette.paper} />
      <Caption x={27} y={36} size={7}>
        INDEPENDENT MINDS / ORIGINAL STORIES
      </Caption>
      <Headline lines={["CREATIVE", "STUDIO."]} x={25} y={80} size={35} />
      <rect
        x="196"
        y="51"
        width="98"
        height="76"
        rx="4"
        fill={palette.forest}
      />
      <rect x="204" y="59" width="82" height="58" fill={palette.sage} />
      <path d="m216 107 22-31 16 19 12-12 20 24Z" fill={palette.cream} />
      <circle cx="271" cy="73" r="7" fill={palette.coral} />
      <path d="M229 128v9h32v-9" fill={palette.forest} />
      <rect x="27" y="139" width="134" height="9" fill={palette.coral} />
      <path
        d="M32 141h7m9 0h7m9 0h7m9 0h7m9 0h7m9 0h7m9 0h7m9 0h7"
        stroke={palette.paper}
        strokeWidth="2"
      />
    </>
  );
}

function YoutubeShort() {
  return (
    <>
      <rect width="320" height="569" fill={palette.burgundy} />
      <Caption y={40} fill={palette.blush}>
        SHORT FORM / BIG THINKING
      </Caption>
      <rect x="28" y="79" width="205" height="155" fill={palette.coral} />
      <rect x="90" y="127" width="202" height="167" fill={palette.ochre} />
      <rect x="110" y="147" width="162" height="127" fill={palette.blush} />
      <Play transform="translate(191 209) scale(1.25)" />
      <Headline
        lines={["ONE MINUTE.", "ONE BIG", "IDEA."]}
        x={25}
        y={359}
        size={39}
        leading={1.18}
        fill={palette.cream}
      />
      <Caption y={534} fill={palette.blush}>
        MAKE IT WORTH THE WATCH.
      </Caption>
    </>
  );
}

function LinkedinPost() {
  return (
    <>
      <Caption x={21} y={25} size={6}>
        PEOPLE. PURPOSE. POSSIBILITY.
      </Caption>
      <Headline
        lines={["Better work", "starts here."]}
        x={20}
        y={69}
        size={30}
      />
      <path
        d="M188 143V96h30v47ZM222 143V67h30v76ZM256 143V35h30v108Z"
        fill={palette.sage}
      />
      <rect x="256" y="35" width="30" height="27" fill={palette.forest} />
      <path d="M22 131h133" stroke={palette.ochre} />
      <Caption x={22} y={148} size={5}>
        THE NEXT CHAPTER OF WORK
      </Caption>
    </>
  );
}

function LinkedinBanner() {
  return (
    <>
      <rect width="320" height="80" fill={palette.forest} />
      <Caption x={15} y={17} fill={palette.cream} size={5}>
        BUILDING WHAT COMES NEXT
      </Caption>
      <Headline
        lines={["Ideas into impact."]}
        x={14}
        y={48}
        size={23}
        elegant
        fill={palette.cream}
      />
      <path
        d="M196 66V33a24 24 0 0 1 48 0v33h-13V34a11 11 0 0 0-22 0v32Z"
        fill={palette.ochre}
      />
      <path
        d="M244 66V33a24 24 0 0 1 48 0v33h-13V34a11 11 0 0 0-22 0v32Z"
        fill={palette.sage}
      />
      <path d="M190 68h111" stroke={palette.blush} />
      <Caption x={15} y={67} fill={palette.sage} size={4}>
        WITH PURPOSE. TOGETHER.
      </Caption>
    </>
  );
}

function LinkedinSquare() {
  return (
    <>
      <path
        d="M213 38h39v45h-18c-1 17 5 24 18 28v19c-31-4-42-22-39-47ZM263 38h39v45h-18c-1 17 5 24 18 28v19c-31-4-42-22-39-47Z"
        fill={palette.sage}
      />
      <Caption y={39}>A NOTE TO MOVE YOU FORWARD</Caption>
      <Headline
        lines={["Make", "meaningful", "progress."]}
        x={24}
        y={125}
        size={45}
        elegant
        fill={palette.burgundy}
      />
      <path d="M26 258h267" stroke={palette.burgundy} />
      <circle cx="36" cy="282" r="9" fill={palette.burgundy} />
      <Caption x={55} y={285} size={7}>
        ONE THOUGHTFUL STEP AT A TIME.
      </Caption>
    </>
  );
}

function XPost() {
  return (
    <>
      <path d="m183 0 63 0 74 104v76h-10Z" fill={palette.coral} />
      <circle cx="251" cy="86" r="46" fill={palette.burgundy} />
      <circle cx="251" cy="86" r="28" fill={palette.ochre} />
      <path d="m251 67 17 19-17 19-17-19Z" fill={palette.cream} />
      <Caption x={20} y={27} size={7}>
        SHIFT YOUR PERSPECTIVE
      </Caption>
      <Headline
        lines={["A fresh", "point of view."]}
        x={19}
        y={80}
        size={30}
        elegant
      />
      <Caption x={21} y={153} size={6}>
        THERE'S ALWAYS ANOTHER ANGLE.
      </Caption>
    </>
  );
}

function XHeader() {
  return (
    <>
      <rect width="320" height="107" fill={palette.blush} />
      <path d="M205 54h89" stroke={palette.burgundy} strokeWidth="3" />
      <circle cx="212" cy="54" r="26" fill={palette.coral} />
      <circle cx="285" cy="54" r="21" fill={palette.burgundy} />
      <path d="M238 32h24v44h-24Z" fill={palette.cream} />
      <Caption x={17} y={22} size={6}>
        IDEAS ARE BETTER SHARED
      </Caption>
      <Headline
        lines={["Keep the", "conversation", "moving."]}
        x={16}
        y={48}
        size={22}
        leading={1.02}
      />
      <path d="m203 93h89m-6-4 6 4-6 4" fill="none" stroke={palette.burgundy} />
    </>
  );
}

function XSquare() {
  return (
    <>
      <rect width="320" height="320" fill={palette.coral} />
      <rect
        x="21"
        y="21"
        width="278"
        height="278"
        fill="none"
        stroke={palette.cream}
        strokeWidth="2"
      />
      <Caption x={36} y={49} fill={palette.cream}>
        GO OFF THE GRID
      </Caption>
      <path d="m213 161 65 56-56 65-65-56Z" fill={palette.burgundy} />
      <path d="m216 185 40 34-34 40-40-34Z" fill={palette.ochre} />
      <Headline
        lines={["Think", "beyond", "the frame."]}
        x={35}
        y={111}
        size={41}
        leading={1.07}
        fill={palette.cream}
      />
      <Caption x={36} y={280} fill={palette.cream} size={6}>
        NEW RULES. NEW POSSIBILITIES.
      </Caption>
    </>
  );
}

function VideoFullHd() {
  return (
    <>
      <rect width="320" height="180" fill={palette.forest} />
      <rect x="186" y="23" width="113" height="118" fill={palette.sage} />
      <circle cx="266" cy="47" r="14" fill={palette.ochre} />
      <Arch transform="translate(213 62) scale(.46 .5)" fill={palette.cream} />
      <path d="M182 142h119l-36-26-39 10Z" fill={palette.burgundy} />
      <Caption x={20} y={29} fill={palette.sage} size={6}>
        A FILM ABOUT POSSIBILITY
      </Caption>
      <Headline
        lines={["Stories", "worth", "watching."]}
        x={18}
        y={68}
        size={30}
        elegant
        fill={palette.cream}
      />
      <path d="M21 160h278" stroke={palette.sage} />
      <path d="M21 160h91" stroke={palette.ochre} strokeWidth="2" />
      <circle cx="112" cy="160" r="3" fill={palette.cream} />
    </>
  );
}

function Video4k() {
  return (
    <>
      <rect width="320" height="180" fill={palette.blush} />
      <circle cx="249" cy="45" r="22" fill={palette.ochre} />
      <path d="M163 146 227 62l70 84Z" fill={palette.sage} />
      <path d="m213 146 54-61 53 61Z" fill={palette.forest} />
      <path d="M179 146 211 107l37 39Z" fill={palette.coral} />
      <path
        d="M18 43V17h33m218 0h33v26M18 139v24h33m218 0h33v-24"
        fill="none"
        stroke={palette.burgundy}
        strokeWidth="2"
      />
      <path
        d="M31 50V30h20m218 0h20v20M31 130v20h20m218 0h20v-20"
        fill="none"
        stroke={palette.cream}
      />
      <Caption x={40} y={48} size={6}>
        EVERY DETAIL MATTERS
      </Caption>
      <Headline
        lines={["See the", "bigger", "picture."]}
        x={38}
        y={82}
        size={29}
        elegant
      />
      <Caption x={56} y={165} size={5}>
        EXPAND YOUR HORIZON / 4K
      </Caption>
    </>
  );
}

// Illustration view boxes are independent of dimensions in either preset catalog.
const compositions = {
  "instagram-post": {
    render: InstagramPost,
    height: 320,
    background: palette.cream,
  },
  "instagram-story": {
    render: InstagramStory,
    height: 569,
    background: palette.cream,
  },
  "instagram-ad": {
    render: InstagramAd,
    height: 320,
    background: palette.cream,
  },
  "facebook-landscape": {
    render: FacebookLandscape,
    height: 168,
    background: palette.cream,
  },
  "facebook-square": {
    render: FacebookSquare,
    height: 320,
    background: palette.cream,
  },
  "facebook-cover": {
    render: FacebookCover,
    height: 119,
    background: palette.cream,
  },
  "youtube-thumbnail": {
    render: YoutubeThumbnail,
    height: 180,
    background: palette.cream,
  },
  "youtube-channel": {
    render: YoutubeChannel,
    height: 180,
    background: palette.cream,
  },
  "youtube-short": {
    render: YoutubeShort,
    height: 569,
    background: palette.burgundy,
  },
  "linkedin-post": {
    render: LinkedinPost,
    height: 167.2,
    background: palette.cream,
  },
  "linkedin-banner": {
    render: LinkedinBanner,
    height: 80,
    background: palette.forest,
  },
  "linkedin-square": {
    render: LinkedinSquare,
    height: 320,
    background: palette.cream,
  },
  "x-post": { render: XPost, height: 180, background: palette.cream },
  "x-header": { render: XHeader, height: 107, background: palette.blush },
  "x-square": { render: XSquare, height: 320, background: palette.coral },
  "video-full-hd": {
    render: VideoFullHd,
    height: 180,
    background: palette.forest,
  },
  "video-4k-uhd": { render: Video4k, height: 180, background: palette.blush },
};

export type PresetArtworkId = keyof typeof compositions;
export const PRESET_ARTWORK_IDS = Object.keys(
  compositions,
) as PresetArtworkId[];

/** Decorative size illustrations only; never used as canvas/template contents. */
export function PresetArtwork({
  id,
  width,
  height,
  artworkId = id,
  className,
}: {
  id: string;
  width: number;
  height: number;
  artworkId?: string | undefined;
  className?: string | undefined;
}) {
  const composition = Object.hasOwn(compositions, artworkId)
    ? compositions[artworkId as PresetArtworkId]
    : undefined;
  const Composition = composition?.render;
  return (
    <svg
      className={`preset-artwork${className ? ` ${className}` : ""}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      data-resize-art={Composition ? id : "dimensions"}
      data-preset-art={Composition ? artworkId : "dimensions"}
    >
      <rect
        width={width}
        height={height}
        fill={composition?.background ?? palette.cream}
      />
      {Composition && composition ? (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 320 ${composition.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect
            width="320"
            height={composition.height}
            fill={composition.background}
          />
          <Composition />
        </svg>
      ) : (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily={sans}
          fontSize={Math.min(width, height) * 0.09}
          fill={palette.ink}
        >
          {width} × {height}
        </text>
      )}
    </svg>
  );
}

/** Compatibility adapter for callers that already have a Resize preset. */
export function ResizePresetPreview({ preset }: { preset: ResizePreset }) {
  return (
    <PresetArtwork
      id={preset.id}
      width={preset.width}
      height={preset.height}
      className="resize-preset-preview"
    />
  );
}
