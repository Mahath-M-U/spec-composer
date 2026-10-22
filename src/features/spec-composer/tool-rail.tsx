import { useState, type ReactElement } from "react";
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
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

function RailTooltip({
  name,
  description,
  disabled = false,
  children,
}: {
  name: string;
  description: string;
  disabled?: boolean;
  children: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  // Keep the trigger tree stable when changing display modes so focus survives.
  return (
    <Tooltip open={!disabled && open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={12}
        collisionPadding={12}
        className="tool-rail-tooltip"
      >
        <strong>{name}</strong>
        <span>{description}</span>
      </TooltipContent>
    </Tooltip>
  );
}

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
    <TooltipProvider delayDuration={400}>
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
          const right =
            railBounds.right - Number.parseFloat(padding.paddingRight);
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
          <RailTooltip
            name={toggleLabel}
            description="Change navigation display mode"
          >
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
          </RailTooltip>
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
              <RailTooltip
                key={id}
                name={label}
                description={description}
                disabled={expanded}
              >
                <button
                  type="button"
                  id={`editor-rail-${id}`}
                  className={active ? "active" : undefined}
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
              </RailTooltip>
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
          <RailTooltip
            name="Quick tour"
            description="Get to know your editor"
            disabled={expanded}
          >
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
          </RailTooltip>
          <RailTooltip
            name="Connect"
            description="Connect via MCP · Coming soon"
            disabled={expanded}
          >
            <button
              type="button"
              className="tool-rail-connect"
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
          </RailTooltip>
        </div>
        {mcpOpen && <McpComingSoonSplash close={() => setMcpOpen(false)} />}
        {guideOpen && (
          <QuickGuide page="editor" close={() => setGuideOpen(false)} />
        )}
      </aside>
    </TooltipProvider>
  );
}
