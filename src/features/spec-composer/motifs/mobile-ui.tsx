import type { Motif } from "./paints";
import { Avatar, PhoneFrame } from "./parts";

/** Mobile app screen motifs: a phone chassis (`PhoneFrame`) with a schematic
 * UI drawn inside its screen area, one per common app pattern. */
export const mobileUiMotifs = {
  "phone-onboarding": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.tint} x="94" y="70" width="92" height="110" rx="10" />
        <circle {...p.accent} cx="118" cy="212" r="5" />
        <circle {...p.soft} cx="140" cy="212" r="5" />
        <circle {...p.soft} cx="162" cy="212" r="5" />
        <rect {...p.soft} x="98" y="234" width="84" height="10" rx="5" />
        <rect {...p.soft} x="110" y="250" width="60" height="8" rx="4" />
        <rect {...p.accent} x="94" y="330" width="92" height="28" rx="14" />
      </PhoneFrame>
    ),
  },
  "phone-login": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.dim} x="98" y="86" width="64" height="10" rx="5" />
        <rect {...p.soft} x="94" y="120" width="92" height="26" rx="8" />
        <rect {...p.soft} x="94" y="154" width="92" height="26" rx="8" />
        <rect {...p.accent} x="94" y="196" width="92" height="26" rx="13" />
        <rect {...p.dim} x="122" y="234" width="36" height="8" rx="4" />
      </PhoneFrame>
    ),
  },
  "phone-dashboard": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.dim} x="94" y="64" width="56" height="10" rx="5" />
        <circle {...p.tint} cx="178" cy="70" r="10" />
        <rect {...p.tint} x="94" y="92" width="42" height="40" rx="8" />
        <rect {...p.accent} x="144" y="92" width="42" height="40" rx="8" />
        <rect {...p.soft} x="94" y="146" width="92" height="12" rx="6" />
        <rect {...p.soft} x="94" y="166" width="92" height="12" rx="6" />
        <rect {...p.soft} x="94" y="186" width="92" height="12" rx="6" />
      </PhoneFrame>
    ),
  },
  "phone-chat": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <Avatar p={p} cx={104} cy={70} r={12} />
        <rect {...p.dim} x="122" y="64" width="48" height="10" rx="5" />
        <rect {...p.soft} x="94" y="100" width="70" height="24" rx="12" />
        <rect {...p.accent} x="112" y="132" width="74" height="24" rx="12" />
        <rect {...p.soft} x="94" y="164" width="60" height="24" rx="12" />
        <rect {...p.accent} x="120" y="196" width="66" height="24" rx="12" />
        <rect {...p.soft} x="94" y="336" width="92" height="20" rx="10" />
      </PhoneFrame>
    ),
  },
  "phone-product": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.tint} x="84" y="50" width="112" height="130" />
        <rect {...p.dim} x="94" y="196" width="76" height="10" rx="5" />
        <rect {...p.accent} x="94" y="214" width="40" height="10" rx="5" />
        <rect {...p.soft} x="94" y="240" width="92" height="8" rx="4" />
        <rect {...p.soft} x="94" y="254" width="70" height="8" rx="4" />
        <rect {...p.accent} x="94" y="330" width="92" height="28" rx="14" />
      </PhoneFrame>
    ),
  },
  "phone-checkout": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.dim} x="98" y="80" width="60" height="10" rx="5" />
        <rect {...p.soft} x="94" y="124" width="60" height="10" rx="5" />
        <rect {...p.soft} x="160" y="124" width="26" height="10" rx="5" />
        <rect {...p.soft} x="94" y="146" width="60" height="10" rx="5" />
        <rect {...p.soft} x="160" y="146" width="26" height="10" rx="5" />
        <rect {...p.accent} x="94" y="176" width="70" height="12" rx="6" />
        <rect {...p.accent} x="94" y="330" width="92" height="28" rx="14" />
      </PhoneFrame>
    ),
  },
  "phone-profile": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <Avatar p={p} cx={140} cy={100} r={28} />
        <rect {...p.dim} x="110" y="140" width="60" height="10" rx="5" />
        <rect {...p.soft} x="94" y="170" width="26" height="20" rx="4" />
        <rect {...p.soft} x="127" y="170" width="26" height="20" rx="4" />
        <rect {...p.soft} x="160" y="170" width="26" height="20" rx="4" />
        <rect {...p.accent} x="94" y="204" width="92" height="24" rx="12" />
      </PhoneFrame>
    ),
  },
  "phone-map": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.tint} x="84" y="50" width="112" height="220" />
        <path {...p.accent} d="M140 140Q152 160 140 180Q128 160 140 140Z" />
        <circle {...p.paper} cx="140" cy="150" r="5" />
        <rect
          {...p.paper}
          {...p.edge}
          x="94"
          y="286"
          width="92"
          height="60"
          rx="10"
        />
        <rect {...p.soft} x="102" y="298" width="60" height="10" rx="5" />
        <rect {...p.soft} x="102" y="314" width="40" height="8" rx="4" />
      </PhoneFrame>
    ),
  },
  "phone-music": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.tint} x="104" y="70" width="72" height="72" rx="8" />
        <rect {...p.dim} x="104" y="156" width="60" height="10" rx="5" />
        <rect {...p.soft} x="104" y="172" width="40" height="8" rx="4" />
        <rect {...p.soft} x="94" y="200" width="92" height="4" rx="2" />
        <circle {...p.accent} cx="120" cy="202" r="5" />
        <circle {...p.dim} cx="110" cy="230" r="8" />
        <circle {...p.accent} cx="140" cy="230" r="12" />
        <circle {...p.dim} cx="170" cy="230" r="8" />
      </PhoneFrame>
    ),
  },
  "phone-fitness": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <circle {...p.soft} cx="140" cy="120" r="34" />
        <path
          {...p.accentStroke}
          strokeWidth="8"
          d="M140 86A34 34 0 1 1 106 120"
        />
        <rect {...p.dim} x="118" y="112" width="44" height="10" rx="5" />
        <rect {...p.soft} x="94" y="176" width="92" height="14" rx="7" />
        <rect {...p.soft} x="94" y="198" width="92" height="14" rx="7" />
        <rect {...p.soft} x="94" y="220" width="92" height="14" rx="7" />
      </PhoneFrame>
    ),
  },
  "phone-wallet": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.soft} x="100" y="82" width="80" height="50" rx="10" />
        <rect {...p.accent} x="94" y="70" width="92" height="56" rx="10" />
        <rect {...p.paper} x="104" y="82" width="30" height="8" rx="4" />
        <rect {...p.dim} x="94" y="146" width="70" height="14" rx="7" />
        <rect {...p.soft} x="94" y="176" width="92" height="20" rx="6" />
        <rect {...p.soft} x="94" y="202" width="92" height="20" rx="6" />
      </PhoneFrame>
    ),
  },
  "phone-notifications": {
    viewBox: "0 0 280 420",
    body: (p) => (
      <PhoneFrame p={p}>
        <rect {...p.dim} x="94" y="66" width="60" height="10" rx="5" />
        {Array.from({ length: 4 }, (_, i) => (
          <g key={i}>
            <circle {...p.tint} cx="104" cy={98 + i * 44} r="10" />
            <rect
              {...p.soft}
              x="122"
              y={92 + i * 44}
              width="64"
              height="8"
              rx="4"
            />
            <rect
              {...p.soft}
              x="122"
              y={104 + i * 44}
              width="44"
              height="6"
              rx="3"
            />
          </g>
        ))}
      </PhoneFrame>
    ),
  },
} satisfies Record<string, Motif>;
