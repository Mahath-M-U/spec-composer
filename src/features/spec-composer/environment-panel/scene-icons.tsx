/** Scene-object icons for the environment editor's Add/Scene tabs, drawn to
 * the same convention as contextual-editor/element-thumbnails.tsx (24
 * viewBox, currentColor, 1.5 stroke). */
import type { ReactElement, ReactNode } from "react";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const SCENE_ICONS: Record<string, () => ReactElement> = {
  camera: () => (
    <Svg>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </Svg>
  ),
  cameraFromView: () => (
    <Svg>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle className="thumb-accent" cx="12" cy="13" r="3.5" />
      <path className="thumb-accent" d="M12 1v3M12 19v4" />
    </Svg>
  ),
  sun: () => (
    <Svg>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </Svg>
  ),
  diffused: () => (
    <Svg>
      <rect x="4" y="5" width="16" height="10" rx="2" />
      <path className="thumb-accent" d="M7 19h10M9 22h6" />
    </Svg>
  ),
  spot: () => (
    <Svg>
      <path d="M9 3h6l2 6H7z" />
      <path className="thumb-accent" d="M7 9l-3 12h16L17 9" />
    </Svg>
  ),
  point: () => (
    <Svg>
      <circle cx="12" cy="12" r="4" />
      <path className="thumb-accent" d="M12 4v2M12 18v2M4 12h2M18 12h2" />
    </Svg>
  ),
  area: () => (
    <Svg>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path className="thumb-accent" d="M7 6v12M12 6v12M17 6v12" />
    </Svg>
  ),
  rim: () => (
    <Svg>
      <circle cx="12" cy="12" r="7" />
      <path className="thumb-accent" d="M18 7a7 7 0 0 1 0 10" />
    </Svg>
  ),
  ambient: () => (
    <Svg>
      <rect x="3" y="3" width="18" height="18" rx="4" fillOpacity={0.12} fill="currentColor" stroke="none" />
      <circle className="thumb-accent" cx="12" cy="12" r="5" />
    </Svg>
  ),
};

export function SceneIcon({ id }: { id: string }) {
  const icon = SCENE_ICONS[id];
  return (
    <span className="contextual-element-thumb" data-thumbnail="dedicated" aria-hidden="true">
      {icon ? icon() : <Svg><rect x="4" y="4" width="16" height="16" rx="4" strokeDasharray="3 3" /></Svg>}
    </span>
  );
}
