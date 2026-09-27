import { dominantVisual } from "./compiler";
import { isImageKind, isTextKind, type SpecDocument } from "./types";

/** The kind of visual editor a prompt-panel section opens (see
 * section-editors.tsx). */
export type Target =
  | { type: "background" | "colors" | "brand" | "mood" }
  | { type: "palette" | "type" | "components" | "imagery" }
  | { type: "element"; id: string };

/** Which editor a section gets, or null when it has nothing visual to edit
 * (layout rules, the overview…) and keeps the plain text editor. */
export function sectionTarget(key: string, doc: SpecDocument): Target | null {
  const id = key.startsWith("skill:el:")
    ? key.slice("skill:el:".length)
    : key.startsWith("el:")
      ? key.slice("el:".length)
      : null;
  if (id)
    return doc.elements.some((e) => e.id === id)
      ? { type: "element", id }
      : null;
  const visible = doc.elements.filter((e) => e.visible);
  switch (key) {
    case "colors":
      return { type: "colors" };
    case "brand":
      return { type: "brand" };
    case "mood":
    case "skill:tagline":
      return { type: "mood" };
    case "skill:theme":
      return { type: "background" };
    case "dominant": {
      const dominant = dominantVisual(doc);
      return dominant ? { type: "element", id: dominant.id } : null;
    }
    case "skill:colors":
      return { type: "palette" };
    case "skill:type":
      return visible.some((e) => isTextKind(e.kind)) ? { type: "type" } : null;
    case "skill:components":
      return visible.length ? { type: "components" } : null;
    case "skill:imagery":
      return visible.some((e) => isImageKind(e.kind))
        ? { type: "imagery" }
        : null;
    default:
      return null;
  }
}
