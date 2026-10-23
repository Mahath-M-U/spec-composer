import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, SlidersHorizontal } from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEditorStore } from "../store";
import { inspectorContext } from "../inspector-properties";
import { SelectionContextBar, type ScreenBox } from "../selection-context-bar";
import type { SpecElement } from "../types";
import { ContextualField } from "./ContextualField";
import { toolbarControls, formatValue } from "./toolbar-controls";
import { mixedProperty } from "./store";
import { contextualPopoverPlacement } from "./toolbar-placement";
import { ToolbarShell } from "./ToolbarShell";
import type { Field } from "./schema";
import "./contextual-editor.css";
import { UserRound, Accessibility, Move, Shirt, Palette } from "lucide-react";
import { ModelPopover } from "./ModelPopover";
import { PosePopover } from "./PosePopover";
import { VariationPopover } from "./VariationPopover";
import { OutfitPopover } from "./OutfitPopover";
import { LookPopover } from "./LookPopover";
import { inferCatalogId } from "./catalog";
import { fieldOptions } from "./schema";

function SelectionPopoverContent({
  workspace,
  screenBox,
  className,
  label,
  children,
}: {
  workspace: HTMLElement | null;
  screenBox: ScreenBox;
  className: string;
  label: string;
  children: ReactNode;
}) {
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const [placement, setPlacement] = useState<ReturnType<typeof contextualPopoverPlacement> | null>(null);
  const focusPending = useRef(false);
  const { left, top, width, height } = screenBox;
  useLayoutEffect(() => {
    if (!content || !workspace || !anchor) return;
    const place = () => {
      const bounds = workspace.getBoundingClientRect();
      const viewportLeft = Math.max(0, bounds.left);
      const viewportTop = Math.max(0, bounds.top);
      const box = anchor.getBoundingClientRect();
      if (!anchor.isConnected || box.width <= 0 || box.height <= 0 || bounds.width <= 0 || bounds.height <= 0) {
        setPlacement(null);
        return;
      }
      const next = contextualPopoverPlacement(
        { left: box.left, top: box.top, width: box.width, height: box.height },
        {
          // Keep the preferred width stable after a narrow side constrains it.
          width: className.includes("model-control-popover") ? 326 : 340,
          height: Math.min(480, content.scrollHeight + content.offsetHeight - content.clientHeight),
        },
        {
          left: viewportLeft,
          top: viewportTop,
          width: Math.max(1, Math.min(window.innerWidth, bounds.right) - viewportLeft),
          height: Math.max(1, Math.min(window.innerHeight, bounds.bottom) - viewportTop),
        },
      );
      setPlacement((previous) =>
        previous && next && Object.keys(next).every((key) =>
          previous[key as keyof typeof next] === next[key as keyof typeof next],
        ) ? previous : next,
      );
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(workspace);
    resize.observe(anchor);
    resize.observe(content);
    const changes = new MutationObserver(place);
    changes.observe(content, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["open"] });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      resize.disconnect();
      changes.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [workspace, anchor, content, className, left, top, width, height]);
  useLayoutEffect(() => {
    if (!content) return;
    if (!placement) {
      if (content.contains(document.activeElement)) {
        const trigger = [...(workspace?.querySelectorAll<HTMLButtonElement>("button[aria-controls]") ?? [])]
          .find(button => button.getAttribute("aria-controls") === content.id);
        trigger?.focus({ preventScroll: true });
      }
      return;
    }
    if (!focusPending.current) return;
    focusPending.current = false;
    const target = content.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
    );
    (target ?? content).focus({ preventScroll: true });
  }, [placement, content, workspace]);
  const visible = !!(placement && content?.isConnected && anchor?.isConnected);
  return (
    <>
      {workspace && createPortal(
        <PopoverAnchor asChild>
          <span
            ref={setAnchor}
            data-selection-anchor
            aria-hidden="true"
            style={{
              position: "absolute",
              display: "block",
              left,
              top,
              width,
              height,
              visibility: "hidden",
              pointerEvents: "none",
            }}
          />
        </PopoverAnchor>,
        workspace,
      )}
      <PopoverContent
        ref={setContent}
        className={className}
        data-selection-anchored="true"
        inert={!visible}
        aria-hidden={!visible}
        side={placement?.side ?? "right"}
        align="start"
        sideOffset={placement?.sideOffset ?? 16}
        alignOffset={placement?.alignOffset ?? 0}
        avoidCollisions={false}
        updatePositionStrategy="always"
        style={{
          width: placement?.width,
          maxHeight: placement?.maxHeight,
          overflowY: "auto",
          visibility: visible ? undefined : "hidden",
        }}
        aria-label={label}
        onOpenAutoFocus={(event) => {
          if (!visible) {
            event.preventDefault();
            focusPending.current = true;
          }
        }}
        onCloseAutoFocus={() => { focusPending.current = false; }}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {children}
      </PopoverContent>
    </>
  );
}

export function LayerOrderControl() {
  return (
    <select
      aria-label="Layer order"
      value=""
      onChange={(event) => {
        const state = useEditorStore.getState();
        switch (event.target.value) {
          case "front":
            state.bringToFront();
            break;
          case "forward":
            state.bringForward();
            break;
          case "backward":
            state.sendBackward();
            break;
          case "back":
            state.sendToBack();
            break;
        }
      }}
    >
      <option value="">Layer order…</option>
      <option value="front">Bring to front</option>
      <option value="forward">Bring forward</option>
      <option value="backward">Send backward</option>
      <option value="back">Send to back</option>
    </select>
  );
}

export function FloatingContextualToolbar({
  elements,
  screenBox,
  onOpenInspector,
}: {
  elements: SpecElement[];
  screenBox: ScreenBox;
  onOpenInspector?: (() => void) | undefined;
}) {
  const [open, setOpen] = useState<string | null>(null),
    [dismissed, setDismissed] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<HTMLElement | null>(null);
  const context = inspectorContext();
  const { primary, overflow } = toolbarControls(elements);
  const model=elements.every(element=>inferCatalogId(element)==="subjects.person");
  const panels={Model:ModelPopover,Pose:PosePopover,Variation:VariationPopover,Outfit:OutfitPopover,Look:LookPopover};
  const icons={Model:UserRound,Pose:Accessibility,Variation:Move,Outfit:Shirt,Look:Palette};
  const groupFields = (fields: Field[]) =>
    [...new Set(fields.map((field) => field.group))].map((group) => ({
      group,
      fields: fields.filter((field) => field.group === group),
    }));
  useLayoutEffect(() => {
    setWorkspace(bar.current?.closest<HTMLElement>(".workspace") ?? null);
  }, []);
  if (dismissed || !primary.length) return null;
  const fieldsContent = (fields: Field[]) =>
    groupFields(fields).map(({ group, fields }) => (
      <section key={group}>
        <h3>{group}</h3>
        {fields.map((field) => (
          <ContextualField
            key={field.key}
            field={field}
            elements={elements}
            context={context}
          />
        ))}
      </section>
    ));
  return (
    <ToolbarShell
      ref={bar}
      anchor={screenBox}
      ariaLabel="Element contextual controls"
      onEscape={() => {
        if (!open) setDismissed(true);
      }}
    >
      {primary.map((control) => {
        const common = mixedProperty(elements, control.field.key);
        const text = common.mixed ? "Mixed" : fieldOptions(control.field).find(option=>option.value===common.value)?.label??formatValue(common.value);
        const Panel=model?panels[control.label as keyof typeof panels]:undefined, Icon=model?icons[control.label as keyof typeof icons]:undefined;
        return (
          <Popover
            key={control.field.key}
            open={open === control.field.key}
            onOpenChange={(next) => setOpen(next ? control.field.key : null)}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="ui-toolbar-button contextual-quick"
                aria-label={`${control.label}: ${text}`}
              >
                <span>{Icon&&<Icon size={12} aria-hidden="true"/>}{control.label}</span>
                <strong>{text}</strong>
              </button>
            </PopoverTrigger>
            <SelectionPopoverContent
              workspace={workspace}
              screenBox={screenBox}
              className={`ui-popover contextual-popover${model?" model-control-popover":""}`}
              label={`${control.label} controls`}
            >
              {Panel?<Panel elements={elements} fields={control.fields} context={context}/>:fieldsContent(control.fields)}
            </SelectionPopoverContent>
          </Popover>
        );
      })}
      <Popover
        open={open === "more"}
        onOpenChange={(next) => setOpen(next ? "more" : null)}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="ui-toolbar-button"
            aria-label="More controls"
            title="More controls"
          >
            <MoreHorizontal size={18} />
          </button>
        </PopoverTrigger>
        <SelectionPopoverContent
          workspace={workspace}
          screenBox={screenBox}
          className="ui-popover contextual-popover contextual-more"
          label="More controls"
        >
          {fieldsContent(overflow)}
          {elements.length === 1 && (
            <SelectionContextBar
              el={elements[0]!}
              screenBox={screenBox}
              embedded
            />
          )}
          <div className="contextual-secondary">
            <LayerOrderControl />
            <button
              type="button"
              className="ui-toolbar-button"
              onClick={() => useEditorStore.getState().duplicate()}
            >
              Duplicate
            </button>
            <button
              type="button"
              className="ui-toolbar-button"
              onClick={() =>
                useEditorStore.getState().updateLayers(
                  elements.map((el) => el.id),
                  { locked: true },
                )
              }
            >
              Lock
            </button>
            <button
              type="button"
              className="ui-toolbar-button"
              onClick={() => useEditorStore.getState().deleteSelected()}
            >
              Delete
            </button>
          </div>
        </SelectionPopoverContent>
      </Popover>
      <button
        type="button"
        className="ui-toolbar-button"
        aria-label="Open Design Inspector"
        title="Advanced / Inspector"
        onClick={() => {
          const state = useEditorStore.getState();
          state.setPanel("style");
          state.setStyleTab("style");
          onOpenInspector?.();
        }}
      >
        <SlidersHorizontal size={16} />
      </button>
    </ToolbarShell>
  );
}
