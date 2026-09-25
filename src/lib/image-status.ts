export type ImageStatus = "loading" | "loaded" | "error";

/**
 * Derives the load state of an <img> from its DOM properties. Used to catch
 * loads and errors that finished before React hydrated the element.
 */
export function imageStatusOf(
  img: { complete: boolean; naturalWidth: number } | null,
): ImageStatus {
  if (!img || !img.complete) return "loading";
  return img.naturalWidth > 0 ? "loaded" : "error";
}

/** Shared loading attributes: eager + high fetch priority above the fold. */
export function imageLoadingProps(priority: boolean) {
  return {
    loading: priority ? "eager" : "lazy",
    decoding: "async",
    fetchPriority: priority ? "high" : "auto",
  } as const;
}
