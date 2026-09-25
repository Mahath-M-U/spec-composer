export type StorageScope =
  "projects" | "brandKits" | "materialKits" | "assetUsage";

type Listener = (scope: StorageScope, remote: boolean) => void;

const CHANNEL = "spec-composer-storage";
const listeners = new Set<Listener>();
let channel: BroadcastChannel | undefined;

function getChannel() {
  if (channel || typeof BroadcastChannel === "undefined") return channel;
  channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event: MessageEvent<StorageScope>) => {
    listeners.forEach((listener) => listener(event.data, true));
  };
  return channel;
}

/** Tells this tab's listeners and every other open tab that `scope` changed. */
export function notifyStorageChange(scope: StorageScope) {
  listeners.forEach((listener) => listener(scope, false));
  getChannel()?.postMessage(scope);
}

export function subscribeStorageChanges(listener: Listener) {
  getChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
