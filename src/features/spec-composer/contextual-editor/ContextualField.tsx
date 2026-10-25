import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useEditorStore } from "../store";
import type { SpecElement } from "../types";
import { availableOptions } from "./conditions";
import { getElementFields, getElementSchema, type Field } from "./schema";
import { inferCatalogId } from "./catalog";
import { referenceTargets, validReference } from "./references";
import { readProperty, type PropertyValue } from "./properties";
import { previewCapability } from "./preview-capabilities";
import {
  commitContextualEdit,
  mixedProperty,
  uploadContextualAsset,
} from "./store";

function ValueInput({
  value,
  onCommit,
  multiline = false,
  ...props
}: {
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  id?: string;
  type?: string;
  min?: number | undefined;
  max?: number | undefined;
  step?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const attributes = {
    ...props,
    value: draft,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setDraft(event.target.value),
    onBlur: () => {
      if (draft !== value) onCommit(draft);
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !multiline) {
        event.preventDefault();
        if (draft !== value) onCommit(draft);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setDraft(value);
      }
    },
  };
  return multiline ? <textarea {...attributes} /> : <input {...attributes} />;
}

export function ContextualField({
  field,
  elements,
  context,
}: {
  field: Field;
  elements: SpecElement[];
  context: string;
}) {
  const id = useId(),
    state = useEditorStore(),
    doc = state.doc,
    element = elements[0];
  if (!element || !doc) return null;
  const common = mixedProperty(elements, field.key),
    value = common.value;
  const lockedKeys =
    element.contextualProperties?.["model.references.lockFields"];
  const disabled = elements.some(
    (el) =>
      el.locked ||
      (field.key !== "model.references.lockFields" &&
        Array.isArray(
          el.contextualProperties?.["model.references.lockFields"],
        ) &&
        el.contextualProperties!["model.references.lockFields"].includes(
          field.key,
        )),
  );
  const commit = (next: PropertyValue | undefined) => {
    if (!commitContextualEdit(context, field.key, next))
      toast.error("This value is unavailable or the selection changed.");
  };
  const text =
    typeof value === "string" || typeof value === "number" ? String(value) : "";
  const options = availableOptions(field, (key) => readProperty(element, key));
  let control: React.ReactNode;
  switch (field.control) {
    case "select":
      control = (
        <select
          id={id}
          value={text}
          disabled={disabled}
          onChange={(event) => commit(event.target.value || undefined)}
        >
          <option value="">{common.mixed ? "Mixed" : "Choose…"}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    case "toggle":
      control = (
        <select
          id={id}
          value={typeof value === "boolean" ? String(value) : ""}
          disabled={disabled}
          onChange={(event) =>
            commit(
              event.target.value === ""
                ? undefined
                : event.target.value === "true",
            )
          }
        >
          <option value="">{common.mixed ? "Mixed" : "Unset"}</option>
          <option value="true">On</option>
          <option value="false">Off</option>
        </select>
      );
      break;
    case "number":
    case "slider":
      control = (
        <ValueInput
          id={id}
          type="number"
          step="any"
          min={field.min}
          max={field.max}
          value={text}
          disabled={disabled}
          placeholder={common.mixed ? "Mixed" : "Unset"}
          onCommit={(next) => commit(next === "" ? undefined : Number(next))}
        />
      );
      break;
    case "color":
    case "color_or_text":
      control = (
        <div className="contextual-color">
          <ValueInput
            id={id}
            value={text}
            placeholder={common.mixed ? "Mixed" : "Color"}
            disabled={disabled}
            onCommit={(next) => commit(next || undefined)}
          />
          <input
            type="color"
            aria-label={`${field.label} picker`}
            value={/^#[\da-f]{6}$/i.test(text) ? text : "#000000"}
            disabled={disabled}
            onChange={(event) => commit(event.target.value)}
          />
        </div>
      );
      break;
    case "multiselect":
    case "field_keys": {
      const choices =
        field.control === "field_keys"
          ? getElementFields(inferCatalogId(element) ?? "")
              .filter((item) => item.key !== field.key)
              .map((item) => ({ value: item.key, label: item.label }))
          : options;
      const selected = Array.isArray(value) ? (value as string[]) : [];
      control = choices.length ? (
        <div id={id} className="contextual-checks">
          {choices.map((option) => (
            <label key={option.value}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                disabled={disabled}
                onChange={(event) =>
                  commit(
                    event.target.checked
                      ? [...selected, option.value]
                      : selected.filter((item) => item !== option.value),
                  )
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : (
        <ValueInput
          id={id}
          value={selected.join(", ")}
          disabled={disabled}
          placeholder="Comma-separated values"
          onCommit={(next) =>
            commit(
              next
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean),
            )
          }
        />
      );
      break;
    }
    case "tags":
      control = (
        <ValueInput
          id={id}
          value={Array.isArray(value) ? value.join(", ") : ""}
          disabled={disabled}
          placeholder={common.mixed ? "Mixed" : "Comma-separated tags"}
          onCommit={(next) =>
            commit(
              next
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean),
            )
          }
        />
      );
      break;
    case "element_reference":
    case "element_references": {
      const targets = referenceTargets(doc, element, field).filter((target) =>
        elements.every((owner) =>
          referenceTargets(doc, owner, field).some(
            (other) => other.id === target.id,
          ),
        ),
      );
      const allowed = field.allowedElementTypes ??
        getElementSchema(inferCatalogId(element))?.linkedElementRoles ?? [
          "subjects.product",
          "subjects.person",
          "subjects.environment",
        ];
      control = (
        <div>
          <select
            id={id}
            multiple={field.control === "element_references"}
            disabled={disabled}
            value={
              field.control === "element_references"
                ? Array.isArray(value)
                  ? (value as string[])
                  : []
                : text
            }
            onChange={(event) =>
              commit(
                field.control === "element_references"
                  ? [...event.target.selectedOptions].map(
                      (option) => option.value,
                    )
                  : event.target.value || undefined,
              )
            }
          >
            {field.control === "element_reference" && (
              <option value="">
                {common.mixed ? "Mixed" : "Choose canvas element…"}
              </option>
            )}
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </select>
          {elements.length === 1 && (
            <select
              aria-label={`Add compatible element for ${field.label}`}
              value=""
              disabled={disabled}
              onChange={(event) => {
                const catalogId = event.target.value,
                  project = doc.id,
                  owner = element.id;
                if (!getElementSchema(catalogId)) return;
                state.addContextualElement(catalogId);
                const latest = useEditorStore.getState(),
                  target = latest.selectedIds[0];
                if (
                  latest.doc?.id !== project ||
                  !target ||
                  target === owner ||
                  !validReference(
                    latest.doc,
                    element,
                    field,
                    field.control === "element_references" ? [target] : target,
                  )
                )
                  return;
                latest.select(owner);
                // Adding and linking are merged into the insertion's undo transaction.
                latest.mutate((next) => {
                  const current = next.elements.find((el) => el.id === owner);
                  if (current) {
                    (current.contextualProperties ??= {})[field.key] =
                      field.control === "element_references"
                        ? [...(Array.isArray(value) ? value : []), target]
                        : target;
                  }
                }, false);
              }}
            >
              <option value="">Add compatible element…</option>
              {allowed
                .filter((catalogId) => getElementSchema(catalogId))
                .map((catalogId) => (
                  <option key={catalogId} value={catalogId}>
                    Add {getElementSchema(catalogId)!.label}
                  </option>
                ))}
            </select>
          )}
        </div>
      );
      break;
    }
    case "asset_reference":
      control = (
        <div className="contextual-asset">
          <select
            id={id}
            value={text}
            disabled={disabled}
            onChange={(event) => commit(event.target.value || undefined)}
          >
            <option value="">{common.mixed ? "Mixed" : "No reference"}</option>
            {text === "__current_source__" && (
              <option value="__current_source__">Current supplied image</option>
            )}
            {Object.entries(doc.referenceAssets ?? {}).map(
              ([assetId, asset]) => (
                <option key={assetId} value={assetId}>
                  {asset.name}
                </option>
              ),
            )}
          </select>
          <label>
            Upload reference
            <input
              type="file"
              accept="image/*"
              disabled={disabled}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                try {
                  await uploadContextualAsset(context, field.key, file);
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Upload failed",
                  );
                }
              }}
            />
          </label>
        </div>
      );
      break;
    case "color_list": {
      const colors = Array.isArray(value) ? (value as string[]) : [];
      control = (
        <div id={id}>
          {colors.map((color, index) => (
            <div className="contextual-row" key={index}>
              <ValueInput
                aria-label={`${field.label} ${index + 1}`}
                value={color}
                disabled={disabled}
                onCommit={(next) =>
                  commit(
                    colors.map((item, position) =>
                      position === index ? next : item,
                    ),
                  )
                }
              />
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove color ${index + 1}`}
                onClick={() =>
                  commit(colors.filter((_, position) => position !== index))
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={() => commit([...colors, "#000000"])}
          >
            Add color
          </button>
        </div>
      );
      break;
    }
    case "repeatable":
    case "data_table":
    case "gradient_stops": {
      const rows = Array.isArray(value)
        ? (value as Record<string, PropertyValue>[])
        : [];
      const columns =
        field.control === "gradient_stops"
          ? ["color", "position"]
          : !Array.isArray(field.options) && field.options?.itemFields
            ? field.options.itemFields
            : [...new Set(rows.flatMap((row) => Object.keys(row)))];
      const keys = columns.length ? columns : ["label", "value"];
      control = (
        <div id={id} className="contextual-data">
          {field.control === "data_table" && (
            <div className="contextual-row">
              <ValueInput
                aria-label="Dataset columns"
                value={keys.join(", ")}
                disabled={disabled}
                onCommit={(next) => {
                  const nextKeys = [
                    ...new Set(
                      next
                        .split(",")
                        .map((key) => key.trim())
                        .filter(Boolean),
                    ),
                  ];
                  if (nextKeys.length)
                    commit(
                      (rows.length ? rows : [{}]).map((row) =>
                        Object.fromEntries(
                          nextKeys.map((key) => [key, row[key] ?? ""]),
                        ),
                      ),
                    );
                }}
              />
            </div>
          )}
          {rows.map((row, index) => (
            <fieldset key={index} disabled={disabled}>
              <legend>Row {index + 1}</legend>
              {keys.map((key) => (
                <label key={key}>
                  {key}
                  <ValueInput
                    aria-label={`${field.label} row ${index + 1} ${key}`}
                    value={String(row[key] ?? "")}
                    type={
                      key === "position" && field.control === "gradient_stops"
                        ? "number"
                        : "text"
                    }
                    onCommit={(next) =>
                      commit(
                        rows.map((item, position) =>
                          position === index
                            ? {
                                ...item,
                                [key]:
                                  key === "position" &&
                                  field.control === "gradient_stops"
                                    ? Number(next)
                                    : next,
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <button
                type="button"
                aria-label={`Remove row ${index + 1}`}
                onClick={() =>
                  commit(rows.filter((_, position) => position !== index))
                }
              >
                Remove row
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              commit([
                ...rows,
                Object.fromEntries(
                  keys.map((key) => [
                    key,
                    field.control === "gradient_stops"
                      ? key === "color"
                        ? "#000000"
                        : Math.min(100, rows.length * 50)
                      : "",
                  ]),
                ),
              ])
            }
          >
            Add {field.control === "gradient_stops" ? "stop" : "row"}
          </button>
        </div>
      );
      break;
    }
    default:
      control = (
        <ValueInput
          id={id}
          multiline={field.control === "textarea"}
          value={text}
          disabled={disabled}
          placeholder={common.mixed ? "Mixed" : "Unset"}
          onCommit={(next) => commit(next || undefined)}
        />
      );
  }
  const capability=previewCapability(element,field.key);
  return (
    <div className="contextual-field" data-field={field.key}>
      <label htmlFor={id}>
        {field.label}
        {field.unit ? ` (${field.unit})` : ""}
      </label>
      {common.mixed && <small>Mixed values</small>}
      <small className={`contextual-capability is-${capability.mode}`} title={capability.description}>{capability.label}</small>
      {control}
    </div>
  );
}
