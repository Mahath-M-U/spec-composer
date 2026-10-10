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
