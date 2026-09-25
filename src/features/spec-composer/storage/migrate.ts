/**
 * One-time, lossless migration of heavy data from localStorage to encrypted
 * IndexedDB.
 *
 * Guarantees:
 * - Idempotent: gated by `storage-version`; re-running after success is a no-op.
 * - Single-writer: runs under a Web Lock so concurrent tabs can't interleave.
 * - Lossless: legacy keys are deleted only after every record has been written
 *   in one transaction AND read back + decrypted + matched. Any failure leaves
 *   localStorage untouched and the app keeps running on it.
 * - Tolerant: records that fail schema validation are skipped (and reported)
 *   rather than aborting the migration of valid ones. Their raw JSON is kept
 *   under `legacy-quarantine` in localStorage for manual recovery.
 */
import {
  decryptJson,
  encryptJson,
  isCryptoAvailable,
} from "@/lib/storage/crypto";
import { done, openDb, promisify, STORES } from "@/lib/storage/idb";
import {
  readJson,
  readRaw,
  removeKey,
  writeJson,
  writeRaw,
} from "@/lib/storage/local";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { normalizeBrandKits } from "../brand-kits";
import { normalizeStyleKits } from "../material-kits";
import { isSpecDocument, type SpecDocument } from "../types";
import {
  encryptProject,
  idbAdapter,
  localStorageAdapter,
  type StorageAdapter,
  type StoredProject,
} from "./adapter";
import { KV_KEYS, LS_KEYS, STORAGE_VERSION } from "./keys";

export type MigrationStatus =
  | "current" // already on IndexedDB
  | "migrated" // moved legacy data this run
  | "fallback" // IndexedDB/WebCrypto unavailable; using localStorage
  | "failed"; // migration errored; using localStorage, nothing lost

export interface MigrationResult {
  status: MigrationStatus;
  adapter: StorageAdapter;
  migrated: { projects: number; brandKits: number; materialKits: number };
  skipped: number;
  error?: unknown;
}

const LOCK_NAME = "spec-composer-storage-migration";

const empty = { projects: 0, brandKits: 0, materialKits: 0 };

function storedVersion() {
  return Number(readRaw(LS_KEYS.storageVersion) ?? 0);
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request)
    return (await navigator.locks.request(LOCK_NAME, fn)) as T;
  return fn();
}

function readLegacy() {
  const rawProjects = readJson<unknown>(LS_KEYS.projects, []);
  const projectList = Array.isArray(rawProjects) ? rawProjects : [];
  const projects = projectList.filter(isSpecDocument);

  const rawBrandKits = readJson<unknown>(LS_KEYS.brandKits, []);
  const brandKits = normalizeBrandKits(rawBrandKits);

  const rawMaterialKits = readJson<unknown>(LS_KEYS.materialKits, []);
  const materialKits = normalizeStyleKits(rawMaterialKits);

  const brandKitIds = new Set(brandKits.map((kit) => kit.id));
  const materialKitIds = new Set(materialKits.map((kit) => kit.id));
  const idOf = (value: unknown) =>
    (value as { id?: unknown } | null)?.id as string | undefined;
  const quarantine = [
    ...projectList.filter((value) => !isSpecDocument(value)),
    ...(Array.isArray(rawBrandKits) ? rawBrandKits : []).filter(
      (value) => !brandKitIds.has(idOf(value) ?? ""),
    ),
    ...(Array.isArray(rawMaterialKits) ? rawMaterialKits : []).filter(
      (value) => !materialKitIds.has(idOf(value) ?? ""),
    ),
  ];

  return {
    projects,
    brandKits,
    materialKits,
    quarantine,
    hasBrandKits: readRaw(LS_KEYS.brandKits) !== null,
    hasMaterialKits: readRaw(LS_KEYS.materialKits) !== null,
  };
}

async function existingProjectRevisions(db: IDBDatabase) {
  const tx = db.transaction(STORES.projects, "readonly");
  const records = await promisify<StoredProject[]>(
    tx.objectStore(STORES.projects).getAll(),
  );
  const revisions = new Map<string, number>();
  for (const record of records) {
    const doc = await decryptJson<SpecDocument>(record).catch(() => undefined);
    if (doc) revisions.set(record.id, doc.revision);
  }
  return revisions;
}

async function kvHas(db: IDBDatabase, key: string) {
  const tx = db.transaction(STORES.kv, "readonly");
  const count = await promisify(tx.objectStore(STORES.kv).count(key));
  return count > 0;
}

async function migrate(): Promise<MigrationResult> {
  const legacy = readLegacy();
  const db = await openDb();

  // A previous attempt may have written some records before failing to
  // verify — never let a stale legacy copy overwrite something newer.
  const existing = await existingProjectRevisions(db);
  const projects = legacy.projects.filter(
    (doc) => (existing.get(doc.id) ?? -1) < doc.revision,
  );
  const writeBrandKits =
    legacy.hasBrandKits && !(await kvHas(db, KV_KEYS.brandKits));
  const writeMaterialKits =
    legacy.hasMaterialKits && !(await kvHas(db, KV_KEYS.materialKits));

  // Encrypt everything up front: awaiting inside an IDB transaction would
  // auto-commit it and break atomicity.
  const base = Date.now();
  const projectRecords = await Promise.all(
    projects.map((doc, index) => encryptProject(doc, base - index)),
  );
  const brandKitRecord = writeBrandKits
    ? await encryptJson(legacy.brandKits)
    : undefined;
  const materialKitRecord = writeMaterialKits
    ? await encryptJson(legacy.materialKits)
    : undefined;

  const tx = db.transaction([STORES.projects, STORES.kv], "readwrite");
  const projectStore = tx.objectStore(STORES.projects);
  projectRecords.forEach((record) => projectStore.put(record));
  if (brandKitRecord)
    tx.objectStore(STORES.kv).put(brandKitRecord, KV_KEYS.brandKits);
  if (materialKitRecord)
    tx.objectStore(STORES.kv).put(materialKitRecord, KV_KEYS.materialKits);
  await done(tx);

  await verify(
    projects,
    writeBrandKits ? legacy.brandKits.length : undefined,
    writeMaterialKits ? legacy.materialKits.length : undefined,
  );

  // Verified — now it is safe to flip the flag and drop the plaintext copies.
  writeRaw(LS_KEYS.storageVersion, String(STORAGE_VERSION));
  removeKey(LS_KEYS.projects);
  removeKey(LS_KEYS.brandKits);
  removeKey(LS_KEYS.materialKits);

  const skipped = legacy.quarantine.length;
  if (skipped) {
    try {
      writeJson(LS_KEYS.quarantine, legacy.quarantine);
    } catch {
      // Best effort — the valid data is already safe in IndexedDB.
    }
    reportLovableError(
      new Error(`Storage migration skipped ${skipped} invalid record(s)`),
      { area: "storage", op: "migrate" },
    );
  }

  return {
    status: "migrated",
    adapter: idbAdapter,
    migrated: {
      projects: projects.length,
      brandKits: writeBrandKits ? legacy.brandKits.length : 0,
      materialKits: writeMaterialKits ? legacy.materialKits.length : 0,
    },
    skipped,
  };
}

async function verify(
  projects: SpecDocument[],
  brandKitCount: number | undefined,
  materialKitCount: number | undefined,
) {
  for (const doc of projects) {
    const stored = (await idbAdapter.getProject(doc.id)) as
      SpecDocument | undefined;
    if (!stored || stored.revision !== doc.revision)
      throw new Error(`Migration verification failed for project ${doc.id}`);
  }
  const kvChecks = [
    [KV_KEYS.brandKits, brandKitCount],
    [KV_KEYS.materialKits, materialKitCount],
  ] as const;
  for (const [key, expected] of kvChecks) {
    if (expected === undefined) continue;
    const stored = await idbAdapter.getKv(key);
    if (!Array.isArray(stored) || stored.length !== expected)
      throw new Error(`Migration verification failed for ${key}`);
  }
}

/** Probes that IndexedDB opens and the encryption key round-trips. */
async function probeIdb() {
  if (!isCryptoAvailable()) throw new Error("WebCrypto is not available");
  await openDb();
  const probe = await encryptJson({ ok: true });
  const back = await decryptJson<{ ok: boolean }>(probe);
  if (!back.ok) throw new Error("Encryption round-trip failed");
}

export async function migrateLegacyStorage(): Promise<MigrationResult> {
  if (typeof window === "undefined")
    return {
      status: "fallback",
      adapter: localStorageAdapter,
      migrated: empty,
      skipped: 0,
    };

  if (storedVersion() >= STORAGE_VERSION)
    return {
      status: "current",
      adapter: idbAdapter,
      migrated: empty,
      skipped: 0,
    };

  try {
    await probeIdb();
  } catch (error) {
    return {
      status: "fallback",
      adapter: localStorageAdapter,
      migrated: empty,
      skipped: 0,
      error,
    };
  }

  try {
    return await withLock(async () => {
      // Another tab may have finished while we waited for the lock.
      if (storedVersion() >= STORAGE_VERSION)
        return {
          status: "current" as const,
          adapter: idbAdapter,
          migrated: empty,
          skipped: 0,
        };
      return migrate();
    });
  } catch (error) {
    reportLovableError(error, { area: "storage", op: "migrate" });
    return {
      status: "failed",
      adapter: localStorageAdapter,
      migrated: empty,
      skipped: 0,
      error,
    };
  }
}
