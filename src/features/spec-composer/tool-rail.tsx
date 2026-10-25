import { useState } from "react";
import {
  Compass,
  Gem,
  Image,
  Layers3,
  LayoutTemplate,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Scaling,
  Sun,
} from "lucide-react";
import { useEditorStore } from "./store";
import { DesignKitSummary } from "./design-kit-card";
import { UserSettings } from "./user-settings";
import { McpComingSoonSplash } from "./coming-soon-lazy";
import { QuickGuide } from "./quick-guide-lazy";
import type { PanelMode } from "./types";
import type { SidebarLayout } from "./use-sidebar-layout";
import "./tool-rail.css";

const NAVIGATION = [
  {
    id: "assets",
    icon: Image,
    label: "Assets",
    description: "Add images, shapes, and text",
  },
  {
    id: "environment",
    icon: Sun,
    label: "Environment",
    description: "Set up the camera, lights, and ambient",
  },
  {
    id: "style",
    icon: Palette,
    label: "Style",
    description: "Edit visual styling",
  },
  {
    id: "layers",
    icon: Layers3,
    label: "Layers",
    description: "Organize your design layers",
  },
  {
    id: "templates",
    icon: LayoutTemplate,
    label: "Templates",
    description: "Explore starting points for your design",
  },
  {
    id: "brandKit",
    icon: Gem,
    label: "Design Kit",
    description: "Manage colors and brand styles",
  },
  {
    id: "resize",
    icon: Scaling,
    label: "Resize",
    description: "Change your canvas dimensions",
  },
] as const satisfies readonly {
  id: PanelMode;
  icon: typeof Image;
  label: string;
  description: string;
}[];

export interface ToolRailProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  sidebars: SidebarLayout;
  onSelectPanel: (id: PanelMode) => void;
  onTour: () => void;
}

export function ToolRail({
  expanded,
  onExpandedChange,
  sidebars,
  onSelectPanel,
  onTour,
}: ToolRailProps) {
  const panel = useEditorStore((s) => s.panel);
  const appliedKitId = useEditorStore(
    (s) => s.doc?.creativeDirection.brandKitId,
  );
  const kit = useEditorStore((s) =>
    s.brandKits.find((item) => item.id === appliedKitId),
  );
  const [mcpOpen, setMcpOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const toggleLabel = expanded ? "Collapse navigation" : "Expand navigation";
  return (
    <aside
      id="editor-tool-rail"
      className="tool-rail tool-rail--redesigned"
      data-expanded={expanded}
      aria-label="Editor tools"
      onFocusCapture={(event) => {
        if (!window.matchMedia("(max-width: 767px)").matches) return;
        const control = (event.target as HTMLElement).closest<HTMLElement>(
          "button, a",
        );
        if (!control || !event.currentTarget.contains(control)) return;
        const rail = event.currentTarget;
        const railBounds = rail.getBoundingClientRect();
        const bounds = control.getBoundingClientRect();
        const padding = getComputedStyle(rail);
        const left = railBounds.left + Number.parseFloat(padding.paddingLeft);
        const right = railBounds.right - Number.parseFloat(padding.paddingRight);
        const delta =
          bounds.left < left
            ? bounds.left - left
            : bounds.right > right
              ? bounds.right - right
              : 0;
        if (delta)
          rail.scrollTo({
            left: Math.max(
              0,
              Math.min(
                rail.scrollWidth - rail.clientWidth,
                rail.scrollLeft + delta,
              ),
            ),
            behavior: "auto",
          });
      }}
    >
      <div className="tool-rail-header">
        <button
          type="button"
          className="tool-rail-toggle"
          aria-label={toggleLabel}
          aria-expanded={expanded}
          aria-controls="editor-tool-navigation"
          onClick={() => onExpandedChange(!expanded)}
        >
          {expanded ? (
            <PanelLeftClose aria-hidden="true" />
          ) : (
            <PanelLeftOpen aria-hidden="true" />
          )}
          <span>{expanded ? "Collapse" : "Expand"}</span>
        </button>
        <UserSettings />
      </div>
      <nav
        id="editor-tool-navigation"
        className="tool-rail-primary"
        aria-label="Design tools"
      >
        {NAVIGATION.map(({ id, icon: Icon, label, description }) => {
          const active = sidebars.leftOpen && panel === id;
          return (
            <button
              key={id}
              type="button"
              id={`editor-rail-${id}`}
              className={active ? "active" : undefined}
              aria-label={label}
              aria-pressed={active}
              aria-controls="editor-left-panel"
              data-tour={`rail-${id}`}
              onClick={() => onSelectPanel(id)}
            >
              <Icon aria-hidden="true" />
              <span className="tool-rail-copy">
                <span>{label}</span>
                <small>{description}</small>
              </span>
            </button>
          );
        })}
      </nav>
      {kit && (
        <button
          type="button"
          className="tool-rail-kit"
          aria-label={`Open applied Design Kit: ${kit.name}`}
          onClick={() => onSelectPanel("brandKit")}
        >
          <DesignKitSummary kit={kit} subtitle="Applied Design Kit" />
        </button>
      )}
      <div className="tool-rail-footer">
        <button
          type="button"
          className="tool-rail-tour"
          aria-label="Quick tour"
          onClick={() => {
            useEditorStore.getState().setPanel("assets");
            onTour();
            setGuideOpen(true);
          }}
        >
          <Compass aria-hidden="true" />
          <span className="tool-rail-copy">
            <span>Tour</span>
            <small>Get to know your editor</small>
          </span>
        </button>
        <button
          type="button"
          className="tool-rail-connect"
          aria-label="Connect"
          data-tour="connect"
          aria-haspopup="dialog"
          onClick={() => setMcpOpen(true)}
        >
          <Plug aria-hidden="true" />
          <span className="tool-rail-copy">
            <span>Connect</span>
            <small>Connect via MCP</small>
          </span>
          <em className="tool-rail-status">Coming soon</em>
        </button>
      </div>
      {mcpOpen && <McpComingSoonSplash close={() => setMcpOpen(false)} />}
      {guideOpen && (
        <QuickGuide page="editor" close={() => setGuideOpen(false)} />
      )}
    </aside>
  );
}
