import {
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { textStyle } from "./static-render";
import { useEditorStore } from "./store";
import type { SpecElement } from "./types";

/** Chrome/Edge support `contentEditable="plaintext-only"`, which strips
 * pasted formatting for free. Firefox and Safari don't: they fall back to
 * regular `contentEditable` plus a paste handler that inserts plain text. */
const supportsPlaintextOnly = (() => {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("div");
  try {
    probe.contentEditable = "plaintext-only";
  } catch {
    return false;
  }
  return probe.contentEditable === "plaintext-only";
})();

function selectAllText(node: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Places the caret at a client-coordinate point, falling back to
 * select-all when the browser has neither caret API or the point misses
 * the node (e.g. it lands in the element's padding). */
function placeCaretAt(node: HTMLElement, x: number, y: number) {
  const selection = window.getSelection();
  if (!selection) return;
  if (typeof document.caretPositionFromPoint === "function") {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos && node.contains(pos.offsetNode)) {
      const range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
  } else if (typeof document.caretRangeFromPoint === "function") {
    const range = document.caretRangeFromPoint(x, y);
    if (range && node.contains(range.startContainer)) {
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
  }
  selectAllText(node);
}

/**
 * Photoshop-style inline editor for one text layer: uncontrolled, so typing
 * never fights React re-renders, and edits land in the store through
 * `setElementText` — the first keystroke of a session pushes one undo step,
 * later keystrokes in the same session amend it.
 */
export function CanvasTextEditor({
  el,
  caret,
  onDone,
}: {
  el: SpecElement;
  /** Client-coordinate point to place the caret at; omit to select all. */
  caret?: { x: number; y: number } | undefined;
  onDone: (reason: "keyboard" | "blur") => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const firstEdit = useRef(true);
  const done = useRef(false);
  const keyboardExit = useRef(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.textContent = el.content ?? "";
    node.focus();
    if (caret) placeCaretAt(node, caret.x, caret.y);
    else selectAllText(node);
    // Runs once on mount: this editor is uncontrolled from then on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    onDone(keyboardExit.current ? "keyboard" : "blur");
  };

  return (
    <div
      ref={ref}
      data-text-editing
      className={`canvas-text kind-${el.kind} canvas-text-editing`}
      style={{ ...textStyle(el), caretColor: "transparent" }}
      contentEditable={supportsPlaintextOnly ? "plaintext-only" : "true"}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={`Edit ${el.name}`}
      spellCheck={false}
      onPointerDown={(e: ReactPointerEvent<HTMLDivElement>) =>
        e.stopPropagation()
      }
      onInput={() => {
        const node = ref.current;
        if (!node) return;
        useEditorStore
          .getState()
          .setElementText(el.id, node.innerText, firstEdit.current);
        firstEdit.current = false;
      }}
      onPaste={
        supportsPlaintextOnly
          ? undefined
          : (e: ClipboardEvent<HTMLDivElement>) => {
              e.preventDefault();
              document.execCommand(
                "insertText",
                false,
                e.clipboardData.getData("text/plain"),
              );
            }
      }
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          keyboardExit.current = true;
          e.currentTarget.blur();
          return;
        }
        if (e.key !== "Enter") return;
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          keyboardExit.current = true;
          e.currentTarget.blur();
          return;
        }
        // Full contentEditable (the plaintext-only fallback) splits into new
        // paragraphs by default; force a plain line break instead, matching
        // plaintext-only's native Enter/Shift+Enter behavior.
        if (!supportsPlaintextOnly) {
          e.preventDefault();
          document.execCommand("insertText", false, "\n");
        }
      }}
      onBlur={commit}
    />
  );
}
