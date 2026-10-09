import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ArrowDownAZ,
  ArrowRight,
  Clock3,
  Check,
  Compass,
  Copy,
  Download,
  Upload,
  FilePlus2,
  Folder,
  Gem,
  Grid2X2,
  Images,
  LayoutTemplate,
  Menu,
  Palette,
  Plug,
  Plus,
  Search,
  Shuffle,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Hint } from "@/components/ui/tooltip";
import { MediaSkeleton } from "@/components/media-skeleton";
import { FormatGrid, PlatformFilterBar } from "./format-gallery";
import { formats, platforms, type PlatformFilter } from "./formats";
import {
  createDocument,
  starterTemplates,
  cloneTemplate,
  templateCategoryKeys,
  matchesTemplateQuery,
  type TemplateCategory,
} from "./templates";
import { getNextProjectName, saveProject } from "./persistence";
import { createProjectBackup, importProjectBackup } from "./project-backup";
import { projectsQueryOptions, useRemoveProject } from "./queries";
import { reportStorageError } from "./storage/errors";
import type { Format, SpecDocument } from "./types";
import { BrandKitPanel } from "./brand-kit-panel";
import { DocumentPreview } from "./static-render";
import { TemplateCardMedia } from "./template-card-media";
import { templateImageFor } from "./template-images";
import { findImageStyle } from "./image-styles";
import { useEditorStore } from "./store";
import {
  compileDesignSkill,
  compileDesignSkillSegments,
  DESIGN_SKILL_HEADER,
  DESIGN_SKILL_SECTIONS,
} from "./design-md";
import { DesignMarkdown } from "./design-md-view";
import { DesignEditorSections, type DesignPart } from "./design-editor-cards";
import {
  compilePromptEditorOutput,
  segText,
  validateExternalToolRequirement,
} from "./compiler";
import {
  CreativeRemixComingSoonSplash,
  McpComingSoonSplash,
} from "./coming-soon-lazy";
import { QuickGuide } from "./quick-guide-lazy";

/** Saves a new document, then opens it in the editor. */
function useOpenNewProject() {
  const navigate = useNavigate();
  return async (document: SpecDocument) => {
    try {
      await saveProject(document);
      navigate({
        to: "/design/$projectId",
        params: { projectId: document.id },
      });
    } catch (error) {
      reportStorageError(error, "create-project");
    }
  };
}

/** Resolves a fresh "Untitled design N" against the stored projects. */
function useNextProjectName() {
  const queryClient = useQueryClient();
  return async () =>
    getNextProjectName(
      await queryClient.ensureQueryData(projectsQueryOptions()),
    );
}

function Mark() {
  return <AppIcon className="h-8 w-8" />;
}

export function DiscoveryShell({
  children,
  tourPage = "home",
}: {
  children: React.ReactNode;
  tourPage?: "home" | "brand-kit";
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState<"mcp" | "remix" | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen text-foreground md:grid md:grid-cols-[268px_minmax(0,1fr)]">
        <aside className="discovery-sidebar">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex min-w-0 items-center gap-3 font-bold">
              <Mark />
              <span>Spec Composer</span>
              <span className="sidebar-soon-badge shrink-0">Beta</span>
            </Link>
            <ThemeToggle />
          </div>
          <button
            type="button"
            className="sidebar-create"
            data-tour="create"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} />
            <span>
              <b>Create a design</b>
              <small>Preset or custom size</small>
            </span>
          </button>
          <nav className="sidebar-navigation" aria-label="Main navigation">
            <span className="sidebar-nav-label">Workspace</span>
            <Nav to="/" icon={<Sparkles />}>
              For you
            </Nav>
            <Nav to="/templates" icon={<LayoutTemplate />}>
              Templates
              <span className="sidebar-soon-badge ml-auto">Beta</span>
            </Nav>
            <Nav to="/prompt-gallery" icon={<Images />}>
              Prompt gallery
            </Nav>
            <button
              type="button"
              className={cn(navLinkClass, "w-full text-left")}
              onClick={() => setComingSoon("remix")}
            >
              <Shuffle />
              Creative Remix
              <span className="sidebar-soon-badge ml-auto">Soon</span>
            </button>
            <Nav to="/projects" icon={<Folder />}>
              My designs
            </Nav>
            <span className="sidebar-nav-label sidebar-nav-label--brand">
              Brand assets
            </span>
            <BrandKitSidebarLink />
          </nav>
          <button
            type="button"
            className="sidebar-brandkit-card sidebar-tour-card"
            onClick={() => setGuideOpen(true)}
          >
            <span className="sidebar-brandkit-icon" aria-hidden="true">
              <Compass />
            </span>
            <span className="sidebar-brandkit-copy">
              <b>Quick tour</b>
              <small>Learn the basics in a minute</small>
            </span>
          </button>
          <button
            type="button"
            className="sidebar-brandkit-card sidebar-mcp-card"
            onClick={() => setComingSoon("mcp")}
          >
            <span className="sidebar-brandkit-icon" aria-hidden="true">
              <Plug />
            </span>
            <span className="sidebar-brandkit-copy">
              <b>Connect via MCP</b>
              <small>Use your designs in any AI</small>
            </span>
            <span className="sidebar-soon-badge">Soon</span>
          </button>
        </aside>
        <main className="discovery-main min-w-0">
          <div className="mobile-discovery-bar">
            <Link
              to="/"
              className="mobile-discovery-brand flex min-w-0 items-center gap-2 font-bold"
            >
              <Mark />
              <span>Spec Composer</span>
            </Link>
            <div className="mobile-discovery-actions flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="mobile-create-button"
                onClick={() => {
                  setMenuOpen(false);
                  setCreateOpen(true);
                }}
                aria-label="Create a design"
              >
                <Plus size={15} />
                Create
              </button>
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="mobile-menu-button"
                    aria-label="Open navigation menu"
                  >
                    <Menu size={20} aria-hidden="true" />
                    <span>Menu</span>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="mobile-discovery-menu"
                  aria-describedby={undefined}
                >
                  <SheetTitle>Workspace</SheetTitle>
                  <nav
                    className="sidebar-navigation"
                    aria-label="Mobile navigation"
                  >
                    <Nav
                      to="/"
                      icon={<Sparkles />}
                      onClick={() => setMenuOpen(false)}
                    >
                      Home
                    </Nav>
                    <Nav
                      to="/templates"
                      icon={<LayoutTemplate />}
                      onClick={() => setMenuOpen(false)}
                    >
                      Templates
                    </Nav>
                    <Nav
                      to="/prompt-gallery"
                      icon={<Images />}
                      onClick={() => setMenuOpen(false)}
                    >
                      Prompt gallery
                    </Nav>
                    <Nav
                      to="/projects"
                      icon={<Folder />}
                      onClick={() => setMenuOpen(false)}
                    >
                      My designs
                    </Nav>
                    <Nav
                      to="/design-kit"
                      icon={<Gem />}
                      onClick={() => setMenuOpen(false)}
                    >
                      Design kits
                    </Nav>
                    <button
                      type="button"
                      className={navLinkClass}
                      onClick={() => {
                        setMenuOpen(false);
                        setGuideOpen(true);
                      }}
                    >
                      <Compass />
                      Quick tour
                    </button>
                    <button
                      type="button"
                      className={navLinkClass}
                      onClick={() => {
                        setMenuOpen(false);
                        setComingSoon("remix");
                      }}
                    >
                      <Shuffle />
                      Creative Remix
                      <span className="sidebar-soon-badge ml-auto">Soon</span>
                    </button>
                    <button
                      type="button"
                      className={navLinkClass}
                      onClick={() => {
                        setMenuOpen(false);
                        setComingSoon("mcp");
                      }}
                    >
                      <Plug />
                      Connect via MCP
                      <span className="sidebar-soon-badge ml-auto">Soon</span>
                    </button>
                  </nav>
                  <div className="mobile-menu-theme">
                    <span>Appearance</span>
                    <ThemeToggle />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          {children}
          <footer className="discovery-footer">
            <Link to="/legal">Legal &amp; credits</Link>
          </footer>
        </main>
      </div>
      {createOpen ? (
        <CreationDialog close={() => setCreateOpen(false)} />
      ) : null}
      {comingSoon === "mcp" ? (
        <McpComingSoonSplash close={() => setComingSoon(null)} />
      ) : comingSoon === "remix" ? (
        <CreativeRemixComingSoonSplash close={() => setComingSoon(null)} />
      ) : null}
      {guideOpen ? (
        <QuickGuide page={tourPage} close={() => setGuideOpen(false)} />
      ) : null}
    </>
  );
}

function colorPaint(color: {
  type: "solid" | "gradient";
  hex: string;
  secondaryHex?: string;
  angle: number;
}) {
  return color.type === "gradient"
    ? `linear-gradient(${color.angle}deg, ${color.hex}, ${color.secondaryHex ?? color.hex})`
    : color.hex;
}

function BrandKitSidebarLink() {
  const brandKits = useEditorStore((state) => state.brandKits);
  const defaultBrandKitId = useEditorStore((state) => state.defaultBrandKitId);
  const globalKit = brandKits.find((kit) => kit.id === defaultBrandKitId);

  return (
    <Link
      to="/design-kit"
      activeProps={{ className: "active" }}
      className="sidebar-brandkit-card"
      data-tour="design-kit"
    >
      <span className="sidebar-brandkit-icon" aria-hidden="true">
        <Gem />
      </span>
      <span className="sidebar-brandkit-copy">
        <b>Design kits</b>
        <small>{globalKit?.name ?? "Build your identity"}</small>
      </span>
      {globalKit ? (
        <span
          className="sidebar-brandkit-swatches"
          aria-label="Default design kit selected"
        >
          {globalKit.colors.slice(0, 3).map((color) => (
            <i key={color.id} style={{ background: colorPaint(color) }} />
          ))}
          {!globalKit.colors.length ? <i /> : null}
        </span>
      ) : (
        <ArrowRight className="sidebar-brandkit-arrow" aria-hidden="true" />
      )}
    </Link>
  );
}

const navLinkClass =
  "sidebar-nav-link flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors [&_svg]:h-4 [&_svg]:w-4";

function Nav({
  to,
  icon,
  children,
  onClick,
}: {
  to: "/" | "/templates" | "/projects" | "/design-kit" | "/prompt-gallery";
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeProps={{
        className: "sidebar-nav-active font-bold",
      }}
      className={navLinkClass}
    >
      {icon}
      {children}
    </Link>
  );
}

export function BrandKitsPage() {
  const brandKits = useEditorStore((state) => state.brandKits);
  const defaultBrandKitId = useEditorStore((state) => state.defaultBrandKitId);
  const globalKit = brandKits.find((kit) => kit.id === defaultBrandKitId);

  return (
    <DiscoveryShell tourPage="brand-kit">
      <div className="discovery-content library-page brandkit-page">
        <header className="library-hero brandkit-page-hero">
          <div className="library-hero-copy">
            <span className="library-hero-kicker">
              <Palette /> Design system
            </span>
            <h1>Your style, in every design.</h1>
            <p>
              Bring your colors, typography, creative style, and mood together
              in a design kit. Make it the default for new posters.
            </p>
          </div>

          <div
            className="brandkit-hero-preview"
            data-tour="kit-default"
            aria-label="Default design kit for designs"
          >
            <div className="brandkit-preview-topline">
              <span>Default for designs</span>
              <i className={globalKit ? "is-live" : undefined} />
            </div>
            <strong>{globalKit?.name ?? "No default kit yet"}</strong>
            <span className="brandkit-preview-font">
              {globalKit?.typography ?? "Choose your signature type"}
            </span>
            <div className="brandkit-preview-palette" aria-hidden="true">
              {(globalKit?.colors.length
                ? globalKit.colors.slice(0, 5)
                : [
                    {
                      id: "a",
                      type: "solid" as const,
                      hex: "#C55454",
                      angle: 0,
                    },
                    {
                      id: "b",
                      type: "solid" as const,
                      hex: "#141413",
                      angle: 0,
                    },
                    {
                      id: "c",
                      type: "solid" as const,
                      hex: "#EFE9DE",
                      angle: 0,
                    },
                  ]
              ).map((color) => (
                <i key={color.id} style={{ background: colorPaint(color) }} />
              ))}
            </div>
            <div className="brandkit-preview-meta">
              <span>{globalKit?.style ?? "Creative style"}</span>
              <span>{globalKit?.emotions[0] ?? "Brand mood"}</span>
            </div>
          </div>
        </header>

        <section id="brand-library" className="brandkit-library-section">
          <div className="library-section-heading">
            <div>
              <span>Your library</span>
              <h2>Design kits</h2>
              <p>
                Create, edit, and choose the identity used across your work.
              </p>
            </div>
            <span className="library-count">
              {brandKits.length} {brandKits.length === 1 ? "kit" : "kits"}
            </span>
          </div>
          <BrandKitPanel standalone pageView />
        </section>
      </div>
    </DiscoveryShell>
  );
}

function matchesQuery(format: Format, query: string) {
  if (!query) return true;
  const haystack = [
    format.label,
    format.category,
    format.platform,
    format.type,
    format.usage,
    format.animated ? "animated motion" : "static",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

const FEATURED_COUNT = 8;
/** Cards above the fold on /templates load eagerly with high fetch priority. */
const TEMPLATE_PRIORITY_COUNT = 5;

/** A random handful of starters, one per category where possible. */
function pickFeaturedTemplates() {
  const pool = [...starterTemplates];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const seen = new Set<string>();
  const varied = pool.filter(
    (template) => !seen.has(template.category) && seen.add(template.category),
  );
  const rest = pool.filter((template) => !varied.includes(template));
  return [...varied, ...rest].slice(0, FEATURED_COUNT);
}

/**
 * Shuffles on the client after hydration, so the server markup stays
 * deterministic; the strip stays hidden until the pick lands.
 */
function useFeaturedTemplates() {
  const [picked, setPicked] = useState<typeof starterTemplates | null>(null);
  useEffect(() => setPicked(pickFeaturedTemplates()), []);
  return {
    ready: picked !== null,
    templates: picked ?? starterTemplates.slice(0, FEATURED_COUNT),
  };
}

export function HomePage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<PlatformFilter>("Popular");
  const [query, setQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const { data: projects = [], isPending: projectsPending } = useQuery(
    projectsQueryOptions(),
  );
  const recent = projects.slice(0, 5);
  const featured = useFeaturedTemplates();
  const openNewProject = useOpenNewProject();
  const nextProjectName = useNextProjectName();

  const createFromPreset = async (format: Format) => {
    const document = createDocument(format);
    document.name = await nextProjectName();
    await openNewProject(document);
  };

  const shown = useMemo(() => {
    const searchingAll = platform === "Popular" && query.trim().length > 0;
    const matchingFormats = formats.filter((format) => {
      const inPlatform =
        searchingAll ||
        (platform === "Popular"
          ? format.popular
          : format.category === platform && format.listedInPlatform !== false);
      return inPlatform && matchesQuery(format, query);
    });

    return platform === "Popular" && !query.trim()
      ? matchingFormats.slice(0, 6)
      : matchingFormats;
  }, [platform, query]);

  const heading = query.trim() ? "Search results" : platform;

  return (
    <DiscoveryShell>
      <div className="discovery-content home-page-content">
        <HomeHero onCreate={() => setCustomOpen(true)} />

        <label className="discovery-search">
          <Search className="h-5 w-5" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search formats, platforms, stories, ads…"
            aria-label="Search design formats"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          ) : (
            <span className="search-hint">Try “story” or “LinkedIn”</span>
          )}
        </label>

        <PlatformFilterBar
          platforms={platforms}
          value={platform}
          onChange={setPlatform}
        />

        <section
          className="format-section"
          data-tour="formats"
          aria-labelledby="format-section-title"
        >
          <div className="section-heading">
            <h2 id="format-section-title">{heading}</h2>
            <span>
              {shown.length} {shown.length === 1 ? "format" : "formats"}
            </span>
          </div>
          {shown.length ? (
            <FormatGrid
              formats={shown}
              onSelect={createFromPreset}
              onCreateCustom={() => setCustomOpen(true)}
            />
          ) : (
            <div className="empty-gallery">
              <Search size={22} />
              <span>No matching formats</span>
              <p>Try another search or choose a different platform.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setPlatform("Popular");
                }}
              >
                View popular formats
              </Button>
            </div>
          )}
        </section>

        <section
          className="discovery-secondary-section recent-showcase"
          aria-labelledby="recent-section-title"
        >
          <div className="section-heading showcase-heading">
            <div className="section-heading-copy">
              <span className="section-kicker">Your workspace</span>
              <h2 id="recent-section-title">Recent designs</h2>
              <p>Pick up where you left off.</p>
            </div>
            <Link to="/projects" className="section-link">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {projectsPending ? (
            <div
              className="template-strip template-strip--recent"
              role="status"
              aria-busy="true"
            >
              <span className="sr-only">Loading recent designs</span>
              {[0, 1, 2].map((index) => (
                <div key={index} className="template-card-skeleton">
                  <div className="template-preview">
                    <MediaSkeleton />
                  </div>
                  <MediaSkeleton className="media-skeleton--line" />
                </div>
              ))}
            </div>
          ) : recent.length ? (
            <div className="template-strip template-strip--recent">
              {recent.map((document) => (
                <TemplateCard key={document.id} doc={document} existing />
              ))}
            </div>
          ) : (
            <div className="empty-band">
              <span>No recent designs yet</span>
              <p>Your work is saved automatically in this browser.</p>
            </div>
          )}
        </section>

        <section
          className="discovery-secondary-section template-showcase"
          data-tour="templates"
          aria-labelledby="template-section-title"
        >
          <div className="section-heading showcase-heading">
            <div className="section-heading-copy">
              <span className="section-kicker">Curated starters</span>
              <h2 id="template-section-title">
                Start from a template
                <span className="beta-chip">Beta</span>
              </h2>
              <p>Choose a direction, then make every detail your own.</p>
            </div>
            <Link to="/templates" className="section-link">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div
            className="template-strip template-strip--starters"
            data-ready={featured.ready ? "" : undefined}
          >
            {featured.templates.map((template) => (
              <TemplateCard
                key={template.name}
                doc={template.document}
                category={template.category}
              />
            ))}
          </div>
        </section>

        <section
          id="design-kit"
          className="discovery-secondary-section brandkit-showcase scroll-mt-8 pb-10"
          aria-labelledby="design-kit-section-title"
        >
          <div className="section-heading showcase-heading">
            <div className="section-heading-copy">
              <span className="section-kicker">Reusable identity</span>
              <h2 id="design-kit-section-title">Design kit</h2>
              <p>
                Save colors, typography, style, and emotion for every design.
              </p>
            </div>
          </div>
          <BrandKitPanel standalone />
        </section>
      </div>
      {customOpen ? (
        <CreationDialog close={() => setCustomOpen(false)} />
      ) : null}
    </DiscoveryShell>
  );
}

function HomeHero({ onCreate }: { onCreate: () => void }) {
  const previews = useMemo(
    () =>
      starterTemplates.flatMap((template) => {
        const image = templateImageFor(template.name);
        return image?.status === "approved"
          ? [{ doc: template.document, image }]
          : [];
      }),
    [],
  );
  const [preview, setPreview] = useState(
    () =>
      previews.find((item) => item.doc.name === "Product Launch") ??
      previews[0],
  );
  const selectedOnMount = useRef(false);
  useEffect(() => {
    if (selectedOnMount.current || !previews.length) return;
    selectedOnMount.current = true;
    try {
      const storageKey = "spec-composer:home-hero-template";
      const previous = sessionStorage.getItem(storageKey);
      const choices = previews.filter((item) => item.doc.name !== previous);
      const chosen =
        choices[Math.floor(Math.random() * choices.length)] ?? previews[0];
      if (chosen) {
        setPreview(chosen);
        sessionStorage.setItem(storageKey, chosen.doc.name);
      }
    } catch {
      // The deterministic first preview remains valid when storage is unavailable.
    }
  }, [previews]);
  const parts = useMemo<DesignPart[]>(
    () =>
      preview
        ? compileDesignSkillSegments(preview.doc)
            .filter((line) =>
              [
                "skill:title",
                "skill:tagline",
                "skill:theme",
                "skill:colors",
                "skill:type",
                "skill:spacing",
              ].includes(line.key),
            )
            .map((line) => {
              const text = segText(line.segs);
              return {
                key: line.key,
                tag:
                  DESIGN_SKILL_HEADER[line.key] ??
                  DESIGN_SKILL_SECTIONS[line.key] ??
                  line.key,
                text,
                editing: false,
                actions: null,
                body: <DesignMarkdown text={text} />,
              };
            })
        : [],
    [preview],
  );
  const designerFrame = useRef<HTMLDivElement>(null);
  const designerPanel = useRef<HTMLDivElement>(null);
  const [designerFit, setDesignerFit] = useState({ scale: 0, height: 0 });
  useEffect(() => {
    const frame = designerFrame.current;
    const panel = designerPanel.current;
    if (!frame || !panel) return;
    const fit = () => {
      if (!panel.offsetWidth || !panel.offsetHeight) return;
      const maxHeight = parseFloat(
        getComputedStyle(frame).getPropertyValue("--hero-designer-max-height"),
      );
      const scale = Math.min(
        frame.clientWidth / panel.offsetWidth,
        maxHeight / panel.offsetHeight,
      );
      const height = panel.offsetHeight * scale;
      setDesignerFit((current) =>
        current.scale === scale && current.height === height
          ? current
          : { scale, height },
      );
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [preview]);
  if (!preview) return null;
  return (
    <section
      className="home-hero"
      aria-labelledby="home-hero-title"
      data-hero-template={preview.doc.name}
    >
      <div className="home-hero-decoration" aria-hidden="true">
        <div className="home-hero-landscape-fade">
          <div className="home-hero-landscape" />
        </div>
        <div className="home-hero-fern home-hero-fern--left" />
        <div className="home-hero-fern home-hero-fern--right" />
      </div>
      <div className="home-hero-copy">
        <p className="home-hero-eyebrow">
          FROM CANVAS TO CREATIVE INTELLIGENCE
        </p>
        <h1 id="home-hero-title">
          Design visually.
          <span>From idea to AI image.</span>
        </h1>
        <p className="home-hero-description">
          Draw or drop a visual idea, get a structured specification, and
          generate production-ready images with AI &mdash; all in one place.
        </p>
        <div className="home-hero-actions">
          <button type="button" onClick={onCreate}>
            <Plus size={17} aria-hidden="true" /> Create a design
          </button>
          <a href="#format-section-title">
            Explore templates <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="home-hero-art" aria-hidden="true" inert>
        <svg
          className="home-hero-flow"
          viewBox="0 0 600 244"
          fill="none"
          focusable="false"
        >
          <path d="M115 11c27-25 58-24 86-3m-12-2 14 4-4-13" />
          <path d="M325 239c35 28 70 27 105 7m-12-2 15-1-5 13" />
        </svg>
        <div
          className="home-hero-preview home-hero-preview--canvas"
          key={`canvas:${preview.doc.name}`}
        >
          <div className="home-hero-toolbar">
            <span className="home-hero-toolbar-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="home-hero-toolbar-tools">
              <Menu size={10} />
              <Plus size={10} />
              <ArrowLeftRight size={10} />
            </span>
          </div>
          <div className="home-hero-canvas-stage">
            <DocumentPreview doc={preview.doc} />
            <span className="home-hero-selection">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
        <div
          className="home-hero-preview home-hero-preview--spec"
          key={`spec:${preview.doc.name}`}
        >
          <div
            className="home-hero-spec-viewport"
            ref={designerFrame}
            style={{ height: designerFit.height }}
          >
            <div
              className="home-hero-designer"
              ref={designerPanel}
              style={{
                transform: `scale(${designerFit.scale})`,
                visibility: designerFit.scale ? "visible" : "hidden",
              }}
            >
              <DesignEditorSections parts={parts} doc={preview.doc} />
            </div>
          </div>
        </div>
        <div
          className="home-hero-preview home-hero-preview--image"
          key={`image:${preview.doc.name}`}
        >
          <img
            src={preview.image.src}
            alt=""
            width={preview.image.width}
            height={preview.image.height}
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}

function TemplateStyleChip({ style }: { style: string | undefined }) {
  const label = findImageStyle(style)?.label;
  return label ? <span className="template-style-chip">{label}</span> : null;
}

function TemplateCard({
  doc,
  category,
  existing = false,
  priority = false,
}: {
  doc: SpecDocument;
  category?: string;
  existing?: boolean;
  priority?: boolean;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const openNewProject = useOpenNewProject();
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);
  const copyDesign = async () => {
    if (copying) return;
    if (doc.promptMode === "visual_prompt") {
      const error = validateExternalToolRequirement(
        doc.externalToolRequirement,
      );
      if (error) {
        toast.error(error.message, {
          description:
            "Open the design to complete its external tool settings.",
        });
        return;
      }
    }
    setCopying(true);
    try {
      const kit = useEditorStore
        .getState()
        .brandKits.find((item) => item.id === doc.creativeDirection.brandKitId);
      const text =
        doc.promptMode === "design_skill"
          ? (doc.designEdit ?? compileDesignSkill(doc, kit))
          : compilePromptEditorOutput(doc);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Design copied", {
        description:
          doc.promptMode === "design_skill"
            ? "DESIGN.md is ready to paste."
            : "The design prompt is ready to paste.",
      });
    } catch {
      toast.error("Couldn't copy design", {
        description: "Allow clipboard access in your browser and try again.",
      });
    } finally {
      setCopying(false);
    }
  };
  // Opening a card leads to the editor, so fetch its code before the click.
  const warmEditor = () => {
    router
      .loadRouteChunk(router.routesById["/design/$projectId"])
      ?.catch(() => {});
  };
  const open = () => {
    if (existing) {
      navigate({ to: "/design/$projectId", params: { projectId: doc.id } });
      return;
    }
    void openNewProject(cloneTemplate(doc.name, doc.format.id));
  };
  const { primaryColor, secondaryColor } = doc.creativeDirection;
  const swatches = [
    ...(doc.background.type === "solid" ? [doc.background.value] : []),
    primaryColor,
    secondaryColor,
  ];

  return (
    <div
      className={`template-card template-card--actions template-card--${existing ? "recent" : "starter"} group w-full text-left`}
      onPointerEnter={warmEditor}
      onFocus={warmEditor}
    >
      {!existing && (
        <div className="template-card-style-row">
          <TemplateStyleChip style={doc.imageStyle} />
        </div>
      )}
      <div className="template-preview">
        <button
          type="button"
          className="template-preview-media template-preview-open"
          onClick={open}
          tabIndex={-1}
          aria-label={`${existing ? "Open" : "Use"} ${doc.name}`}
        >
          <TemplateCardMedia
            doc={doc}
            image={existing ? undefined : templateImageFor(doc.name)}
            priority={priority}
          />
        </button>
        {/* Revealed as the poster window morphs up on hover or focus. */}
        <div className="template-preview-reveal">
          <span className="template-preview-details" aria-hidden="true">
            <span className="template-preview-swatches">
              {swatches.map((color, index) => (
                <i key={index} style={{ background: color }} />
              ))}
            </span>
            <span className="template-preview-format">
              {doc.format.width} × {doc.format.height}
            </span>
          </span>
          <div className="template-preview-actions">
            <button
              type="button"
              className="template-preview-action"
              onClick={open}
              aria-label={`${existing ? "Open" : "Use"} ${doc.name}`}
            >
              <span className="template-preview-action-label">
                {existing ? "Open design" : "Use template"}
              </span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="template-preview-action template-preview-copy"
              onClick={() => void copyDesign()}
              disabled={copying}
              aria-label={`Copy design: ${doc.name}`}
            >
              {copied ? (
                <Check size={14} aria-hidden="true" />
              ) : (
                <Copy size={14} aria-hidden="true" />
              )}
              <span className="template-preview-action-label">
                {copied ? "Copied" : copying ? "Copying…" : "Copy design"}
              </span>
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="template-card-copy w-full text-left"
        onClick={open}
        tabIndex={-1}
      >
        <span className="template-card-title">{doc.name}</span>
        <span className="template-card-meta">
          {existing
            ? `${doc.format.label} · ${doc.format.width} × ${doc.format.height}px`
            : (category ?? "Template")}
        </span>
      </button>
    </div>
  );
}

function CreationDialog({
  format,
  close,
}: {
  format?: Format;
  close: () => void;
}) {
  const openNewProject = useOpenNewProject();
  const nextProjectName = useNextProjectName();
  const { data: projects } = useQuery(projectsQueryOptions());
  const defaultProjectName = useMemo(
    () => getNextProjectName(projects ?? []),
    [projects],
  );
  // Undefined until the user edits it, so it follows the loaded default.
  const [editedName, setProjectName] = useState<string>();
  const projectName = editedName ?? defaultProjectName;
  const [sizeMode, setSizeMode] = useState<"preset" | "custom">("preset");
  const [presetId, setPresetId] = useState(
    () => format?.id ?? formats[0]?.id ?? "instagram-post",
  );
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const parsedWidth = Number(customWidth);
  const parsedHeight = Number(customHeight);
  const customSizeValid =
    Number.isInteger(parsedWidth) &&
    Number.isInteger(parsedHeight) &&
    parsedWidth >= 40 &&
    parsedWidth <= 8000 &&
    parsedHeight >= 40 &&
    parsedHeight <= 8000;
  const selectedPreset =
    formats.find((candidate) => candidate.id === presetId) ?? formats[0];
  const activeFormat = useMemo<Format | undefined>(() => {
    if (sizeMode === "preset") return selectedPreset;
    if (!customSizeValid) return undefined;
    return {
      id: `custom-${parsedWidth}x${parsedHeight}`,
      label: "Custom size",
      subtitle: "Custom",
      width: parsedWidth,
      height: parsedHeight,
      category: "Custom",
      platform: "generic",
      type: "post",
      usage: "custom canvas",
      previewVariant: "minimal",
    };
  }, [customSizeValid, parsedHeight, parsedWidth, selectedPreset, sizeMode]);
  // Previews are laid out at the chosen canvas size; defer so typing a custom
  // width stays responsive while the thumbnails catch up.
  const previewFormat = useDeferredValue(activeFormat);
  const compatibleTemplates = useMemo(() => {
    if (!previewFormat) return [];
    const targetRatio = previewFormat.width / previewFormat.height;
    return starterTemplates
      .filter((template) => {
        const templateRatio =
          template.document.format.width / template.document.format.height;
        return Math.abs(Math.log(targetRatio / templateRatio)) < 0.5;
      })
      .map((template) => ({
        name: template.name,
        category: template.category,
        document: createDocument(previewFormat, template.name, {
          brandKit: false,
        }),
      }));
  }, [previewFormat]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, [close]);

  const create = async (template?: string) => {
    if (!activeFormat) return;
    const document = template
      ? cloneTemplate(template, activeFormat)
      : createDocument(activeFormat);
    document.name = editedName?.trim() || (await nextProjectName());
    await openNewProject(document);
  };

  return (
    <div className="dialog-backdrop" onMouseDown={close} role="presentation">
      <div
        className="dialog-panel creation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="creation-dialog-header">
          <span className="creation-dialog-icon" aria-hidden="true">
            <FilePlus2 size={19} />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">New project</p>
            <h2 id="create-dialog-title">Create a design</h2>
            <p>
              {activeFormat
                ? `${activeFormat.label} · ${activeFormat.width} × ${activeFormat.height} px`
                : "Choose valid canvas dimensions"}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="creation-dialog-close"
            onClick={close}
            aria-label="Close dialog"
          >
            <X size={17} />
          </Button>
        </div>

        <div className="creation-dialog-body">
          <form
            className="creation-setup"
            onSubmit={(event) => {
              event.preventDefault();
              create();
            }}
          >
            <div>
              <span className="creation-step">01</span>
              <h3>Choose a canvas size</h3>
              <p>Use a ready-made format or enter exact dimensions.</p>
            </div>
            <div className="creation-size-toggle" aria-label="Canvas size type">
              <button
                type="button"
                aria-pressed={sizeMode === "preset"}
                onClick={() => setSizeMode("preset")}
              >
                Preset
              </button>
              <button
                type="button"
                aria-pressed={sizeMode === "custom"}
                onClick={() => setSizeMode("custom")}
              >
                Custom size
              </button>
            </div>
            {sizeMode === "preset" ? (
              <label className="creation-format-field">
                <span>Format</span>
                <select
                  value={presetId}
                  onChange={(event) => setPresetId(event.target.value)}
                >
                  {formats.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.label} — {candidate.width} × {candidate.height}{" "}
                      px
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="creation-custom-size">
                <label>
                  <span>Width</span>
                  <input
                    type="number"
                    min={40}
                    max={8000}
                    inputMode="numeric"
                    value={customWidth}
                    onChange={(event) => setCustomWidth(event.target.value)}
                    aria-label="Canvas width in pixels"
                  />
                </label>
                <span aria-hidden="true">×</span>
                <label>
                  <span>Height</span>
                  <input
                    type="number"
                    min={40}
                    max={8000}
                    inputMode="numeric"
                    value={customHeight}
                    onChange={(event) => setCustomHeight(event.target.value)}
                    aria-label="Canvas height in pixels"
                  />
                </label>
                <Hint label="Swap size">
                  <button
                    type="button"
                    className="creation-swap-size"
                    onClick={() => {
                      setCustomWidth(customHeight);
                      setCustomHeight(customWidth);
                    }}
                    aria-label="Swap width and height"
                  >
                    <ArrowLeftRight size={15} />
                  </button>
                </Hint>
              </div>
            )}
            {sizeMode === "custom" && !customSizeValid ? (
              <p className="creation-size-error" role="alert">
                Width and height must be whole numbers from 40 to 8,000 px.
              </p>
            ) : null}
            <div className="creation-project-heading">
              <span className="creation-step">02</span>
              <h3>Name your project</h3>
              <p>This name will appear in your recent designs.</p>
            </div>
            <label className="creation-name-field">
              <span>Project name</span>
              <input
                autoFocus
                maxLength={80}
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                onBlur={() => {
                  if (!projectName.trim()) setProjectName(defaultProjectName);
                }}
                placeholder={defaultProjectName}
                aria-describedby="project-name-hint"
              />
            </label>
            <p id="project-name-hint" className="creation-name-hint">
              Leave it blank to use {defaultProjectName}.
            </p>
            <Button
              type="submit"
              className="creation-blank-button"
              disabled={!activeFormat}
            >
              <span>
                <b>Start blank</b>
                <small>Build the composition from scratch</small>
              </span>
              <ArrowRight size={17} />
            </Button>
          </form>

          <section
            className="creation-starters"
            aria-labelledby="starter-title"
          >
            <div className="creation-starters-heading">
              <span className="creation-step">03</span>
              <div>
                <h3 id="starter-title">Or choose a starting point</h3>
                <p>Use a structured layout and customize every detail.</p>
              </div>
            </div>
            {compatibleTemplates.length ? (
              <div className="creation-template-grid">
                {compatibleTemplates.map((template) => (
                  <button
                    type="button"
                    key={template.name}
                    className="template-card creation-template-option"
                    aria-label={`Use ${template.name} template`}
                    onClick={() => create(template.name)}
                  >
                    <span className="template-card-style-row">
                      <TemplateStyleChip style={template.document.imageStyle} />
                    </span>
                    <span className="template-preview">
                      <span className="template-preview-media">
                        <TemplateCardMedia
                          doc={template.document}
                          image={
                            Math.abs(
                              Math.log(
                                template.document.format.width /
                                  template.document.format.height /
                                  0.8,
                              ),
                            ) < 0.02
                              ? templateImageFor(template.name)
                              : undefined
                          }
                        />
                      </span>
                      <span
                        className="template-preview-reveal"
                        aria-hidden="true"
                      >
                        <span className="template-preview-details">
                          <span className="template-preview-swatches">
                            {[
                              ...(template.document.background.type === "solid"
                                ? [template.document.background.value]
                                : []),
                              template.document.creativeDirection.primaryColor,
                              template.document.creativeDirection
                                .secondaryColor,
                            ].map((color, index) => (
                              <i key={index} style={{ background: color }} />
                            ))}
                          </span>
                          <span className="template-preview-format">
                            {template.document.format.width} ×{" "}
                            {template.document.format.height}
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
                      <span className="template-card-title">
                        {template.name}
                      </span>
                      <span className="template-card-meta">
                        {template.category}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="creation-no-templates">
                No compatible templates yet. Start blank and compose your own.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function TemplateCategoryFilterBar({
  value,
  onChange,
}: {
  value: TemplateCategory;
  onChange: (category: TemplateCategory) => void;
}) {
  return (
    <div className="platform-scroll" aria-label="Filter templates by category">
      {templateCategoryKeys.map((category) => (
        <button
          key={category}
          type="button"
          className="platform-chip"
          aria-pressed={value === category}
          onClick={() => onChange(category)}
        >
          <span>{category}</span>
        </button>
      ))}
    </div>
  );
}

export function TemplatesPage() {
  const [category, setCategory] = useState<TemplateCategory>("All");
  const [query, setQuery] = useState("");

  const shown = useMemo(
    () =>
      starterTemplates.filter((template) => {
        const inCategory = category === "All" || template.category === category;
        return (
          inCategory &&
          matchesTemplateQuery(template.name, template.category, query)
        );
      }),
    [category, query],
  );

  return (
    <DiscoveryShell>
      <div className="discovery-content">
        <p className="eyebrow">STRUCTURED STARTING POINTS</p>
        <h1 className="text-3xl font-extrabold md:text-4xl">Templates</h1>
        <p className="mt-2 text-muted-foreground">
          Previews are AI-rendered examples. Every template opens as editable
          semantic JSON.
        </p>

        <label className="discovery-search">
          <Search className="h-5 w-5" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates by name or category…"
            aria-label="Search templates"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          ) : (
            <span className="search-hint">Try "sale" or "events"</span>
          )}
        </label>

        <TemplateCategoryFilterBar value={category} onChange={setCategory} />

        <div className="section-heading">
          <span>
            {shown.length} {shown.length === 1 ? "template" : "templates"}
          </span>
        </div>

        {shown.length ? (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {shown.map((template, index) => (
              <TemplateCard
                key={template.name}
                doc={template.document}
                category={template.category}
                priority={index < TEMPLATE_PRIORITY_COUNT}
              />
            ))}
          </div>
        ) : (
          <div className="empty-gallery">
            <Search size={22} />
            <span>No matching templates</span>
            <p>Try another search or choose a different category.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              View all templates
            </Button>
          </div>
        )}
      </div>
    </DiscoveryShell>
  );
}

export function ProjectsPage() {
  const { data: projects = [], isPending } = useQuery(projectsQueryOptions());
  const queryClient = useQueryClient();
  const backupInput = useRef<HTMLInputElement>(null);
  const ready = !isPending;
  const removeProject = useRemoveProject();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"updated" | "name">("updated");
  const [pendingDelete, setPendingDelete] = useState<SpecDocument>();

  const shownProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...projects]
      .filter((project) => {
        if (!normalizedQuery) return true;
        return [project.name, project.format.label, project.format.platform]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [projects, query, sort]);

  const formatCount = new Set(projects.map((project) => project.format.id))
    .size;
  const latestProject = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];

  return (
    <DiscoveryShell>
      <div className="discovery-content library-page projects-page">
        <header className="library-hero projects-page-hero">
          <div className="library-hero-copy">
            <span className="library-hero-kicker">
              <Grid2X2 /> Your workspace
            </span>
            <h1>My designs</h1>
            <p>
              Pick up a work in progress, revisit a finished composition, or
              start something entirely new.
            </p>
            <Link to="/" className="library-hero-action">
              <Plus /> Create a design
            </Link>
          </div>
          <div className="projects-hero-summary" aria-label="Design summary">
            <span className="projects-summary-label">Workspace overview</span>
            <strong>{projects.length.toString().padStart(2, "0")}</strong>
            <span>saved designs</span>
            <div>
              <span>
                <Grid2X2 /> {formatCount} formats
              </span>
              <span>
                <Clock3 />{" "}
                {latestProject ? "Recently active" : "Ready to create"}
              </span>
            </div>
          </div>
        </header>

        <section
          className="projects-library"
          aria-labelledby="projects-library-title"
        >
          <div className="library-section-heading projects-heading">
            <div>
              <span>Saved in this browser</span>
              <h2 id="projects-library-title">All designs</h2>
            </div>
            <span className="library-count">{shownProjects.length} shown</span>
          </div>

          <div className="projects-toolbar">
            <Button
              variant="outline"
              type="button"
              onClick={async () => {
                try {
                  const content = await createProjectBackup();
                  const skipped = (
                    JSON.parse(content) as { skippedDamagedRecords: number }
                  ).skippedDamagedRecords;
                  if (skipped)
                    toast.warning(
                      `${skipped} damaged design(s) could not be included in this backup. They remain in browser storage.`,
                    );
                  const url = URL.createObjectURL(
                    new Blob([content], { type: "application/json" }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `spec-composer-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 60_000);
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Backup failed",
                  );
                }
              }}
            >
              <Download size={16} /> Back up designs
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => backupInput.current?.click()}
            >
              <Upload size={16} /> Restore backup
            </Button>
            <input
              ref={backupInput}
              type="file"
              accept="application/json,.json"
              hidden
              aria-label="Restore Spec Composer backup"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                try {
                  if (file.size > 100_000_000)
                    throw new Error("Backup exceeds 100 MB.");
                  const result = await importProjectBackup(await file.text());
                  await queryClient.invalidateQueries({
                    queryKey: ["projects"],
                  });
                  toast.success(
                    `Restored ${result.imported} designs${result.renamed ? ` (${result.renamed} renamed to avoid overwriting)` : ""}.`,
                  );
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Restore failed",
                  );
                }
              }}
            />
            <label className="projects-search">
              <Search aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search designs or formats"
                aria-label="Search designs"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X />
                </button>
              ) : null}
            </label>
            <label className="projects-sort">
              <ArrowDownAZ aria-hidden="true" />
              <span>Sort</span>
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as "updated" | "name")
                }
                aria-label="Sort designs"
              >
                <option value="updated">Last updated</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          {!ready ? (
            <div
              className="projects-loading-grid"
              role="status"
              aria-busy="true"
              aria-label="Loading designs"
            >
              <i>
                <MediaSkeleton />
              </i>
              <i>
                <MediaSkeleton />
              </i>
              <i>
                <MediaSkeleton />
              </i>
            </div>
          ) : shownProjects.length ? (
            <div className="project-library-grid">
              {shownProjects.map((document) => (
                <div key={document.id} className="project-library-card">
                  <TemplateCard doc={document} existing />
                  <button
                    type="button"
                    aria-label={`Delete ${document.name}`}
                    className="project-delete-button"
                    onClick={() => setPendingDelete(document)}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="projects-empty-state">
              <span className="projects-empty-icon">
                {projects.length ? <Search /> : <Grid2X2 />}
              </span>
              <b>
                {projects.length ? "No designs found" : "Your canvas is ready"}
              </b>
              <p>
                {projects.length
                  ? "Try another name or format."
                  : "Create your first design and it will appear here automatically."}
              </p>
              {projects.length ? (
                <Button variant="outline" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              ) : (
                <Link to="/" className="library-empty-action">
                  Explore formats <ArrowRight />
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This design is stored only in this browser. Deleting it cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep design</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!pendingDelete) return;
                removeProject.mutate(pendingDelete.id, {
                  onError: (error) =>
                    reportStorageError(error, "remove-project"),
                });
                setPendingDelete(undefined);
              }}
            >
              Delete design
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DiscoveryShell>
  );
}
