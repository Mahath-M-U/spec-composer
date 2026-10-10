import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Hint } from "@/components/ui/tooltip";
import { useEditorStore } from "./store";
import {
  elementRole,
  findAssetItem,
  roleOf,
  swapAlternatives,
  type AssetItem,
} from "./asset-catalog";
import { swapCatalogAsset } from "./assets-panel/add-asset";
import { AssetPreview } from "./assets-panel/asset-previews";
import { useRovingGrid } from "./assets-panel/use-roving-grid";
import { getBrandKitColor } from "./brand-kits";
import { backgroundStyle } from "./static-render";
import type { ArtColors } from "./illustrations";
import type { SpecElement } from "./types";

/** The screen-space box of the current selection, in `canvas-surface.tsx`'s
 * own coordinates (CSS pixels relative to the workspace, not the document). */
export interface ScreenBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const DETAIL_PLACEHOLDERS: Partial<Record<SpecElement["kind"], string>> = {
  humanModelImage: "Person doing what?",
  productImage: "Which product?",
};

/**
 * Floating bar under (or, if that would run off the workspace, above) the
 * single selected element: a one-click swap strip of same-role alternatives
 * when it was created from a catalog item, and — for subject images — a
 * short subject-detail field that feeds the compiled prompt (see
 * compiler.ts's `, specifically …` line). Keyboard events never reach the
 * window-level shortcut handler, so arrowing through the strip or typing a
 * detail can't nudge or delete the selected element.
 */
export function SelectionContextBar({
  el,
  screenBox,
}: {
  el: SpecElement;
  screenBox: ScreenBox;
}) {
  const doc = useEditorStore((s) => s.doc);
  const activeKit = useEditorStore((s) =>
    s.brandKits.find((kit) => kit.id === s.doc?.creativeDirection.brandKitId),
  );
  const barRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(screenBox.top + screenBox.height + 28);
  const { containerRef, onKeyDown } = useRovingGrid("row");
  const detailFirstKeystroke = useRef(true);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const workspace = bar?.closest<HTMLElement>(".workspace");
    const below = screenBox.top + screenBox.height + 28;
    if (!bar || !workspace) {
      setTop(below);
      return;
    }
    const barHeight = bar.offsetHeight;
    setTop(
      below + barHeight > workspace.clientHeight
        ? screenBox.top - 28 - barHeight
        : below,
    );
  }, [screenBox.top, screenBox.height]);

  if (!doc) return null;

  const item = el.assetId ? findAssetItem(el.assetId) : undefined;
  const alternatives =
    item && roleOf(item) !== "decor" ? swapAlternatives(item) : [];
  const role = elementRole(el, findAssetItem, doc.format);
  const showDetail = role === "subject";
  if (!alternatives.length && !showDetail) return null;

  const colors: ArtColors = {
    ink: doc.creativeDirection.primaryColor,
    accent: doc.creativeDirection.secondaryColor,
  };
  const paper = String(backgroundStyle(doc).background);
  const baseTextColor = activeKit
    ? ((
        getBrandKitColor(activeKit, "text") ??
        getBrandKitColor(activeKit, "primary") ??
        activeKit.colors.find(
          (color) => color.role !== "background" && color.role !== "text",
        )
      )?.hex ?? "#18181B")
    : "#18181B";

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onKeyDown(event);
  };

  return (
    <div
      ref={barRef}
      className="selection-context-bar"
      data-canvas-ui
      style={{ left: screenBox.left, top }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {alternatives.length > 0 && (
        <div
          ref={containerRef}
          className="selection-context-swap"
          role="group"
          aria-label="Swap asset"
          onKeyDown={handleKeyDown}
        >
          {alternatives.map((alt: AssetItem) => (
            <Hint key={alt.id} label={alt.label}>
              <button
                type="button"
                data-roving-tile
                className="selection-context-swap-button"
                aria-label={`Swap to ${alt.label}`}
                onClick={() => swapCatalogAsset(el.id, alt)}
              >
                <AssetPreview
                  item={alt}
                  colors={colors}
                  paper={paper}
                  baseTextColor={baseTextColor}
                />
              </button>
            </Hint>
          ))}
        </div>
      )}
      {showDetail && (
        <input
          type="text"
          className="selection-context-detail"
          maxLength={140}
          placeholder={DETAIL_PLACEHOLDERS[el.kind] ?? "Describe the subject"}
          value={el.detail ?? ""}
          onFocus={() => {
            detailFirstKeystroke.current = true;
          }}
          onChange={(event) => {
            useEditorStore
              .getState()
              .setElementDetail(
                el.id,
                event.target.value,
                detailFirstKeystroke.current,
              );
            detailFirstKeystroke.current = false;
          }}
        />
      )}
    </div>
  );
}
