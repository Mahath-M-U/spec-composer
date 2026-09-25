/**
 * Pure functions over the local "most used / recently used" asset store.
 * No I/O here: `asset-usage-store.ts` wraps these with localStorage.
 */

export interface AssetUsageEntry {
  count: number;
  /** Epoch milliseconds of the most recent use. */
  last: number;
}

export interface AssetUsage {
  v: 1;
  entries: Record<string, AssetUsageEntry>;
}

export const EMPTY_USAGE: AssetUsage = { v: 1, entries: {} };

const MAX_ENTRIES = 200;
const RECENT_LIMIT = 12;
const MOST_USED_MIN_COUNT = 2;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Never throws: any malformed input falls back to EMPTY_USAGE. */
export function parseUsage(value: unknown): AssetUsage {
  if (!value || typeof value !== "object") return EMPTY_USAGE;
  const source = value as { v?: unknown; entries?: unknown };
  if (source.v !== 1 || !source.entries || typeof source.entries !== "object") {
    return EMPTY_USAGE;
  }
  const entries: Record<string, AssetUsageEntry> = {};
  for (const [id, raw] of Object.entries(
    source.entries as Record<string, unknown>,
  )) {
    if (!id || !raw || typeof raw !== "object") continue;
    const { count, last } = raw as { count?: unknown; last?: unknown };
    if (typeof count !== "number" || !Number.isFinite(count) || count <= 0)
      continue;
    if (typeof last !== "number" || !Number.isFinite(last)) continue;
    entries[id] = { count, last };
  }
  return { v: 1, entries };
}

/** Immutable: returns a new AssetUsage, pruned to the 200 most recently used entries. */
export function recordUse(
  usage: AssetUsage,
  id: string,
  now = Date.now(),
): AssetUsage {
  const previous = usage.entries[id];
  const nextEntry: AssetUsageEntry = {
    count: (previous?.count ?? 0) + 1,
    last: now,
  };
  const merged: Record<string, AssetUsageEntry> = {
    ...usage.entries,
    [id]: nextEntry,
  };
  const entries = Object.entries(merged);
  if (entries.length <= MAX_ENTRIES) return { v: 1, entries: merged };
  const kept = entries
    .sort((a, b) => b[1].last - a[1].last)
    .slice(0, MAX_ENTRIES);
  return { v: 1, entries: Object.fromEntries(kept) };
}

/** Ids most recently used, newest first. */
export function recentIds(usage: AssetUsage, limit = RECENT_LIMIT): string[] {
  return Object.entries(usage.entries)
    .sort(([, a], [, b]) => b.last - a.last)
    .slice(0, limit)
    .map(([id]) => id);
}

/** Ids used at least `minCount` times, most-used first. */
export function mostUsedIds(
  usage: AssetUsage,
  minCount = MOST_USED_MIN_COUNT,
): string[] {
  return Object.entries(usage.entries)
    .filter(([, entry]) => entry.count >= minCount)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([id]) => id);
}

export interface PopularRankable {
  id: string;
  label: string;
  popularRank?: number;
}

/**
 * Merges curated rank with local usage: score = (rank ? 20 - rank : 0) +
 * 6·log2(1+count) + (used within the last 7 days ? 3 : 0). Only items with
 * a score above 0 are kept. Ties break by rank, then label.
 */
export function rankPopular<T extends PopularRankable>(
  items: T[],
  usage: AssetUsage,
  now = Date.now(),
): T[] {
  return items
    .map((item) => {
      const entry = usage.entries[item.id];
      const rankScore = item.popularRank ? 20 - item.popularRank : 0;
      const countScore = entry ? 6 * Math.log2(1 + entry.count) : 0;
      const recencyScore = entry && now - entry.last <= SEVEN_DAYS_MS ? 3 : 0;
      return { item, score: rankScore + countScore + recencyScore };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.item.popularRank ?? Number.MAX_SAFE_INTEGER) -
          (b.item.popularRank ?? Number.MAX_SAFE_INTEGER) ||
        a.item.label.localeCompare(b.item.label),
    )
    .map(({ item }) => item);
}
