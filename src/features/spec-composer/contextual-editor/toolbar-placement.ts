import type { ScreenBox } from "../selection-context-bar";

export function contextualPopoverPlacement(
  selection: ScreenBox,
  contentSize: { width: number; height: number },
  viewport: { left?: number; top?: number; width: number; height: number },
) {
  const margin = 8,
    gap = 16,
    left = (viewport.left ?? 0) + margin,
    top = (viewport.top ?? 0) + margin,
    right = (viewport.left ?? 0) + viewport.width - margin,
    bottom = (viewport.top ?? 0) + viewport.height - margin,
    availableWidth = Math.max(1, right - left),
    availableHeight = Math.max(1, bottom - top),
    preferredWidth = Math.min(contentSize.width, availableWidth),
    preferredHeight = Math.min(contentSize.height, availableHeight),
    minimumWidth = Math.min(200, preferredWidth),
    minimumHeight = Math.min(160, preferredHeight);
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, max));
  const result = (
    side: "right" | "left" | "top" | "bottom",
    x: number,
    y: number,
    width: number,
    height: number,
  ) => ({
    side,
    left: x,
    top: y,
    width,
    height,
    maxHeight: height,
    sideOffset:
      side === "right"
        ? x - selection.left - selection.width
        : side === "left"
          ? selection.left - x - width
          : side === "bottom"
            ? y - selection.top - selection.height
            : selection.top - y - height,
    alignOffset:
      side === "right" || side === "left"
        ? y - selection.top
        : x - selection.left,
  });

  const rightSpace = right - selection.left - selection.width - gap;
  const leftSpace = selection.left - gap - left;
  const sides = leftSpace > rightSpace
    ? ["left", "right"] as const
    : ["right", "left"] as const;
  for (const side of sides) {
    const edge =
      side === "right"
        ? Math.max(left, selection.left + selection.width + gap)
        : Math.min(right, selection.left - gap);
    const space = side === "right" ? right - edge : edge - left;
    if (space < minimumWidth) continue;
    const width = Math.min(preferredWidth, space);
    return result(
      side,
      side === "right" ? edge : edge - width,
      clamp(selection.top, top, bottom - preferredHeight),
      width,
      preferredHeight,
    );
  }

  for (const side of ["top", "bottom"] as const) {
    const edge =
      side === "top"
        ? Math.min(bottom, selection.top - gap)
        : Math.max(top, selection.top + selection.height + gap);
    const space = side === "top" ? edge - top : bottom - edge;
    if (space < minimumHeight) continue;
    const height = Math.min(preferredHeight, space);
    return result(
      side,
      clamp(selection.left, left, right - preferredWidth),
      side === "top" ? edge - height : edge,
      preferredWidth,
      height,
    );
  }

  // Keep the selected artwork unobscured when no separated menu area exists.
  return null;
}

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
