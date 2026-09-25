import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Loading placeholder for image and preview areas. A <span> so it is valid
 * inside <button>; the parent must be positioned. Place it BEFORE the image.
 */
export function MediaSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <span className={cn("media-skeleton", className)} aria-hidden="true" />
  );
}

/** Shown in place of an image that failed to load. */
export function MediaFallback({ label }: { label: string }) {
  return (
    <span className="media-fallback" role="img" aria-label={label}>
      <ImageOff aria-hidden="true" size={22} />
      <span aria-hidden="true">{label}</span>
    </span>
  );
}
