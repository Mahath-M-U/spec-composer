/**
 * At-rest encryption for IndexedDB payloads (AES-GCM 256, WebCrypto).
 *
 * The key is generated once as NON-EXTRACTABLE and stored as a CryptoKey in
 * the `meta` store, so its raw bytes never exist in JS or on disk in a readable
 * form. This defends against someone reading the profile's IndexedDB files or
 * browsing it in devtools; it does NOT defend against script running on this
 * origin, which can use the key just as the app does.
 */
import { done, openDb, promisify, STORES } from "./idb";

const KEY_ID = "aes-gcm-key";

export interface EncryptedPayload {
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
}

let keyPromise: Promise<CryptoKey> | undefined;

export function isCryptoAvailable() {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

async function readKey(): Promise<CryptoKey | undefined> {
  const db = await openDb();
  const tx = db.transaction(STORES.meta, "readonly");
  return promisify<CryptoKey | undefined>(
    tx.objectStore(STORES.meta).get(KEY_ID),
  );
}

async function loadOrCreateKey(): Promise<CryptoKey> {
  const existing = await readKey();
  if (existing) return existing;
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const db = await openDb();
  const tx = db.transaction(STORES.meta, "readwrite");
  // `add` fails if another tab stored a key first; theirs wins so both agree.
  tx.objectStore(STORES.meta).add(key, KEY_ID);
  try {
    await done(tx);
    return key;
  } catch {
    const winner = await readKey();
    if (winner) return winner;
    throw new Error("Could not persist encryption key");
  }
}

export function getKey(): Promise<CryptoKey> {
  keyPromise ??= loadOrCreateKey().catch((error: unknown) => {
    keyPromise = undefined;
    throw error;
  });
  return keyPromise;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function encryptJson(value: unknown): Promise<EncryptedPayload> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(value)),
  );
  return { iv, data };
}

export async function decryptJson<T = unknown>(
  payload: EncryptedPayload,
): Promise<T> {
  const key = await getKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: payload.iv },
    key,
    payload.data,
  );
  return JSON.parse(decoder.decode(plain)) as T;
}
