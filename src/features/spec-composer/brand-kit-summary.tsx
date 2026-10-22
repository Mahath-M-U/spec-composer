import type { ReactNode } from "react";
import { Gem } from "lucide-react";
import { getBrandKitColor } from "./brand-kits";
import { readableTextOn } from "./color-names";
import type { BrandKit, BrandKitColor } from "./types";
import "./brand-kit-summary.css";

export function brandKitColorPaint(
  color: Pick<BrandKitColor, "type" | "angle" | "hex" | "secondaryHex">,
): string {
  return color.type === "gradient"
    ? `linear-gradient(${color.angle}deg, ${color.hex}, ${color.secondaryHex ?? color.hex})`
    : color.hex;
}

/** Noninteractive color samples. Callers can supply a separate editable palette. */
export function BrandKitSwatches({
  colors,
  max = 5,
}: {
  colors: readonly BrandKitColor[];
  max?: number;
}) {
  return (
    <span
      className="brand-kit-swatches"
      aria-label={colors.length ? "Kit palette" : "No kit colors"}
    >
      {colors.slice(0, max).map((color) => (
        <i
          key={color.id}
          style={{ background: brandKitColorPaint(color) }}
          title={color.hex}
        />
      ))}
      {!colors.length && <small>No colors yet</small>}
    </span>
  );
}

/** Compact identity content, suitable inside a navigation link or a standalone card. */
export function BrandKitSummary({
  kit,
  variant = "compact",
  title,
  subtitle,
  actions,
  showSwatches = true,
}: {
  kit?: BrandKit | undefined;
  variant?: "compact" | "sidebar";
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  showSwatches?: boolean;
}) {
  const background = kit && getBrandKitColor(kit, "background");
  const text = kit && getBrandKitColor(kit, "text");
  const summary = kit
    ? [kit.typography, kit.style, ...kit.emotions.slice(0, 2)]
        .filter(Boolean)
        .join(" · ")
    : "Build your identity";
  return (
    <span
      className={`brand-kit-summary brand-kit-summary--${variant}`}
      style={
        variant === "compact" && background
          ? {
              background: brandKitColorPaint(background),
              color: readableTextOn(background.hex, text?.hex),
            }
          : undefined
      }
    >
      <Gem className="brand-kit-summary-icon" aria-hidden="true" />
      <span className="brand-kit-summary-copy">
        <strong
          className="brand-kit-summary-title"
          style={
            variant === "compact"
              ? { fontFamily: kit?.typography || undefined }
              : undefined
          }
        >
          {title ?? kit?.name ?? "Design kits"}
        </strong>
        <small className="brand-kit-summary-subtitle">
          {subtitle ?? summary}
        </small>
        {showSwatches && kit && <BrandKitSwatches colors={kit.colors} />}
      </span>
      {actions && (
        <span
          className="brand-kit-summary-actions"
          role="toolbar"
          aria-label={`${kit?.name ?? "Design kit"} actions`}
        >
          {actions}
        </span>
      )}
    </span>
  );
}
