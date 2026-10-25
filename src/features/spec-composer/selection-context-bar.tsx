import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
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

const SIDE_GAP = 12;

/** Where a floating control should sit relative to the selected element:
 * beside it (flipping to the left when it would otherwise run off the
 * right edge of the workspace) for the side Design Inspector shortcut, or
 * below it (or, if that would run off the workspace, above) for the
 * context bar. Pure so it can be used for both the unmeasured first
 * render and the measured layout pass. */
function placement(
  screenBox: ScreenBox,
  iconOnly: boolean,
  size?: { width: number; height: number },
  workspace?: { clientWidth: number; clientHeight: number },
): { left: number; top: number } {
  if (iconOnly) {
    const ringHalf = Math.max(32, screenBox.width) / 2;
    const cx = screenBox.left + screenBox.width / 2;
    const right = cx + ringHalf + SIDE_GAP;
    if (!size || !workspace) return { left: right, top: screenBox.top };
    let left = right;
    if (right + size.width > workspace.clientWidth - 4) {
      left = cx - ringHalf - SIDE_GAP - size.width;
    }
    left = Math.max(4, left);
    const top = Math.min(
      Math.max(screenBox.top, 4),
      workspace.clientHeight - size.height - 4,
    );
    return { left, top };
  }
  const below = screenBox.top + screenBox.height + 28;
  if (!size || !workspace) return { left: screenBox.left, top: below };
  const top =
    below + size.height > workspace.clientHeight
      ? screenBox.top - 28 - size.height
      : below;
  return { left: screenBox.left, top };
}

/**
 * Icon-only chip, placed beside the selected element with no bar chrome
 * behind it, that opens the Design Inspector's Style tab. Rendered for
 * every selected element regardless of whether the context bar below it
 * also has content.
 */
function SelectionInspectorShortcut({
  el,
  screenBox,
}: {
  el: SpecElement;
  screenBox: ScreenBox;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(placement(screenBox, true));

  useLayoutEffect(() => {
    const chip = ref.current;
    const workspace = chip?.closest<HTMLElement>(".workspace");
    if (!chip || !workspace) {
      setPos(placement(screenBox, true));
      return;
    }
    setPos(
      placement(
        screenBox,
        true,
        { width: chip.offsetWidth, height: chip.offsetHeight },
        workspace,
      ),
    );
  }, [screenBox.left, screenBox.top, screenBox.width, screenBox.height]);

  return (
    <div
      ref={ref}
      className="selection-context-bar is-side"
      data-canvas-ui
      style={{ left: pos.left, top: pos.top }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Hint label="Open Design Inspector">
        <button
          type="button"
          className="selection-template-inspector"
          aria-label="Open Design Inspector"
          onClick={() => {
            const state = useEditorStore.getState();
            state.select(el.id);
            state.setPanel("style");
            state.setStyleTab("style");
          }}
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
        </button>
      </Hint>
    </div>
  );
}

/**
 * Floating bar under (or, if that would run off the workspace, above) the
 * single selected element: a one-click swap strip of same-role alternatives
 * when it was created from a catalog item, and — for subject images — a
 * short subject-detail field that feeds the compiled prompt (see
 * compiler.ts's `, specifically …` line). Rendered only when it has swap or
 * detail content; the Design Inspector shortcut is always rendered beside
 * the element via `SelectionInspectorShortcut`, independent of this bar.
 * Keyboard events never reach the window-level shortcut handler, so
 * arrowing through the strip or typing a detail can't nudge or delete the
 * selected element.
 */
export function SelectionContextBar({
  el,
  screenBox,
  embedded = false,
}: {
  el: SpecElement;
  screenBox: ScreenBox;
  embedded?: boolean;
}) {
  const doc = useEditorStore((s) => s.doc);
  const activeKit = useEditorStore((s) =>
    s.brandKits.find((kit) => kit.id === s.doc?.creativeDirection.brandKitId),
  );

  const item = el.assetId ? findAssetItem(el.assetId) : undefined;
  const alternatives =
    item && roleOf(item) !== "decor" ? swapAlternatives(item) : [];
  const hasTemplate = el.kind === "shape" && !!el.descriptionTemplate;

  const barRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(placement(screenBox, false));
  const { containerRef, onKeyDown } = useRovingGrid("row");
  const detailFirstKeystroke = useRef(true);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const workspace = bar?.closest<HTMLElement>(".workspace");
    if (!bar || !workspace) {
      setPos(placement(screenBox, false));
      return;
    }
    setPos(
      placement(
        screenBox,
        false,
        { width: bar.offsetWidth, height: bar.offsetHeight },
        workspace,
      ),
    );
  }, [screenBox.left, screenBox.top, screenBox.width, screenBox.height]);

  if (!doc) return null;

  const role = elementRole(el, findAssetItem, doc.format);
  const showDetail =
    role === "subject" ||
    (el.kind === "shape" &&
      (el.semanticRole === "subject" ||
        el.semanticRole === "product" ||
        el.semanticRole === "text_area"));
  const showBar = alternatives.length > 0 || (showDetail && !hasTemplate);

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
    <>
      {showBar && (
        <div
          ref={barRef}
          className={`selection-context-bar${embedded ? " contextual-legacy" : ""}`}
          data-canvas-ui
          style={embedded ? undefined : { left: pos.left, top: pos.top }}
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
          {showDetail && !hasTemplate && (
            <input
              type="text"
              className="selection-context-detail"
              maxLength={140}
              aria-label="Region description"
              disabled={el.locked}
              placeholder={
                el.semanticRole === "text_area"
                  ? "Describe reserved copy space"
                  : el.semanticRole === "product"
                    ? "Which product?"
                    : (DETAIL_PLACEHOLDERS[el.kind] ?? "Describe the subject")
              }
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
      )}
      {!embedded && <SelectionInspectorShortcut el={el} screenBox={screenBox} />}
    </>
  );
}
