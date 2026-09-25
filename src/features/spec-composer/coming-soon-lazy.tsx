import { lazy, Suspense } from "react";

/**
 * The coming-soon splashes carry a lot of inline SVG and only open after a
 * click, so their code loads on first use instead of with the page.
 */
type SplashProps = { close: () => void };

const McpInner = lazy(() =>
  import("./coming-soon").then((m) => ({ default: m.McpComingSoonSplash })),
);
const ChatInner = lazy(() =>
  import("./coming-soon").then((m) => ({ default: m.ChatComingSoonSplash })),
);
const CreativeRemixInner = lazy(() =>
  import("./coming-soon").then((m) => ({
    default: m.CreativeRemixComingSoonSplash,
  })),
);

export function McpComingSoonSplash(props: SplashProps) {
  return (
    <Suspense fallback={null}>
      <McpInner {...props} />
    </Suspense>
  );
}

export function ChatComingSoonSplash(props: SplashProps) {
  return (
    <Suspense fallback={null}>
      <ChatInner {...props} />
    </Suspense>
  );
}

export function CreativeRemixComingSoonSplash(props: SplashProps) {
  return (
    <Suspense fallback={null}>
      <CreativeRemixInner {...props} />
    </Suspense>
  );
}
