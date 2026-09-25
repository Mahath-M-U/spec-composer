import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Blocks, Check, Plus, Search, X } from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import { useEditorStore } from "./store";
import {
  defaultExternalToolRequirement,
  validateExternalToolRequirement,
  type ExternalToolError,
} from "./compiler";
import type { ExternalToolRequirement } from "./types";
import {
  customToolCandidate,
  filterCatalog,
  findCatalogTool,
  isAddedTool,
  normalizeToolName,
  selectTool,
  toolMonogram,
  type ToolType,
} from "./tool-catalog";
import { toolLogo } from "./tool-logos";

export function destinationLabel(settings: ExternalToolRequirement) {
  return settings.destination === "chatgpt"
    ? "ChatGPT"
    : settings.assistantName?.trim() || "Other assistant";
}

/** A tool's brand mark: its original logo image when the catalog has one, a
 * single-color fallback glyph for the few tools without a verified original
 * (colored on a light tile, foreground-colored on a dark one when the brand
 * color itself is too dark to read), otherwise a monogram. Custom tools
 * always get the dashed monogram tile. */
export function ToolLogo({
  name,
  custom,
  size,
}: {
  name: string;
  custom?: boolean;
  size: "sm" | "md";
}) {
  const logo = !custom ? toolLogo(name) : null;
  return (
    <span
      className="tool-tile"
      data-size={size}
      data-custom={custom || undefined}
      data-logo={
        logo
          ? logo.kind === "asset"
            ? "asset"
            : logo.adaptive
              ? "adaptive"
              : "brand"
          : undefined
      }
      style={
        logo?.kind === "glyph" && !logo.adaptive
          ? ({ "--tool-logo": `#${logo.hex}` } as CSSProperties)
          : undefined
      }
      aria-hidden="true"
    >
      {logo ? (
        logo.kind === "asset" ? (
          <img
            src={logo.src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <svg viewBox="0 0 24 24" focusable="false">
            <path d={logo.path} />
          </svg>
        )
      ) : (
        toolMonogram(name)
      )}
    </span>
  );
}

/** The compact Add tools control beside Include in output. */
export function ToolAddButton({
  settings,
  error,
  open,
  onOpen,
  buttonRef,
}: {
  settings: ExternalToolRequirement;
  error: ExternalToolError | null;
  open: boolean;
  onOpen: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  const enabled = settings.enabled;
  const name = settings.toolName.trim();
  return (
    <Hint
      label={enabled ? `Change required tool: ${name}` : "Add a required tool"}
      side="top"
    >
      <button
        ref={buttonRef}
        type="button"
        className="prompt-tool-add"
        data-active={enabled || undefined}
        data-invalid={error ? "true" : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={enabled ? `Change required tool: ${name}` : "Add tools"}
        aria-describedby={error ? "tool-requirement-error" : undefined}
        onClick={onOpen}
      >
        <Blocks size={14} aria-hidden="true" />
      </button>
    </Hint>
  );
}

type ToolRow = {
  key: string;
  name: string;
  type: ToolType;
  custom: boolean;
};

/** The dialog's live content: search and tool list. */
function ToolPickerBody() {
  const doc = useEditorStore((s) => s.doc);
  const updateExternalTool = useEditorStore((s) => s.updateExternalTool);
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const settings =
    doc?.externalToolRequirement ?? defaultExternalToolRequirement();

  const currentName = settings.enabled
    ? normalizeToolName(settings.toolName)
    : "";
  const currentIsCatalog = !!findCatalogTool(currentName);
  const normalizedQuery = normalizeToolName(query).toLowerCase();
  const showCurrentCustomRow =
    !!currentName &&
    !currentIsCatalog &&
    currentName.toLowerCase().includes(normalizedQuery);
  const catalogMatches = filterCatalog(query);
  const candidate = customToolCandidate(query);
  const showCandidateRow =
    !!candidate &&
    !(
      showCurrentCustomRow &&
      candidate.toLowerCase() === currentName.toLowerCase()
    );

  const rows: ToolRow[] = [];
  if (showCurrentCustomRow)
    rows.push({
      key: `current:${currentName}`,
      name: currentName,
      type: settings.toolType,
      custom: true,
    });
  for (const tool of catalogMatches)
    rows.push({
      key: `catalog:${tool.id}`,
      name: tool.name,
      type: tool.type,
      custom: false,
    });
  if (showCandidateRow && candidate)
    rows.push({
      key: `candidate:${candidate}`,
      name: candidate,
      type: "other",
      custom: true,
    });

  useEffect(() => {
    if (!pendingFocus) return;
    const selector = `[data-tool-name="${CSS.escape(pendingFocus.toLowerCase())}"]`;
    listRef.current?.querySelector<HTMLButtonElement>(selector)?.focus();
  }, [pendingFocus, rows.length]);

  if (!doc) return null;

  const handleAdd = (name: string, type: ToolType) => {
    const previous = currentName;
    const selected = selectTool(settings, { name, type });
    updateExternalTool(
      validateExternalToolRequirement(selected)
        ? selectTool(defaultExternalToolRequirement(), { name, type })
        : selected,
    );
    setAnnouncement(
      previous && previous.toLowerCase() !== name.toLowerCase()
        ? `${name} replaced ${previous}.`
        : `${name} added to your prompt.`,
    );
    setPendingFocus(name.toLowerCase());
  };

  const handleRemove = (name: string) => {
    updateExternalTool({ enabled: false });
    setAnnouncement(`${name} removed.`);
    setPendingFocus(name.toLowerCase());
  };

  const focusFirstAction = () => {
    listRef.current?.querySelector<HTMLButtonElement>(".tool-action")?.focus();
  };

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusFirstAction();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const first = rows[0];
      if (first && !isAddedTool(settings, first.name))
        handleAdd(first.name, first.type);
    }
  };

  const handleRowKeyDown = (
    event: ReactKeyboardEvent<HTMLTableSectionElement>,
  ) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(".tool-action") ??
        [],
    );
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    const next =
      event.key === "ArrowDown"
        ? Math.min(index + 1, buttons.length - 1)
        : Math.max(index - 1, 0);
    buttons[next]?.focus();
  };

  return (
    <>
      <div className="tool-picker-head">
        <div className="tool-picker-heading">
          <DialogPrimitive.Title>Tools</DialogPrimitive.Title>
          <DialogPrimitive.Description className="tool-picker-desc">
            Pick one tool your copied prompt must use. Adding another replaces
            it. Spec Composer adds the instruction; it doesn&apos;t connect to
            the tool.
          </DialogPrimitive.Description>
        </div>
        <DialogPrimitive.Close asChild>
          <button
            type="button"
            className="tool-picker-close"
            aria-label="Close tools"
          >
            <X size={14} />
          </button>
        </DialogPrimitive.Close>
        <label className="tool-picker-search" htmlFor="tool-picker-search">
          <Search size={14} aria-hidden="true" />
          <input
            id="tool-picker-search"
            type="search"
            maxLength={100}
            placeholder="Search or name a tool"
            aria-label="Search tools"
            aria-controls="tool-picker-list"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </label>
      </div>
      <div className="tool-picker-list" ref={listRef}>
        {catalogMatches.length === 0 && normalizedQuery && (
          <p className="tool-picker-empty">
            No tools match &quot;{query.trim()}&quot;. Add it as a custom tool
            below.
          </p>
        )}
        <table id="tool-picker-list">
          <caption className="sr-only">Available tools</caption>
          <thead>
            <tr>
              <th>Name</th>
              <th>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody onKeyDown={handleRowKeyDown}>
            {rows.map((row) => {
              const added = isAddedTool(settings, row.name);
              const blurb = row.custom
                ? "Custom tool"
                : (findCatalogTool(row.name)?.blurb ?? "Custom tool");
              return (
                <tr key={row.key} className="tool-row" data-added={added}>
                  <td>
                    <div className="tool-row-main">
                      <ToolLogo name={row.name} custom={row.custom} size="md" />
                      <span className="tool-row-text">
                        <span className="tool-row-name">{row.name}</span>
                        <span className="tool-row-blurb">{blurb}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="tool-action"
                      data-tool-name={row.name.toLowerCase()}
                      aria-pressed={added}
                      aria-label={
                        added
                          ? `Remove ${row.name} from prompt`
                          : row.custom
                            ? `Add "${row.name}" as a custom tool`
                            : `Add ${row.name} to prompt`
                      }
                      onClick={() =>
                        added
                          ? handleRemove(row.name)
                          : handleAdd(row.name, row.type)
                      }
                    >
                      <span className="tool-action-idle">
                        {added ? (
                          <>
                            <Check size={12} aria-hidden="true" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus size={12} aria-hidden="true" />
                            Add
                          </>
                        )}
                      </span>
                      {added && (
                        <span className="tool-action-hover">Remove</span>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className="tool-picker-foot">
        <DialogPrimitive.Close asChild>
          <button type="button" className="tool-picker-done">
            Done
          </button>
        </DialogPrimitive.Close>
      </div>
    </>
  );
}

/** The Tools dialog: search the catalog or add a custom tool name. */
export function ToolPickerDialog({
  open,
  onOpenChange,
  returnFocusRef,
  fallbackFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The element that opened the dialog. */
  returnFocusRef: RefObject<HTMLElement | null>;
  /** Where to send focus when the opener is gone. */
  fallbackFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal
        container={
          open
            ? (document.querySelector<HTMLElement>(".editor-shell") ??
              undefined)
            : undefined
        }
      >
        <DialogPrimitive.Overlay className="tool-picker-overlay" />
        <DialogPrimitive.Content
          className="tool-picker animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById("tool-picker-search")?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const opener = returnFocusRef.current;
            (opener?.isConnected ? opener : fallbackFocusRef.current)?.focus();
          }}
        >
          {open && <ToolPickerBody />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
