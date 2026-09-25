import { useSyncExternalStore } from "react";
import {
  notifyStorageChange,
  subscribeStorageChanges,
} from "@/lib/storage/events";
import { readJson, writeJson } from "@/lib/storage/local";
import { LS_KEYS } from "./storage";
import {
  EMPTY_USAGE,
  parseUsage,
  recordUse,
  type AssetUsage,
} from "./asset-catalog/usage";

/**
 * Local "most used / recently used" asset storage. Cross-tab updates ride
 * the same BroadcastChannel-backed notify/subscribe pair as projects, brand
 * kits and style kits (`@/lib/storage/events`), rather than a raw `storage`
 * event listener, so a change in this tab updates this tab's panel too.
 */

let cachedSnapshot: AssetUsage | undefined;

function readUsage(): AssetUsage {
  return parseUsage(readJson<unknown>(LS_KEYS.assetUsage, null));
}

/** Loads lazily on the first client read, then returns a cached reference
 * so useSyncExternalStore doesn't see a new object identity every render. */
function getSnapshot(): AssetUsage {
  if (typeof window === "undefined") return EMPTY_USAGE;
  if (!cachedSnapshot) cachedSnapshot = readUsage();
  return cachedSnapshot;
}

function getServerSnapshot(): AssetUsage {
  return EMPTY_USAGE;
}

function subscribe(onStoreChange: () => void) {
  return subscribeStorageChanges((scope) => {
    if (scope !== "assetUsage") return;
    cachedSnapshot = undefined;
    onStoreChange();
  });
}

/** Popular/recently-used asset usage, SSR-safe. Falls back to EMPTY_USAGE
 * when storage is blocked or unavailable. */
export function useAssetUsage(): AssetUsage {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Reads, records one use of `id`, and writes back, all best-effort. */
export function recordAssetUse(id: string) {
  const current = readUsage();
  const next = recordUse(current, id);
  try {
    writeJson(LS_KEYS.assetUsage, next);
    cachedSnapshot = next;
    notifyStorageChange("assetUsage");
  } catch {
    // Losing a usage record is harmless: the panel still works without it.
  }
}

export function clearAssetUsage() {
  try {
    writeJson(LS_KEYS.assetUsage, EMPTY_USAGE);
    cachedSnapshot = EMPTY_USAGE;
    notifyStorageChange("assetUsage");
  } catch {
    // Storage disabled — nothing to clear.
  }
}
