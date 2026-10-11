import { useEditorStore } from "../store";
import { isFreeFloat, resolveAssetPatch, roleOf, type AssetItem } from "../asset-catalog";
import { recordAssetUse } from "../asset-usage-store";

/**
 * Adds a catalog item to the open document: resolves its patch against the
 * document's format and brand colors, then either drops it free (a drag
 * drop point, or a free-float item such as decor/badges — added and nudged
 * as today) or auto-slots it into its role's zone (a plain click on
 * anything else, replacing that role's current occupant). Records the use
 * for the Popular and Recently used rows. No-ops when there is no open
 * document.
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

  if (point || isFreeFloat(item)) {
    state.addElement(item.kind, point?.x, point?.y, patch, {
      atBack,
      preservePatchStyle: true,
    });
  } else {
    state.slotElement(roleOf(item), item.kind, patch, { atBack });
  }
  recordAssetUse(item.id);
}

/**
 * Swaps an on-canvas element for a different catalog item via the selection
 * context bar's swap strip: resolves the new item's patch against the
 * document's format and brand colors, same as `addCatalogAsset`, then
 * applies it with `swapAsset` instead of inserting a new element.
 */
export function swapCatalogAsset(elementId: string, item: AssetItem) {
  const state = useEditorStore.getState();
  const doc = state.doc;
  if (!doc) return;

  const { patch } = resolveAssetPatch(item, {
    format: { width: doc.format.width, height: doc.format.height },
    colors: {
      primary: doc.creativeDirection.primaryColor,
      secondary: doc.creativeDirection.secondaryColor,
    },
  });

  state.swapAsset(elementId, item.kind, patch);
  recordAssetUse(item.id);
}
