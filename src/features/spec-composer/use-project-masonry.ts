import { useCallback, useEffect, useState } from "react";

/** Preserve source order while packing native-height project cards into full-width columns. */
export function useProjectMasonry(collectionKey: string) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container) return;
    const items = Array.from(container.children).filter((item) =>
      item.classList.contains("project-masonry-item"),
    ) as HTMLElement[];
    let frame: number | null = null;
    let active = true;

    const measure = () => {
      frame = null;
      if (!active) return;
      const styles = getComputedStyle(container);
      const minWidth =
        Number.parseFloat(
          styles.getPropertyValue("--project-masonry-min-width"),
        ) || 210;
      const maxColumns =
        Number.parseInt(
          styles.getPropertyValue("--project-masonry-max-columns"),
          10,
        ) || 5;
      const gap = Number.parseFloat(styles.columnGap) || 0;
      const capacity = Math.max(
        1,
        Math.min(
          maxColumns,
          Math.floor((container.clientWidth + gap) / (minWidth + gap)),
        ),
      );
      const columns = String(Math.max(1, Math.min(items.length, capacity)));
      if (
        container.style.getPropertyValue("--project-masonry-columns") !==
        columns
      )
        container.style.setProperty("--project-masonry-columns", columns);
      if (container.dataset["projectMasonry"] !== "ready")
        container.dataset["projectMasonry"] = "ready";

      // offsetHeight ignores the card's hover transform. Start alignment keeps
      // the wrapper intrinsic rather than stretching it to its assigned span.
      const spans = items.map((item) => {
        const spacing =
          Number.parseFloat(getComputedStyle(item).marginBottom) || 0;
        const rowEnd = `span ${Math.max(1, Math.ceil(item.offsetHeight + spacing))}`;
        return { item, rowEnd };
      });
      for (const { item, rowEnd } of spans) {
        if (item.style.gridRowEnd !== rowEnd) item.style.gridRowEnd = rowEnd;
      }
    };
    const schedule = () => {
      if (active && frame === null) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    items.forEach((item) => observer.observe(item));
    schedule();

    return () => {
      active = false;
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
      delete container.dataset["projectMasonry"];
      container.style.removeProperty("--project-masonry-columns");
      items.forEach((item) => item.style.removeProperty("grid-row-end"));
    };
  }, [container, collectionKey]);

  return containerRef;
}
