import type { ScreenBox } from "../selection-context-bar";

export function toolbarPlacement(
  box: ScreenBox,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const margin = 8,
    gap = 18,
    bottomControls = 54;
  const candidates = [
    {
      left: box.left + (box.width - size.width) / 2,
      top: box.top - size.height - gap,
    },
    {
      left: box.left + (box.width - size.width) / 2,
      top: box.top + box.height + gap,
    },
    { left: box.left + box.width + gap, top: Math.max(margin, box.top) },
    { left: box.left - size.width - gap, top: Math.max(margin, box.top) },
  ];
  const fits = (pos: (typeof candidates)[number]) =>
    pos.left >= margin &&
    pos.top >= margin &&
    pos.left + size.width <= viewport.width - margin &&
    pos.top + size.height <= viewport.height - bottomControls;
  const chosen = candidates.find(fits) ?? candidates[0]!;
  return {
    left: Math.max(
      margin,
      Math.min(chosen.left, viewport.width - size.width - margin),
    ),
    top: Math.max(
      margin,
      Math.min(chosen.top, viewport.height - size.height - bottomControls),
    ),
  };
}
