import {
  Fragment,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  FileText,
  Lock,
  MessageSquare,
  Plug,
  Shuffle,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = { label: string; pane: ReactNode };
type SpecRow = {
  k: string;
  v?: string;
  swatches?: string[];
  locked?: boolean;
  changed?: boolean;
};

export function McpComingSoonSplash({ close }: { close: () => void }) {
  return (
    <ComingSoonSplash
      id="mcp"
      feature="MCP"
      title={
        <>
          Connect to <em>your AI</em>
        </>
      }
      body="With Model Context Protocol support, Claude, Cursor and other MCP clients will be able to read your designs, design kits and DESIGN.md specs, and compose new ones. We're still building it."
      stages={[
        { label: "Canvas", pane: <CanvasPane /> },
        {
          label: "Connect",
          pane: <FeaturePane feature="connect" />,
        },
        { label: "Your AI", pane: <ClientPane /> },
      ]}
      close={close}
    />
  );
}

export function ChatComingSoonSplash({ close }: { close: () => void }) {
  return (
    <ComingSoonSplash
      id="chat"
      feature="Chat"
      title={
        <>
          Edit by <em>conversation</em>
        </>
      }
      body={
        'Describe a change like "make the headline bolder" or "switch to the brand palette", and Spec Composer will update your canvas, prompt and spec for you. We\'re still building it.'
      }
      stages={[
        {
          label: "Ask",
          pane: <MessagePane head="Chat" text="Make the headline bolder" />,
        },
        { label: "Edit", pane: <FeaturePane feature="edit" /> },
        {
          label: "Spec",
          pane: (
            <SpecPane
              rows={[
                { k: "h1.weight", v: "800", changed: true },
                { k: "h1.size", v: "64px" },
                { k: "accent", v: "#c55454", swatches: ["#c55454"] },
              ]}
            />
          ),
        },
      ]}
      close={close}
    />
  );
}

export function PromptGalleryComingSoonSplash({
  close,
}: {
  close: () => void;
}) {
  return (
    <ComingSoonSplash
      id="gallery"
      feature="Prompt gallery"
      title={
        <>
          Copy a prompt, <em>paste anywhere</em>
        </>
      }
      body="Browse viral AI photo prompts, copy one in a click and paste it into ChatGPT, Gemini, Midjourney or any image AI. We're still building it."
      stages={[
        { label: "Browse", pane: <GalleryPane /> },
        {
          label: "Copy",
          pane: <FeaturePane feature="copy" />,
        },
        {
          label: "Paste",
          pane: (
            <MessagePane
              head="Any AI"
              text="Cinematic portrait, golden hour"
              caret
            />
          ),
        },
      ]}
      close={close}
    />
  );
}

export function CreativeRemixComingSoonSplash({
  close,
}: {
  close: () => void;
}) {
  return (
    <ComingSoonSplash
      id="remix"
      feature="Creative Remix"
      title={
        <>
          One design, <em>many directions</em>
        </>
      }
      body="Turn one of your designs into fresh variations that still feel like your brand. Your colors, fonts and message stay put while the layout and style get a creative shake-up. We're still building it."
      stages={[
        { label: "Design", pane: <CanvasPane brand /> },
        {
          label: "Remix",
          pane: <FeaturePane feature="remix" />,
        },
        { label: "Variants", pane: <VariationsPane /> },
      ]}
      close={close}
    />
  );
}

export function QuickGuideSplash({
  page,
  start,
  close,
}: {
  page: "editor" | "home" | "brand-kit";
  start: () => void;
  close: () => void;
}) {
  const stages: readonly [Stage, Stage, Stage] = [
    { label: "Canvas", pane: <CanvasPane /> },
    { label: "Edit", pane: <FeaturePane feature="edit" /> },
    {
      label: "Spec",
      pane: (
        <SpecPane
          rows={[
            { k: "h1.weight", v: "800", changed: true },
            { k: "h1.size", v: "64px" },
            { k: "accent", v: "#c55454", swatches: ["#c55454"] },
          ]}
        />
      ),
    },
  ];
  return (
    <ComingSoonSplash
      id="guide"
      eyebrow={
        <>
          <span className="soon-splash-dot" />
          Quick tour
        </>
      }
      title={
        <>
          Find your way <em>in a minute</em>
        </>
      }
      body={
        {
          editor:
            "Walk through every part of the editor: the asset library and left rail, the canvas tools, the style dock, and the Design and Prompt Editors.",
          home: "Create a design, pick a format or template to open it in the editor, and set up a design kit to keep your brand consistent.",
          "brand-kit":
            "See how to create a design kit by hand or generate one from a single color, set a default for new designs, and edit colors, type, style and mood.",
        }[page]
      }
      stages={stages}
      primaryLabel="Start tour"
      onPrimary={start}
      secondaryLabel="Skip"
      onSecondary={close}
      close={close}
    />
  );
}

function ComingSoonSplash({
  id,
  feature,
  eyebrow,
  title,
  body,
  stages,
  primaryLabel = "Got it",
  onPrimary,
  secondaryLabel,
  onSecondary,
  close,
}: {
  id: string;
  feature?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  body: string;
  stages: readonly [Stage, Stage, Stage];
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  close: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  // Capture the opener before autoFocus runs during React's commit.
  const openerRef = useRef(document.activeElement);
  useEffect(() => {
    const opener = openerRef.current;
    primaryRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    // Handle dismissal before the editor's tooltips consume Escape.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [close]);
  return createPortal(
    <div className="soon-splash-backdrop" onMouseDown={close}>
      <div
        ref={dialogRef}
        className="soon-splash"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-splash-title`}
        aria-describedby={`${id}-splash-body`}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = Array.from(
            dialogRef.current?.querySelectorAll("button") ?? [],
          );
          if (!buttons.length) return;
          event.preventDefault();
          const active = document.activeElement;
          const index = buttons.indexOf(active as HTMLButtonElement);
          const next = event.shiftKey
            ? buttons[index <= 0 ? buttons.length - 1 : index - 1]
            : buttons[
                index === -1 || index === buttons.length - 1 ? 0 : index + 1
              ];
          next?.focus();
        }}
      >
        <div className="soon-pipeline" aria-hidden="true">
          {stages.map((stage, index) => (
            <Fragment key={stage.label}>
              {index > 0 && (
                <span className="soon-link">
                  <ArrowRight />
                </span>
              )}
              <div
                className="soon-stage"
                style={{ "--i": index } as CSSProperties}
              >
                <span className="soon-stage-label">
                  <b>0{index + 1}</b>
                  {stage.label}
                </span>
                <div
                  className={cn("soon-pane", index === 2 && "soon-pane--out")}
                >
                  {stage.pane}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
        <div className="soon-splash-copy">
          <div>
            <p className="soon-splash-eyebrow">
              {eyebrow ?? (
                <>
                  <span className="soon-splash-dot" />
                  Coming soon<span className="soon-splash-sep">·</span>
                  <span>{feature}</span>
                </>
              )}
            </p>
            <h2 className="soon-splash-title" id={`${id}-splash-title`}>
              {title}
            </h2>
            <p className="soon-splash-body" id={`${id}-splash-body`}>
              {body}
            </p>
          </div>
          <div className="soon-splash-actions">
            {secondaryLabel && (
              <button
                type="button"
                className="soon-splash-secondary"
                onClick={onSecondary}
              >
                {secondaryLabel}
              </button>
            )}
            <button
              ref={primaryRef}
              type="button"
              className="soon-splash-close"
              onClick={onPrimary ?? close}
              autoFocus
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Artboard({
  variant = "base",
  editing = false,
}: {
  variant?: "base" | "bold" | "centered" | "split";
  editing?: boolean;
}) {
  return (
    <div
      className={cn(
        "soon-art",
        variant !== "base" && `soon-art--${variant}`,
        editing && "soon-art--editing",
      )}
    >
      <span className="soon-art-img">
        <PosterScene />
      </span>
      <b className="soon-art-head">
        Summer
        <br />
        in motion.
      </b>
      <i className="soon-art-line" />
      <i className="soon-art-line" />
      <span className="soon-art-cta">Explore</span>
    </div>
  );
}
function BrandPalette() {
  return (
    <span className="soon-brand-palette">
      <i />
      <i />
      <i />
    </span>
  );
}
function CanvasPane({ brand = false }: { brand?: boolean }) {
  return (
    <div className="soon-pane-body soon-canvas">
      <div className="soon-canvas-preview">
        <Artboard />
      </div>
      <div className="soon-pane-caption">
        <BrandPalette />
        <span>{brand ? "Your original" : "Design + brand"}</span>
      </div>
    </div>
  );
}
function SpecPane({
  file = "DESIGN.md",
  rows,
}: {
  file?: string;
  rows: SpecRow[];
}) {
  return (
    <>
      <div className="soon-spec-file">
        <FileText />
        {file}
      </div>
      <div className="soon-type-preview">
        <span>Aa</span>
        <ArrowRight />
        <b>Aa</b>
        <Check />
      </div>
      <div className="soon-spec-rows">
        {rows.slice(0, 4).map((row) => (
          <div
            key={row.k}
            className={cn(
              "soon-spec-row",
              row.changed && "soon-spec-row--changed",
            )}
          >
            <span className="soon-spec-k">{row.k}</span>
            <span className="soon-spec-v">
              {row.swatches?.map((color) => (
                <i
                  key={color}
                  className="soon-spec-swatch"
                  style={{ background: color }}
                />
              ))}
              {row.v}
            </span>
            {row.locked && <Lock />}
          </div>
        ))}
      </div>
    </>
  );
}
function ClientPane() {
  return (
    <>
      <div className="soon-pane-head">
        <Plug />
        MCP client
      </div>
      <ul className="soon-calls">
        <li>
          <Check />
          Read design
        </li>
        <li>
          <Check />
          Read brand + spec
        </li>
        <li className="is-live">
          <i />
          Compose design
          <span className="soon-caret" />
        </li>
      </ul>
    </>
  );
}
function MessagePane({
  head,
  text,
  caret = false,
}: {
  head: string;
  text: string;
  caret?: boolean;
}) {
  return (
    <>
      <div className="soon-pane-head">
        <MessageSquare />
        {head}
      </div>
      <span className="soon-message-hint">
        {caret ? "Your prompt, ready" : "Describe a change"}
      </span>
      <div className="soon-msg-box">
        <p className="soon-msg-text">
          {text}
          {caret && <span className="soon-caret" />}
        </p>
        <span className="soon-msg-send">
          <ArrowUp />
        </span>
      </div>
    </>
  );
}
function GalleryPane() {
  return (
    <div className="soon-gallery">
      <span className="soon-photo soon-photo--sunset">
        <PortraitScene />
        <span className="soon-gallery-pick">
          <Check />
          Portrait
        </span>
      </span>
      <span className="soon-photo soon-photo--dusk">
        <LandscapeScene />
      </span>
      <span className="soon-photo soon-photo--paper">
        <PosterScene />
      </span>
    </div>
  );
}
function FeaturePane({
  feature,
}: {
  feature: "connect" | "copy" | "remix" | "edit";
}) {
  const content = {
    connect: {
      icon: Plug,
      from: "DESIGN.md",
      to: "Your AI",
      action: "Connect",
      detail: "Design + brand context",
    },
    copy: {
      icon: Copy,
      from: "Prompt",
      to: "Clipboard",
      action: "Copied",
      detail: "Cinematic portrait",
    },
    remix: {
      icon: Shuffle,
      from: "Brand locked",
      to: "Variants",
      action: "Remix",
      detail: "Keep colors, type & copy",
    },
    edit: {
      icon: Type,
      from: "Weight 400",
      to: "800",
      action: "Bold applied",
      detail: "A bolder headline",
    },
  }[feature];
  const Icon = content.icon;
  return (
    <div className={`soon-feature soon-feature--${feature}`}>
      <span className="soon-feature-icon">
        <Icon />
      </span>
      <span className="soon-feature-detail">{content.detail}</span>
      <span className="soon-feature-path">
        <span>{content.from}</span>
        <ArrowRight />
        <span>{content.to}</span>
      </span>
      <span className="soon-feature-action">
        {feature === "copy" || feature === "edit" ? <Check /> : <Icon />}
        {content.action}
      </span>
    </div>
  );
}

/** Original vector scenes for the small preview panes. No external image assets. */
function PortraitScene() {
  return (
    <svg
      className="soon-scene"
      viewBox="0 0 240 190"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="soon-portrait-sky" x2="0" y2="1">
          <stop stopColor="#592e36" />
          <stop offset=".5" stopColor="#db7650" />
          <stop offset="1" stopColor="#f7c687" />
        </linearGradient>
        <linearGradient id="soon-portrait-ground" x2="0" y2="1">
          <stop stopColor="#7b4554" />
          <stop offset="1" stopColor="#231f2a" />
        </linearGradient>
        <linearGradient id="soon-portrait-skin" x2="1" y2="1">
          <stop stopColor="#e1a172" />
          <stop offset="1" stopColor="#8d4c49" />
        </linearGradient>
      </defs>
      <rect width="240" height="190" fill="url(#soon-portrait-sky)" />
      <circle cx="188" cy="69" r="30" fill="#ffdb9a" opacity=".9" />
      <path d="M0 120q39-22 83-5t78-3 79 8v70H0Z" fill="#8a5760" opacity=".7" />
      <path
        d="M0 148q49-27 91-7 44 18 85-5 35-17 64-1v55H0Z"
        fill="url(#soon-portrait-ground)"
      />
      <path
        d="M46 145C32 120 31 91 43 68 38 44 56 22 82 19c29-4 53 9 62 36-15-9-28-8-37 2-16 19-18 48-12 68l-9 30Z"
        fill="#29202a"
      />
      <path
        d="M99 50c17-10 35-1 44 14 3 7 5 9 13 13l-8 6c0 11-6 18-15 21-8 3-15 0-21-5l-1 19c21 9 40 27 46 72H74c-1-29 5-53 21-72-12-18-14-46 4-68Z"
        fill="url(#soon-portrait-skin)"
      />
      <path
        d="M69 190c1-32 9-56 26-71 8 13 19 19 31 17 11-2 18-8 23-17 19 17 30 41 34 71Z"
        fill="#342532"
      />
      <path
        d="M69 52c8-24 36-32 57-21 11 6 18 17 20 29-16-10-29-6-38 4-7 8-14 11-23 11 2 12-1 23-11 31-11-16-14-37-5-54Z"
        fill="#241d27"
      />
      <path
        d="M65 48C45 34 24 37 12 32c14 17 34 20 51 30Zm-7 24C37 62 22 68 8 63c13 15 33 17 49 23Z"
        fill="#29202a"
      />
      <circle cx="132" cy="76" r="1.8" fill="#37252b" />
      <path
        d="M139 91q5 2 8-1"
        fill="none"
        stroke="#6e3940"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LandscapeScene() {
  return (
    <svg
      className="soon-scene"
      viewBox="0 0 120 110"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="soon-landscape-sky" x2="0" y2="1">
          <stop stopColor="#392840" />
          <stop offset="1" stopColor="#e4a06a" />
        </linearGradient>
      </defs>
      <rect width="120" height="110" fill="url(#soon-landscape-sky)" />
      <circle cx="82" cy="38" r="19" fill="#f9ce8d" />
      <path d="M0 77 32 49l27 26 27-18 34 24v29H0Z" fill="#794658" />
      <path d="M0 92q30-21 59-6 35 15 61-5v29H0Z" fill="#302735" />
    </svg>
  );
}

function PosterScene() {
  return (
    <svg
      className="soon-scene"
      viewBox="0 0 88 72"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="88" height="72" fill="#f3dfbf" />
      <path d="M0 49 29 10l28 27 31-22v57H0Z" fill="#c7564c" />
      <circle cx="60" cy="18" r="10" fill="#f5b979" />
      <path d="M0 60q21-24 43-12 17 10 45-8v32H0Z" fill="#642e39" />
      <path
        d="M12 16h25M12 22h19"
        stroke="#fff2da"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VariationsPane() {
  return (
    <div className="soon-remix-output">
      <div className="soon-variants-heading">
        <Shuffle />3 directions
      </div>
      <div className="soon-variations">
        {(
          [
            ["bold", "Bold"],
            ["centered", "Focus"],
            ["split", "Split"],
          ] as const
        ).map(([variant, label]) => (
          <div className="soon-variant" key={variant}>
            <Artboard variant={variant} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="soon-pane-caption">
        <BrandPalette />
        <Lock />
        <span>Same brand</span>
      </div>
    </div>
  );
}
