import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ChevronsLeftRight } from "lucide-react";
import { MediaFallback, MediaSkeleton } from "@/components/media-skeleton";
import { useImageStatus } from "@/hooks/use-image-status";
import type { GalleryPrompt } from "./catalog";

export function BeforeAfter({ prompt }: { prompt: GalleryPrompt }) {
  const [split, setSplit] = useState(50);
  const activePointer = useRef<number | null>(null);
  const after = useImageStatus(prompt.afterImage);
  const before = useImageStatus(prompt.beforeImage);
  const failed = after.status === "error" || before.status === "error";
  const loading =
    !failed && (after.status !== "loaded" || before.status !== "loaded");

  const updateSplit = (event: PointerEvent<HTMLInputElement>) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    if (width > 0) {
      setSplit(
        Math.round(
          Math.max(0, Math.min(100, ((event.clientX - left) / width) * 100)),
        ),
      );
    }
  };
  const endPointer = (event: PointerEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (failed) {
    return (
      <div className="prompt-gallery-comparison prompt-gallery-comparison--unavailable">
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
        className="prompt-gallery-image prompt-gallery-image--after"
        src={prompt.afterImage}
        alt={prompt.afterAlt}
        loading="lazy"
        decoding="async"
        onLoad={after.onLoad}
        onError={after.onError}
      />
      <div className="prompt-gallery-before-layer">
        <img
          ref={before.ref}
          className="prompt-gallery-image"
          src={prompt.beforeImage}
          alt={prompt.beforeAlt}
          loading="lazy"
          decoding="async"
          onLoad={before.onLoad}
          onError={before.onError}
        />
      </div>
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
        onPointerDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
          if (
            event.button !== 0 ||
            !event.isPrimary ||
            activePointer.current !== null
          )
            return;
          event.currentTarget.focus();
          activePointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateSplit(event);
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
          if (activePointer.current !== event.pointerId) return;
          event.preventDefault();
          updateSplit(event);
        }}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={(event) => {
          event.stopPropagation();
          if (activePointer.current === event.pointerId)
            activePointer.current = null;
        }}
        onClick={(event) => event.stopPropagation()}
        aria-label={`Compare before and after: ${prompt.title}`}
        aria-valuetext={`${split}% before image visible`}
      />
    </div>
  );
}
