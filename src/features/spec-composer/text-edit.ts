import { isTextKind, type SpecDocument } from "./types.ts";

/**
 * Applies edited canvas text to an element in place. Used by both the
 * inline canvas editor and anything that sets `content` outside the Style
 * Dock, so a hand-edited prompt section for this element is dropped the
 * same way `section-editors.tsx` drops one for a section (see `edit` there):
 * the live segment takes over instead of the frozen override text.
 */
export function applyElementText(
  doc: SpecDocument,
  id: string,
  content: string,
): boolean {
  const el = doc.elements.find((e) => e.id === id);
  if (!el) return false;
  if (!isTextKind(el.kind) && el.content === undefined) return false;
  el.content = content;
  if (doc.promptParts) {
    delete doc.promptParts[`el:${id}`];
    delete doc.promptParts[`skill:el:${id}`];
  }
  return true;
}
