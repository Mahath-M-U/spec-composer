import type { SpecDocument } from "./types";
import type { Box, Guide } from "./store";

const GRID = 4;
const SAFE_MARGIN_RATIO = 0.06;
const THRESHOLD_SCREEN_PX = 6;

interface Hit {
  target: number;
  delta: number;
}

function bestHit(
  values: number[],
  targets: number[],
  threshold: number,
): Hit | undefined {
  let best: Hit | undefined;
  for (const v of values) {
    for (const t of targets) {
      const delta = t - v;
      if (
        Math.abs(delta) <= threshold &&
        (!best || Math.abs(delta) < Math.abs(best.delta))
      ) {
        best = { target: t, delta };
      }
    }
  }
  return best;
}

export function computeSnap(
  box: Box,
  doc: SpecDocument,
  excludeIds: string[],
  zoom: number,
  bypass: boolean,
): { box: Box; guides: Guide[] } {
  if (bypass) return { box, guides: [] };
  const threshold = THRESHOLD_SCREEN_PX / Math.max(zoom, 0.05);
  const { width: W, height: H } = doc.format;
  const margin = Math.round(Math.min(W, H) * SAFE_MARGIN_RATIO);
  const guides: Guide[] = [];

  const left = box.x;
  const right = box.x + box.width;
  const centerX = box.x + box.width / 2;
  const top = box.y;
  const bottom = box.y + box.height;
  const centerY = box.y + box.height / 2;

  const xTargets = [0, margin, W / 2, W - margin, W];
  const yTargets = [0, margin, H / 2, H - margin, H];
  for (const el of doc.elements) {
    if (excludeIds.includes(el.id) || !el.visible) continue;
    xTargets.push(el.x, el.x + el.width, el.x + el.width / 2);
    yTargets.push(el.y, el.y + el.height, el.y + el.height / 2);
  }

  let nx = Math.round(box.x / GRID) * GRID;
  const xHit = bestHit([left, centerX, right], xTargets, threshold);
  if (xHit) {
    nx = Math.round(box.x + xHit.delta);
    guides.push({ axis: "x", pos: xHit.target });
  }

  let ny = Math.round(box.y / GRID) * GRID;
  const yHit = bestHit([top, centerY, bottom], yTargets, threshold);
  if (yHit) {
    ny = Math.round(box.y + yHit.delta);
    guides.push({ axis: "y", pos: yHit.target });
  }

  return {
    box: { x: nx, y: ny, width: box.width, height: box.height },
    guides,
  };
}
