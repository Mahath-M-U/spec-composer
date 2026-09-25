import type { Motif } from "./paints";
import { Sparkle } from "./parts";

/** AI-agent and AI-feature motifs: chat surfaces, an agent glyph, node
 * graphs and small UI chrome (prompt bars, chips, checklists). */
export const aiMotifs = {
  "ai-chat-window": {
    viewBox: "0 0 320 300",
    body: (p) => (
      <>
        <rect
          {...p.paper}
          {...p.edge}
          x="20"
          y="20"
          width="280"
          height="260"
          rx="16"
        />
        <Sparkle x={44} y={44} size={12} fill={p.accent.fill} />
        <rect {...p.dim} x="64" y="38" width="90" height="12" rx="6" />
        <rect {...p.soft} x="40" y="80" width="140" height="26" rx="13" />
        <rect {...p.accent} x="140" y="118" width="140" height="26" rx="13" />
        <rect {...p.soft} x="40" y="156" width="110" height="26" rx="13" />
        <rect {...p.soft} x="40" y="234" width="240" height="26" rx="13" />
      </>
    ),
  },
  "ai-robot": {
    viewBox: "0 0 240 300",
    body: (p) => (
      <>
        <rect {...p.dim} x="112" y="18" width="16" height="26" rx="8" />
        <circle {...p.accent} cx="120" cy="16" r="8" />
        <rect {...p.soft} x="60" y="40" width="120" height="90" rx="24" />
        <circle {...p.accent} cx="95" cy="82" r="10" />
        <circle {...p.accent} cx="145" cy="82" r="10" />
        <rect {...p.dim} x="100" y="104" width="40" height="8" rx="4" />
        <rect {...p.soft} x="70" y="140" width="100" height="90" rx="16" />
        <rect {...p.tint} x="90" y="160" width="60" height="40" rx="8" />
        <rect {...p.dim} x="30" y="150" width="30" height="14" rx="7" />
        <rect {...p.dim} x="180" y="150" width="30" height="14" rx="7" />
      </>
    ),
  },
  "ai-sparkle": {
    viewBox: "0 0 240 240",
    body: (p) => (
      <>
        <Sparkle x={120} y={120} size={72} fill={p.accent.fill} />
        <Sparkle x={54} y={70} size={20} fill={p.ink.fill} />
        <Sparkle x={186} y={82} size={16} fill={p.ink.fill} />
        <Sparkle x={70} y={190} size={14} fill={p.accent.fill} />
      </>
    ),
  },
  "ai-prompt-bar": {
    viewBox: "0 0 320 120",
    body: (p) => (
      <>
        <rect
          {...p.paper}
          {...p.edge}
          x="20"
          y="30"
          width="280"
          height="60"
          rx="30"
        />
        <Sparkle x={48} y={60} size={14} fill={p.accent.fill} />
        <rect {...p.soft} x="72" y="54" width="150" height="12" rx="6" />
        <circle {...p.accent} cx="264" cy="60" r="20" />
        <path
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          d="M258 60H270M264 54L270 60L264 66"
        />
      </>
    ),
  },
  "ai-copilot": {
    viewBox: "0 0 320 300",
    body: (p) => (
      <>
        <rect {...p.soft} x="0" y="0" width="220" height="300" />
        <rect {...p.ink} x="220" y="0" width="100" height="300" />
        <Sparkle x={260} y={40} size={14} fill={p.accent.fill} />
        <rect {...p.shine} x="236" y="66" width="68" height="10" rx="5" />
        <rect {...p.shine} x="236" y="86" width="50" height="8" rx="4" />
        <rect {...p.accent} x="236" y="240" width="68" height="24" rx="12" />
      </>
    ),
  },
  "ai-node-graph": {
    viewBox: "0 0 340 220",
    body: (p) => (
      <>
        <path {...p.accentStroke} strokeWidth="4" d="M60 60Q150 40 170 110" />
        <path
          {...p.accentStroke}
          strokeWidth="4"
          d="M170 110Q190 170 260 170"
        />
        <path {...p.strokeInk} strokeWidth="3" d="M60 60Q40 130 100 170" />
        <path {...p.strokeInk} strokeWidth="3" d="M170 110Q230 70 280 60" />
        <circle {...p.soft} cx="60" cy="60" r="22" />
        <circle {...p.soft} cx="100" cy="170" r="20" />
        <circle {...p.soft} cx="280" cy="60" r="20" />
        <circle {...p.soft} cx="260" cy="170" r="20" />
        <circle {...p.accent} cx="170" cy="110" r="30" />
        <Sparkle x={170} y={110} size={14} fill={p.paper.fill} />
      </>
    ),
  },
  "ai-voice-wave": {
    viewBox: "0 0 320 160",
    body: (p) => (
      <>
        {[24, 48, 86, 54, 96, 40, 70, 30].map((h, i) => (
          <rect
            key={i}
            {...(i % 2 ? p.accent : p.dim)}
            x={32 + i * 33}
            y={80 - h / 2}
            width="16"
            height={h}
            rx="8"
          />
        ))}
      </>
    ),
  },
  "ai-chat-bubbles": {
    viewBox: "0 0 300 220",
    body: (p) => (
      <>
        <path
          {...p.soft}
          d="M40 40h140a16 16 0 0 1 16 16v50a16 16 0 0 1-16 16H100l-24 24v-24H40a16 16 0 0 1-16-16V56a16 16 0 0 1 16-16Z"
        />
        <path
          {...p.accent}
          d="M120 110h120a14 14 0 0 1 14 14v46a14 14 0 0 1-14 14H190l-20 20v-20h-50a14 14 0 0 1-14-14v-46a14 14 0 0 1 14-14Z"
        />
        <Sparkle x={250} y={70} size={12} fill={p.accent.fill} />
      </>
    ),
  },
  "ai-chip": {
    viewBox: "0 0 240 240",
    body: (p) => (
      <>
        {[54, 90, 126, 162].map((y, i) => (
          <g key={i}>
            <rect {...p.dim} x="30" y={y} width="26" height="8" rx="4" />
            <rect {...p.dim} x="184" y={y} width="26" height="8" rx="4" />
          </g>
        ))}
        {[54, 90, 126, 162].map((x, i) => (
          <g key={`v${i}`}>
            <rect {...p.dim} x={x} y="30" width="8" height="26" rx="4" />
            <rect {...p.dim} x={x} y="184" width="8" height="26" rx="4" />
          </g>
        ))}
        <rect {...p.ink} x="60" y="60" width="120" height="120" rx="14" />
        <rect {...p.accent} x="82" y="82" width="76" height="76" rx="8" />
        <Sparkle x={120} y={120} size={16} fill={p.paper.fill} />
      </>
    ),
  },
  "ai-image-grid": {
    viewBox: "0 0 300 300",
    body: (p) => (
      <>
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              {...((row + col) % 2 ? p.accent : p.tint)}
              x={30 + col * 84}
              y={30 + row * 84}
              width="72"
              height="72"
              rx="8"
            />
          )),
        )}
        <circle {...p.ink} cx="252" cy="48" r="20" />
        <Sparkle x={252} y={48} size={11} fill={p.paper.fill} />
      </>
    ),
  },
  "ai-task-list": {
    viewBox: "0 0 300 260",
    body: (p) => (
      <>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle
              {...(i < 2 ? p.accent : p.soft)}
              cx="42"
              cy={46 + i * 48}
              r="14"
            />
            {i < 2 && (
              <path
                fill="none"
                stroke="#fff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d={`M35 ${46 + i * 48}l5 5l9 -10`}
              />
            )}
            <rect
              {...p.soft}
              x="68"
              y={38 + i * 48}
              width="180"
              height="16"
              rx="8"
            />
          </g>
        ))}
      </>
    ),
  },
  "ai-agents-network": {
    viewBox: "0 0 320 260",
    body: (p) => (
      <>
        <path
          {...p.strokeInk}
          strokeWidth="3"
          strokeDasharray="2 8"
          d="M100 70L60 170"
        />
        <path
          {...p.strokeInk}
          strokeWidth="3"
          strokeDasharray="2 8"
          d="M100 70L220 60"
        />
        <path
          {...p.strokeInk}
          strokeWidth="3"
          strokeDasharray="2 8"
          d="M100 70L200 190"
        />
        <path
          {...p.strokeInk}
          strokeWidth="3"
          strokeDasharray="2 8"
          d="M200 190L260 100"
        />
        <circle {...p.accent} cx="100" cy="70" r="26" />
        <Sparkle x={100} y={70} size={11} fill={p.paper.fill} />
        <circle {...p.soft} cx="60" cy="170" r="18" />
        <circle {...p.soft} cx="220" cy="60" r="18" />
        <circle {...p.soft} cx="200" cy="190" r="18" />
        <circle {...p.soft} cx="260" cy="100" r="18" />
      </>
    ),
  },
} satisfies Record<string, Motif>;
