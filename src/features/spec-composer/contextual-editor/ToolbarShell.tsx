import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { ScreenBox } from "../selection-context-bar";
import { toolbarPlacement } from "./toolbar-placement";
import "./contextual-editor.css";

/** Shared floating shell for canvas-anchored toolbars (the element
 * contextual toolbar and the scene-object toolbar): clamps screen position
 * relative to an anchor box to the workspace, and owns the toolbar's
 * keyboard contract (Escape, roving arrow-key focus between buttons).
 * Content is entirely up to the caller. */
export const ToolbarShell = forwardRef<
  HTMLDivElement,
  {
    anchor: ScreenBox;
    ariaLabel: string;
    className?: string;
    onEscape?: () => void;
    children: ReactNode;
  }
>(function ToolbarShell({ anchor, ariaLabel, className, onEscape, children }, forwardedRef) {
  const bar = useRef<HTMLDivElement | null>(null);
  const setRefs = (node: HTMLDivElement | null) => {
    bar.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };
  const { left, top, width, height } = anchor;
  const [position, setPosition] = useState({
    left: anchor.left,
    top: Math.max(8, anchor.top - 64),
  });
  useLayoutEffect(() => {
    const node = bar.current,
      workspace = node?.closest<HTMLElement>(".workspace");
    if (!node || !workspace) return;
    const place = () =>
      setPosition(
        toolbarPlacement(
          { left, top, width, height },
          { width: node.offsetWidth, height: node.offsetHeight },
          { width: workspace.clientWidth, height: workspace.clientHeight },
        ),
      );
    place();
    const observer = new ResizeObserver(place);
    observer.observe(workspace);
    observer.observe(node);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [left, top, width, height]);
  return (
    <div
      ref={setRefs}
      data-canvas-ui
      className={`floating-contextual-toolbar ui-toolbar${className ? ` ${className}` : ""}`}
      role="toolbar"
      aria-label={ariaLabel}
      style={{ left: position.left, top: position.top }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          onEscape?.();
          return;
        }
        if (
          (event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "Home" ||
            event.key === "End") &&
          event.target instanceof HTMLButtonElement &&
          event.currentTarget.contains(event.target)
        ) {
          const buttons = [
            ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
              ":scope > button, :scope > [data-radix-popper-content-wrapper] button",
            ),
          ];
          const current = buttons.indexOf(event.target);
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : (current +
                    (event.key === "ArrowRight" ? 1 : -1) +
                    buttons.length) %
                  buttons.length;
          event.preventDefault();
          buttons[next]?.focus();
        }
      }}
    >
      {children}
    </div>
  );
});
