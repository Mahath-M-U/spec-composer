import type { ReactElement, ReactNode } from "react";
import {
  Image,
  Type,
  ChartNoAxesCombined,
  MousePointerClick,
  BadgeCheck,
  LayoutTemplate,
  Shapes,
  type LucideIcon,
} from "lucide-react";

const GROUP_ICONS: Record<string, LucideIcon> = {
  subjects: Image,
  information: Type,
  dataProof: ChartNoAxesCombined,
  actions: MousePointerClick,
  branding: BadgeCheck,
  structure: LayoutTemplate,
  decoration: Shapes,
};

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

const THUMBNAILS: Record<string, () => ReactElement> = {
  "subjects.product": () => (
    <Svg>
      <path d="M9.5 3h5" />
      <path d="M10 3v2.2c0 .5-.3.9-.8 1.2-1 .6-1.7 1.7-1.7 2.9V20a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9.3c0-1.2-.7-2.3-1.7-2.9-.5-.3-.8-.7-.8-1.2V3" />
      <path className="thumb-accent" d="M8 13h8" />
    </Svg>
  ),
  "subjects.image": () => (
    <Svg>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle
        className="thumb-accent-fill"
        cx="16"
        cy="9"
        r="1.4"
        stroke="none"
      />
      <path d="M3 17l5-5 4 4 3-3 5 5" />
    </Svg>
  ),
  "subjects.person": () => (
    <Svg>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M6 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
    </Svg>
  ),
  "subjects.illustration": () => (
    <Svg>
      <circle cx="9" cy="9" r="4" />
      <path d="M16 6l4 8h-8z" />
      <rect className="thumb-accent" x="11" y="13" width="7" height="7" rx="1" />
    </Svg>
  ),
  "subjects.background": () => (
    <Svg>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path className="thumb-accent" d="M4 10q2-2 4 0t4 0 4 0 4 0" />
      <path d="M4 14q2-2 4 0t4 0 4 0 4 0" />
      <path d="M4 18q2-2 4 0t4 0 4 0 4 0" />
    </Svg>
  ),
  "information.title": () => (
    <Svg>
      <text x="4" y="17" fontSize="12" fontFamily="sans-serif" stroke="none" fill="currentColor">
        Aa
      </text>
    </Svg>
  ),
  "information.benefit": () => (
    <Svg>
      <path d="M9 6h10" />
      <circle
        className="thumb-accent-fill"
        cx="5"
        cy="6"
        r="1.3"
        stroke="none"
      />
      <path d="M9 12h7" />
      <circle cx="5" cy="12" r="1.3" />
      <path d="M9 18h4" />
      <circle cx="5" cy="18" r="1.3" />
    </Svg>
  ),
  "information.price": () => (
    <Svg>
      <path d="M12 3h7a2 2 0 0 1 2 2v7L10 23 1 14 12 3z" />
      <circle
        className="thumb-accent-fill"
        cx="17"
        cy="7"
        r="1.3"
        stroke="none"
      />
      <text x="5.5" y="16" fontSize="8" stroke="none" fill="currentColor">
        $
      </text>
    </Svg>
  ),
  "information.headline": () => (
    <Svg>
      <path d="M4 8h16" strokeWidth={3} />
      <path className="thumb-accent" d="M4 13h10" strokeWidth={3} />
      <path d="M4 18h8" />
    </Svg>
  ),
  "information.body": () => (
    <Svg>
      <path d="M4 5h16" />
      <path d="M4 10h16" />
      <path d="M4 15h16" />
      <path className="thumb-accent" d="M4 20h7" />
    </Svg>
  ),
  "information.label": () => (
    <Svg>
      <rect x="4" y="9" width="16" height="6" rx="3" />
      <circle
        className="thumb-accent-fill"
        cx="8"
        cy="12"
        r="1"
        stroke="none"
      />
    </Svg>
  ),
  "actions.cta": () => (
    <Svg>
      <rect x="3" y="8" width="14" height="8" rx="3" />
      <path className="thumb-accent" d="M14 7l6 5-6 5" />
    </Svg>
  ),
  "branding.logo": () => (
    <Svg>
      <circle cx="9" cy="12" r="5" />
      <circle className="thumb-accent" cx="15" cy="12" r="5" />
    </Svg>
  ),
  "structure.stage": () => (
    <Svg>
      <rect x="5" y="4" width="14" height="11" rx="1" />
      <ellipse className="thumb-accent" cx="12" cy="19" rx="7" ry="2" />
    </Svg>
  ),
  "decoration.badge": () => (
    <Svg>
      <circle cx="12" cy="10" r="6" />
      <path d="M9 15l-1 5 4-2 4 2-1-5" />
      <path
        className="thumb-accent"
        d="M12 7l1.1 2.2 2.4.3-1.8 1.7.4 2.4-2.1-1.2-2.1 1.2.4-2.4-1.8-1.7 2.4-.3z"
      />
    </Svg>
  ),
  "decoration.shape": () => (
    <Svg>
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
        fill="currentColor"
        fillOpacity={0.15}
        stroke="none"
      />
      <path className="thumb-accent" d="M14 4h6v6" />
    </Svg>
  ),
  "decoration.divider": () => (
    <Svg>
      <path d="M5 8h4" />
      <path className="thumb-accent" d="M10 12h4" />
      <path d="M15 16h4" />
    </Svg>
  ),
  "decoration.icon": () => (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path className="thumb-accent" d="M12 7l5 5-5 5-5-5z" />
    </Svg>
  ),
  "decoration.arrow": () => (
    <Svg>
      <path d="M4 12c4-6 10-6 13-3" />
      <path className="thumb-accent" d="M14 6l3 3-3 3" />
    </Svg>
  ),
};

function GenericThumb() {
  return (
    <Svg>
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        strokeDasharray="3 3"
      />
    </Svg>
  );
}

export function ElementThumbnail({ id }: { id: string }) {
  const dedicated = THUMBNAILS[id];
  if (dedicated)
    return (
      <span className="contextual-element-thumb" data-thumbnail="dedicated" aria-hidden="true">
        {dedicated()}
      </span>
    );
  const GroupIcon = GROUP_ICONS[id.split(".")[0] ?? ""];
  if (GroupIcon)
    return (
      <span className="contextual-element-thumb" data-thumbnail="group" aria-hidden="true">
        <GroupIcon size={18} />
      </span>
    );
  return (
    <span className="contextual-element-thumb" data-thumbnail="generic" aria-hidden="true">
      <GenericThumb />
    </span>
  );
}

export function LibraryGroupIcon({
  groupId,
  size = 16,
  className,
}: {
  groupId: string;
  size?: number;
  className?: string;
}) {
  const Icon = GROUP_ICONS[groupId] ?? Shapes;
  return (
    <Icon
      size={size}
      {...(className === undefined ? {} : { className })}
      aria-hidden="true"
    />
  );
}
