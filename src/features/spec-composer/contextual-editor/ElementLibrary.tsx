import { memo, useRef, useState } from "react";
import { Upload, Search, Sparkles, Grid2X2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useEditorStore } from "../store";
import { readImageUpload } from "../image-upload";
import { inspectorContext } from "../inspector-properties";
import { CATALOG_DRAG_TYPE, inferCatalogId, libraryEntries } from "./catalog";
import { CreativePurposeSelect } from "./CreativePurposeSelect";
import { ElementThumbnail, LibraryGroupIcon } from "./element-thumbnails";
import "./contextual-editor.css";

let collapsedGroups = new Set<string>();
export const ElementLibrary = memo(function ElementLibrary() {
  const doc = useEditorStore((state) => state.doc);
  const state = useEditorStore.getState();
  const [view, setView] = useState<"recommended" | "all">("recommended"),
    [search, setSearch] = useState(""),
    [searchOpen, setSearchOpen] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(collapsedGroups),
  );
  const groups = libraryEntries(doc?.creativePurposeId, view, search);
  const counts = new Map<string, number>();
  state.doc?.elements.forEach((el) => {
    const id = inferCatalogId(el);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  return (
    <div className="contextual-library">
      <CreativePurposeSelect
        value={state.doc?.creativePurposeId}
        onChange={state.setCreativePurpose}
      />
      <div
        className="contextual-library-actions"
        role="group"
        aria-label="Element library actions"
      >
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="ui-icon-button"
              aria-label="Search elements"
              title="Search elements"
              aria-pressed={searchOpen || !!search}
            >
              <Search size={17} aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="ui-popover contextual-search-popover"
            align="start"
            collisionPadding={12}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              searchInput.current?.focus();
            }}
          >
            <div className="contextual-search-input">
              <input
                ref={searchInput}
                type="search"
                aria-label="Search all elements"
                placeholder="Search all elements…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear element search"
                  title="Clear element search"
                  onClick={() => {
                    setSearch("");
                    searchInput.current?.focus();
                  }}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <button
          type="button"
          className="ui-icon-button"
          aria-label="Recommended"
          title="Recommended"
          aria-pressed={view === "recommended"}
          onClick={() => setView("recommended")}
        >
          <Sparkles size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ui-icon-button"
          aria-label="All Elements"
          title="All Elements"
          aria-pressed={view === "all"}
          onClick={() => setView("all")}
        >
          <Grid2X2 size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ui-icon-button"
          aria-label="Upload image"
          title="Upload image"
          onClick={() => upload.current?.click()}
        >
          <Upload size={17} aria-hidden="true" />
        </button>
      </div>
      <input
        ref={upload}
        hidden
        aria-label="Choose image to upload"
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0],
            project = state.doc?.id,
            context = inspectorContext();
          event.target.value = "";
          if (!file || !project) return;
          try {
            const source = await readImageUpload(file);
            const latest = useEditorStore.getState();
            if (latest.doc?.id !== project || inspectorContext() !== context)
              return;
            latest.addElement("supportingImage", undefined, undefined, {
              src: source,
              catalogElementId: "subjects.image",
              name: file.name,
              aiDescription: "",
            });
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Image could not be uploaded",
            );
          }
        }}
      />
      {groups.map((group) => {
        const expanded = !!search || !collapsed.has(group.id);
        return (
          <section key={group.id} className="contextual-library-group">
            <button
              type="button"
              className="contextual-group-heading"
              aria-expanded={expanded}
              onClick={() =>
                setCollapsed((previous) => {
                  const next = new Set(previous);
                  if (next.has(group.id)) next.delete(group.id);
                  else next.add(group.id);
                  collapsedGroups = next;
                  return next;
                })
              }
            >
              <LibraryGroupIcon
                groupId={group.id}
                size={16}
                className="ui-section-heading-icon"
              />
              <strong>{group.label}</strong>
              <span>{group.entries.length}</span>
            </button>
            {expanded && (
              <div className="contextual-element-grid">
                {group.entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="contextual-element-card"
                    data-added={counts.get(entry.id) ? "true" : undefined}
                    title={`Add ${entry.label}`}
                    draggable
                    onClick={() => state.addContextualElement(entry.id)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        CATALOG_DRAG_TYPE,
                        JSON.stringify({ elementId: entry.id }),
                      );
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                  >
                    <ElementThumbnail id={entry.id} />
                    <span className="contextual-element-text">
                      <span className="contextual-element-name">
                        {entry.label}
                      </span>
                      {(entry.status || counts.get(entry.id)) && (
                        <small>
                          {entry.status}
                          {entry.status && counts.get(entry.id) ? " · " : ""}
                          {counts.get(entry.id) ? (
                            <span className="ui-count">{`Added ${counts.get(entry.id)}`}</span>
                          ) : null}
                        </small>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {expanded && !group.entries.length && (
              <p className="contextual-empty">
                <LibraryGroupIcon groupId={group.id} size={14} />
                <span>{search ? "No matches" : "Browse All Elements"}</span>
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
});
