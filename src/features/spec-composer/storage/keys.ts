/** localStorage keys. Heavy ones are legacy after the IndexedDB migration. */
export const LS_KEYS = {
  projects: "spec-composer:projects",
  brandKits: "spec-composer:brand-kits",
  materialKits: "spec-composer:style-kits",
  defaultBrandKit: "spec-composer:default-brand-kit",
  ui: "spec-composer:ui",
  topBarCopyMode: "spec-composer:top-bar-copy-mode",
  assetUsage: "spec-composer:asset-usage",
  storageVersion: "spec-composer:storage-version",
  /** Raw legacy records that failed validation during migration. */
  quarantine: "spec-composer:legacy-quarantine",
} as const;

/** IndexedDB `kv` store keys. */
export const KV_KEYS = {
  brandKits: "brand-kits",
  materialKits: "style-kits",
} as const;

export type KvKey = (typeof KV_KEYS)[keyof typeof KV_KEYS];

/** Storage layout version; 2 = heavy data lives encrypted in IndexedDB. */
export const STORAGE_VERSION = 2;
