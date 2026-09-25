import { useId, type ReactNode } from "react";
import { dominantVisual, ratio } from "./compiler";
import { isImageKind, isTextKind, type SpecDocument } from "./types";

/** Visual companions for the prompt panel's parts: a mini canvas for layout
 * lines, swatches for color lines, a specimen for type, pills for mood. They
 * read from the document, so they stay true even when a part's text has been
 * hand-edited; the copied prompt is never affected. */

const elementId = (key: string) =>
  key.startsWith("skill:el:")
    ? key.slice("skill:el:".length)
    : key.startsWith("el:")
      ? key.slice("el:".length)
      : null;

/** A thumbnail of the composition. With `focus`, every other layer dims and
 * the focused one is outlined, so a line shows where its element sits. */
function CanvasMap({
  doc,
  focus,
  width,
}: {
  doc: SpecDocument;
  focus?: string;
  width: number;
}) {
  const { width: W, height: H } = doc.format;
  const bg = doc.background;
  const gradientId = `pv-bg-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const layers = doc.elements
    .filter((e) => e.visible)
    .sort((a, b) => a.zIndex - b.zIndex);
  return (
    <svg
      className="pv-map"
      viewBox={`0 0 ${W} ${H}`}
      style={{ width }}
      aria-hidden="true"
    >
      {bg.type === "gradient" && (
        <defs>
          <linearGradient
            id={gradientId}
            gradientTransform={`rotate(${(bg.angle ?? 135) - 90} 0.5 0.5)`}
          >
            <stop offset="0" stopColor={bg.value} />
            <stop offset="1" stopColor={bg.secondaryValue ?? bg.value} />
          </linearGradient>
        </defs>
      )}
      <rect
        width={W}
        height={H}
        fill={bg.type === "gradient" ? `url(#${gradientId})` : bg.value}
      />
      {layers.map((e) => (
        <rect
          key={e.id}
          x={e.x}
          y={e.y}
          width={e.width}
          height={e.height}
          rx={Math.min(W, H) * 0.015}
          transform={
            e.rotation
              ? `rotate(${e.rotation} ${e.x + e.width / 2} ${e.y + e.height / 2})`
              : undefined
          }
          className={
            e.id === focus
              ? "pv-map-focus"
              : isImageKind(e.kind)
                ? "pv-map-image"
                : "pv-map-layer"
          }
          fill={
            (isTextKind(e.kind)
              ? (e.style.background ?? e.style.color)
              : isImageKind(e.kind)
                ? undefined
                : e.style.background) ?? "#8a8a8a"
          }
          data-dim={focus && e.id !== focus ? "" : undefined}
        />
      ))}
    </svg>
  );
}

function Swatches({
  items,
}: {
  items: {
    label: string;
    value?: string | undefined;
    to?: string | undefined;
    angle?: number | undefined;
  }[];
}) {
  return (
    <div className="pv-swatches">
      {items
        .filter((c) => c.value)
        .map((c) => (
          <span key={c.label} className="pv-swatch">
            <span
              className="pv-swatch-chip"
              style={{
                background: c.to
                  ? `linear-gradient(${c.angle ?? 135}deg, ${c.value}, ${c.to})`
                  : c.value,
              }}
            />
            <small>{c.label}</small>
            <code>{c.to ? `${c.value} → ${c.to}` : c.value}</code>
          </span>
        ))}
    </div>
  );
}

function Specimen({ family, note }: { family: string; note: string }) {
  return (
    <div className="pv-specimen">
      <span
        className="pv-specimen-sample"
        style={{
          fontFamily: `"${family}", ui-sans-serif, system-ui, sans-serif`,
        }}
      >
        Aa
      </span>
      <span>
        <b>{family}</b>
        <small>{note}</small>
      </span>
    </div>
  );
}

const stack = (visual: ReactNode, children: ReactNode) => (
  <div className="pv-stack">
    {visual}
    {children}
  </div>
);
const split = (visual: ReactNode, children: ReactNode) => (
  <div className="pv-split">
    {visual}
    {children}
  </div>
);

export function PromptPart({
  lineKey,
  doc,
  text,
  custom,
  bare,
  children,
}: {
  lineKey: string;
  doc: SpecDocument;
  text: string;
  custom: boolean;
  /** While the section's editor is open, its controls already show this. */
  bare?: boolean;
  children: ReactNode;
}) {
  if (bare) return children;
  const f = doc.format;
  const cd = doc.creativeDirection;
  const id = elementId(lineKey);
  if (id && doc.elements.some((e) => e.id === id))
    return split(<CanvasMap doc={doc} focus={id} width={52} />, children);
  switch (lineKey) {
    case "format":
      return stack(
        <div className="pv-format">
          <CanvasMap doc={doc} width={60} />
          <span>
            <b>{f.label}</b>
            <small>
              {f.width} × {f.height} · {ratio(f.width, f.height)}
              {f.platform && f.type ? ` · ${f.platform} ${f.type}` : ""}
            </small>
          </span>
        </div>,
        children,
      );
    case "colors":
      return stack(
        <Swatches
          items={[
            {
              label: "Background",
              value: doc.background.value,
              to:
                doc.background.type === "gradient"
                  ? doc.background.secondaryValue
                  : undefined,
              angle: doc.background.angle,
            },
            { label: "Primary", value: cd.primaryColor },
            { label: "Secondary", value: cd.secondaryColor },
          ]}
        />,
        children,
      );
    case "brand":
      return stack(
        <div className="pv-brand">
          <Swatches
            items={[
              { label: "Primary", value: cd.primaryColor },
              { label: "Secondary", value: cd.secondaryColor },
            ]}
          />
          <Specimen family={cd.typography} note="Brand typography" />
        </div>,
        children,
      );
    case "mood":
      return stack(
        <div className="pv-brand">
          <span className="pv-pills">
            {cd.mood.map((m) => (
              <span key={m} className="pv-pill">
                {m}
              </span>
            ))}
          </span>
          <Specimen family={cd.typography} note="Typography direction" />
        </div>,
        children,
      );
    case "dominant": {
      const dominant = dominantVisual(doc);
      return dominant
        ? split(
            <CanvasMap doc={doc} focus={dominant.id} width={52} />,
            children,
          )
        : children;
    }
    case "avoid": {
      // The generated line is one "Avoid a, b, and c." sentence; show it as a
      // checklist unless it has been rewritten by hand.
      const items = /^Avoid (.*?)\.?$/.exec(text.trim())?.[1];
      if (custom || !items) return children;
      return (
        <ul className="pv-avoid">
          {items
            .split(/,\s*(?:and\s+)?|\s+and\s+/)
            .filter(Boolean)
            .map((item) => (
              <li key={item}>{item}</li>
            ))}
        </ul>
      );
    }
    default:
      return children;
  }
}
