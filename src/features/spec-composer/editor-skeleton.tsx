import { Fragment } from "react";
import { MediaSkeleton } from "@/components/media-skeleton";

function Bone({ shape }: { shape: string }) {
  return (
    <MediaSkeleton className={`editor-skeleton-bone editor-skeleton-bone--${shape}`} />
  );
}

/**
 * Placeholder for the editor while its route chunk or project is loading.
 * Mirrors the editor shell's grid and chrome (rail, left panel, canvas page,
 * right panel) with low-detail bone shapes so the page does not jump when it
 * opens. It deliberately has no `.artboard` element.
 */
export function EditorSkeleton() {
  return (
    <div className="editor-skeleton" role="status" aria-busy="true">
      <span className="sr-only">Opening composition…</span>
      <div className="editor-skeleton-block editor-skeleton-top">
        <MediaSkeleton />
      </div>
      <div className="editor-skeleton-panel editor-skeleton-rail">
        <Bone shape="icon" />
        <div className="editor-skeleton-rail-nav">
          {Array.from({ length: 6 }).map((_, index) => (
            <Bone key={index} shape="icon" />
          ))}
        </div>
        <div className="editor-skeleton-rail-foot">
          <Bone shape="icon" />
          <Bone shape="icon" />
        </div>
      </div>
      <div className="editor-skeleton-panel editor-skeleton-left">
        <Bone shape="title" />
        <Bone shape="field" />
        <div className="editor-skeleton-tiles">
          {Array.from({ length: 6 }).map((_, index) => (
            <Bone key={index} shape="tile" />
          ))}
        </div>
        <div className="editor-skeleton-rows">
          <Bone shape="line-long" />
          <Bone shape="line" />
          <Bone shape="line-short" />
        </div>
      </div>
      <div className="editor-skeleton-canvas">
        <div className="editor-skeleton-page">
          <div className="editor-skeleton-page-body">
            <Bone shape="title-wide" />
            <Bone shape="title-narrow" />
            <Bone shape="media" />
            <Bone shape="line-long" />
            <Bone shape="line" />
            <Bone shape="line-short" />
          </div>
        </div>
        <div className="editor-skeleton-zoom">
          <Bone shape="pill" />
        </div>
      </div>
      <div className="editor-skeleton-panel editor-skeleton-right">
        <div className="editor-skeleton-right-head">
          <Bone shape="segment" />
          <Bone shape="segment" />
          <Bone shape="segment" />
        </div>
        <div className="editor-skeleton-right-body">
          {Array.from({ length: 4 }).map((_, index) => (
            <Fragment key={index}>
              <Bone shape="line-short" />
              <Bone shape="field" />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
