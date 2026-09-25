import {
  decryptJson,
  encryptJson,
  type EncryptedPayload,
} from "@/lib/storage/crypto";
import { done, openDb, promisify, STORES } from "@/lib/storage/idb";
import { readJson, writeJson } from "@/lib/storage/local";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { KV_KEYS, LS_KEYS, MAX_PROJECTS, type KvKey } from "./keys";

export interface ProjectRecord {
  id: string;
}

/**
 * Backend-agnostic persistence. Projects come back most-recently-saved first
 * and are returned unvalidated — callers own schema checks.
 */
export interface StorageAdapter {
  kind: "indexeddb" | "localStorage";
  listProjects(): Promise<unknown[]>;
  getProject(id: string): Promise<unknown>;
  /** Upserts one project and moves it to the front of the list. */
  putProject(project: ProjectRecord): Promise<void>;
  /** Upserts many projects, keeping their current position in the list. */
  putProjects(projects: ProjectRecord[]): Promise<void>;
  deleteProject(id: string): Promise<void>;
  getKv(key: KvKey): Promise<unknown>;
  setKv(key: KvKey, value: unknown): Promise<void>;
}

/** Shape stored in the `projects` object store; only id/savedAt are plaintext. */
export interface StoredProject extends EncryptedPayload {
  id: string;
  savedAt: number;
}

let lastSavedAt = 0;

/** Strictly increasing within a tab, so same-millisecond saves keep order. */
function nextSavedAt() {
  lastSavedAt = Math.max(Date.now(), lastSavedAt + 1);
  return lastSavedAt;
}

export async function encryptProject(
  project: ProjectRecord,
  savedAt: number,
): Promise<StoredProject> {
  return { id: project.id, savedAt, ...(await encryptJson(project)) };
}

/** Deletes the oldest projects beyond {@link MAX_PROJECTS} inside `tx`. */
function pruneInTx(tx: IDBTransaction) {
  const store = tx.objectStore(STORES.projects);
  const count = store.count();
  count.onsuccess = () => {
    let excess = count.result - MAX_PROJECTS;
    if (excess <= 0) return;
    const cursor = store.index("savedAt").openCursor();
    cursor.onsuccess = () => {
      const current = cursor.result;
      if (!current || excess <= 0) return;
      current.delete();
      excess -= 1;
      current.continue();
    };
  };
}

async function decryptProject(record: StoredProject) {
  try {
    return await decryptJson(record);
  } catch (error) {
    reportLovableError(error, {
      area: "storage",
      op: "decrypt",
      id: record.id,
    });
    return undefined;
  }
}

export const idbAdapter: StorageAdapter = {
  kind: "indexeddb",

  async listProjects() {
    const db = await openDb();
    const tx = db.transaction(STORES.projects, "readonly");
    const records = await promisify<StoredProject[]>(
      tx.objectStore(STORES.projects).index("savedAt").getAll(),
    );
    const docs = await Promise.all(records.reverse().map(decryptProject));
    return docs.filter((doc) => doc !== undefined);
  },

  async getProject(id) {
    const db = await openDb();
    const tx = db.transaction(STORES.projects, "readonly");
    const record = await promisify<StoredProject | undefined>(
      tx.objectStore(STORES.projects).get(id),
    );
    return record ? decryptProject(record) : undefined;
  },

  async putProject(project) {
    const record = await encryptProject(project, nextSavedAt());
    const db = await openDb();
    const tx = db.transaction(STORES.projects, "readwrite");
    tx.objectStore(STORES.projects).put(record);
    pruneInTx(tx);
    await done(tx);
  },

  async putProjects(projects) {
    if (!projects.length) return;
    const db = await openDb();
    const read = db.transaction(STORES.projects, "readonly");
    const existing = await promisify<StoredProject[]>(
      read.objectStore(STORES.projects).getAll(),
    );
    const savedAt = new Map(existing.map((r) => [r.id, r.savedAt]));
    // New projects go to the front, first one most recent.
    const fresh = projects.filter((p) => !savedAt.has(p.id)).reverse();
    fresh.forEach((p) => savedAt.set(p.id, nextSavedAt()));
    // Encrypt before opening the write transaction — awaiting inside an IDB
    // transaction lets it auto-commit.
    const records = await Promise.all(
      projects.map((p) => encryptProject(p, savedAt.get(p.id) ?? 0)),
    );
    const tx = db.transaction(STORES.projects, "readwrite");
    const store = tx.objectStore(STORES.projects);
    records.forEach((record) => store.put(record));
    pruneInTx(tx);
    await done(tx);
  },

  async deleteProject(id) {
    const db = await openDb();
    const tx = db.transaction(STORES.projects, "readwrite");
    tx.objectStore(STORES.projects).delete(id);
    await done(tx);
  },

  async getKv(key) {
    const db = await openDb();
    const tx = db.transaction(STORES.kv, "readonly");
    const record = await promisify<EncryptedPayload | undefined>(
      tx.objectStore(STORES.kv).get(key),
    );
    if (!record) return undefined;
    try {
      return await decryptJson(record);
    } catch (error) {
      reportLovableError(error, { area: "storage", op: "decrypt", key });
      return undefined;
    }
  },

  async setKv(key, value) {
    const record = await encryptJson(value);
    const db = await openDb();
    const tx = db.transaction(STORES.kv, "readwrite");
    tx.objectStore(STORES.kv).put(record, key);
    await done(tx);
  },
};

const kvToLs: Record<KvKey, string> = {
  [KV_KEYS.brandKits]: LS_KEYS.brandKits,
  [KV_KEYS.materialKits]: LS_KEYS.materialKits,
};

const readLsProjects = () => {
  const value = readJson<unknown>(LS_KEYS.projects, []);
  return Array.isArray(value) ? (value as ProjectRecord[]) : [];
};

/** Plaintext localStorage fallback when IndexedDB/WebCrypto are unusable. */
export const localStorageAdapter: StorageAdapter = {
  kind: "localStorage",

  async listProjects() {
    return readLsProjects();
  },

  async getProject(id) {
    return readLsProjects().find((p) => p?.id === id);
  },

  async putProject(project) {
    const rest = readLsProjects().filter((p) => p?.id !== project.id);
    writeJson(LS_KEYS.projects, [project, ...rest].slice(0, MAX_PROJECTS));
  },

  async putProjects(projects) {
    const byId = new Map(projects.map((p) => [p.id, p]));
    const current = readLsProjects();
    const merged = current.map((p) => byId.get(p?.id) ?? p);
    const known = new Set(current.map((p) => p?.id));
    const added = projects.filter((p) => !known.has(p.id));
    writeJson(LS_KEYS.projects, [...added, ...merged].slice(0, MAX_PROJECTS));
  },

  async deleteProject(id) {
    writeJson(
      LS_KEYS.projects,
      readLsProjects().filter((p) => p?.id !== id),
    );
  },

  async getKv(key) {
    return readJson<unknown>(kvToLs[key], undefined);
  },

  async setKv(key, value) {
    writeJson(kvToLs[key], value);
  },
};
