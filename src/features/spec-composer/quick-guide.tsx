import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import { QuickGuideSplash } from "./coming-soon";
import { arrowPath, placeCallout, type Rect } from "./quick-guide-layout";

type GuidePage = "editor" | "home" | "brand-kit";
type GuideStep = {
  target: string;
  title: string;
  body: string;
  section?: string;
};

const STEPS: Record<GuidePage, GuideStep[]> = {
  editor: [
    {
      target: "project",
      section: "Top bar",
      title: "Name your design",
      body: "Rename your design here; every change saves automatically in this browser.",
    },
    {
      target: "assets",
      section: "Left panel",
      title: "Add assets",
      body: "Search and add images, icons, shapes, text, and more from the asset library.",
    },
    {
      target: "rail-layers",
      section: "Left panel",
      title: "Layers",
      body: "Reorder, lock and group the layers of your design.",
    },
    {
      target: "rail-templates",
      section: "Left panel",
      title: "Templates",
      body: "Start over from a ready-made layout.",
    },
    {
      target: "rail-brandKit",
      section: "Left panel",
      title: "Design kit",
      body: "Manage the fonts, colors and brand mood your design uses.",
    },
    {
      target: "rail-resize",
      section: "Left panel",
      title: "Resize",
      body: "Change the design size to another format or a custom size.",
    },
    {
      target: "connect",
      section: "Left panel",
      title: "Connect (coming soon)",
      body: "Soon, AI tools like Claude and Cursor will read and compose your designs over MCP.",
    },
    {
      target: "canvas",
      section: "Canvas",
      title: "Edit the canvas",
      body: "Click any element to move, resize, or edit it directly on the canvas.",
    },
    {
      target: "canvas-tools",
      section: "Canvas",
      title: "Canvas tools",
      body: "Switch between select and hand, zoom or fit the canvas, and undo or redo.",
    },
    {
      target: "style",
      section: "Style dock",
      title: "Style dock",
      body: "Style the selected element's position, text and colors, or the background. Drag the title to move it.",
    },
    {
      target: "style-layout",
      section: "Style dock",
      title: "Layout",
      body: "Rearrange your design with one-click layouts, or tidy up the spacing.",
    },
    {
      target: "style-design-kit",
      section: "Style dock",
      title: "Design kit",
      body: "Apply a saved design kit's colors and type to this design.",
    },
    {
      target: "design-editor",
      section: "Output panel",
      title: "Design Editor",
      body: "A reusable DESIGN.md built from your design kit and layout. Click any section to fine-tune it.",
    },
    {
      target: "prompt-editor",
      section: "Output panel",
      title: "Prompt Editor",
      body: "A natural-language prompt for image models, with image style and purpose.",
    },
    {
      target: "chat",
      section: "Output panel",
      title: "Chat (coming soon)",
      body: "Soon you'll change your design by describing edits in plain words.",
    },
    {
      target: "include-output",
      section: "Output panel",
      title: "Include in output",
      body: "Choose which sections appear in the spec or prompt.",
    },
    {
      target: "copy-actions",
      section: "Output panel",
      title: "Edit and copy",
      body: "Edit the text by hand, then copy it into any AI tool.",
    },
    {
      target: "export",
      section: "Output panel",
      title: "Export",
      body: "Download your design as DESIGN.md, JSON or PNG.",
    },
    {
      target: "preview",
      section: "Top bar",
      title: "Preview",
      body: "See your design full-screen without editing guides (shortcut P).",
    },
  ],
  "brand-kit": [
    {
      target: "kit-default",
      title: "Default kit",
      body: "Every new design starts with this kit's colors, typeface, style and mood.",
    },
    {
      target: "kit-new",
      title: "New design kit",
      body: "Name a blank kit, then add your colors, typeface, style and mood.",
    },
    {
      target: "kit-generate",
      title: "Generate a kit from one color",
      body: "Enter a name and pick one seed color, then press Generate. You get a Material 3 kit with five matching colors (primary, secondary, background, text, accent) and Manrope type, ready to edit.",
    },
    {
      target: "kit-card",
      title: "Your design kits",
      body: "Each card previews a kit's palette, typeface, style and mood.",
    },
    {
      target: "kit-default-toggle",
      title: "Set as default",
      body: "Make this kit the default for new designs; click again to remove it.",
    },
    {
      target: "kit-palette",
      title: "Copy a color",
      body: "Click any swatch to copy its hex code.",
    },
    {
      target: "kit-edit",
      title: "Edit kit",
      body: "Change the name, creative style, typeface, colors and emotions, or delete the kit.",
    },
  ],
  home: [
    {
      target: "create",
      title: "Create a design",
      body: "Start from a preset size or set your own dimensions.",
    },
    {
      target: "formats",
      title: "Pick a format",
      body: "Search or filter by platform, then click a size to open it in the editor.",
    },
    {
      target: "templates",
      title: "Start from a template",
      body: "Choose a curated starter and make every detail your own.",
    },
    {
      target: "design-kit",
      title: "Set up a design kit",
      body: "Save colors, fonts and mood once and reuse them in every design.",
    },
  ],
};

export default function QuickGuide({
  page,
  close,
}: {
  page: GuidePage;
  close: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "tour">("intro");
  const openerRef = useRef(document.activeElement);
  useEffect(() => {
    const opener = openerRef.current;
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return phase === "intro" ? (
    <QuickGuideSplash
      page={page}
      start={() => setPhase("tour")}
      close={close}
    />
  ) : (
    <GuideTour steps={STEPS[page]} close={close} />
  );
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isFullyInView(rect: DOMRect) {
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

function GuideTour({
  steps: allSteps,
  close,
}: {
  steps: GuideStep[];
  close: () => void;
}) {
  const [resolvedSteps, setResolvedSteps] = useState<GuideStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardSize, setCardSize] = useState({ width: 300, height: 160 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const present = allSteps.filter((step) =>
        document.querySelector(`[data-tour="${step.target}"]`),
      );
      setResolvedSteps(present.length ? present : allSteps);
    });
    return () => cancelAnimationFrame(raf);
  }, [allSteps]);

  const steps = resolvedSteps ?? [];
  const step = steps[index];
  const isLast = steps.length > 0 && index === steps.length - 1;

  const goNext = () => {
    if (isLast) {
      close();
      return;
    }
    setIndex((i) => Math.min(i + 1, steps.length - 1));
  };
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  // Measure (and keep measuring) the current step's target.
  useLayoutEffect(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const target = document.querySelector<HTMLElement>(
      `[data-tour="${step.target}"]`,
    );
    if (!target) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-tour="${step.target}"]`,
      );
      if (!el) {
        setRect(null);
        return;
      }
      const bounds = el.getBoundingClientRect();
      setRect({
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      });
    };
    const initialBounds = target.getBoundingClientRect();
    if (!isFullyInView(initialBounds)) {
      target.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }
    measure();

    let raf: number | null = null;
    const schedule = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        measure();
      });
    };
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, {
      capture: true,
      passive: true,
    });
    const observer = new ResizeObserver(schedule);
    observer.observe(target);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, { capture: true });
      observer.disconnect();
    };
  }, [step]);

  // Measure the callout card itself so placement accounts for its real size.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => {
      const bounds = el.getBoundingClientRect();
      setCardSize({ width: bounds.width, height: bounds.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [step]);

  useEffect(() => {
    nextRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key === "Tab") {
        const buttons = Array.from(
          overlayRef.current?.querySelectorAll<HTMLButtonElement>(
            ".guide-bar button",
          ) ?? [],
        );
        if (!buttons.length) return;
        event.preventDefault();
        const active = document.activeElement;
        const at = buttons.indexOf(active as HTMLButtonElement);
        const next = event.shiftKey
          ? buttons[at <= 0 ? buttons.length - 1 : at - 1]
          : buttons[at === -1 || at === buttons.length - 1 ? 0 : at + 1];
        next?.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [close, index, steps.length]);

  if (!step) return null;

  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const placement = placeCallout(rect, cardSize, viewport);
  const cardRect: Rect = {
    top: placement.top,
    left: placement.left,
    width: cardSize.width,
    height: cardSize.height,
  };
  const showSpotlight = rect !== null;
  const showArrow = rect !== null && placement.side !== "center";

  return createPortal(
    <div
      ref={overlayRef}
      className="guide-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-step-title"
      aria-describedby="guide-step-body"
    >
      <div className="guide-blocker" />
      <div
        className={`guide-spotlight${showSpotlight ? "" : " guide-spotlight--full"}`}
        style={
          showSpotlight && rect
            ? {
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16,
              }
            : undefined
        }
      />
      {showArrow && rect && (
        <svg
          className="guide-arrow"
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        >
          <defs>
            <marker
              id="guide-arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
            </marker>
          </defs>
          <path
            d={arrowPath(cardRect, rect, placement.side)}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            markerEnd="url(#guide-arrowhead)"
          />
        </svg>
      )}
      <div
        ref={cardRef}
        className="guide-card"
        style={{ top: placement.top, left: placement.left }}
      >
        <div className="guide-card-head">
          <span className="guide-card-num">{index + 1}</span>
          {step.section && (
            <span className="guide-card-section">{step.section}</span>
          )}
        </div>
        <h2 id="guide-step-title">{step.title}</h2>
        <p id="guide-step-body">{step.body}</p>
      </div>
      <div className="guide-bar">
        <span className="guide-count" aria-live="polite">
          {index + 1} / {steps.length}
        </span>
        {steps.length <= 8 ? (
          <span className="guide-dots" aria-hidden="true">
            {steps.map((s, i) => (
              <i key={s.target} className={i === index ? "is-active" : ""} />
            ))}
          </span>
        ) : (
          <span className="guide-progress" aria-hidden="true">
            <i style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </span>
        )}
        {index > 0 && (
          <button
            type="button"
            className="guide-skip guide-back"
            onClick={goPrev}
          >
            Back
          </button>
        )}
        <button type="button" className="guide-skip" onClick={close}>
          Skip tour
        </button>
        <button
          ref={nextRef}
          type="button"
          className="guide-next"
          onClick={goNext}
        >
          {isLast ? "Done" : "Next"}
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
