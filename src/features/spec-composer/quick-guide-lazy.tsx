import { lazy, Suspense } from "react";

/**
 * The quick tour's overlay carries its own layout math and DOM measuring
 * logic and only opens after a click, so its code loads on first use
 * instead of with the page.
 */
export type QuickGuidePage = "editor" | "home" | "brand-kit";
type QuickGuideProps = { page: QuickGuidePage; close: () => void };

const Inner = lazy(() => import("./quick-guide"));

export function QuickGuide(props: QuickGuideProps) {
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}
