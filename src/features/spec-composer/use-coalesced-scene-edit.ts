import { useRef } from "react";

/** Brackets a continuous scene-object edit (a slider or color drag) between
 * pointerdown and pointerup so the whole gesture is a single history entry:
 * the first change within the gesture commits with `history=true`, every
 * change after that commits with `history=false`. Outside of a
 * pointer-bracketed gesture — a keyboard-driven change, or a control that
 * never calls `onPointerDown` — every call commits its own entry, matching
 * the "selects/toggles/buttons commit once" rule for discrete controls. */
export function useCoalescedSceneEdit<P>(
  apply: (patch: P, history: boolean) => void,
) {
  const dragging = useRef(false);
  const committed = useRef(false);
  const onPointerDown = () => {
    dragging.current = true;
    committed.current = false;
  };
  const endDrag = () => {
    dragging.current = false;
    committed.current = false;
  };
  const onChange = (patch: P) => {
    const history = !dragging.current || !committed.current;
    apply(patch, history);
    if (dragging.current) committed.current = true;
  };
  return { onPointerDown, onPointerUp: endDrag, onPointerCancel: endDrag, onChange };
}
