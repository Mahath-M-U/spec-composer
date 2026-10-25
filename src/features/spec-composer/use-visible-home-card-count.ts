import { useCallback, useEffect, useState } from "react";

/** Measure one row when its strip actually mounts, including after an empty state. */
export function useVisibleHomeCardCount() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(1);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container) return;

    const updateVisibleCount = () => {
      const styles = getComputedStyle(container);
      const minCardWidth =
        Number.parseFloat(styles.getPropertyValue("--home-card-min-width")) ||
        210;
      const columnGap = Number.parseFloat(styles.columnGap) || 0;
      const count = Math.max(
        1,
        Math.floor(
          (container.clientWidth + columnGap) / (minCardWidth + columnGap),
        ),
      );
      setVisibleCount((current) => (current === count ? current : count));
    };

    updateVisibleCount();
    const observer = new ResizeObserver(updateVisibleCount);
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  return { containerRef, visibleCount };
}
