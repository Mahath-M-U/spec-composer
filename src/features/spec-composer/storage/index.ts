import { migrateLegacyStorage, type MigrationResult } from "./migrate";
import type { StorageAdapter } from "./adapter";

let init: Promise<MigrationResult> | undefined;

/**
 * Runs the legacy migration once per page and resolves to its result. Every
 * storage call goes through this, so nothing can read or write before the
 * backend is chosen — no matter which component touches storage first.
 */
export function initStorage(): Promise<MigrationResult> {
  init ??= migrateLegacyStorage();
  return init;
}

export async function getStorage(): Promise<StorageAdapter> {
  return (await initStorage()).adapter;
}

let persistRequested = false;

/** Asks the browser not to evict our data under storage pressure. */
export async function requestPersistentStorage() {
  if (persistRequested || typeof navigator === "undefined") return;
  persistRequested = true;
  try {
    if (await navigator.storage?.persisted?.()) return;
    await navigator.storage?.persist?.();
  } catch {
    // Not supported or denied; eviction is still unlikely for active sites.
  }
}

export { KV_KEYS, LS_KEYS, MAX_PROJECTS } from "./keys";
export type { MigrationResult } from "./migrate";
