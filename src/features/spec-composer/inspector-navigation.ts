import { useEditorStore } from "./store";
import type { SidebarLayout } from "./use-sidebar-layout";

/** Reveals the inspector for an intentional selection, including overlay drawers. */
export function openStyleEditor(
  sidebars: SidebarLayout,
  { preserveActiveTab = false }: { preserveActiveTab?: boolean } = {},
) {
  const store = useEditorStore.getState();
  if (
    !store.doc ||
    (!store.backgroundSelected &&
      !store.doc.elements.some((element) =>
        store.selectedIds.includes(element.id),
      ))
  )
    return;
  const keepTab = preserveActiveTab && store.panel === "style";
  store.setPanel("style");
  if (!keepTab) store.setStyleTab("style");
  if (!sidebars.leftOpen) sidebars.setOpen("left", true);
}
