import { useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOptionLabel, filterOptions, toggleValue } from "./multi-select-options";

/** A type-to-filter, type-to-add multi-select: selected values render as
 * removable tags, the trigger opens a `Command` popover with checkmarked
 * options plus an "Add '…'" row for anything not already in the list. */
export function MultiSelect({
  options,
  value,
  onChange,
  max,
  ariaLabel,
  placeholder,
  quickPicks,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  ariaLabel: string;
  placeholder?: string;
  quickPicks?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const atMax = max != null && value.length >= max;
  const filtered = filterOptions(options, value, query);
  const createLabel = createOptionLabel(query, options, value, max);

  const setOpenState = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const remove = (target: string) =>
    onChange(value.filter((item) => item !== target));

  const removeLast = () => {
    if (value.length) remove(value[value.length - 1]!);
  };

  const select = (target: string) => onChange(toggleValue(value, target, max));

  return (
    <>
      <Popover modal open={open} onOpenChange={setOpenState}>
        <PopoverAnchor asChild>
          <div className="bk-ms">
            {value.map((tag) => (
              <span key={tag} className="bk-ms-tag">
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => remove(tag)}
                >
                  <X aria-hidden="true" />
                </button>
              </span>
            ))}
            <PopoverTrigger asChild>
              <button
                type="button"
                className="bk-ms-trigger"
                aria-label={ariaLabel}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && value.length) {
                    event.preventDefault();
                    removeLast();
                  }
                }}
              >
                <span>{placeholder ?? "Add…"}</span>
                {max != null && (
                  <span>
                    {value.length}/{max}
                  </span>
                )}
                <ChevronDown aria-hidden="true" />
              </button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          collisionPadding={8}
          className="bk-ms-popover"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Type to search or add"
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !query && value.length) {
                  removeLast();
                }
              }}
            />
            <CommandList className="bk-ms-list">
              <CommandEmpty>
                {atMax ? `Up to ${max} selected` : "No matches"}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((option) => {
                  const selected = value.includes(option);
                  return (
                    <CommandItem
                      key={option}
                      value={option}
                      disabled={!selected && atMax}
                      onSelect={() => select(option)}
                    >
                      {selected ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Check aria-hidden="true" className="opacity-0" />
                      )}
                      {option}
                    </CommandItem>
                  );
                })}
                {createLabel && (
                  <CommandItem
                    value={`__create__:${createLabel}`}
                    onSelect={() => {
                      onChange([...value, createLabel]);
                      setQuery("");
                    }}
                  >
                    <Plus aria-hidden="true" />
                    Add “{createLabel}”
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {!value.length && !!quickPicks && (
        <div className="bk-quick-picks">
          {options.slice(0, quickPicks).map((option) => (
            <button
              key={option}
              type="button"
              className="emotion-chip"
              onClick={() => select(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export interface SelectOption {
  id: string;
  label: string;
  description?: string;
}

const NONE_VALUE = "__none__";

/** A fixed single-choice `Select`: the trigger shows only the chosen
 * label, options show label + description. */
export function OptionSelect({
  options,
  value,
  onChange,
  ariaLabel,
  placeholder,
  clearable,
}: {
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  placeholder: string;
  clearable?: boolean;
}) {
  const selected = options.find((option) => option.id === value);
  return (
    <Select
      value={value || ""}
      onValueChange={(next) => onChange(next === NONE_VALUE ? "" : next)}
    >
      <SelectTrigger className="bk-select-trigger" aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder}>{selected?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent className="bk-select-content" position="popper">
        {clearable && (
          <SelectItem value={NONE_VALUE}>
            <span>None</span>
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <span>{option.label}</span>
            {option.description && <small>{option.description}</small>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
