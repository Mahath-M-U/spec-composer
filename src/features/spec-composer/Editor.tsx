import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type CSSProperties,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CanvasWorkspace } from "./canvas-surface";
import { AssetsPanel } from "./assets-panel/AssetsPanel";
import { ResizePanel } from "./resize-panel";
import { PanelHeader, PanelCollapseProvider } from "./panel-header";
import { BrandKitPanel, brandKitPaint } from "./brand-kit-panel";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Copy,
  Trash2,
  AlignVerticalSpaceAround,
  Download,
  Layers3,
  LayoutTemplate,
  LayoutGrid,
  Palette,
  Image,
  ZoomIn,
  ZoomOut,
  Scan,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Folder,
  Clipboard,
  FileText,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  BringToFront,
  SendToBack,
  Group,
  Ungroup,
  X,
  MoveUp,
  MoveDown,
  Search,
  Gem,
  Check,
  Pencil,
  SlidersHorizontal,
  Loader2,
  AlertTriangle,
  Plug,
  MessagesSquare,
  RotateCw,
  Scaling,
  Compass,
  PanelRightClose,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { readRaw, writeRaw } from "@/lib/storage/local";
import { AppIcon } from "@/components/app-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEditorStore, type Box, type ComposeLayout } from "./store";
import {
  useSidebarLayout,
  focusSidebarControl,
  RIGHT_REOPEN_ID,
  RIGHT_COLLAPSE_ID,
  type SidebarLayout,
} from "./use-sidebar-layout";
import { alignUnits } from "./canvas-geometry";
import { Sep, Tool } from "./toolbar-controls";
import { loadProjectVersion } from "./persistence";
import { LS_KEYS } from "./storage";
import { reportStorageError } from "./storage/errors";
import { validateImageUpload } from "./image-validation";
import {
  createDocument,
  matchesTemplateQuery,
  starterTemplates,
} from "./templates";
import {
  buildJsonExport,
  compileExternalToolRequirement,
  compileRegionPrompt,
  compileVisualPrompt,
  compileVisualSegments,
  defaultExternalToolRequirement,
  segText,
  validateExternalToolRequirement,
  type PromptLine,
  type PromptSeg,
} from "./compiler";
import {
  compileDesignSkill,
  compileDesignSkillSegments,
  DESIGN_SKILL_HEADER,
  DESIGN_SKILL_SECTIONS,
} from "./design-md";
import { compileCopyText, type CopyKind } from "./copy-output";
import { DesignMarkdown, PromptProse, ProseText } from "./design-md-view";
import {
  DesignEditorSections,
  PromptEditorSections,
  TokenCard,
  type DesignPart,
} from "./design-editor-cards";
import { PromptPart } from "./prompt-visuals";
import { FEATURED_FONTS, MORE_FONTS } from "./fonts";
import { SectionEditor, ArtDirectionControls } from "./section-editors";
import { ART_DIRECTION_FIELDS } from "./art-direction";
import {
  destinationLabel,
  ToolAddButton,
  ToolLogo,
  ToolPickerDialog,
} from "./tool-picker";
import { findCatalogTool, TOOL_TYPE_LABEL } from "./tool-catalog";
import { sectionTarget } from "./section-target";
import {
  IMAGE_STYLE_GROUPS,
  IMAGE_STYLE_NONE,
  IMAGE_STYLES,
  resolveImageStyle,
  resolveImageStyleId,
  setImageStyle,
} from "./image-styles";
import { ChatComingSoonSplash, McpComingSoonSplash } from "./coming-soon-lazy";
import { QuickGuide } from "./quick-guide-lazy";
import { EditorSkeleton } from "./editor-skeleton";
import { hasPlaceholderArt, PLACEHOLDER_ART_OPTIONS } from "./illustrations";
import {
  backgroundStyle,
  DocumentPreview,
  StaticDocument,
} from "./static-render";
import {
  isImageKind,
  isTextKind,
  type ElementKind,
  type ExternalToolRequirement,
  type Format,
  type PanelMode,
  type PromptMode,
  type SpecDocument,
  type SpecElement,
} from "./types";

/** Placeholder-art options grouped for the picker's <optgroup> list, in the
 * order each group first appears in PLACEHOLDER_ART_OPTIONS. */
const PLACEHOLDER_ART_GROUPS: [string, typeof PLACEHOLDER_ART_OPTIONS][] =
  Array.from(
    PLACEHOLDER_ART_OPTIONS.reduce((groups, option) => {
      const existing = groups.get(option.group);
      if (existing) existing.push(option);
      else groups.set(option.group, [option]);
      return groups;
    }, new Map<string, typeof PLACEHOLDER_ART_OPTIONS>()),
  );

function colorInputValue(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function aspectRatioLabel(width: number, height: number): string {
  const w = Math.round(width);
  const h = Math.round(height);
  const divisor = gcd(w, h) || 1;
  return `${w / divisor}:${h / divisor}`;
}

const COMPOSE_LAYOUTS: { id: ComposeLayout; label: string; hint: string }[] = [
  {
    id: "copy-left",
    label: "Copy left",
    hint: "Text block on the left, visual on the right",
  },
  {
    id: "copy-right",
    label: "Copy right",
    hint: "Text block on the right, visual on the left",
  },
  {
    id: "stack-center",
    label: "Centered stack",
    hint: "Everything centered, top to bottom",
  },
  {
    id: "split-top",
    label: "Visual on top",
    hint: "Visual fills the top half, copy below",
  },
  {
    id: "split-bottom",
    label: "Visual on bottom",
    hint: "Visual fills the bottom half, copy above",
  },
  {
    id: "grid-2up",
    label: "Two-up grid",
    hint: "Equal visual and copy columns",
  },
  {
    id: "corner-badge",
    label: "Corner badge",
    hint: "Badge and CTA pinned to opposite corners",
  },
  {
    id: "layered-card",
    label: "Layered card",
    hint: "Full-bleed visual with copy on a centered card",
  },
  {
    id: "diagonal",
    label: "Diagonal cascade",
    hint: "Elements cascade from corner to corner",
  },
  {
    id: "full-bleed-overlay",
    label: "Full-bleed overlay",
    hint: "Visual fills the canvas, copy overlays the base",
  },
];

const LEFT_PANEL_DEFAULT_WIDTH = 432;
const RIGHT_PANEL_DEFAULT_WIDTH = 624;

/** Total non-canvas width the floating shell reserves on desktop: the rail
 * track plus the left/right 12px resize-handle tracks and the shell's own
 * 12px padding on each side. Must stay in sync with `--rail-width`,
 * `--shell-gap` and the handle tracks in styles.css. */
function editorChromeWidth(): number {
  const rail = window.innerWidth <= 1250 ? 76 : 80;
  return rail + 2 * 12 + 2 * 12;
}

/** Switches the left sidebar to the Style panel's Style tab and, on desktop,
 * opens it — shared by canvas selection and prompt-panel selection so both
 * land on the same place. */
function openStyleEditor(sidebars: SidebarLayout) {
  const store = useEditorStore.getState();
  store.setPanel("style");
  store.setStyleTab("style");
  if (!sidebars.overlay && !sidebars.leftOpen) sidebars.setOpen("left", true);
}

export function Editor({ projectId }: { projectId: string }) {
  const store = useEditorStore();
  const [preview, setPreview] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(
    LEFT_PANEL_DEFAULT_WIDTH,
  );
  const [rightPanelWidth, setRightPanelWidth] = useState(
    RIGHT_PANEL_DEFAULT_WIDTH,
  );
  const sidebars = useSidebarLayout();

  useEffect(() => {
    const keepWorkspaceVisible = () => {
      if (sidebars.overlay) return;
      const left = sidebars.leftOpen ? leftPanelWidth : 0;
      const right = sidebars.rightOpen ? rightPanelWidth : 0;
      const panelBudget =
        Math.max(1100, window.innerWidth) - editorChromeWidth() - 350;
      if (left + right <= panelBudget) return;
      if (sidebars.rightOpen) {
        const nextRight = Math.max(280, panelBudget - left);
        setRightPanelWidth(nextRight);
        if (sidebars.leftOpen)
          setLeftPanelWidth(Math.max(240, panelBudget - nextRight));
      } else if (sidebars.leftOpen) {
        setLeftPanelWidth(Math.max(240, panelBudget - right));
      }
    };
    keepWorkspaceVisible();
    window.addEventListener("resize", keepWorkspaceVisible);
    return () => window.removeEventListener("resize", keepWorkspaceVisible);
  }, [
    leftPanelWidth,
    rightPanelWidth,
    sidebars.overlay,
    sidebars.leftOpen,
    sidebars.rightOpen,
  ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Load kits first so the default kit applies to a new document.
        if (!useEditorStore.getState().hydrated)
          await useEditorStore.getState().hydrate();
        const found = await loadProjectVersion(projectId);
        if (cancelled) return;
        if (found) {
          setNotFound(false);
          store.setDocument(found.doc, found.token);
          return;
        }
        setNotFound(true);
      } catch (error) {
        if (!cancelled) reportStorageError(error, "open-project");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Kit changes made outside the editor must not reach the last open poster.
  useEffect(() => () => useEditorStore.getState().closeDocument(), []);

  useShortcuts(() => setPreview(true));

  const openStyleFromCanvas = () => openStyleEditor(sidebars);

  if (notFound)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">Design not found</h1>
        <p>This design is unavailable in this browser.</p>
        <Link to="/projects" className="text-primary underline">
          My designs
        </Link>
      </div>
    );
  if (!store.doc || store.doc.id !== projectId) return <EditorSkeleton />;

  return (
    <div
      className="editor-shell"
      data-layout={sidebars.overlay ? "overlay" : "inline"}
      data-left-panel={sidebars.leftOpen ? "open" : "closed"}
      data-right-panel={sidebars.rightOpen ? "open" : "closed"}
      style={
        {
          "--left-panel-width": `${leftPanelWidth}px`,
          "--right-panel-width": `${rightPanelWidth}px`,
        } as CSSProperties
      }
    >
      <TopBar
        preview={() => setPreview(true)}
        sidebars={sidebars}
        openChat={() => setChatOpen(true)}
      />
      <ToolRail
        sidebars={sidebars}
        onSelectPanel={(id) => {
          if (store.panel === id && sidebars.leftOpen)
            sidebars.setOpen("left", false);
          else {
            store.setPanel(id);
            sidebars.setOpen("left", true);
          }
        }}
        onTour={() => {
          sidebars.setOpen("left", true);
          if (!sidebars.overlay) sidebars.setOpen("right", true);
        }}
      />
      <ContextPanel
        onCollapse={() => {
          const id = store.panel;
          sidebars.setOpen("left", false);
          focusSidebarControl(`editor-rail-${id}`);
        }}
      />
      <PanelResizeHandle
        label="Resize left sidebar"
        side="left"
        width={leftPanelWidth}
        setWidth={setLeftPanelWidth}
        min={360}
        max={680}
        defaultWidth={LEFT_PANEL_DEFAULT_WIDTH}
        className="panel-resize-handle--left"
      />
      <Workspace onCanvasSelect={openStyleFromCanvas} />
      <PanelResizeHandle
        label="Resize right sidebar"
        side="right"
        width={rightPanelWidth}
        setWidth={setRightPanelWidth}
        min={360}
        max={680}
        defaultWidth={RIGHT_PANEL_DEFAULT_WIDTH}
        className="panel-resize-handle--right"
      />
      <RightPanel
        sidebars={sidebars}
        exportOpen={() => setExportOpen(true)}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
      />
      {sidebars.overlay && (sidebars.leftOpen || sidebars.rightOpen) && (
        <div
          className="editor-drawer-backdrop"
          aria-hidden="true"
          onClick={sidebars.closeDrawers}
        />
      )}
      {preview && <Preview close={() => setPreview(false)} />}
      {exportOpen && <ExportDialog close={() => setExportOpen(false)} />}
    </div>
  );
}

function PanelResizeHandle({
  label,
  side,
  width,
  setWidth,
  min,
  max,
  defaultWidth,
  className,
}: {
  label: string;
  side: "left" | "right";
  width: number;
  setWidth: Dispatch<SetStateAction<number>>;
  min: number;
  max: number;
  defaultWidth: number;
  className?: string;
}) {
  const drag = useRef<{ x: number; width: number } | null>(null);
  const clampWidth = useCallback(
    (next: number) => {
      const shell = document.querySelector<HTMLElement>(".editor-shell");
      if (!shell) return Math.min(max, Math.max(min, next));
      const oppositeClosed =
        shell.dataset[side === "left" ? "rightPanel" : "leftPanel"] ===
        "closed";
      const oppositeWidth = oppositeClosed
        ? 0
        : Number.parseFloat(
            shell.style.getPropertyValue(
              side === "left" ? "--right-panel-width" : "--left-panel-width",
            ),
          );
      const workspaceMax =
        shell.clientWidth - editorChromeWidth() - 350 - oppositeWidth;
      return Math.min(max, Math.max(min, workspaceMax), Math.max(min, next));
    },
    [max, min, side],
  );

  return (
      <div
        className={cn("panel-resize-handle", className)}
        role="separator"
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={width}
        tabIndex={0}
        onDoubleClick={() => setWidth(defaultWidth)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          const direction = e.key === "ArrowRight" ? 1 : -1;
          setWidth((current) =>
            clampWidth(current + direction * (side === "left" ? 12 : -12)),
          );
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, width };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const direction = side === "left" ? 1 : -1;
          setWidth(
            clampWidth(
              drag.current.width + (e.clientX - drag.current.x) * direction,
            ),
          );
        }}
        onPointerUp={(e) => {
          drag.current = null;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      />
  );
}

function TopBar({
  preview,
  sidebars,
  openChat,
}: {
  preview: () => void;
  sidebars: SidebarLayout;
  openChat: () => void;
}) {
  const s = useEditorStore();
  const d = s.doc;
  return (
    <header className="editor-top">
      <div className="editor-chip editor-chip--start flex min-w-0 items-center gap-2">
        <Hint label="Back to home">
          <Link to="/" className="tool-button" aria-label="Back to home">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Hint>
        <label className="project-name-field" data-tour="project">
          <span
            className="project-name-autosize text-sm font-bold"
            data-value={d?.name || " "}
          >
            <input
              aria-label="Project name"
              className="truncate bg-transparent text-sm font-bold outline-hidden"
              value={d?.name ?? ""}
              onChange={(e) =>
                s.mutate((doc) => {
                  doc.name = e.target.value;
                }, false)
              }
            />
          </span>
        </label>
        <Hint
          label={
            s.saveStatus === "saving"
              ? "Saving…"
              : s.saveStatus === "error"
                ? "Not saved"
                : "Saved locally"
          }
        >
          <span className="hidden shrink-0 items-center sm:flex" tabIndex={0}>
            {s.saveStatus === "saving" ? (
              <Loader2
                size={12}
                className="animate-spin text-editor-muted"
                aria-hidden="true"
              />
            ) : (
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  s.saveStatus === "error"
                    ? "bg-destructive"
                    : "bg-emerald-500",
                )}
                aria-hidden="true"
              />
            )}
            <span className="sr-only">
              {s.saveStatus === "saving"
                ? "Saving"
                : s.saveStatus === "error"
                  ? "Not saved"
                  : "Saved locally"}
            </span>
          </span>
        </Hint>
      </div>
      <div className="editor-chip editor-chip--end flex items-center gap-1">
        <Hint label="Preview">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-keyshortcuts="P"
            aria-label="Preview"
            data-tour="preview"
            onClick={preview}
            className="text-editor-muted hover:bg-editor-hover hover:text-editor-foreground"
          >
            <Eye size={16} aria-hidden="true" />
          </Button>
        </Hint>
        {!sidebars.rightOpen && <TopBarCopyActions />}
        <ThemeToggle className="text-editor-muted hover:bg-editor-hover hover:text-editor-foreground" />
        <RightPanelReopen sidebars={sidebars} openChat={openChat} />
      </div>
    </header>
  );
}

function RightPanelReopen({
  sidebars,
  openChat,
}: {
  sidebars: SidebarLayout;
  openChat: () => void;
}) {
  if (sidebars.rightOpen) return null;
  const open = (view: "design" | "prompt" | "chat") => {
    if (view === "chat") openChat();
    else {
      const mode: PromptMode =
        view === "design" ? "design_skill" : "visual_prompt";
      const st = useEditorStore.getState();
      if (st.doc && st.doc.promptMode !== mode)
        st.mutate((x) => {
          x.promptMode = mode;
        }, false);
    }
    sidebars.setOpen("right", true);
    focusSidebarControl(RIGHT_COLLAPSE_ID);
  };
  const views = [
    ["design", "Design"],
    ["prompt", "Prompt"],
    ["chat", "Chat"],
  ] as const;
  return (
    <div className="right-panel-launch" role="group" aria-label="Open side panel">
      {views.map(([view, label], i) => (
        <button
          key={view}
          type="button"
          id={i === 0 ? RIGHT_REOPEN_ID : undefined}
          aria-expanded={false}
          aria-controls="editor-right-panel"
          aria-haspopup={view === "chat" ? "dialog" : undefined}
          onClick={() => open(view)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ToolRail({
  sidebars,
  onSelectPanel,
  onTour,
}: {
  sidebars: SidebarLayout;
  onSelectPanel: (id: PanelMode) => void;
  onTour: () => void;
}) {
  const s = useEditorStore();
  const [mcpOpen, setMcpOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const items = [
    ["assets", Image, "Assets"],
    ["style", Palette, "Style"],
    ["layers", Layers3, "Layers"],
    ["templates", LayoutTemplate, "Templates"],
    ["brandKit", Gem, "Design kit"],
    ["resize", Scaling, "Resize"],
  ] as const;
  return (
    <aside className="tool-rail">
      <Hint label="Home" side="right">
        <Link to="/" className="spec-mark editor-top-home" aria-label="Home">
          <AppIcon className="h-full w-full" />
        </Link>
      </Hint>
      {items.map(([id, Icon, label]) => {
        const active = sidebars.leftOpen && s.panel === id;
        return (
          <button
            key={id}
            type="button"
            id={`editor-rail-${id}`}
            className={active ? "active" : ""}
            aria-pressed={active}
            data-tour={`rail-${id}`}
            onClick={() => onSelectPanel(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="tool-rail-tour"
        aria-label="Quick tour"
        onClick={() => {
          s.setPanel("assets");
          onTour();
          setGuideOpen(true);
        }}
      >
        <Compass />
        <span>Tour</span>
      </button>
      <button
        type="button"
        className="tool-rail-connect"
        data-tour="connect"
        onClick={() => setMcpOpen(true)}
      >
        <Plug />
        <span>Connect</span>
      </button>
      {mcpOpen && <McpComingSoonSplash close={() => setMcpOpen(false)} />}
      {guideOpen && (
        <QuickGuide page="editor" close={() => setGuideOpen(false)} />
      )}
    </aside>
  );
}

function ContextPanel({ onCollapse }: { onCollapse: () => void }) {
  const panel = useEditorStore((s) => s.panel);
  return (
    <aside
      className="context-panel"
      data-tour="assets"
      id="editor-left-panel"
      aria-label="Editor panel"
    >
      <PanelCollapseProvider onCollapse={onCollapse}>
        {panel === "assets" ? (
          <AssetsPanel />
        ) : panel === "style" ? (
          <StylePanel />
        ) : panel === "layers" ? (
          <LayersPanel />
        ) : panel === "templates" ? (
          <TemplatesPanel />
        ) : panel === "brandKit" ? (
          <BrandKitPanel />
        ) : panel === "resize" ? (
          <ResizePanel />
        ) : (
          <AssetsPanel />
        )}
      </PanelCollapseProvider>
    </aside>
  );
}

function LayersPanel() {
  const s = useEditorStore();
  const d = s.doc;
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  if (!d) return null;
  const layers = [...d.elements].sort((a, b) => b.zIndex - a.zIndex);
  const groups = new Map<string, SpecElement[]>();
  layers.forEach((element) => {
    if (!element.groupId) return;
    const members = groups.get(element.groupId) ?? [];
    members.push(element);
    groups.set(element.groupId, members);
  });

  const seenGroups = new Set<string>();
  const layerItems: Array<
    | { type: "layer"; element: SpecElement }
    | { type: "group"; id: string; elements: SpecElement[] }
  > = [];
  layers.forEach((element) => {
    if (!element.groupId) {
      layerItems.push({ type: "layer", element });
      return;
    }
    if (seenGroups.has(element.groupId)) return;
    seenGroups.add(element.groupId);
    layerItems.push({
      type: "group",
      id: element.groupId,
      elements: groups.get(element.groupId) ?? [],
    });
  });

  const moveLayerUp = (id: string) => {
    const index = layers.findIndex((element) => element.id === id);
    if (index <= 0) return;
    const ids = layers.map((element) => element.id);
    [ids[index - 1], ids[index]] = [ids[index]!, ids[index - 1]!];
    s.reorder(ids.reverse());
  };

  const moveLayerDown = (id: string) => {
    const index = layers.findIndex((element) => element.id === id);
    if (index < 0 || index >= layers.length - 1) return;
    const ids = layers.map((element) => element.id);
    [ids[index], ids[index + 1]] = [ids[index + 1]!, ids[index]!];
    s.reorder(ids.reverse());
  };

  const renderLayer = (element: SpecElement, nested = false) => {
    const index = layers.findIndex((layer) => layer.id === element.id);
    return (
      <div
        key={element.id}
        className={`layer-row ${nested ? "layer-row-child" : ""} ${s.selectedIds.includes(element.id) ? "active" : ""}`}
        onClick={(event) => s.select(element.id, event.shiftKey)}
      >
        <span className="truncate">
          {element.name}
        </span>
        <Hint label={element.locked ? "Unlock" : "Lock"}>
          <button
            type="button"
            aria-label={
              element.locked ? `Unlock ${element.name}` : `Lock ${element.name}`
            }
            onClick={(event) => {
              event.stopPropagation();
              s.updateElement(element.id, { locked: !element.locked });
            }}
          >
            {element.locked ? <Lock /> : <Unlock />}
          </button>
        </Hint>
        <Hint label="Move up">
          <button
            type="button"
            aria-label={`Move ${element.name} up`}
            disabled={index === 0}
            onClick={(event) => {
              event.stopPropagation();
              moveLayerUp(element.id);
            }}
          >
            <MoveUp />
          </button>
        </Hint>
        <Hint label="Move down">
          <button
            type="button"
            aria-label={`Move ${element.name} down`}
            disabled={index === layers.length - 1}
            onClick={(event) => {
              event.stopPropagation();
              moveLayerDown(element.id);
            }}
          >
            <MoveDown />
          </button>
        </Hint>
        <Hint label="Delete">
          <button
            type="button"
            className="layer-delete"
            aria-label={`Delete ${element.name}`}
            onClick={(event) => {
              event.stopPropagation();
              s.deleteElements([element.id]);
            }}
          >
            <Trash2 />
          </button>
        </Hint>
      </div>
    );
  };

  return (
    <>
      <PanelHeader
        icon={Layers3}
        eyebrow="Canvas"
        title="Layers"
        meta={`${d.elements.length} layer${d.elements.length === 1 ? "" : "s"}`}
      />
      <div className="layer-list px-2">
        {layerItems.map((item, itemIndex) => {
          if (item.type === "layer") return renderLayer(item.element);

          const isCollapsed = collapsedGroups.has(item.id);
          const memberIds = item.elements.map((element) => element.id);
          const isSelected = memberIds.some((id) => s.selectedIds.includes(id));
          const groupNumber = layerItems
            .slice(0, itemIndex + 1)
            .filter((candidate) => candidate.type === "group").length;
          const groupLabel = `Group ${groupNumber}`;

          return (
            <div className="layer-group" key={item.id}>
              <div
                className={`layer-group-row ${isSelected ? "active" : ""}`}
                onClick={(event) => s.selectMany(memberIds, event.shiftKey)}
              >
                <Hint label={isCollapsed ? "Expand" : "Collapse"}>
                  <button
                    type="button"
                    className="layer-group-toggle"
                    aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${groupLabel}`}
                    aria-expanded={!isCollapsed}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCollapsedGroups((current) => {
                        const next = new Set(current);
                        if (next.has(item.id)) next.delete(item.id);
                        else next.add(item.id);
                        return next;
                      });
                    }}
                  >
                    {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                  </button>
                </Hint>
                <Folder className="layer-group-folder" aria-hidden="true" />
                <span className="truncate">
                  {groupLabel}
                </span>
                <span className="layer-group-count">
                  {item.elements.length}
                </span>
                <Hint label="Delete group">
                  <button
                    type="button"
                    className="layer-delete"
                    aria-label={`Delete ${groupLabel} and its layers`}
                    onClick={(event) => {
                      event.stopPropagation();
                      s.deleteElements(memberIds);
                    }}
                  >
                    <Trash2 />
                  </button>
                </Hint>
              </div>
              {!isCollapsed && (
                <div className="layer-group-children">
                  {item.elements.map((element) => renderLayer(element, true))}
                </div>
              )}
            </div>
          );
        })}
        <div
          className={`layer-row-background ${s.backgroundSelected ? "active" : ""}`}
          onClick={() => s.selectBackground()}
        >
          <span
            className="layer-background-swatch"
            style={backgroundStyle(d)}
            aria-hidden="true"
          />
          <span className="truncate">Background</span>
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={s.selectedIds.length < 2}
          onClick={s.group}
        >
          <Group size={14} />
          Group
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={
            !d.elements.some(
              (element) =>
                s.selectedIds.includes(element.id) && Boolean(element.groupId),
            )
          }
          onClick={s.ungroup}
        >
          <Ungroup size={14} />
          Ungroup
        </Button>
        <Button
          className="col-span-2"
          size="sm"
          variant="outline"
          disabled={!s.selectedIds.length}
          onClick={s.deleteSelected}
        >
          <Trash2 size={14} />
          Delete selected
        </Button>
      </div>
    </>
  );
}

function TemplatesPanel() {
  const s = useEditorStore();
  const [query, setQuery] = useState("");
  const fmt = s.doc?.format;
  const fmtId = fmt?.id;
  const fmtLabel = fmt?.label;
  const fmtSubtitle = fmt?.subtitle;
  const fmtWidth = fmt?.width;
  const fmtHeight = fmt?.height;
  const fmtCategory = fmt?.category;
  // Preview (and apply) templates at the canvas's current size so picking a
  // template never snaps a resized canvas back to the template's own size.
  const templates = useMemo(() => {
    const currentFormat: Format | undefined =
      fmtId !== undefined &&
      fmtLabel !== undefined &&
      fmtSubtitle !== undefined &&
      fmtWidth !== undefined &&
      fmtHeight !== undefined &&
      fmtCategory !== undefined
        ? {
            id: fmtId,
            label: fmtLabel,
            subtitle: fmtSubtitle,
            width: fmtWidth,
            height: fmtHeight,
            category: fmtCategory,
          }
        : undefined;
    return starterTemplates.map((t) => ({
      ...t,
      document: currentFormat
        ? createDocument(currentFormat, t.name, { brandKit: false })
        : t.document,
    }));
  }, [fmtId, fmtLabel, fmtSubtitle, fmtWidth, fmtHeight, fmtCategory]);
  const shown = templates.filter((t) =>
    matchesTemplateQuery(t.name, t.category, query),
  );
  const apply = (t: (typeof templates)[number]) => {
    if (
      s.doc?.elements.length &&
      !window.confirm(
        `Replace this design with the ${t.name} template? You can undo this change.`,
      )
    )
      return;
    s.applyTemplate(t.document, t.name);
  };
  return (
    <>
      <PanelHeader
        icon={LayoutTemplate}
        eyebrow="Library"
        title="Templates"
        badge={<span className="beta-chip">Beta</span>}
        meta={`${shown.length} template${shown.length === 1 ? "" : "s"}`}
      />
      <div className="template-panel">
        <div className="asset-search-wrap">
          <Search aria-hidden="true" />
          <input
            className="asset-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
          />
          {query && (
            <Hint label="Clear search">
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X />
              </button>
            </Hint>
          )}
        </div>
        <div className="template-panel-grid">
          {shown.map((t) => (
            <button
              type="button"
              className="template-card template-panel-card"
              key={t.name}
              aria-label={`Use ${t.name} template`}
              onClick={() => apply(t)}
            >
              <span className="template-preview">
                <span className="template-preview-media">
                  <DocumentPreview doc={t.document} />
                </span>
                <span className="template-preview-reveal" aria-hidden="true">
                  <span className="template-preview-details">
                    <span className="template-preview-swatches">
                      {[
                        ...(t.document.background.type === "solid"
                          ? [t.document.background.value]
                          : []),
                        t.document.creativeDirection.primaryColor,
                        t.document.creativeDirection.secondaryColor,
                      ].map((color, index) => (
                        <i key={index} style={{ background: color }} />
                      ))}
                    </span>
                    <span className="template-preview-format">
                      {t.document.format.width} × {t.document.format.height}
                    </span>
                  </span>
                  <span className="template-preview-action">
                    <span className="template-preview-action-label">
                      Use template
                    </span>
                    <ArrowRight size={14} />
                  </span>
                </span>
              </span>
              <span className="template-card-copy">
                <span className="template-card-title">{t.name}</span>
                <span className="template-card-meta">{t.category}</span>
              </span>
            </button>
          ))}
          {!shown.length && (
            <p className="template-panel-empty">No templates match.</p>
          )}
        </div>
      </div>
    </>
  );
}

/** Compact labeled number input for the Style panel (X/Y/W/H, rotation, opacity, angle). */
function DockNumberField({
  prefix,
  label,
  value,
  onChange,
  min,
  max,
  suffix,
  disabled = false,
}: {
  prefix: ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <Hint label={label}>
      <label className="style-dock-field">
        <span className="style-dock-field-prefix" aria-hidden="true">
          {prefix}
        </span>
        <input
          type="number"
          aria-label={label}
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix && <em className="style-dock-field-suffix">{suffix}</em>}
      </label>
    </Hint>
  );
}

function StylePanel() {
  const s = useEditorStore();
  const d = s.doc;
  const [brandKitOpen, setBrandKitOpen] = useState(false);
  const brandKitPickerRef = useRef<HTMLDivElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [regenCopied, setRegenCopied] = useState(false);
  const tab = s.styleTab;
  const setTab = s.setStyleTab;

  useEffect(() => {
    if (!brandKitOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!brandKitPickerRef.current?.contains(event.target as Node)) {
        setBrandKitOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBrandKitOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [brandKitOpen]);

  if (!d) return null;

  // The kit this poster was designed with, not the default for new posters.
  const activeBrandKit = s.brandKits.find(
    (kit) => kit.id === d.creativeDirection.brandKitId,
  );
  const selectedElements = d.elements.filter((element) =>
    s.selectedIds.includes(element.id),
  );
  const textElements = selectedElements.filter((element) =>
    isTextKind(element.kind),
  );
  const firstElement = selectedElements[0];
  const firstTextElement = textElements[0];
  const updateSelectedStyles = (
    patch: Partial<SpecElement["style"]>,
    textOnly = false,
  ) =>
    s.mutate((doc) => {
      doc.elements.forEach((element) => {
        if (
          s.selectedIds.includes(element.id) &&
          (!textOnly || isTextKind(element.kind))
        )
          Object.assign(element.style, patch);
      });
    });
  const updateBackground = (patch: Partial<SpecDocument["background"]>) =>
    s.mutate((doc) => Object.assign(doc.background, patch));
  const updateFirstElement = (patch: Partial<SpecElement>) => {
    if (
      ["x", "y", "width", "height", "rotation"].some((key) => key in patch) &&
      selectedElements.some((el) => el.locked)
    )
      return;
    if (firstElement) s.updateElement(firstElement.id, patch);
  };
  const showImageFit = !!firstElement && isImageKind(firstElement.kind);
  const showColorControls =
    !!firstElement &&
    !s.backgroundSelected &&
    (isTextKind(firstElement.kind) ||
      firstElement.kind === "shape" ||
      firstElement.kind === "divider");

  return (
    <section className="style-panel" data-tab={tab} aria-label="Style controls">
      <PanelHeader
        icon={Palette}
        eyebrow="Design"
        title="Style"
        meta={
          s.backgroundSelected
            ? "Background"
            : s.selectedIds.length
              ? `${s.selectedIds.length} selected`
              : "Nothing selected"
        }
      />
      <div className="style-dock">
        <div className="style-dock-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "style"}
            className={tab === "style" ? "active" : ""}
            onClick={() => setTab("style")}
          >
            <Palette aria-hidden="true" />
            Style
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "layout"}
            className={tab === "layout" ? "active" : ""}
            onClick={() => setTab("layout")}
          >
            <LayoutGrid aria-hidden="true" />
            Layout
          </button>
        </div>
        <span className="style-dock-separator" />

        {tab === "layout" && <ComposeList />}

        {tab === "style" && (
          <>
            {firstElement && !s.backgroundSelected && (
              <div className="style-dock-section element-details-section">
                <h3 className="style-dock-section-title element-details-heading">
                  <button
                    type="button"
                    className="element-details-toggle"
                    aria-expanded={detailsOpen}
                    aria-controls="style-panel-element-details"
                    onClick={() => setDetailsOpen((open) => !open)}
                  >
                    <span>Element details</span>
                    <b className="truncate">{firstElement.name}</b>
                    <ChevronDown aria-hidden="true" />
                  </button>
                </h3>

                {detailsOpen && (
                  <div
                    id="style-panel-element-details"
                    className="element-details-fields"
                  >
                    <label>
                      <span>Name</span>
                      <input
                        value={firstElement.name}
                        onChange={(event) =>
                          updateFirstElement({ name: event.target.value })
                        }
                      />
                    </label>
                    {!isTextKind(firstElement.kind) &&
                      firstElement.content !== undefined && (
                        <label>
                          <span>Content</span>
                          <textarea
                            rows={3}
                            value={firstElement.content ?? ""}
                            onChange={(event) =>
                              s.setElementText(
                                firstElement.id,
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      )}
                    {isImageKind(firstElement.kind) && (
                      <label>
                        <span>AI description</span>
                        <textarea
                          rows={3}
                          value={firstElement.aiDescription ?? ""}
                          onChange={(event) =>
                            updateFirstElement({
                              aiDescription: event.target.value,
                            })
                          }
                        />
                      </label>
                    )}
                    {isImageKind(firstElement.kind) && !firstElement.src && (
                      <label>
                        <span>Placeholder art</span>
                        <select
                          value={
                            hasPlaceholderArt(firstElement.placeholderArt)
                              ? firstElement.placeholderArt
                              : "none"
                          }
                          onChange={(event) =>
                            updateFirstElement({
                              placeholderArt: event.target.value,
                            })
                          }
                        >
                          {PLACEHOLDER_ART_GROUPS.map(([group, options]) => (
                            <optgroup key={group} label={group}>
                              {options.map((option) => (
                                <option key={option.key} value={option.key}>
                                  {option.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          <option value="none">None (empty slot)</option>
                        </select>
                      </label>
                    )}
                    {isImageKind(firstElement.kind) && (
                      <label>
                        <span>Replace image (regenerate this region)</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={async (event) => {
                            const f = event.target.files?.[0];
                            event.target.value = "";
                            if (!f) return;
                            try {
                              await validateImageUpload(f);
                            } catch (error) {
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "Image is invalid",
                              );
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string")
                                updateFirstElement({
                                  src: reader.result,
                                  aiDescription: f.name,
                                });
                            };
                            reader.readAsDataURL(f);
                          }}
                        />
                      </label>
                    )}
                    <div className="element-constraint-fields">
                      <h4 className="element-constraint-title">
                        AI constraints
                      </h4>
                      <label>
                        <span>Lock (anti-slop)</span>
                        <select
                          value={firstElement.constraint?.lock ?? "guided"}
                          onChange={(event) =>
                            s.updateElementConstraint(firstElement.id, {
                              lock: event.target.value as
                                "exact" | "guided" | "free",
                            })
                          }
                        >
                          <option value="free">Free — fully generative</option>
                          <option value="guided">Guided — stay in style</option>
                          <option value="exact">Exact — must not change</option>
                        </select>
                      </label>
                      <label>
                        <span>Must include</span>
                        <textarea
                          rows={3}
                          placeholder="e.g. photographic, studio lighting"
                          value={
                            firstElement.constraint?.positiveConstraint ?? ""
                          }
                          onChange={(event) =>
                            s.updateElementConstraint(firstElement.id, {
                              positiveConstraint: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Must avoid</span>
                        <textarea
                          rows={3}
                          placeholder="e.g. no added text, no watermark"
                          value={
                            firstElement.constraint?.negativeConstraint ?? ""
                          }
                          onChange={(event) =>
                            s.updateElementConstraint(firstElement.id, {
                              negativeConstraint: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="element-constraint-checkbox">
                        <input
                          type="checkbox"
                          checked={
                            firstElement.constraint?.brandLocked ?? false
                          }
                          onChange={(event) =>
                            s.updateElementConstraint(firstElement.id, {
                              brandLocked: event.target.checked,
                            })
                          }
                        />
                        <span>Brand-locked (colors/fonts non-negotiable)</span>
                      </label>
                      <div className="element-constraint-actions">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() =>
                            s.mutate((doc) => {
                              doc.elements.forEach((el) => {
                                if (el.id !== firstElement.id)
                                  el.constraint = {
                                    ...el.constraint,
                                    lock: "exact",
                                  };
                                else if (el.constraint?.lock === "exact")
                                  el.constraint = {
                                    ...el.constraint,
                                    lock: "guided",
                                  };
                              });
                            })
                          }
                        >
                          <Lock size={14} />
                          Lock all except this
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(
                              compileRegionPrompt(d, firstElement.id),
                            );
                            setRegenCopied(true);
                            setTimeout(() => setRegenCopied(false), 1500);
                          }}
                        >
                          {regenCopied ? (
                            <Check size={14} />
                          ) : (
                            <Clipboard size={14} />
                          )}
                          {regenCopied ? "Copied" : "Copy region prompt"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {firstElement &&
              !s.backgroundSelected &&
              isTextKind(firstElement.kind) && (
                <div className="style-dock-section element-details-fields">
                  <h3 className="style-dock-section-title">Content</h3>
                  <textarea
                    aria-label="Content"
                    rows={3}
                    value={firstElement.content ?? ""}
                    disabled={firstElement.locked}
                    onChange={(event) =>
                      s.setElementText(firstElement.id, event.target.value)
                    }
                  />
                </div>
              )}

            {firstElement && !s.backgroundSelected && (
              <div className="style-dock-section">
                <h3 className="style-dock-section-title">Transform</h3>
                <div className="style-dock-grid">
                  <DockNumberField
                    prefix="X"
                    label="X position"
                    disabled={selectedElements.some((el) => el.locked)}
                    value={Math.round(firstElement.x)}
                    onChange={(value) => updateFirstElement({ x: value })}
                  />
                  <DockNumberField
                    prefix="Y"
                    label="Y position"
                    disabled={selectedElements.some((el) => el.locked)}
                    value={Math.round(firstElement.y)}
                    onChange={(value) => updateFirstElement({ y: value })}
                  />
                  <DockNumberField
                    prefix="W"
                    label="Width"
                    disabled={selectedElements.some((el) => el.locked)}
                    min={1}
                    value={Math.round(firstElement.width)}
                    onChange={(value) =>
                      updateFirstElement({ width: Math.max(1, value) })
                    }
                  />
                  <DockNumberField
                    prefix="H"
                    label="Height"
                    disabled={selectedElements.some((el) => el.locked)}
                    min={1}
                    value={Math.round(firstElement.height)}
                    onChange={(value) =>
                      updateFirstElement({ height: Math.max(1, value) })
                    }
                  />
                  <DockNumberField
                    prefix={<RotateCw aria-hidden="true" />}
                    label="Rotation"
                    disabled={selectedElements.some((el) => el.locked)}
                    suffix="°"
                    value={Math.round(firstElement.rotation)}
                    onChange={(value) =>
                      updateFirstElement({ rotation: value })
                    }
                  />
                  <DockNumberField
                    prefix="O"
                    label="Opacity"
                    suffix="%"
                    min={0}
                    max={100}
                    value={Math.round((firstElement.style.opacity ?? 1) * 100)}
                    onChange={(value) =>
                      updateSelectedStyles({
                        opacity: Math.min(100, Math.max(0, value)) / 100,
                      })
                    }
                  />
                </div>
                <input
                  className="style-dock-opacity-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  aria-label="Opacity"
                  value={Math.round((firstElement.style.opacity ?? 1) * 100)}
                  onChange={(event) =>
                    updateSelectedStyles({
                      opacity: Number(event.target.value) / 100,
                    })
                  }
                />
              </div>
            )}

            {firstTextElement && (
              <div className="style-dock-section">
                <h3 className="style-dock-section-title">Text</h3>
                <label className="style-dock-control style-dock-font">
                  {activeBrandKit?.typography ? (
                    <Hint label="Set by design kit">
                      <div className="font-trigger style-dock-font-locked">
                        <Lock aria-hidden="true" />
                        <b>
                          {firstTextElement.style.fontFamily ??
                            activeBrandKit.typography}
                        </b>
                      </div>
                    </Hint>
                  ) : (
                    <select
                      aria-label="Font"
                      value={firstTextElement.style.fontFamily ?? "Manrope"}
                      onChange={(event) =>
                        updateSelectedStyles(
                          { fontFamily: event.target.value },
                          true,
                        )
                      }
                    >
                      {[...FEATURED_FONTS, ...MORE_FONTS].map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
                <div className="style-dock-grid">
                  <DockNumberField
                    prefix="Aa"
                    label="Font size"
                    min={1}
                    max={1000}
                    value={Math.round(firstTextElement.style.fontSize ?? 16)}
                    onChange={(value) =>
                      updateSelectedStyles(
                        { fontSize: Math.max(1, value) },
                        true,
                      )
                    }
                  />
                  <Hint label="Font weight">
                    <label className="style-dock-control style-dock-weight">
                      <select
                        aria-label="Font weight"
                        value={firstTextElement.style.fontWeight ?? 400}
                        onChange={(event) =>
                          updateSelectedStyles(
                            { fontWeight: Number(event.target.value) },
                            true,
                          )
                        }
                      >
                        {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                          (weight) => (
                            <option key={weight} value={weight}>
                              {weight}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  </Hint>
                </div>
                <label className="style-dock-row">
                  <span>Text color</span>
                  <input
                    type="color"
                    className="style-dock-swatch"
                    value={colorInputValue(
                      firstTextElement.style.color,
                      "#18181b",
                    )}
                    onChange={(event) =>
                      updateSelectedStyles(
                        { color: event.target.value },
                        true,
                      )
                    }
                  />
                </label>
              </div>
            )}

            {(showImageFit || showColorControls) && (
              <div className="style-dock-section">
                <h3 className="style-dock-section-title">Appearance</h3>
                {showColorControls && firstElement && (
                  <>
                    {isTextKind(firstElement.kind) ? (
                      <label className="style-dock-row">
                        <span>Background</span>
                        <input
                          type="color"
                          className="style-dock-swatch"
                          value={colorInputValue(
                            firstElement.style.background,
                            "#ffffff",
                          )}
                          onChange={(event) =>
                            updateSelectedStyles(
                              { background: event.target.value },
                              true,
                            )
                          }
                        />
                      </label>
                    ) : firstElement.kind === "shape" ||
                      firstElement.kind === "divider" ? (
                      <label className="style-dock-row">
                        <span>Element color</span>
                        <input
                          type="color"
                          className="style-dock-swatch"
                          value={colorInputValue(
                            firstElement.style.background,
                            "#8b5cf6",
                          )}
                          onChange={(event) =>
                            updateSelectedStyles({
                              background: event.target.value,
                            })
                          }
                        />
                      </label>
                    ) : null}
                  </>
                )}
                {showImageFit && firstElement && (
                  <label className="style-dock-row">
                    <span>Image fit</span>
                    <select
                      className="style-dock-row-select"
                      value={firstElement.style.objectFit ?? "cover"}
                      onChange={(event) =>
                        updateSelectedStyles({
                          objectFit: event.target.value as "cover" | "contain",
                        })
                      }
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </label>
                )}
              </div>
            )}

            {s.backgroundSelected && (
              <div className="style-dock-section">
                <h3 className="style-dock-section-title">Background</h3>
                <label className="style-dock-row">
                  <span>Fill</span>
                  <select
                    className="style-dock-row-select"
                    value={d.background.type}
                    onChange={(event) =>
                      updateBackground({
                        type: event.target.value as "solid" | "gradient",
                        ...(event.target.value === "gradient" &&
                        !d.background.secondaryValue
                          ? { secondaryValue: d.background.value, angle: 135 }
                          : {}),
                      })
                    }
                  >
                    <option value="solid">Solid</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </label>
                {d.background.type === "gradient" ? (
                  <>
                    <label className="style-dock-row">
                      <span>From</span>
                      <input
                        type="color"
                        className="style-dock-swatch"
                        value={d.background.value}
                        onChange={(event) =>
                          updateBackground({ value: event.target.value })
                        }
                      />
                    </label>
                    <label className="style-dock-row">
                      <span>To</span>
                      <input
                        type="color"
                        className="style-dock-swatch"
                        value={
                          d.background.secondaryValue ?? d.background.value
                        }
                        onChange={(event) =>
                          updateBackground({
                            secondaryValue: event.target.value,
                          })
                        }
                      />
                    </label>
                  </>
                ) : (
                  <label className="style-dock-row">
                    <span>Color</span>
                    <input
                      type="color"
                      className="style-dock-swatch"
                      value={d.background.value}
                      onChange={(event) =>
                        updateBackground({ value: event.target.value })
                      }
                    />
                  </label>
                )}
                {d.background.type === "gradient" && (
                  <DockNumberField
                    prefix={<RotateCw aria-hidden="true" />}
                    label="Gradient angle"
                    suffix="°"
                    min={0}
                    max={360}
                    value={d.background.angle ?? 135}
                    onChange={(value) =>
                      updateBackground({
                        angle: Math.min(360, Math.max(0, value)),
                      })
                    }
                  />
                )}
              </div>
            )}

            <div
              ref={brandKitPickerRef}
              className="style-dock-section style-dock-brandkit"
            >
              <h3 className="style-dock-section-title">Design kit</h3>
              <button
                className="font-trigger"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={brandKitOpen}
                onClick={() => setBrandKitOpen((open) => !open)}
              >
                <Gem aria-hidden="true" />
                <b>{activeBrandKit?.name ?? "No design kit"}</b>
                <ChevronDown aria-hidden="true" />
              </button>

              {brandKitOpen && (
                <div className="font-picker-popover brandkit-picker-popover">
                  <div className="font-picker-head">
                    <div>
                      <Gem aria-hidden="true" />
                      <div>
                        <b>Design kit</b>
                        <small>Apply colors and type to this poster</small>
                      </div>
                    </div>
                    <Hint label="Close">
                      <button
                        type="button"
                        aria-label="Close design kit picker"
                        onClick={() => setBrandKitOpen(false)}
                      >
                        <X />
                      </button>
                    </Hint>
                  </div>
                  <div
                    className="brandkit-list"
                    role="listbox"
                    aria-label="Design kits"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={!activeBrandKit}
                      className={`brandkit-option${!activeBrandKit ? " active" : ""}`}
                      onClick={() => {
                        if (activeBrandKit) s.deactivateBrandKit();
                        setBrandKitOpen(false);
                      }}
                    >
                      <span className="brandkit-swatches" aria-hidden="true">
                        <i className="brandkit-swatch-empty" />
                      </span>
                      <span className="truncate">No design kit</span>
                      {!activeBrandKit && <Check aria-hidden="true" />}
                    </button>
                    {s.brandKits.length ? (
                      <>
                        {s.brandKits.map((kit) => {
                          const isActive = activeBrandKit?.id === kit.id;
                          return (
                            <button
                              key={kit.id}
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              className={`brandkit-option${isActive ? " active" : ""}`}
                              onClick={() => {
                                s.activateBrandKit(kit.id);
                                setBrandKitOpen(false);
                              }}
                            >
                              <span
                                className="brandkit-swatches"
                                aria-hidden="true"
                              >
                                {kit.colors.length ? (
                                  kit.colors.slice(0, 5).map((c) => (
                                    <i
                                      key={c.id}
                                      style={{
                                        background: brandKitPaint(c),
                                      }}
                                    />
                                  ))
                                ) : (
                                  <i className="brandkit-swatch-empty" />
                                )}
                              </span>
                              <span className="truncate">{kit.name}</span>
                              {isActive && <Check aria-hidden="true" />}
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <p className="font-empty brandkit-empty-inline">
                        No saved design kits yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Workspace({ onCanvasSelect }: { onCanvasSelect: () => void }) {
  return (
    <CanvasWorkspace onCanvasSelect={onCanvasSelect}>
      <FloatingControls />
    </CanvasWorkspace>
  );
}

const COPY_OPTIONS: Record<CopyKind, { label: string; Icon: typeof Palette }> =
  {
    prompt: { label: "Copy prompt", Icon: FileText },
    design: { label: "Copy design", Icon: Palette },
  };

/** Per-viewer default for the top-bar Copy button; survives the component
 * unmounting while the right panel is open. */
function loadCopyMode(): CopyKind {
  return readRaw(LS_KEYS.topBarCopyMode) === "prompt" ? "prompt" : "design";
}

function saveCopyMode(mode: CopyKind) {
  try {
    writeRaw(LS_KEYS.topBarCopyMode, mode);
  } catch {
    // Losing a UI preference is harmless.
  }
}

/** Top-bar Copy split button shown while the right panel is collapsed: the
 * main half copies the last-chosen output (design by default), and the
 * chevron opens a menu that switches the default and copies. It skips the
 * panel's "before you copy" warnings and only blocks on the hard
 * external-tool requirement, surfaced as a toast instead of opening a
 * dialog. */
function TopBarCopyActions() {
  const [copied, setCopied] = useState<CopyKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<CopyKind>(loadCopyMode);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async (kind: CopyKind) => {
    if (busy) return;
    const { doc, brandKits } = useEditorStore.getState();
    if (!doc) return;
    const kit = brandKits.find((k) => k.id === doc.creativeDirection.brandKitId);
    if (kind === "prompt") {
      const error = validateExternalToolRequirement(doc.externalToolRequirement);
      if (error) {
        toast.error(error.message, {
          description:
            "Open the prompt panel's Prompt Editor to finish the external tool settings.",
        });
        return;
      }
    }
    setBusy(true);
    try {
      await navigator.clipboard.writeText(compileCopyText(doc, kit, kind));
      setCopied(kind);
    } catch {
      toast.error(
        kind === "prompt" ? "Couldn't copy prompt" : "Couldn't copy design",
        {
          description: "Allow clipboard access in your browser and try again.",
        },
      );
    } finally {
      setBusy(false);
    }
  };

  const { label: modeLabel, Icon: ModeIcon } = COPY_OPTIONS[mode];
  const choose = (kind: CopyKind) => {
    setMode(kind);
    saveCopyMode(kind);
    void copy(kind);
  };

  return (
    <>
      <div className="editor-split-button" role="group" aria-label="Copy">
        <Hint label={modeLabel}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={modeLabel}
            onClick={() => void copy(mode)}
            className="editor-split-main"
          >
            {copied === mode ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <ModeIcon size={14} aria-hidden="true" />
            )}
            <span className="editor-copy-label">
              {copied === mode ? "Copied" : modeLabel}
            </span>
          </Button>
        </Hint>
        <DropdownMenu>
          <Hint label="More copy options">
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="More copy options"
                className="editor-split-toggle w-6"
              >
                <ChevronDown size={12} aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
          </Hint>
          <DropdownMenuContent align="end" sideOffset={6} className="editor-menu">
            <DropdownMenuRadioGroup value={mode}>
              {(["prompt", "design"] as const).map((kind) => {
                const { label, Icon } = COPY_OPTIONS[kind];
                return (
                  <DropdownMenuRadioItem
                    key={kind}
                    value={kind}
                    className="editor-menu-item"
                    onSelect={() => choose(kind)}
                  >
                    <Icon aria-hidden="true" />
                    {label}
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {copied === "prompt"
          ? "Prompt copied"
          : copied === "design"
            ? "Design copied"
            : ""}
      </span>
    </>
  );
}

function FloatingControls() {
  const s = useEditorStore();
  const d = s.doc;
  if (!s.selectedIds.length || !d) return null;
  const selectedEls = d.elements.filter((e) => s.selectedIds.includes(e.id));
  const hasGroup = selectedEls.some((e) => e.groupId);
  const units = alignUnits(selectedEls);
  const canDistribute = units.filter((u) => !u.locked).length >= 3;
  const allLocked = selectedEls.every((element) => element.locked);
  const allVisible = selectedEls.every((element) => element.visible);
  const updateSelected = (patch: Partial<SpecElement>) =>
    s.mutate((doc) => {
      doc.elements.forEach((element) => {
        if (s.selectedIds.includes(element.id)) Object.assign(element, patch);
      });
    });
  return (
    <div className="floating-controls" data-canvas-ui>
      <Tool
        label="Align left"
        icon={<AlignStartVertical />}
        disabled={allLocked}
        onClick={() => s.align("left")}
      />
      <Tool
        label="Align center"
        icon={<AlignCenterVertical />}
        disabled={allLocked}
        onClick={() => s.align("center")}
      />
      <Tool
        label="Align right"
        icon={<AlignEndVertical />}
        disabled={allLocked}
        onClick={() => s.align("right")}
      />
      <Sep />
      <Tool
        label="Align top"
        icon={<AlignStartHorizontal />}
        disabled={allLocked}
        onClick={() => s.align("top")}
      />
      <Tool
        label="Align middle"
        icon={<AlignCenterHorizontal />}
        disabled={allLocked}
        onClick={() => s.align("middle")}
      />
      <Tool
        label="Align bottom"
        icon={<AlignEndHorizontal />}
        disabled={allLocked}
        onClick={() => s.align("bottom")}
      />
      {canDistribute && (
        <>
          <Sep />
          <Tool
            label="Distribute horizontally"
            icon={<AlignHorizontalDistributeCenter />}
            onClick={() => s.distribute("horizontal")}
          />
          <Tool
            label="Distribute vertically"
            icon={<AlignVerticalDistributeCenter />}
            onClick={() => s.distribute("vertical")}
          />
        </>
      )}
      <Sep />
      <Tool
        label="Bring to front"
        icon={<BringToFront />}
        onClick={s.bringToFront}
      />
      <Tool label="Bring forward" icon={<MoveUp />} onClick={s.bringForward} />
      <Tool
        label="Send backward"
        icon={<MoveDown />}
        onClick={s.sendBackward}
      />
      <Tool label="Send to back" icon={<SendToBack />} onClick={s.sendToBack} />
      <Sep />
      <Tool
        label="Duplicate"
        shortcut="Ctrl+D"
        icon={<Copy />}
        onClick={s.duplicate}
      />
      <Tool
        disabled={s.selectedIds.length < 2}
        label="Group"
        shortcut="Ctrl+G"
        icon={<Group />}
        onClick={s.group}
      />
      <Tool
        disabled={!hasGroup}
        label="Ungroup"
        shortcut="Ctrl+Shift+G"
        icon={<Ungroup />}
        onClick={s.ungroup}
      />
      <Tool
        label={allLocked ? "Unlock" : "Lock"}
        icon={allLocked ? <Unlock /> : <Lock />}
        onClick={() => updateSelected({ locked: !allLocked })}
      />
      <Tool
        label={allVisible ? "Hide" : "Show"}
        icon={<Eye />}
        onClick={() => updateSelected({ visible: !allVisible })}
      />
      <Tool
        label="Delete"
        shortcut="Del"
        icon={<Trash2 />}
        onClick={s.deleteSelected}
      />
    </div>
  );
}

type ThumbRect = [x: number, y: number, w: number, h: number];
type ThumbSpec = { visual?: ThumbRect; blocks: ThumbRect[] };

// Rough 40x50 sketches of where compose() places the visual and copy.
const COMPOSE_THUMBS: Record<ComposeLayout, ThumbSpec> = {
  "copy-left": {
    visual: [21, 6, 17, 36],
    blocks: [
      [3, 8, 14, 4],
      [3, 16, 15, 2],
      [3, 21, 13, 2],
      [3, 26, 9, 3],
    ],
  },
  "copy-right": {
    visual: [3, 8, 19, 35],
    blocks: [
      [25, 8, 12, 4],
      [25, 16, 12, 2],
      [25, 21, 10, 2],
      [25, 26, 8, 3],
    ],
  },
  "stack-center": {
    blocks: [
      [10, 6, 20, 4],
      [8, 14, 24, 12],
      [12, 31, 16, 2],
      [14, 36, 12, 2],
      [15, 42, 10, 3],
    ],
  },
  "split-top": {
    visual: [0, 0, 40, 27],
    blocks: [
      [3, 31, 22, 4],
      [3, 38, 32, 2],
      [3, 43, 26, 2],
    ],
  },
  "split-bottom": {
    visual: [0, 22, 40, 28],
    blocks: [
      [3, 4, 22, 4],
      [3, 11, 32, 2],
      [3, 16, 26, 2],
    ],
  },
  "grid-2up": {
    visual: [0, 0, 20, 50],
    blocks: [
      [24, 9, 13, 4],
      [24, 17, 13, 2],
      [24, 22, 11, 2],
      [24, 28, 8, 3],
    ],
  },
  "corner-badge": {
    blocks: [
      [3, 3, 9, 4],
      [7, 19, 26, 4],
      [7, 27, 26, 2],
      [10, 32, 20, 2],
      [27, 43, 10, 4],
    ],
  },
  "layered-card": {
    visual: [0, 0, 40, 50],
    blocks: [
      [8, 17, 24, 4],
      [8, 25, 24, 2],
      [8, 30, 20, 2],
    ],
  },
  diagonal: {
    blocks: [
      [3, 5, 16, 4],
      [7, 15, 16, 8],
      [11, 28, 16, 2],
      [15, 35, 16, 2],
      [19, 42, 10, 3],
    ],
  },
  "full-bleed-overlay": {
    visual: [0, 0, 40, 50],
    blocks: [
      [3, 34, 24, 4],
      [3, 41, 32, 2],
      [3, 45, 24, 2],
    ],
  },
};

function ComposeThumb({ spec }: { spec: ThumbSpec }) {
  return (
    <svg
      className="compose-thumb"
      viewBox="0 0 40 50"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="compose-thumb-page" width="40" height="50" />
      {spec.visual && (
        <rect
          className="compose-thumb-visual"
          x={spec.visual[0]}
          y={spec.visual[1]}
          width={spec.visual[2]}
          height={spec.visual[3]}
        />
      )}
      {spec.blocks.map(([x, y, w, h], i) => (
        <rect
          key={i}
          className="compose-thumb-block"
          x={x}
          y={y}
          width={w}
          height={h}
          rx="1"
        />
      ))}
    </svg>
  );
}

// Sketches the saved pre-compose boxes, or the current ones before any compose.
function originThumb(
  doc: SpecDocument | undefined,
  origin: Record<string, Box> | undefined,
): ThumbSpec {
  if (!doc) return { blocks: [] };
  const sx = 40 / doc.format.width;
  const sy = 50 / doc.format.height;
  const spec: ThumbSpec = { blocks: [] };
  doc.elements
    .filter((e) => e.visible && e.kind !== "shape" && e.kind !== "divider")
    .forEach((e) => {
      const b = origin?.[e.id] ?? e;
      const rect: ThumbRect = [b.x * sx, b.y * sy, b.width * sx, b.height * sy];
      if (e.kind.toLowerCase().includes("image")) spec.visual ??= rect;
      else spec.blocks.push(rect);
    });
  return spec;
}

function ComposeList() {
  const s = useEditorStore();
  return (
    <div className="compose-list">
      <div className="compose-scroll">
        <button
          type="button"
          className="compose-item"
          disabled={!s.composeOrigin}
          onClick={s.resetCompose}
        >
          <ComposeThumb spec={originThumb(s.doc, s.composeOrigin)} />
          <span className="compose-item-copy">
            <b>Original</b>
            <small>Restore positions from before any layout</small>
          </span>
        </button>
        {COMPOSE_LAYOUTS.map((l) => (
          <button
            key={l.id}
            type="button"
            className="compose-item"
            onClick={() => s.compose(l.id)}
          >
            <ComposeThumb spec={COMPOSE_THUMBS[l.id]} />
            <span className="compose-item-copy">
              <b>{l.label}</b>
              <small>{l.hint}</small>
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="compose-tidy" onClick={s.tidy}>
        <AlignVerticalSpaceAround aria-hidden="true" />
        Tidy up spacing
      </button>
    </div>
  );
}

function RightPanel({
  sidebars,
  exportOpen,
  chatOpen,
  setChatOpen,
}: {
  sidebars: SidebarLayout;
  exportOpen: () => void;
  chatOpen: boolean;
  setChatOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <aside
      className="right-panel"
      id="editor-right-panel"
      aria-label="Prompt panel"
    >
      <PromptPanel
        sidebars={sidebars}
        exportOpen={exportOpen}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
      />
    </aside>
  );
}

const promptMeta = (key: string, d: SpecDocument) => {
  if (key === "imageStyle")
    return {
      kind: "setup",
      tag: `Image style · ${resolveImageStyle(d)?.label ?? "Custom"}`,
    };
  const fixed: Record<string, [string, string]> = {
    format: ["setup", "Format"],
    colors: ["setup", "Colors"],
    brand: ["setup", "Brand"],
    mood: ["setup", "Mood"],
    dominant: ["visual", "Dominant visual"],
    layout: ["rules", "Layout"],
    avoid: ["rules", "Avoid"],
  };
  const f = fixed[key];
  if (f) return { kind: f[0], tag: f[1] };
  const el = d.elements.find((e) => `el:${e.id}` === key);
  return {
    kind:
      el && (isTextKind(el.kind) || el.content !== undefined)
        ? "text"
        : "visual",
    tag: el?.name ?? "Element",
  };
};

const skillMeta = (key: string, d: SpecDocument) => {
  const header = DESIGN_SKILL_HEADER[key];
  if (header) return { kind: "setup", tag: header };
  const heading = DESIGN_SKILL_SECTIONS[key];
  if (heading)
    return {
      kind: ["skill:rules", "skill:layout"].includes(key)
        ? "rules"
        : ["skill:components", "skill:imagery", "skill:art"].includes(key)
          ? "visual"
          : "setup",
      tag: heading,
    };
  const id = key.startsWith("skill:el:") ? key.slice("skill:el:".length) : null;
  const el = id ? d.elements.find((e) => e.id === id) : undefined;
  return {
    kind: el && isTextKind(el.kind) ? "text" : "visual",
    tag: el?.name ?? "Slot",
  };
};

/** The Design Editor and Prompt Editor keep separate hand edits, so a change
 * in one mode never leaks into the other's view, copy or export. */
const setHandEdit = (x: SpecDocument, mode: PromptMode, text: string) => {
  if (mode === "design_skill") {
    x.designEdit = text;
    x.designEditRevision = x.revision + 1;
  } else {
    x.visualEdit = text;
    x.visualEditRevision = x.revision + 1;
  }
};
const clearHandEdit = (x: SpecDocument, mode: PromptMode) => {
  if (mode === "design_skill") {
    delete x.designEdit;
    delete x.designEditRevision;
  } else {
    delete x.visualEdit;
    delete x.visualEditRevision;
  }
};

function PromptPanel({
  sidebars,
  exportOpen,
  chatOpen,
  setChatOpen,
}: {
  sidebars: SidebarLayout;
  exportOpen: () => void;
  chatOpen: boolean;
  setChatOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const s = useEditorStore();
  const d = s.doc;
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingPart, setEditingPart] = useState<string | null>(null);
  // Sections with design values open visual controls; this is set when the
  // raw text editor is open instead.
  const [textMode, setTextMode] = useState(false);
  const [toolPicker, setToolPicker] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const toolButtonRef = useRef<HTMLButtonElement>(null);
  const styleSelectRef = useRef<HTMLSelectElement>(null);
  // Return focus to the control that opened the Tools dialog.
  const toolOpenerRef = useRef<HTMLElement | null>(null);
  const [copyWarnings, setCopyWarnings] = useState<
    { key: string; message: string }[] | null
  >(null);
  const briefMissing =
    !!copyWarnings?.some((w) => w.key === "brief") && !d?.imageBrief.trim();
  // Selecting from a prompt row shouldn't also scroll the panel that
  // triggered it — only canvas-originated selection changes should.
  const fromPromptRef = useRef(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const selectedKey = s.selectedIds.join(",");
  useEffect(() => {
    if (fromPromptRef.current) {
      fromPromptRef.current = false;
      return;
    }
    if (!sidebars.rightOpen) return;
    const frame = requestAnimationFrame(() => {
      const row =
        viewRef.current?.querySelector(".de-subrow[data-selected]") ??
        viewRef.current?.querySelector("[data-selected]");
      row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedKey, sidebars.rightOpen]);
  const selectFromPrompt = (id: string) => {
    fromPromptRef.current = true;
    s.select(id);
    openStyleEditor(sidebars);
  };
  // The top-bar launcher can switch modes while the panel is hidden; don't
  // carry an open text editor across modes.
  const promptMode = d?.promptMode;
  useEffect(() => {
    setEditing(false);
    setEditingPart(null);
  }, [promptMode]);
  if (!d) return null;
  const kit = s.brandKits.find((k) => k.id === d.creativeDirection.brandKitId);
  const isSkill = d.promptMode === "design_skill";
  const edit = isSkill ? d.designEdit : d.visualEdit;
  const editRevision = isSkill ? d.designEditRevision : d.visualEditRevision;
  const toolSettings =
    d.externalToolRequirement ?? defaultExternalToolRequirement();
  const toolBlock = !isSkill
    ? compileExternalToolRequirement(toolSettings)
    : "";
  const visibleToolError = validateExternalToolRequirement(
    d.externalToolRequirement,
  );
  const openToolPicker = () => {
    const active = document.activeElement;
    toolOpenerRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
    setToolPicker(true);
  };
  const checkTool = (doc: SpecDocument) => {
    if (doc.promptMode !== "visual_prompt") return true;
    const error = validateExternalToolRequirement(doc.externalToolRequirement);
    if (!error) return true;
    setCopyWarnings(null);
    openToolPicker();
    return false;
  };
  const generated = isSkill
    ? compileDesignSkill(d, kit)
    : compileVisualPrompt(d);
  const effective = edit ?? generated;
  const handEdited = isSkill ? (
    <DesignMarkdown text={effective} />
  ) : (
    <PromptProse text={effective} />
  );
  const dirty = !!edit && editRevision !== d.revision;
  const noun = isSkill ? "design" : "prompt";
  const meta = isSkill ? skillMeta : promptMeta;
  const segments: PromptLine[] = isSkill
    ? compileDesignSkillSegments(d, kit)
    : compileVisualSegments(d);
  const baseSegments: PromptLine[] = isSkill
    ? compileDesignSkillSegments({ ...d, promptParts: {} }, kit)
    : compileVisualSegments({ ...d, promptParts: {} });
  // The brief feeds the prompt only; a design skill is reusable. It reads as
  // a section of its own, right after Format (or first if Format is removed).
  const sectionView = !editing && edit == null;
  const briefAfterFormat = segments.some(
    (l) => l.key === "format" && d.promptParts?.[l.key] !== "",
  );
  // Tool selection sits beside Include in output in the actions row (Prompt
  // Editor only).
  const toolButton = !isSkill && (
    <ToolAddButton
      settings={toolSettings}
      error={visibleToolError}
      open={toolPicker}
      onOpen={openToolPicker}
      buttonRef={toolButtonRef}
    />
  );
  const styleSelect = (
    <label className="prompt-style-row">
      <span>Image style</span>
      <select
        ref={styleSelectRef}
        className="se-input"
        value={resolveImageStyleId(d)}
        onChange={(e) => s.mutate((x) => setImageStyle(x, e.target.value))}
      >
        <option value={IMAGE_STYLE_NONE}>None</option>
        {IMAGE_STYLE_GROUPS.map((group) => (
          <optgroup key={group} label={group}>
            {IMAGE_STYLES.filter((style) => style.group === group).map(
              (style) => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ),
            )}
          </optgroup>
        ))}
      </select>
    </label>
  );
  const briefField = isSkill ? null : (
    <>
      {/* Titled with the keyword it takes in the prompt ("Purpose: …"). */}
      <div className="prompt-tag">
        <label htmlFor="image-brief">Purpose</label>
      </div>
      <textarea
        id="image-brief"
        className="brief-input"
        placeholder="What is this image for? e.g. Launch post for a new running shoe — get young runners to pre-order"
        value={d.imageBrief}
        spellCheck={false}
        onChange={(e) =>
          s.mutate((x) => {
            x.imageBrief = e.target.value;
          }, false)
        }
      />
    </>
  );
  const briefClass = briefMissing ? "prompt-brief-missing" : undefined;
  const briefSection = briefField && (
    <div
      key="brief"
      className={cn("prompt-part prompt-brief", briefClass)}
      data-kind="setup"
    >
      {briefField}
    </div>
  );
  const artDirectionCount = ART_DIRECTION_FIELDS.filter((f) =>
    d.artDirection?.[f.key]?.trim(),
  ).length;
  const artSection = !isSkill && (
    <TokenCard
      key="artDirection"
      icon={Camera}
      title="Art direction"
      summary={`${artDirectionCount} of ${ART_DIRECTION_FIELDS.length} set`}
      defaultOpen
    >
      <ArtDirectionControls />
    </TokenCard>
  );

  const doCopy = async () => {
    const current = useEditorStore.getState().doc;
    if (!current || !checkTool(current)) return;
    const currentKit = useEditorStore
      .getState()
      .brandKits.find((k) => k.id === current.creativeDirection.brandKitId);
    const text = compileCopyText(
      current,
      currentKit,
      current.promptMode === "design_skill" ? "design" : "prompt",
    );
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const requestCopy = () => {
    if (!checkTool(d)) return;
    const warnings: { key: string; message: string }[] = [];
    if (!isSkill && !d.imageBrief.trim())
      warnings.push({
        key: "brief",
        message:
          "You haven't filled in Purpose — the generator won't know what this image is for.",
      });
    const modeOverrides = Object.keys(d.promptParts ?? {}).filter(
      (k) => k.startsWith("skill:") === isSkill,
    );
    if (modeOverrides.length === 0)
      warnings.push({
        key: "parts",
        message:
          "You haven't edited any of the placeholder text yet — it's still the auto-generated default.",
      });
    if (warnings.length) setCopyWarnings(warnings);
    else doCopy();
  };
  // Drops the hand edit if it never diverged from the generated text, so an
  // untouched "Edit" round-trip doesn't pin the doc to a stale snapshot.
  const finishEditing = () => {
    if (editing && edit === generated)
      s.mutate((x) => clearHandEdit(x, x.promptMode), false);
    setEditing(false);
  };
  // One section's row: tag, edit/delete actions and its body (visual
  // controls, raw textarea or rendered text). Shared by the Prompt Editor's
  // flat list and the Design Editor's cards below.
  const renderPart = (line: PromptLine): DesignPart & { kind: string } => {
    const m = meta(line.key, d);
    const isEditing = editingPart === line.key;
    const text = segText(line.segs);
    const base = baseSegments.find((l) => l.key === line.key);
    const elId = line.key.startsWith("skill:el:")
      ? line.key.slice("skill:el:".length)
      : line.key.startsWith("el:")
        ? line.key.slice("el:".length)
        : null;
    const target = sectionTarget(line.key, d);
    const targetId = target?.type === "element" ? target.id : undefined;
    const visual = !!target;
    const startTextEdit = () => {
      s.mutate((x) => {
        x.promptParts = { ...x.promptParts, [line.key]: text };
      }, false);
      setTextMode(true);
    };
    const controls = isEditing && !textMode && (
      <SectionEditor
        lineKey={line.key}
        baseText={base ? segText(base.segs) : text}
        onEditText={startTextEdit}
      />
    );
    const actions = (
      <span className="prompt-tag-actions">
        {!isSkill && line.key === "dominant" && targetId && (
          <Hint label="Edit style">
            <button
              type="button"
              className="prompt-part-edit"
              aria-label={`Edit ${m.tag} style`}
              onClick={() => selectFromPrompt(targetId)}
            >
              <Palette size={11} />
            </button>
          </Hint>
        )}
        <Hint label={isEditing ? "Done" : "Edit"}>
          <button
            type="button"
            className="prompt-part-edit"
            aria-label={isEditing ? "Done" : `Edit ${m.tag}`}
            onClick={() => {
              if (!isEditing) {
                setEditingPart(line.key);
                if (visual) setTextMode(false);
                else startTextEdit();
                return;
              }
              if (textMode && base && text === segText(base.segs))
                s.mutate((x) => {
                  if (x.promptParts) delete x.promptParts[line.key];
                }, false);
              setEditingPart(null);
            }}
          >
            {isEditing ? <Check size={11} /> : <Pencil size={11} />}
          </button>
        </Hint>
        <Hint label="Delete">
          <button
            type="button"
            className="prompt-part-delete"
            aria-label={`Delete ${m.tag}`}
            onClick={() => {
              if (editingPart === line.key) setEditingPart(null);
              if (elId) {
                s.deleteElements([elId]);
                s.mutate((x) => {
                  if (x.promptParts) delete x.promptParts[line.key];
                }, false);
              } else if (line.key === "imageStyle") {
                s.mutate((x) => setImageStyle(x, IMAGE_STYLE_NONE));
                styleSelectRef.current?.focus();
              } else {
                s.mutate((x) => {
                  x.promptParts = { ...x.promptParts, [line.key]: "" };
                });
              }
            }}
          >
            <Trash2 size={11} />
          </button>
        </Hint>
      </span>
    );
    const fieldInput = (seg: Exclude<PromptSeg, string>, key: number) => (
      <input
        key={key}
        className="prompt-field"
        value={seg.value}
        placeholder={seg.fallback || "Text"}
        spellCheck={false}
        onFocus={() => selectFromPrompt(seg.id)}
        onChange={(e) =>
          seg.field === "content"
            ? s.setElementText(seg.id, e.target.value)
            : s.updateElement(seg.id, {
                [seg.field]: e.target.value,
              })
        }
      />
    );
    const withChrome = (content: ReactNode) => (
      <>
        {controls}
        {isEditing && textMode ? (
          <textarea
            className="prompt-part-text"
            autoFocus
            value={text}
            spellCheck={false}
            onChange={(e) =>
              s.mutate((x) => {
                x.promptParts = {
                  ...x.promptParts,
                  [line.key]: e.target.value,
                };
              }, false)
            }
          />
        ) : isSkill && !elId ? (
          <DesignMarkdown
            text={
              line.key === "skill:title"
                ? `# ${text}`
                : line.key === "skill:tagline"
                  ? `> ${text}`
                  : text
            }
          />
        ) : (
          <PromptPart
            lineKey={line.key}
            doc={d}
            text={text}
            custom={line.custom}
            bare={!!controls}
          >
            {content}
          </PromptPart>
        )}
      </>
    );
    const body = withChrome(
      <p className="md-prose">
        {line.segs.map((seg, j) =>
          typeof seg === "string" ? (
            <ProseText
              key={j}
              // Slot bullets read as rows here, not a list.
              text={isSkill && j === 0 ? seg.replace(/^- /, "") : seg}
            />
          ) : (
            fieldInput(seg, j)
          ),
        )}
      </p>,
    );
    return {
      key: line.key,
      tag: m.tag,
      text,
      editing: isEditing,
      actions,
      body,
      kind: m.kind,
      elementId: targetId,
      selected: !!targetId && s.selectedIds.includes(targetId),
      onSelect: targetId ? () => selectFromPrompt(targetId) : undefined,
    };
  };

  return (
    <>
      {/* Pinned bar: collapse, mode tabs and Chat, then Export at the far end. */}
      <div className="right-panel-head">
        {sidebars.rightOpen && (
          <Hint label="Hide panel">
            <button
              type="button"
              id={RIGHT_COLLAPSE_ID}
              className="right-panel-toggle"
              aria-label="Hide prompt panel"
              aria-expanded={true}
              aria-controls="editor-right-panel"
              onClick={() => {
                sidebars.setOpen("right", false);
                focusSidebarControl(RIGHT_REOPEN_ID);
              }}
            >
              <PanelRightClose aria-hidden="true" />
            </button>
          </Hint>
        )}
        <div className="segmented">
          {/* Chat is a dialog trigger, not a tab, so it sits outside the tablist. */}
          <div
            className="segmented-tabs"
            role="tablist"
            aria-label="Prompt mode"
          >
            {(
              [
                ["design_skill", "design.md", Palette],
                ["visual_prompt", "prompt.md", FileText],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={d.promptMode === id}
                className={d.promptMode === id ? "active" : ""}
                data-tour={
                  id === "design_skill" ? "design-editor" : "prompt-editor"
                }
                onClick={() => {
                  if (editing) finishEditing();
                  setEditingPart(null);
                  s.mutate((x) => {
                    x.promptMode = id;
                  }, false);
                }}
              >
                <Icon aria-hidden="true" />
                <span className="segmented-label">{label}</span>
              </button>
            ))}
          </div>
          <Hint label="Chat (coming soon)">
            <button
              type="button"
              className="segmented-chat"
              aria-haspopup="dialog"
              data-tour="chat"
              onClick={() => setChatOpen(true)}
            >
              <MessagesSquare aria-hidden="true" />
              <span className="segmented-chat-label">Chat</span>
            </button>
          </Hint>
        </div>
        <Hint label="Export">
          <button
            type="button"
            className="right-panel-export"
            aria-label="Export"
            data-tour="export"
            onClick={exportOpen}
          >
            <Download />
          </button>
        </Hint>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="p-3 empty:hidden">
          {chatOpen && (
            <ChatComingSoonSplash close={() => setChatOpen(false)} />
          )}
          {dirty && (
            <div className="sync-note">Out of sync with the current design</div>
          )}
          {/* Without per-section rows to sit in, the brief stays up here. */}
          {briefField && !sectionView && (
            <div className={cn("prompt-brief prompt-brief-top", briefClass)}>
              {briefField}
            </div>
          )}
          {!isSkill && styleSelect}
        </div>
        {editing ? (
          <>
            {!isSkill &&
              toolSettings.enabled &&
              (visibleToolError ? (
                <p
                  id="tool-requirement-error"
                  className="tool-directive-note"
                  data-invalid="true"
                  role="alert"
                >
                  {visibleToolError.message}{" "}
                  <button
                    type="button"
                    className="tool-directive-fix"
                    onClick={() => openToolPicker()}
                  >
                    Fix
                  </button>
                </p>
              ) : (
                <p className="tool-directive-note">
                  {toolSettings.toolName.trim()} requirement is added above this
                  text when you copy.
                </p>
              ))}
            <textarea
              className="prompt-text"
              value={effective}
              autoFocus
              onChange={(e) => {
                const value = e.target.value;
                s.mutate((x) => setHandEdit(x, x.promptMode, value), false);
              }}
              spellCheck={false}
            />
          </>
        ) : (
          <div
            ref={viewRef}
            className={`prompt-text prompt-view${isSkill ? " prompt-view-md" : ""}`}
          >
            {!isSkill && toolSettings.enabled && (
              <div
                key="tool-directive"
                className="prompt-part prompt-tool-part"
                data-kind="rules"
                data-invalid={visibleToolError ? "true" : undefined}
              >
                <span className="prompt-tag">
                  <span className="prompt-tool-title">
                    <ToolLogo
                      name={toolSettings.toolName}
                      custom={!findCatalogTool(toolSettings.toolName)}
                      size="sm"
                    />
                    <span className="prompt-tool-name">
                      {toolSettings.toolName.trim() || "Choose a tool"}
                    </span>
                    <span className="prompt-tool-meta">
                      Required{" "}
                      {TOOL_TYPE_LABEL[toolSettings.toolType].toLowerCase()} ·{" "}
                      {destinationLabel(toolSettings)}
                      {toolSettings.output === "editable_design"
                        ? " · Editable"
                        : ""}
                    </span>
                  </span>
                  <span className="prompt-tag-actions">
                    <Hint label="Change tool">
                      <button
                        type="button"
                        className="prompt-part-edit"
                        aria-label="Change required tool"
                        onClick={() => openToolPicker()}
                      >
                        <Pencil size={11} />
                      </button>
                    </Hint>
                    <Hint label="Remove tool">
                      <button
                        type="button"
                        className="prompt-part-delete"
                        aria-label={`Remove ${toolSettings.toolName} from prompt`}
                        onClick={() => {
                          s.updateExternalTool({ enabled: false });
                          toolButtonRef.current?.focus();
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </Hint>
                  </span>
                </span>
                {toolBlock ? (
                  <p className="prompt-tool-text">
                    {toolBlock.replace(/^REQUIRED TOOL\n\n/, "")}
                  </p>
                ) : (
                  <p
                    id="tool-requirement-error"
                    className="prompt-tool-error"
                    role="alert"
                  >
                    <AlertTriangle size={12} aria-hidden="true" />
                    {visibleToolError?.message}
                  </p>
                )}
              </div>
            )}
            {sectionView && !briefAfterFormat && briefSection}
            {sectionView && !briefAfterFormat && artSection}
            {edit != null ? (
              handEdited
            ) : isSkill ? (
              <DesignEditorSections
                parts={segments
                  .filter(
                    (line) =>
                      d.promptParts?.[line.key] !== "" &&
                      line.key !== "skill:overview",
                  )
                  .map(renderPart)}
                doc={d}
                kit={kit}
                styleControl={styleSelect}
                styleLabel={resolveImageStyle(d)?.label ?? "None"}
              />
            ) : (
              <PromptEditorSections
                parts={segments
                  .filter((line) => d.promptParts?.[line.key] !== "")
                  .map(renderPart)}
                doc={d}
                brief={briefSection}
                artDirection={artSection}
              />
            )}
          </div>
        )}
        <div
          className="prompt-actions flex items-center gap-2 p-3"
          data-tour="copy-actions"
        >
          <Popover open={optionsOpen} onOpenChange={setOptionsOpen}>
            <Hint label="Include in output" side="top">
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="prompt-options-trigger"
                  aria-label="Include in output"
                  data-tour="include-output"
                  data-active={optionsOpen || undefined}
                >
                  <SlidersHorizontal size={14} aria-hidden="true" />
                </button>
              </PopoverTrigger>
            </Hint>
            <PopoverContent
              side="top"
              align="start"
              className="prompt-options-menu"
              aria-label="Include in output"
            >
              <p className="prompt-options-title">Include in output</p>
              {Object.entries(d.promptOptions).map(([k, v]) => (
                <label key={k}>
                  <input
                    type="checkbox"
                    checked={!!v}
                    onChange={(e) =>
                      s.mutate((x) => {
                        x.promptOptions[k as keyof typeof x.promptOptions] =
                          e.target.checked;
                      }, false)
                    }
                  />
                  {k.replace(/([A-Z])/g, " $1")}
                </label>
              ))}
            </PopoverContent>
          </Popover>
          {toolButton}
          <Button
            variant="outline"
            className="prompt-edit-button"
            onClick={() => {
              if (editing) finishEditing();
              else setEditing(true);
            }}
          >
            {editing ? <Check size={12} /> : <Pencil size={12} />}
            {editing ? "Done" : `Edit ${noun}`}
          </Button>
          <Button className="prompt-copy-button" onClick={requestCopy}>
            <Clipboard size={12} />
            {copied ? "Copied" : `Copy ${noun}`}
          </Button>
        </div>
        {copyWarnings && (
          <div
            className="dialog-backdrop"
            onMouseDown={() => setCopyWarnings(null)}
          >
            <div
              className="dialog-panel"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold">Before you copy</h2>
              <ul className="copy-warning-list">
                {copyWarnings.map((w) => (
                  <li key={w.key} className="copy-warning-item">
                    <AlertTriangle size={13} />
                    <span>{w.message}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setCopyWarnings(null)}>
                  Go back
                </Button>
                <Button
                  onClick={() => {
                    setCopyWarnings(null);
                    doCopy();
                  }}
                >
                  Copy anyway
                </Button>
              </div>
            </div>
          </div>
        )}
        {!isSkill && (
          <ToolPickerDialog
            open={toolPicker}
            onOpenChange={(open) => {
              if (!open) setToolPicker(false);
            }}
            returnFocusRef={toolOpenerRef}
            fallbackFocusRef={toolButtonRef}
          />
        )}
      </div>
    </>
  );
}

function Preview({ close }: { close: () => void }) {
  const d = useEditorStore((s) => s.doc);
  if (!d) return null;
  const scale = Math.min(
    (innerWidth - 120) / d.format.width,
    (innerHeight - 120) / d.format.height,
  );
  return (
    <div className="preview-overlay">
      <Hint label="Close" side="left">
        <Button
          aria-label="Close preview"
          size="icon"
          variant="secondary"
          className="absolute right-5 top-5"
          onClick={close}
        >
          <X />
        </Button>
      </Hint>
      <div
        style={{
          width: d.format.width,
          height: d.format.height,
          transform: `scale(${scale})`,
        }}
      >
        <StaticArtboard />
      </div>
    </div>
  );
}

function StaticArtboard({
  exportRef,
}: {
  exportRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const d = useEditorStore((s) => s.doc);
  if (!d) return null;
  return <StaticDocument doc={d} exportRef={exportRef} />;
}

function ExportDialog({ close }: { close: () => void }) {
  const d = useEditorStore((s) => s.doc);
  const brandKits = useEditorStore((s) => s.brandKits);
  const ref = useRef<HTMLDivElement>(null);
  if (!d) return null;
  const save = (blob: Blob, name: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const json = () =>
    save(
      new Blob([JSON.stringify(buildJsonExport(d), null, 2)], {
        type: "application/json",
      }),
      `${d.name}.json`,
    );
  const markdown = () => {
    const kit = brandKits.find((k) => k.id === d.creativeDirection.brandKitId);
    // A hand-edited DESIGN.md wins over the generated one.
    const text = d.designEdit ?? compileDesignSkill(d, kit);
    save(new Blob([text], { type: "text/markdown" }), "DESIGN.md");
  };
  const png = async () => {
    if (!ref.current) return;
    try {
      // Loaded on demand so the editor opens without the export library.
      const { toPng } = await import("html-to-image");
      const url = await toPng(ref.current, {
        width: d.format.width,
        height: d.format.height,
        pixelRatio: 1,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${d.name}.png`;
      a.click();
    } catch {
      toast.error("Couldn't export PNG", {
        description: "Check your connection and try again.",
      });
    }
  };
  return (
    <div className="dialog-backdrop" onMouseDown={close}>
      <div className="dialog-panel" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">Export composition</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Download the reusable design skill, the source of truth or a clean
          target-size render.
        </p>
        <div className="mt-6 grid gap-2">
          <Button onClick={markdown}>
            <FileText />
            Download DESIGN.md
          </Button>
          <Button variant="secondary" onClick={json}>
            <Download />
            Download JSON
          </Button>
          <Button variant="secondary" onClick={png}>
            <Image />
            Download PNG
          </Button>
        </div>
        <div className="pointer-events-none fixed -left-[10000px] top-0">
          <StaticArtboard exportRef={ref} />
        </div>
      </div>
    </div>
  );
}

function useShortcuts(preview: () => void) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const s = useEditorStore.getState();
      const t = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) ||
        t.isContentEditable
      )
        return;
      if (t.closest?.('[role="dialog"], [role="alertdialog"]')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        s.duplicate();
      } else if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) s.ungroup();
        else s.group();
      } else if (e.key === "Delete" || e.key === "Backspace")
        s.deleteSelected();
      else if (e.key.toLowerCase() === "v") s.setTool("select");
      else if (e.key.toLowerCase() === "h") s.setTool("hand");
      else if (e.key.toLowerCase() === "p") preview();
      else if (e.key === "Escape") s.select();
      else if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
      ) {
        e.preventDefault();
        const n = e.shiftKey ? 8 : 1;
        s.mutate((d) =>
          d.elements.forEach((el) => {
            if (!s.selectedIds.includes(el.id) || el.locked) return;
            if (e.key === "ArrowLeft") el.x -= n;
            if (e.key === "ArrowRight") el.x += n;
            if (e.key === "ArrowUp") el.y -= n;
            if (e.key === "ArrowDown") el.y += n;
          }),
        );
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [preview]);
}
