/** Type-specific guide shapes for one Scene Overlay object, drawn in the
 * handle's own rotated local space (0deg = pointing along +x, i.e. "right"
 * before SceneHandle's screen rotate() is applied). Unselected objects get
 * a plain marker; the selected object gets its full guide. */
export type SceneGuideKind =
  | "sun"
  | "diffused"
  | "spot"
  | "point"
  | "area"
  | "rim"
  | "camera";

export function SceneGuides({
  kind,
  selected,
  coneAngle = 35,
}: {
  kind: SceneGuideKind;
  selected: boolean;
  coneAngle?: number;
}) {
  const stroke = selected ? "var(--editor-action)" : "var(--color-editor-muted)";
  const style = { stroke, fill: "none" } as const;
  if (!selected)
    return <circle className="scene-guide-marker" r={5} style={style} />;
  const half = (coneAngle / 2) * (Math.PI / 180);
  const spread = 24;
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
          <circle r={16} strokeDasharray="2 3" />
          <circle r={24} strokeDasharray="1 4" />
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
          <circle r={7} />
          <line x1={10} y1={0} x2={16} y2={0} />
          <line x1={-10} y1={0} x2={-16} y2={0} />
          <line x1={0} y1={10} x2={0} y2={16} />
          <line x1={0} y1={-10} x2={0} y2={-16} />
        </g>
      );
    case "area":
      return (
        <g className="scene-guide scene-guide-area" style={style}>
          <rect x={-14} y={-8} width={28} height={16} rx={2} />
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
