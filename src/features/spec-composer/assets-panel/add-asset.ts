import { useEditorStore } from "../store";
import { resolveAssetPatch, type AssetItem } from "../asset-catalog";
import { recordAssetUse } from "../asset-usage-store";

/**
 * Adds a catalog item to the open document: resolves its patch against the
 * document's format and brand colors, adds the element (optionally at a
 * drop point, otherwise clamped inside the canvas), and records the use for
 * the Popular and Recently used rows. No-ops when there is no open document.
 */
export function addCatalogAsset(
  item: AssetItem,
  point?: { x: number; y: number },
) {
  const state = useEditorStore.getState();
  const doc = state.doc;
  if (!doc) return;

  const { patch, atBack } = resolveAssetPatch(item, {
    format: { width: doc.format.width, height: doc.format.height },
    colors: {
      primary: doc.creativeDirection.primaryColor,
      secondary: doc.creativeDirection.secondaryColor,
    },
  });

  state.addElement(item.kind, point?.x, point?.y, patch, {
    atBack,
    preservePatchStyle: true,
  });
  recordAssetUse(item.id);
}
