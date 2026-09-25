/** Thrown when a write fails because the browser storage quota is exhausted. */
export class StorageQuotaError extends Error {
  override name = "StorageQuotaError";
  constructor(cause?: unknown) {
    super("Browser storage is full.", { cause });
  }
}

export function isQuotaError(error: unknown): boolean {
  if (error instanceof StorageQuotaError) return true;
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
}

const hasWindow = () => typeof window !== "undefined";

export function readRaw(key: string): string | null {
  if (!hasWindow()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Writes a string; rethrows quota failures as {@link StorageQuotaError}. */
export function writeRaw(key: string, value: string) {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (isQuotaError(error)) throw new StorageQuotaError(error);
    throw error;
  }
}

export function writeJson(key: string, value: unknown) {
  writeRaw(key, JSON.stringify(value));
}

export function removeKey(key: string) {
  if (!hasWindow()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage disabled — nothing to remove.
  }
}
