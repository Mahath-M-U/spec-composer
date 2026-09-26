import { useCallback, useEffect, useState } from "react";

export type SidebarSide = "left" | "right";

export const OVERLAY_QUERY = "(max-width: 1099px)";

interface SidebarVisibility {
  left: boolean;
  right: boolean;
}

interface SidebarState {
  desktop: SidebarVisibility;
  overlay: SidebarVisibility;
}

const DIALOG_SELECTOR =
  '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

export const RIGHT_REOPEN_ID = "editor-toggle-right";
export const RIGHT_COLLAPSE_ID = "editor-collapse-right";

/** Focuses the sidebar control with the given id on the next animation
 * frame, after the element it replaces has finished unmounting. */
export function focusSidebarControl(id: string): void {
  requestAnimationFrame(() => {
    document.getElementById(id)?.focus();
  });
}

/** Hides/shows the left (`ContextPanel`) and right (`RightPanel`) sidebars in
 * `Editor`. Desktop (inline) and overlay (drawer) visibility are tracked
 * separately so switching breakpoints doesn't clobber the other mode's
 * state. */
export function useSidebarLayout() {
  const [overlay, setOverlay] = useState(false);
  const [state, setState] = useState<SidebarState>({
    desktop: { left: true, right: true },
    overlay: { left: false, right: false },
  });

  useEffect(() => {
    const mql = window.matchMedia(OVERLAY_QUERY);
    const onChange = () => setOverlay(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const mode = overlay ? "overlay" : "desktop";
  const leftOpen = state[mode].left;
  const rightOpen = state[mode].right;

  const setOpen = useCallback(
    (side: SidebarSide, open: boolean) => {
      setState((current) => {
        const activeMode = overlay ? "overlay" : "desktop";
        const nextVisibility: SidebarVisibility = {
          ...current[activeMode],
          [side]: open,
        };
        if (overlay && open) {
          const otherSide: SidebarSide = side === "left" ? "right" : "left";
          nextVisibility[otherSide] = false;
        }
        return { ...current, [activeMode]: nextVisibility };
      });
    },
    [overlay],
  );

  const toggle = useCallback(
    (side: SidebarSide) => {
      setOpen(side, !state[mode][side]);
    },
    [mode, setOpen, state],
  );

  const closeDrawers = useCallback(() => {
    if (!overlay) return;
    setState((current) => ({
      ...current,
      overlay: { left: false, right: false },
    }));
  }, [overlay]);

  useEffect(() => {
    if (!overlay || !(leftOpen || rightOpen)) return;
    const openSide: SidebarSide = leftOpen ? "left" : "right";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(DIALOG_SELECTOR)) return;
      closeDrawers();
      // The left toggle stays in the tool rail; the right toggle becomes a
      // floating button over the workspace once its drawer closes.
      focusSidebarControl(`editor-toggle-${openSide}`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlay, leftOpen, rightOpen, closeDrawers]);

  return { overlay, leftOpen, rightOpen, setOpen, toggle, closeDrawers };
}

export type SidebarLayout = ReturnType<typeof useSidebarLayout>;
