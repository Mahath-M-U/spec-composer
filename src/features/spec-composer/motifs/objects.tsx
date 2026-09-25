import { cos, sin, type Motif } from "./paints";
import { Sparkle } from "./parts";

/** Tier B object motifs for the topic categories (business, food, fashion,
 * tech, events, seasonal, education, health, travel, real estate, finance)
 * plus the abstract/decorative and background fill motifs. */
export const objectMotifs = {
  briefcase: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path
          fill="none"
          stroke={p.ink.fill}
          strokeWidth="10"
          d="M120 90V70a30 30 0 0 1 60 0v20"
        />
        <rect {...p.accent} x="60" y="90" width="180" height="130" rx="16" />
        <rect {...p.dim} x="60" y="90" width="180" height="34" rx="16" />
        <rect {...p.paper} x="135" y="130" width="30" height="20" rx="4" />
      </>
    ),
  },
  handshake: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path {...p.accent} d="M40 160H140L165 180L140 200H40Z" />
        <path {...p.dim} d="M260 160H160L135 180L160 200H260Z" />
        <rect {...p.soft} x="130" y="150" width="40" height="60" rx="10" />
      </>
    ),
  },
  calendar: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect
          {...p.paper}
          {...p.edge}
          x="60"
          y="80"
          width="180"
          height="160"
          rx="12"
        />
        <rect {...p.accent} x="60" y="80" width="180" height="40" rx="12" />
        <rect {...p.dim} x="86" y="60" width="12" height="40" rx="6" />
        <rect {...p.dim} x="202" y="60" width="12" height="40" rx="6" />
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              {...(row === 1 && col === 2 ? p.accent : p.soft)}
              x={80 + col * 36}
              y={150 + row * 30}
              width="24"
              height="20"
              rx="4"
            />
          )),
        )}
      </>
    ),
  },
  "coffee-cup": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path {...p.accent} d="M90 120H210L198 220Q150 240 102 220Z" />
        <path
          fill="none"
          stroke={p.ink.fill}
          strokeWidth="10"
          d="M205 140Q240 140 240 165Q240 190 205 190"
        />
        <path
          {...p.steam}
          strokeWidth="4"
          d="M120 100Q126 80 118 60M150 100Q156 80 148 60M180 100Q186 80 178 60"
        />
      </>
    ),
  },
  pizza: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path {...p.accent} {...p.edge} d="M150 60L230 240H70Z" />
        <circle {...p.dim} cx="150" cy="140" r="10" />
        <circle {...p.dim} cx="130" cy="180" r="10" />
        <circle {...p.dim} cx="170" cy="180" r="10" />
      </>
    ),
  },
  burger: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path {...p.accent} d="M60 140Q150 90 240 140Z" />
        <rect {...p.dim} x="60" y="140" width="180" height="14" rx="7" />
        <rect {...p.soft} x="60" y="158" width="180" height="18" rx="4" />
        <rect {...p.tint} x="60" y="180" width="180" height="14" rx="7" />
        <rect {...p.accent} x="60" y="198" width="180" height="26" rx="13" />
      </>
    ),
  },
  cake: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect {...p.accent} x="90" y="170" width="120" height="60" rx="8" />
        <rect {...p.tint} x="110" y="130" width="80" height="40" rx="8" />
        <rect {...p.dim} x="145" y="100" width="10" height="34" rx="5" />
        <path {...p.accent} d="M145 90Q150 78 155 90Q150 100 145 90Z" />
      </>
    ),
  },
  lipstick: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect {...p.ink} x="130" y="150" width="40" height="90" rx="8" />
        <path {...p.accent} d="M130 150L170 150L160 100L140 100Z" />
      </>
    ),
  },
  "hanger-dress": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path
          fill="none"
          stroke={p.ink.fill}
          strokeWidth="8"
          d="M150 60a14 14 0 1 1 -14 14"
        />
        <path
          fill="none"
          stroke={p.ink.fill}
          strokeWidth="6"
          d="M150 80L90 120H210Z"
        />
        <path {...p.accent} d="M110 120L90 240H210L190 120Z" />
      </>
    ),
  },
  sneaker: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path
          {...p.accent}
          d="M50 200Q50 170 90 165L150 150L210 160Q250 165 250 195Q250 210 230 210H60Q50 210 50 200Z"
        />
        <rect {...p.dim} x="60" y="190" width="180" height="20" rx="6" />
      </>
    ),
  },
  "game-controller": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path
          {...p.accent}
          d="M70 130Q60 130 55 150L40 200Q35 220 55 225Q70 228 80 210L100 180H200L220 210Q230 228 245 225Q265 220 260 200L245 150Q240 130 230 130Z"
        />
        <rect {...p.dim} x="80" y="165" width="30" height="10" rx="4" />
        <rect {...p.dim} x="90" y="155" width="10" height="30" rx="4" />
        <circle {...p.dim} cx="210" cy="160" r="8" />
        <circle {...p.dim} cx="230" cy="175" r="8" />
      </>
    ),
  },
  camera: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect {...p.accent} x="60" y="110" width="180" height="120" rx="14" />
        <rect {...p.dim} x="110" y="85" width="60" height="30" rx="8" />
        <circle {...p.paper} cx="150" cy="170" r="40" />
        <circle {...p.accent} cx="150" cy="170" r="26" />
        <circle {...p.dim} cx="205" cy="130" r="8" />
      </>
    ),
  },
  confetti: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        {[
          [60, 80, "accent", 20],
          [120, 60, "dim", -20],
          [180, 90, "accent", 40],
          [220, 60, "soft", -10],
          [90, 150, "dim", 10],
          [200, 160, "accent", -30],
        ].map(([x, y, paint, rot], i) => (
          <rect
            key={i}
            {...p[paint as "accent" | "dim" | "soft"]}
            x={x}
            y={y}
            width="16"
            height="16"
            rx="3"
            transform={`rotate(${rot} ${Number(x) + 8} ${Number(y) + 8})`}
          />
        ))}
      </>
    ),
  },
  pumpkin: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path
          {...p.accent}
          d="M150 100C90 100 70 150 70 180C70 220 110 240 150 240C190 240 230 220 230 180C230 150 210 100 150 100Z"
        />
        <path
          fill="none"
          stroke={p.dim.fill}
          strokeWidth="3"
          d="M150 100V240M110 105Q100 170 110 235M190 105Q200 170 190 235"
        />
        <rect {...p.ink} x="140" y="70" width="20" height="34" rx="6" />
      </>
    ),
  },
  "sun-waves": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <circle {...p.accent} cx="150" cy="110" r="40" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={150 + 50 * cos(a)}
              y1={110 + 50 * sin(a)}
              x2={150 + 68 * cos(a)}
              y2={110 + 68 * sin(a)}
              stroke={p.dim.fill}
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })}
        <path
          {...p.strokeInk}
          strokeWidth="6"
          d="M60 220Q90 200 120 220Q150 240 180 220Q210 200 240 220"
        />
      </>
    ),
  },
  "pencil-ruler": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect
          {...p.dim}
          x="60"
          y="200"
          width="180"
          height="20"
          rx="4"
          transform="rotate(-8 150 210)"
        />
        <path {...p.accent} d="M90 100L180 190L160 210L70 120Z" />
        <path {...p.ink} d="M70 120L90 100L80 90Z" />
      </>
    ),
  },
  backpack: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect {...p.accent} x="80" y="110" width="140" height="130" rx="24" />
        <rect {...p.dim} x="100" y="160" width="100" height="50" rx="12" />
        <path
          fill="none"
          stroke={p.ink.fill}
          strokeWidth="8"
          d="M100 110Q100 70 150 70Q200 70 200 110"
        />
      </>
    ),
  },
  dumbbell: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect {...p.ink} x="70" y="140" width="160" height="20" rx="10" />
        <rect {...p.accent} x="50" y="110" width="30" height="80" rx="8" />
        <rect {...p.accent} x="220" y="110" width="30" height="80" rx="8" />
      </>
    ),
  },
  "heart-pulse": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path
          {...p.accent}
          d="M150 220C80 170 60 120 100 95C125 80 150 100 150 120C150 100 175 80 200 95C240 120 220 170 150 220Z"
        />
        <path
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          d="M100 150H130L145 120L165 180L180 150H210"
        />
      </>
    ),
  },
  plane: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <path
        {...p.accent}
        d="M150 60L165 130L230 160L230 175L165 160L155 220L180 235V245L150 235L120 245V235L145 220L135 160L70 175V160L135 130Z"
      />
    ),
  },
  suitcase: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect {...p.dim} x="120" y="70" width="60" height="30" rx="8" />
        <rect {...p.accent} x="60" y="100" width="180" height="130" rx="16" />
        <rect {...p.ink} x="60" y="150" width="180" height="10" />
        <rect {...p.dim} x="90" y="100" width="10" height="130" />
        <rect {...p.dim} x="200" y="100" width="10" height="130" />
      </>
    ),
  },
  "palm-beach": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <circle {...p.accent} cx="220" cy="90" r="30" />
        <rect
          {...p.dim}
          x="140"
          y="140"
          width="16"
          height="100"
          rx="8"
          transform="rotate(4 148 190)"
        />
        <path {...p.accent} d="M148 140Q100 110 60 130Q100 130 148 150Z" />
        <path {...p.accent} d="M148 140Q196 110 236 130Q196 130 148 150Z" />
        <path {...p.accent} d="M148 140Q120 90 90 70Q130 90 148 130Z" />
        <path {...p.accent} d="M148 140Q176 90 206 70Q166 90 148 130Z" />
      </>
    ),
  },
  "map-pin": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path
          {...p.accent}
          d="M150 60C110 60 80 90 80 130C80 180 150 240 150 240C150 240 220 180 220 130C220 90 190 60 150 60Z"
        />
        <circle {...p.paper} cx="150" cy="128" r="30" />
      </>
    ),
  },
  globe: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <circle {...p.accent} cx="150" cy="150" r="80" />
        <ellipse
          fill="none"
          stroke={p.paper.fill}
          strokeWidth="4"
          cx="150"
          cy="150"
          rx="80"
          ry="30"
        />
        <ellipse
          fill="none"
          stroke={p.paper.fill}
          strokeWidth="4"
          cx="150"
          cy="150"
          rx="30"
          ry="80"
        />
        <line
          x1="70"
          y1="150"
          x2="230"
          y2="150"
          stroke={p.paper.fill}
          strokeWidth="4"
        />
      </>
    ),
  },
  "house-key": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path {...p.accent} d="M150 70L230 140V230H70V140Z" />
        <circle {...p.paper} cx="150" cy="170" r="16" />
        <rect {...p.paper} x="144" y="180" width="12" height="24" />
      </>
    ),
  },
  "floor-plan": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect
          fill="none"
          stroke={p.ink.fill}
          strokeWidth="6"
          x="60"
          y="80"
          width="180"
          height="140"
        />
        <line
          x1="150"
          y1="80"
          x2="150"
          y2="150"
          stroke={p.ink.fill}
          strokeWidth="6"
        />
        <line
          x1="150"
          y1="150"
          x2="240"
          y2="150"
          stroke={p.ink.fill}
          strokeWidth="6"
        />
        <path
          fill="none"
          stroke={p.accent.fill}
          strokeWidth="4"
          d="M150 150Q180 150 180 180"
        />
      </>
    ),
  },
  "credit-card": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect {...p.accent} x="50" y="100" width="200" height="120" rx="16" />
        <rect {...p.dim} x="50" y="130" width="200" height="24" />
        <rect {...p.paper} x="70" y="175" width="30" height="22" rx="4" />
      </>
    ),
  },
  "coin-stack": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        {[0, 1, 2].map((i) => (
          <ellipse
            key={i}
            {...p.accent}
            cx="150"
            cy={220 - i * 18}
            rx="70"
            ry="18"
          />
        ))}
        <ellipse {...p.dim} cx="150" cy="160" rx="70" ry="18" />
      </>
    ),
  },
  "crypto-coin": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <circle {...p.accent} cx="150" cy="150" r="80" />
        <circle
          fill="none"
          stroke={p.paper.fill}
          strokeWidth="4"
          cx="150"
          cy="150"
          r="60"
        />
        <path fill={p.paper.fill} d="M150 110L170 150L150 190L130 150Z" />
      </>
    ),
  },
  "piggy-bank": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <ellipse {...p.accent} cx="150" cy="160" rx="90" ry="60" />
        <circle {...p.accent} cx="230" cy="140" r="20" />
        <rect {...p.ink} x="140" y="110" width="30" height="8" rx="4" />
        <rect {...p.dim} x="100" y="210" width="14" height="20" rx="4" />
        <rect {...p.dim} x="190" y="210" width="14" height="20" rx="4" />
      </>
    ),
  },
  "abstract-blobs": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <path
          {...p.tint}
          d="M100 80C160 60 220 100 210 150C200 200 140 220 90 190C50 170 40 110 100 80Z"
        />
        <path
          {...p.accent}
          d="M180 150C220 140 250 170 240 200C230 230 190 240 170 210C155 188 155 158 180 150Z"
        />
      </>
    ),
  },
  "pattern-dots": {
    viewBox: "0 0 260 260",
    body: (p) => (
      <>
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => (
            <circle
              key={`${row}-${col}`}
              {...((row + col) % 2 ? p.accent : p.soft)}
              cx={40 + col * 45}
              cy={40 + row * 45}
              r="10"
            />
          )),
        )}
      </>
    ),
  },
  "spheres-3d": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <circle {...p.accent} cx="120" cy="150" r="60" />
        <circle {...p.tint} cx="190" cy="120" r="40" />
        <circle {...p.shine} cx="100" cy="130" r="14" />
      </>
    ),
  },
  "torus-3d": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <circle
          fill="none"
          stroke={p.accent.fill}
          strokeWidth="34"
          cx="150"
          cy="150"
          r="70"
        />
        <circle
          fill="none"
          stroke={p.shine.fill}
          strokeWidth="8"
          cx="150"
          cy="120"
          r="60"
          opacity="0.5"
        />
      </>
    ),
  },
  "glass-cards": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect
          {...p.soft}
          x="70"
          y="90"
          width="140"
          height="100"
          rx="16"
          transform="rotate(-6 140 140)"
        />
        <rect
          {...p.tint}
          x="100"
          y="110"
          width="140"
          height="100"
          rx="16"
          transform="rotate(6 170 160)"
        />
      </>
    ),
  },
  "sparkle-cluster": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <Sparkle x={150} y={150} size={50} fill={p.accent.fill} />
        <Sparkle x={90} y={100} size={18} fill={p.ink.fill} />
        <Sparkle x={210} y={110} size={14} fill={p.accent.fill} />
        <Sparkle x={100} y={210} size={16} fill={p.ink.fill} />
      </>
    ),
  },
  polaroid: {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        <rect
          {...p.paper}
          {...p.edge}
          x="70"
          y="60"
          width="160"
          height="190"
          rx="4"
        />
        <rect {...p.tint} x="86" y="76" width="128" height="128" />
      </>
    ),
  },
} satisfies Record<string, Motif>;
