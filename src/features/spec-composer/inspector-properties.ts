import { transformBoxes, validBox, type CanvasBox } from "./canvas-geometry";
import { boundsOf, useEditorStore } from "./store";
import { hasPreset, togglePreset } from "./art-direction";
import { isImageKind, isTextKind, type SpecElement } from "./types";

export type CommonValue<T> =
  { mixed: false; value: T | undefined } | { mixed: true; value?: never };
export function commonValue<T>(values: T[]): CommonValue<T> {
  return values.every((value) => Object.is(value, values[0]))
    ? { mixed: false, value: values[0] }
    : { mixed: true };
}
export function inspectorCategory(elements: SpecElement[]) {
  if (!elements.length) return undefined;
  if (elements.every((el) => isTextKind(el.kind))) return "text";
  if (elements.every((el) => isImageKind(el.kind))) return "image";
  if (elements.every((el) => el.kind === "shape" || el.kind === "divider"))
    return "shape";
  return "mixed";
}
export function semanticRole(element: SpecElement): string {
  const role = element.semanticRole ?? element.slot ?? element.kind;
  return role.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
}
/** The inspector uses unrotated layout bounds, just like canvas resizing. */
export function inspectorGeometry(
  elements: SpecElement[],
  key: keyof CanvasBox,
  value: number,
  ratio = false,
) {
  if (
    !elements.length ||
    !Number.isFinite(value) ||
    elements.some((el) => el.locked || !el.visible)
  )
    return undefined;
  const start = boundsOf(elements);
  const next = { ...start, [key]: value };
  const first = elements[0]!;
  if (
    elements.length === 1 &&
    first.kind === "shape" &&
    first.semanticRole &&
    first.style.shapeType === "circle" &&
    (key === "width" || key === "height")
  ) {
    next.width = value;
    next.height = value;
  }
  if (ratio && key === "width")
    next.height = (start.height * value) / start.width;
  if (ratio && key === "height")
    next.width = (start.width * value) / start.height;
  if (!validBox(next)) return undefined;
  // Do not let the geometry utility's minimum clamp distort a collective scale.
  if (
    elements.some(
      (el) =>
        (el.width * next.width) / start.width < 1 ||
        (el.height * next.height) / start.height < 1,
    )
  )
    return undefined;
  return transformBoxes(elements, start, next);
}
export function materialState(
  elements: SpecElement[],
  preset: string,
): boolean | "mixed" {
  const count = elements.filter((el) =>
    hasPreset(el.material ?? "", preset),
  ).length;
  return count === elements.length ? true : count ? "mixed" : false;
}
export function toggledMaterial(
  element: SpecElement,
  preset: string,
  remove: boolean,
): string {
  const present = hasPreset(element.material ?? "", preset);
  return present === remove
    ? togglePreset(element.material ?? "", preset)
    : (element.material ?? "");
}

/** Selection identity guards delayed field/file handlers without rejecting unrelated edits. */
export function inspectorContext() {
  const state = useEditorStore.getState();
  return JSON.stringify([
    state.doc?.id,
    [...state.selectedIds].sort(),
    [...state.selectedGroupIds].sort(),
    state.backgroundSelected,
  ]);
}
export function commitInspectorEdit(
  context: string,
  edit: (element: SpecElement) => void,
  geometry = false,
  history = true,
): boolean {
  const state = useEditorStore.getState();
  if (!state.doc || inspectorContext() !== context) return false;
  const selected = state.doc.elements.filter((el) =>
    state.selectedIds.includes(el.id),
  );
  if (geometry && selected.some((el) => el.locked || !el.visible)) return false;
  const changes = selected
    .filter((el) => !el.locked)
    .map((el) => {
      const next = structuredClone(el);
      edit(next);
      return next;
    })
    .filter(
      (el) =>
        JSON.stringify(el) !==
        JSON.stringify(selected.find((old) => old.id === el.id)),
    );
  if (!changes.length) return false;
  if (geometry && changes.some((el) => !Number.isFinite(el.rotation))) return false;
  state.mutate((doc) =>
    doc.elements.forEach((el) => {
      const next = changes.find((change) => change.id === el.id);
      if (next) edit(el);
    }),
    history,
  );
  return true;
}
export function commitInspectorGeometry(
  context: string,
  key: keyof CanvasBox,
  value: number,
  ratio = false,
) {
  const state = useEditorStore.getState();
  if (!state.doc || inspectorContext() !== context) return;
  const elements = state.doc.elements.filter((el) =>
    state.selectedIds.includes(el.id),
  );
  const boxes = inspectorGeometry(elements, key, value, ratio);
  if (boxes) state.commitCanvasTransform(state.doc, boxes);
}
