import { useState, type CSSProperties } from "react";
import { ChevronsLeftRight } from "lucide-react";
import { MediaFallback, MediaSkeleton } from "@/components/media-skeleton";
import { useImageStatus } from "@/hooks/use-image-status";
import type { GalleryPrompt } from "./catalog";

export function BeforeAfter({ prompt }: { prompt: GalleryPrompt }) {
  const [split, setSplit] = useState(50);
  const after = useImageStatus(prompt.afterImage);
  const before = useImageStatus(prompt.beforeImage);
  const failed = after.status === "error" || before.status === "error";
  const loading =
    !failed && (after.status !== "loaded" || before.status !== "loaded");

  if (failed) {
    return (
      <div className="prompt-gallery-comparison">
        <MediaFallback label="Preview unavailable" />
      </div>
    );
  }

  return (
    <div
      className="prompt-gallery-comparison"
      style={{ "--split": `${split}%` } as CSSProperties}
    >
      {loading && <MediaSkeleton />}
      <img
        ref={after.ref}
        className="prompt-gallery-image"
        src={prompt.afterImage}
        alt={prompt.afterAlt}
        width={1024}
        height={1536}
        loading="lazy"
        decoding="async"
        onLoad={after.onLoad}
        onError={after.onError}
      />
      <img
        ref={before.ref}
        className="prompt-gallery-image prompt-gallery-image--before"
        src={prompt.beforeImage}
        alt={prompt.beforeAlt}
        width={1024}
        height={1536}
        loading="lazy"
        decoding="async"
        onLoad={before.onLoad}
        onError={before.onError}
      />
      <span
        className="prompt-gallery-image-label prompt-gallery-image-label--before"
        aria-hidden="true"
      >
        Before
      </span>
      <span
        className="prompt-gallery-image-label prompt-gallery-image-label--after"
        aria-hidden="true"
      >
        After
      </span>
      <span className="prompt-gallery-divider" aria-hidden="true">
        <span className="prompt-gallery-handle">
          <ChevronsLeftRight aria-hidden="true" />
        </span>
      </span>
      <input
        className="prompt-gallery-range"
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(event) => setSplit(Number(event.target.value))}
        aria-label={`Compare before and after: ${prompt.title}`}
        aria-valuetext={`${split}% before image visible`}
      />
    </div>
  );
}
