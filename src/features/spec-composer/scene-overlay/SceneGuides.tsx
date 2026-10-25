/** Type-specific guide shapes for one Scene Overlay object, drawn in the
 * handle's own rotated local space (0deg = pointing along +x, i.e. "right"
 * before SceneHandle's screen rotate() is applied). Unselected objects get
 * a plain marker; the selected object gets its full guide. */
export type SceneGuideKind =
  "sun" | "diffused" | "spot" | "point" | "area" | "rim" | "camera";

export function SceneGuides({
  kind,
  selected,
  coneAngle = 35,
  intensity = 100,
  softness = 0,
  enabled = true,
  color,
  radius = 0.3,
  width = 2,
  height = 1.2,
}: {
  kind: SceneGuideKind;
  selected: boolean;
  coneAngle?: number;
  intensity?: number;
  softness?: number;
  enabled?: boolean;
  color?: string;
  radius?: number;
  width?: number;
  height?: number;
}) {
  const stroke =
    color ?? (selected ? "var(--editor-action)" : "var(--color-editor-muted)");
  const style = {
    stroke,
    fill: "none",
    opacity: enabled ? 0.35 + (intensity / 100) * 0.65 : 0.25,
    strokeDasharray: softness > 65 ? "3 2" : undefined,
  } as const;
  if (!selected)
    return <circle className="scene-guide-marker" r={5} style={style} />;
  const half = (coneAngle / 2) * (Math.PI / 180);
  const spread = 18 + intensity * 0.12;
  const influence = 8 + radius * 8;
  const breadth = 12 + softness * 0.14;
  const aspect = width / Math.max(0.1, height);
  switch (kind) {
    case "sun":
      return (
        <g className="scene-guide scene-guide-sun" style={style}>
          <line x1={-6} y1={0} x2={22} y2={0} />
          <path d="M16 -6 L22 0 L16 6" />
          <line x1={-6} y1={-10} x2={10} y2={-10} />
          <line x1={-6} y1={10} x2={10} y2={10} />
        </g>
      );
    case "diffused":
      return (
        <g className="scene-guide scene-guide-diffused" style={style}>
          <circle r={8} />
          <ellipse
            rx={breadth * 0.7 * Math.sqrt(aspect)}
            ry={(breadth * 0.7) / Math.sqrt(aspect)}
            strokeDasharray="2 3"
          />
          <ellipse
            rx={breadth * Math.sqrt(aspect)}
            ry={breadth / Math.sqrt(aspect)}
            strokeDasharray="1 4"
          />
        </g>
      );
    case "spot":
      return (
        <g className="scene-guide scene-guide-spot" style={style}>
          <path
            d={`M0 0 L${spread * Math.cos(half)} ${spread * Math.sin(half)} A${spread} ${spread} 0 0 0 ${spread * Math.cos(half)} ${-spread * Math.sin(half)} Z`}
          />
        </g>
      );
    case "rim":
      return (
        <g className="scene-guide scene-guide-rim" style={style}>
          <path
            d={`M0 0 L${spread * Math.cos(half)} ${spread * Math.sin(half)} A${spread} ${spread} 0 0 0 ${spread * Math.cos(half)} ${-spread * Math.sin(half)} Z`}
            strokeDasharray="3 2"
          />
        </g>
      );
    case "point":
      return (
        <g className="scene-guide scene-guide-point" style={style}>
          <circle r={influence} />
          <line x1={10} y1={0} x2={16} y2={0} />
          <line x1={-10} y1={0} x2={-16} y2={0} />
          <line x1={0} y1={10} x2={0} y2={16} />
          <line x1={0} y1={-10} x2={0} y2={-16} />
        </g>
      );
    case "area":
      return (
        <g className="scene-guide scene-guide-area" style={style}>
          <rect
            x={-width * 7}
            y={-height * 7}
            width={width * 14}
            height={height * 14}
            rx={2 + softness * 0.03}
          />
          <line x1={14} y1={0} x2={24} y2={0} />
          <line x1={10} y1={-6} x2={20} y2={-6} />
          <line x1={10} y1={6} x2={20} y2={6} />
        </g>
      );
    case "camera":
    default:
      return (
        <g className="scene-guide scene-guide-camera" style={style}>
          <rect x={-10} y={-7} width={20} height={14} rx={2} />
          <circle r={4} />
          <path d={`M10 0 L26 ${spread * 0.5} M10 0 L26 ${-spread * 0.5}`} />
        </g>
      );
  }
}
