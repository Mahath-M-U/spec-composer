import type { ReactNode } from "react";
import type { Paints } from "./paints";

/**
 * Reusable drawing parts shared across placeholder motifs. Like the motifs
 * that use them, these paint only through `p.*` attributes so PNG export
 * (which clones the <svg> subtree without inlining stylesheet paint) keeps
 * their colors.
 */

export function Sparkle({
  x,
  y,
  size,
  fill,
}: {
  x: number;
  y: number;
  size: number;
  fill: string;
}) {
  const s = size;
  return (
    <path
      fill={fill}
      d={`M${x} ${y - s}Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y}Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s}Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y}Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s}Z`}
    />
  );
}

/**
 * The phone-app chassis: bezel, screen and a status-bar notch, in a
 * 280 × 420 viewBox. Screen content sits inside x 84–196, y 50–366.
 */
export function PhoneFrame({
  p,
  children,
}: {
  p: Paints;
  children?: ReactNode;
}) {
  return (
    <>
      <ellipse {...p.soft} cx="140" cy="396" rx="80" ry="9" />
      <rect {...p.ink} x="74" y="36" width="132" height="344" rx="24" />
      <rect {...p.paper} x="84" y="50" width="112" height="316" rx="14" />
      <rect {...p.dim} x="124" y="42" width="32" height="5" rx="2.5" />
      {children}
    </>
  );
}

/**
 * A browser-window chassis: outer frame, toolbar dots and a URL pill, in a
 * 420 × 300 viewBox. Page content sits inside x 10–410, y 42–290.
 */
export function BrowserFrame({
  p,
  children,
}: {
  p: Paints;
  children?: ReactNode;
}) {
  return (
    <>
      <rect {...p.ink} x="6" y="6" width="408" height="288" rx="16" />
      <rect {...p.paper} x="10" y="40" width="400" height="250" />
      <circle {...p.dim} cx="28" cy="23" r="4" />
      <circle {...p.dim} cx="42" cy="23" r="4" />
      <circle {...p.dim} cx="56" cy="23" r="4" />
      <rect {...p.soft} x="80" y="16" width="220" height="14" rx="7" />
      {children}
    </>
  );
}

/** A block of placeholder copy lines, the last one shorter. */
export function TextLines({
  p,
  x,
  y,
  width,
  lines = 3,
  gap = 11,
  height = 6,
  paint = "dim",
}: {
  p: Paints;
  x: number;
  y: number;
  width: number;
  lines?: number;
  gap?: number;
  height?: number;
  paint?: "dim" | "soft" | "ink";
}) {
  return (
    <>
      {Array.from({ length: lines }, (_, i) => (
        <rect
          key={i}
          {...p[paint]}
          x={x}
          y={y + i * gap}
          width={i === lines - 1 ? Math.round(width * 0.6) : width}
          height={height}
          rx={height / 2}
        />
      ))}
    </>
  );
}

/** A round avatar glyph: a filled circle with a simple head-and-shoulders mark. */
export function Avatar({
  p,
  cx,
  cy,
  r,
}: {
  p: Paints;
  cx: number;
  cy: number;
  r: number;
}) {
  return (
    <>
      <circle {...p.tint} cx={cx} cy={cy} r={r} />
      <circle {...p.dim} cx={cx} cy={cy - r * 0.24} r={r * 0.36} />
      <path
        {...p.dim}
        d={`M${cx - r * 0.62} ${cy + r * 0.66}Q${cx} ${cy + r * 0.06} ${cx + r * 0.62} ${cy + r * 0.66}Z`}
      />
    </>
  );
}
