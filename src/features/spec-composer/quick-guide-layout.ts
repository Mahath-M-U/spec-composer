/**
 * Pure geometry helpers for the quick-tour callout. No React or DOM globals
 * so this can be unit-tested and reasoned about without a browser.
 */

export type Rect = { top: number; left: number; width: number; height: number };
type Size = { width: number; height: number };

export type CalloutPlacement = {
  top: number;
  left: number;
  side: "right" | "left" | "bottom" | "top" | "center";
};

/**
 * Places the tour card next to `target`, preferring right, then left, then
 * bottom, then top — the first side that fits within the viewport (minus
 * `margin`) wins. Falls back to a centered placement when there's no target
 * or nothing fits.
 */
export function placeCallout(
  target: Rect | null,
  card: Size,
  viewport: Size,
  gap = 16,
  margin = 16,
): CalloutPlacement {
  if (!target) return centerCallout(card, viewport, margin);

  const targetCenterY = target.top + target.height / 2;
  const targetCenterX = target.left + target.width / 2;

  const candidates: CalloutPlacement[] = [
    {
      side: "right",
      top: targetCenterY - card.height / 2,
      left: target.left + target.width + gap,
    },
    {
      side: "left",
      top: targetCenterY - card.height / 2,
      left: target.left - gap - card.width,
    },
    {
      side: "bottom",
      top: target.top + target.height + gap,
      left: targetCenterX - card.width / 2,
    },
    {
      side: "top",
      top: target.top - gap - card.height,
      left: targetCenterX - card.width / 2,
    },
  ];

  for (const candidate of candidates) {
    if (fits(candidate, card, viewport, margin)) {
      return clampCallout(candidate, card, viewport, margin);
    }
  }

  return centerCallout(card, viewport, margin);
}

function fits(
  placement: CalloutPlacement,
  card: Size,
  viewport: Size,
  margin: number,
): boolean {
  return (
    placement.top >= margin &&
    placement.left >= margin &&
    placement.top + card.height <= viewport.height - margin &&
    placement.left + card.width <= viewport.width - margin
  );
}

function clampCallout(
  placement: CalloutPlacement,
  card: Size,
  viewport: Size,
  margin: number,
): CalloutPlacement {
  return {
    side: placement.side,
    top: clamp(
      placement.top,
      margin,
      Math.max(margin, viewport.height - margin - card.height),
    ),
    left: clamp(
      placement.left,
      margin,
      Math.max(margin, viewport.width - margin - card.width),
    ),
  };
}

function centerCallout(
  card: Size,
  viewport: Size,
  margin: number,
): CalloutPlacement {
  return {
    side: "center",
    top: clamp(
      (viewport.height - card.height) / 2,
      margin,
      Math.max(margin, viewport.height - margin - card.height),
    ),
    left: clamp(
      (viewport.width - card.width) / 2,
      margin,
      Math.max(margin, viewport.width - margin - card.width),
    ),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Builds the `d` attribute for a quadratic-curve arrow from the card edge
 * facing `target` to the nearest point on the target's edge.
 */
export function arrowPath(
  card: Rect,
  target: Rect,
  side: "right" | "left" | "bottom" | "top" | "center",
  inset = 6,
): string {
  const cardCenterX = card.left + card.width / 2;
  const cardCenterY = card.top + card.height / 2;
  const targetCenterX = target.left + target.width / 2;
  const targetCenterY = target.top + target.height / 2;

  let startX: number;
  let startY: number;
  let endX: number;
  let endY: number;

  if (side === "right") {
    startX = card.left;
    startY = cardCenterY;
    endX = target.left + target.width - inset;
    endY = targetCenterY;
  } else if (side === "left") {
    startX = card.left + card.width;
    startY = cardCenterY;
    endX = target.left + inset;
    endY = targetCenterY;
  } else if (side === "bottom") {
    startX = cardCenterX;
    startY = card.top;
    endX = targetCenterX;
    endY = target.top + target.height - inset;
  } else {
    // "top" and "center" both draw upward from the card toward the target.
    startX = cardCenterX;
    startY = card.top + card.height;
    endX = targetCenterX;
    endY = target.top + inset;
  }

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy) || 1;
  const perpX = -dy / length;
  const perpY = dx / length;
  const bow = Math.min(24, length * 0.25);
  const controlX = midX + perpX * bow;
  const controlY = midY + perpY * bow;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
}
