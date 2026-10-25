interface Size {
  width: number;
  height: number;
}

/** Match the layout footprint to the transformed artboard, with no canvas zoom limits. */
export function fitPreview(format: Size, available: Size) {
  if (
    [format.width, format.height, available.width, available.height].some(
      (value) => !Number.isFinite(value) || value <= 0,
    )
  )
    return null;
  const scale = Math.min(
    available.width / format.width,
    available.height / format.height,
  );
  if (!Number.isFinite(scale) || scale <= 0) return null;
  return { scale, width: format.width * scale, height: format.height * scale };
}
