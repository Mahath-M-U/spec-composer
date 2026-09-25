import { useEffect, useState, type RefObject } from "react";

/**
 * True once the element has come within `rootMargin` of the viewport, and
 * stays true afterwards. Starts false on server and client alike; without
 * IntersectionObserver it resolves to true right after mount.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { rootMargin = "240px" }: { rootMargin?: string } = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, inView]);

  return inView;
}
