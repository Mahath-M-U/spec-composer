import { useCallback, useRef, type KeyboardEvent } from "react";

/**
 * Roving keyboard navigation for a row or grid of asset tiles: arrows move
 * focus between `[data-roving-tile]` elements inside the container, Home and
 * End jump to the first/last tile. Enter and Space add the focused tile
 * because tiles render as native `<button>`s, so no extra handling is
 * needed for those two keys.
 */
export function useRovingGrid(columns: number | "row") {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const tiles = Array.from(
        container.querySelectorAll<HTMLElement>("[data-roving-tile]"),
      );
      if (!tiles.length) return;
      const active = document.activeElement;
      const index = active ? tiles.indexOf(active as HTMLElement) : -1;
      let next = index;
      switch (event.key) {
        case "ArrowRight":
          next = Math.min(tiles.length - 1, index + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, index - 1);
          break;
        case "ArrowDown":
          if (columns === "row") return;
          next = Math.min(tiles.length - 1, index + columns);
          break;
        case "ArrowUp":
          if (columns === "row") return;
          next = Math.max(0, index - columns);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = tiles.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      tiles[next]?.focus();
    },
    [columns],
  );

  return { containerRef, onKeyDown };
}
