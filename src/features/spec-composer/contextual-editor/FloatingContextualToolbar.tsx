import { useLayoutEffect, useRef, useState } from "react";
import { MoreHorizontal, SlidersHorizontal } from "lucide-react";
import {
  Popover,
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
import { toolbarPlacement } from "./toolbar-placement";
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
  const { left, top, width, height } = screenBox;
  const [position, setPosition] = useState({
    left: screenBox.left,
    top: Math.max(8, screenBox.top - 64),
  });
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
  }, [left, top, width, height, primary.length, dismissed]);
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
    <div
      ref={bar}
      data-canvas-ui
      className="floating-contextual-toolbar"
      role="toolbar"
      aria-label="Element contextual controls"
      style={{ left: position.left, top: position.top }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape" && !open) {
          setDismissed(true);
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
                className="contextual-quick"
                aria-label={`${control.label}: ${text}`}
              >
                <span>{Icon&&<Icon size={12} aria-hidden="true"/>}{control.label}</span>
                <strong>{text}</strong>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className={`contextual-popover${model?" model-control-popover":""}`}
              side="bottom"
              collisionPadding={12}
              collisionBoundary={bar.current?.closest<HTMLElement>(".workspace")??null}
              aria-label={`${control.label} controls`}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {Panel?<Panel elements={elements} fields={control.fields} context={context}/>:fieldsContent(control.fields)}
            </PopoverContent>
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
            aria-label="More controls"
            title="More controls"
          >
            <MoreHorizontal size={18} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="contextual-popover contextual-more"
          collisionPadding={12}
          collisionBoundary={bar.current?.closest<HTMLElement>(".workspace")??null}
          aria-label="More controls"
          onKeyDown={(event) => event.stopPropagation()}
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
              onClick={() => useEditorStore.getState().duplicate()}
            >
              Duplicate
            </button>
            <button
              type="button"
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
              onClick={() => useEditorStore.getState().deleteSelected()}
            >
              Delete
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <button
        type="button"
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
    </div>
  );
}
