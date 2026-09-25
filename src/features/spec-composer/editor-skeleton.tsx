import { MediaSkeleton } from "@/components/media-skeleton";

/**
 * Placeholder for the editor while its route chunk or project is loading.
 * Mirrors the editor shell grid so the page does not jump when it opens. It
 * deliberately has no `.artboard` element.
 */
export function EditorSkeleton() {
  return (
    <div className="editor-skeleton" role="status" aria-busy="true">
      <span className="sr-only">Opening composition…</span>
      <div className="editor-skeleton-block editor-skeleton-top">
        <MediaSkeleton />
      </div>
      <div className="editor-skeleton-block editor-skeleton-rail">
        <MediaSkeleton />
      </div>
      <div className="editor-skeleton-block editor-skeleton-left">
        <MediaSkeleton />
      </div>
      <div className="editor-skeleton-canvas">
        <div className="editor-skeleton-block editor-skeleton-page">
          <MediaSkeleton />
        </div>
      </div>
      <div className="editor-skeleton-block editor-skeleton-right">
        <MediaSkeleton />
      </div>
    </div>
  );
}
