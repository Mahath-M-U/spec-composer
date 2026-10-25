import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { findPurpose, getCreativePurposes } from "./catalog";
import { cn } from "@/lib/utils";

export function CreativePurposeSelect({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id?: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const groups = getCreativePurposes().map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      `${group.label} ${item.label}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
  }));
  const items = groups.flatMap((group) => group.items);
  const activeId = items[active]?.id;
  useEffect(() => {
    if (open && activeId)
      document
        .getElementById(`${id}-${activeId}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [activeId, open, id]);
  const choose = (next?: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
    trigger.current?.focus();
  };
  return (
    <div className="contextual-purpose">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setQuery("");
            setActive(0);
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            ref={trigger}
            type="button"
            className="contextual-purpose-trigger"
            aria-label={
              value
                ? `Creative Purpose: ${findPurpose(value)?.label ?? "Creative Purpose"}`
                : "Creative Purpose"
            }
            aria-expanded={open}
            aria-controls={`${id}-popup`}
          >
            <span>{findPurpose(value)?.label ?? "Creative Purpose"}</span>
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          id={`${id}-popup`}
          className="ui-popover contextual-purpose-popover"
          align="start"
          collisionPadding={12}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            input.current?.focus();
          }}
        >
          <div className="contextual-purpose-input">
            <Search size={14} aria-hidden="true" />
            <input
              id={id}
              ref={input}
              role="combobox"
              aria-label="Search creative purposes"
              aria-expanded={open}
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={
                open && activeId ? `${id}-${activeId}` : undefined
              }
              placeholder="Search creative purposes..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                }
                if (
                  event.key === "ArrowDown" ||
                  event.key === "ArrowUp" ||
                  event.key === "Home" ||
                  event.key === "End"
                ) {
                  event.preventDefault();
                  setActive((previous) =>
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? Math.max(0, items.length - 1)
                        : Math.max(
                            0,
                            Math.min(
                              items.length - 1,
                              previous + (event.key === "ArrowDown" ? 1 : -1),
                            ),
                          ),
                  );
                }
                if (event.key === "Enter" && activeId) {
                  event.preventDefault();
                  choose(activeId);
                }
              }}
            />
          </div>
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label="Creative purposes"
            className="contextual-purpose-options"
          >
            {groups
              .filter((group) => group.items.length)
              .map((group) => (
                <div role="group" aria-label={group.label} key={group.id}>
                  <strong>{group.label}</strong>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      id={`${id}-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={item.id === value}
                      className={cn(
                        "ui-menu-item",
                        activeId === item.id && "is-active",
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            {!items.length && <p>No matching purposes</p>}
          </div>
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          className="contextual-purpose-clear"
          aria-label="Clear creative purpose"
          title="Clear creative purpose"
          onClick={() => choose()}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
