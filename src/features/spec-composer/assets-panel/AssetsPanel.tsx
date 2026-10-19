import { useId, useRef, useState } from "react";
import {
  Box,
  LayoutPanelTop,
  MessageCircle,
  Scan,
  Shapes,
  SlidersHorizontal,
  Sun,
  UserRound,
} from "lucide-react";
import { SceneLightingControls } from "../scene-lighting-controls";
import { PanelHeader } from "../panel-header";
import { useEditorStore } from "../store";
import {
  SHAPE_TYPE_LABELS,
  shapeRoleLabel,
  type ShapeType,
} from "../shape-workflow";
import { ASSET_PRESETS } from "../asset-presets";
import { PRIMARY_TEXT_PRESETS, MORE_TEXT_PRESETS } from "./text-presets";
import { isTextKind } from "../types";

const VIEWS = [
  { id: "add", label: "Add", icon: Shapes },
  { id: "environment", label: "Environment", icon: Sun },
] as const;
const SCENE_TILES = {
  model: { label: "Person", icon: UserRound },
  product: { label: "Product", icon: Box },
  pedestal: { label: "Display", icon: Box },
  backdrop: { label: "Backdrop", icon: LayoutPanelTop },
  "copy-space": { label: "Copy space", icon: Scan },
  label: { label: "Callout", icon: MessageCircle },
};
const PRIMARY_SHAPES: readonly ShapeType[] = [
  "rectangle",
  "circle",
  "rounded rectangle",
  "triangle",
  "diamond",
];
const MORE_SHAPES: readonly ShapeType[] = ["ellipse", "line"];

export function AssetsPanel() {
  const s = useEditorStore();
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("add");
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected =
    s.doc?.elements.filter((element) => s.selectedIds.includes(element.id)) ??
    [];
  const element = selected.length === 1 ? selected[0] : undefined;
  const renderShape = (type: ShapeType) => (
    <button
      key={type}
      type="button"
      data-primitive={type}
      draggable
      aria-label={SHAPE_TYPE_LABELS[type]}
      title={SHAPE_TYPE_LABELS[type]}
      onClick={() => s.addShape(type)}
      onDragStart={(event) => {
        event.dataTransfer.setData("spec/shape", type);
        event.dataTransfer.effectAllowed = "copy";
      }}
    >
      <span className="shape-preview" data-shape={type} aria-hidden="true" />
    </button>
  );
  const renderText = (
    preset:
      | (typeof PRIMARY_TEXT_PRESETS)[number]
      | (typeof MORE_TEXT_PRESETS)[number],
  ) => (
    <button
      key={preset.id}
      type="button"
      draggable
      onClick={() => s.addTextPreset(preset.id)}
      onDragStart={(event) => {
        event.dataTransfer.setData("spec/text-preset", preset.id);
        event.dataTransfer.effectAllowed = "copy";
      }}
    >
      <span
        className="asset-text-preview"
        data-kind={preset.kind}
        aria-hidden="true"
      >
        {preset.sample}
      </span>
      {preset.label}
    </button>
  );
  return (
    <div className="assets-panel compose-panel">
      <PanelHeader eyebrow="Compose" title="Build your scene" />
      <div
        className="asset-workflow-tabs"
        role="tablist"
        aria-label="Composition settings"
      >
        {VIEWS.map(({ id: key, label, icon: Icon }, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-${key}-tab`}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            aria-selected={view === key}
            aria-controls={`${id}-${key}-panel`}
            tabIndex={view === key ? 0 : -1}
            onClick={() => setView(key)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % VIEWS.length
                  : event.key === "ArrowLeft"
                    ? (index + VIEWS.length - 1) % VIEWS.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? VIEWS.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              const nextView = VIEWS[next];
              if (!nextView) return;
              setView(nextView.id);
              tabRefs.current[next]?.focus();
            }}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-add-panel`}
        aria-labelledby={`${id}-add-tab`}
        hidden={view !== "add"}
        tabIndex={0}
      >
        <div className="shape-palette">
          <section className="compose-section">
            <div className="asset-section-heading">
              <h3>Scene elements</h3>
              <span>Click or drag</span>
            </div>
            <div
              className="asset-starter-grid"
              role="group"
              aria-label="Scene elements"
            >
              {ASSET_PRESETS.map((preset) => {
                const { label, icon: Icon } = SCENE_TILES[preset.id];
                return (
                  <button
                    key={preset.id}
                    type="button"
                    draggable
                    onClick={() => s.addAssetPreset(preset.id)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "application/x-spec-asset-preset",
                        JSON.stringify({
                          presetId: preset.id,
                          templateId: preset.templateId,
                        }),
                      );
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                  >
                    <Icon aria-hidden="true" />
                    <strong>{label}</strong>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="compose-section">
            <div className="asset-section-heading">
              <h3>Shapes</h3>
              <span>Click or drag</span>
            </div>
            <div className="shape-palette-grid">
              {PRIMARY_SHAPES.map(renderShape)}
              {MORE_SHAPES.map(renderShape)}
            </div>
          </section>
          <section className="compose-section">
            <div className="asset-section-heading">
              <h3>Text</h3>
            </div>
            <div className="shape-text-options">
              {PRIMARY_TEXT_PRESETS.map(renderText)}
              {MORE_TEXT_PRESETS.map(renderText)}
            </div>
          </section>
        </div>
      </div>
      <div
        role="tabpanel"
        id={`${id}-environment-panel`}
        aria-labelledby={`${id}-environment-tab`}
        hidden={view !== "environment"}
        tabIndex={0}
        className="asset-settings-view"
      >
        {view === "environment" && (
          <SceneLightingControls presentation="inline" />
        )}
      </div>
      <section className="compose-selection" aria-label="Selected element">
        <div className="asset-section-heading">
          <h3>Selected element</h3>
          {element && (
            <span className="asset-role-badge">
              {element.semanticRole
                ? shapeRoleLabel(element.semanticRole)
                : isTextKind(element.kind)
                  ? "Text"
                  : element.kind === "shape"
                    ? "Shape"
                    : element.kind === "divider"
                      ? "Divider"
                      : "Image"}
            </span>
          )}
        </div>
        {selected.length ? (
          <button
            type="button"
            className="compose-selection-edit"
            aria-label={
              element
                ? `Edit ${element.name}`
                : `Edit ${selected.length} selected elements`
            }
            onClick={() => {
              s.setPanel("style");
              s.setStyleTab("style");
            }}
          >
            <Box aria-hidden="true" />
            <span>
              {element?.name ?? `${selected.length} elements selected`}
            </span>
            <SlidersHorizontal aria-hidden="true" />
          </button>
        ) : (
          <p className="workflow-hint">
            Select an element on the canvas to edit it.
          </p>
        )}
        {!!selected.length && (
          <p className="workflow-hint">
            Edit its role, appearance, placement and description.
          </p>
        )}
      </section>
    </div>
  );
}
