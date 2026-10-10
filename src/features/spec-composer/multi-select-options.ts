/** Pure helpers behind `MultiSelect` (brand-select.tsx): filtering the
 * options list, deciding whether a typed query can be added as a new value,
 * and toggling a value in/out of the selection. Kept dependency-free so they
 * can be unit-tested without mounting the component. */

/** Case-insensitive substring match of `query` against `options` and any
 * selected values that aren't in `options` (custom, user-added values).
 * Custom selected values come first in the result, so they're easy to find
 * and uncheck. An empty query returns everything. */
export function filterOptions(
  options: readonly string[],
  selected: string[],
  query: string,
): string[] {
  const trimmed = query.trim().toLowerCase();
  const matches = (value: string) =>
    !trimmed || value.toLowerCase().includes(trimmed);
  const custom = selected.filter((value) => !options.includes(value));
  return [...custom.filter(matches), ...options.filter(matches)];
}

/** The trimmed query, if it can be offered as a new "Add '…'" option: not
 * empty, not already an option or a selected value (case-insensitively),
 * and not at `max`. Returns `null` otherwise. */
export function createOptionLabel(
  query: string,
  options: readonly string[],
  selected: string[],
  max?: number,
): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (max != null && selected.length >= max) return null;
  const lower = trimmed.toLowerCase();
  if (options.some((option) => option.toLowerCase() === lower)) return null;
  if (selected.some((value) => value.toLowerCase() === lower)) return null;
  return trimmed;
}

/** Removes `value` from `selected` if present; otherwise appends it, unless
 * that would exceed `max`. */
export function toggleValue(
  selected: string[],
  value: string,
  max?: number,
): string[] {
  if (selected.includes(value))
    return selected.filter((item) => item !== value);
  if (max != null && selected.length >= max) return selected;
  return [...selected, value];
}
