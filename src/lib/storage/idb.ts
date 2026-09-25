import { isQuotaError, StorageQuotaError } from "./local";

export const DB_NAME = "spec-composer";
export const DB_VERSION = 1;

export const STORES = {
  projects: "projects",
  kv: "kv",
  meta: "meta",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | undefined;

export function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Resolves when the transaction commits; rejects on error or abort. */
export function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    const fail = () => {
      const error =
        tx.error ?? new DOMException("Transaction aborted", "AbortError");
      reject(isQuotaError(error) ? new StorageQuotaError(error) : error);
    };
    tx.onerror = fail;
    tx.onabort = fail;
  });
}

export function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined")
    return Promise.reject(new Error("IndexedDB is not available"));
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.projects)) {
        const projects = db.createObjectStore(STORES.projects, {
          keyPath: "id",
        });
        projects.createIndex("savedAt", "savedAt");
      }
      if (!db.objectStoreNames.contains(STORES.kv))
        db.createObjectStore(STORES.kv);
      if (!db.objectStoreNames.contains(STORES.meta))
        db.createObjectStore(STORES.meta);
    };
    request.onblocked = () =>
      reject(new Error("IndexedDB upgrade blocked by another open tab"));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      // Let a newer version in another tab upgrade instead of blocking it.
      db.onversionchange = () => {
        db.close();
        dbPromise = undefined;
      };
      db.onclose = () => {
        dbPromise = undefined;
      };
      resolve(db);
    };
  }).catch((error: unknown) => {
    dbPromise = undefined;
    throw error;
  });
  return dbPromise;
}
