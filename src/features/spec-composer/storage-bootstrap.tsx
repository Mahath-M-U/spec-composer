import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { subscribeStorageChanges } from "@/lib/storage/events";
import { projectKeys } from "./queries";
import { useEditorStore } from "./store";
import { initStorage, requestPersistentStorage } from "./storage";

/**
 * Client-only storage lifecycle: runs the legacy migration, hydrates kits,
 * keeps queries in sync with writes from this and other tabs, and flushes
 * pending autosaves when the page is hidden.
 */
export function StorageBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await initStorage();
      if (cancelled) return;
      if (result.status === "failed")
        toast.warning("Couldn't upgrade local storage", {
          description:
            "Your designs are safe and still saved in this browser. We'll retry next time.",
        });
      else if (result.status === "fallback")
        toast.warning("Limited storage in this browser", {
          description:
            navigator.locks
              ? "Designs are saved unencrypted with less space (e.g. in private windows)."
              : "Designs are saved unencrypted. This browser cannot protect edits made in multiple tabs; use one tab at a time.",
        });
      else if (result.skipped)
        toast.warning(`${result.skipped} damaged item(s) couldn't be restored`);
      if (result.status === "migrated" || result.status === "current")
        void requestPersistentStorage();

      await useEditorStore.getState().hydrate();
      if (!cancelled)
        void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    })();

    const unsubscribe = subscribeStorageChanges((scope, remote) => {
      if (scope === "projects") {
        void queryClient.invalidateQueries({ queryKey: projectKeys.all });
        if (remote) void useEditorStore.getState().checkRemoteChange();
        return;
      }
      // Local kit writes already updated the store; only reload remote ones.
      if (remote) void useEditorStore.getState().hydrate();
    });

    const flush = () => {
      if (useEditorStore.getState().saveStatus === "saving")
        void useEditorStore.getState().saveNow();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      unsubscribe();
      removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [queryClient]);

  return null;
}
