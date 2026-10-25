import { commitInspectorEdit, inspectorContext } from "../inspector-properties";
import { useEditorStore } from "../store";
import { readImageUpload } from "../image-upload";
import {
  readProperty,
  validProperty,
  visibleFields,
  writeProperty,
  type PropertyValue,
} from "./properties";
import { validReference } from "./references";
import type { SpecElement } from "../types";

export function commitContextualEdit(
  context: string,
  key: string,
  value: PropertyValue | undefined,
) {
  const state = useEditorStore.getState(),
    doc = state.doc;
  if (!doc || inspectorContext() !== context) return false;
  const selected = doc.elements.filter((el) =>
    state.selectedIds.includes(el.id),
  );
  if (!selected.length || selected.some((el) => el.locked || !el.visible))
    return false;
  if (
    selected.some((el) => {
      const field = visibleFields(el).find((field) => field.key === key);
      const locked = el.contextualProperties?.["model.references.lockFields"];
      return (
        !field ||
        !validProperty(field, value, el) ||
        (key !== "model.references.lockFields" &&
          Array.isArray(locked) &&
          locked.includes(key)) ||
        (field.control.startsWith("element_reference") &&
          !validReference(doc, el, field, value)) ||
        (field.control === "asset_reference" &&
          value &&
          (typeof value !== "string" || !doc.referenceAssets?.[value]))
      );
    })
  )
    return false;
  if(selected.some(element=>!writeProperty(structuredClone(element),key,value)))return false;
  return commitInspectorEdit(
    context,
    (element) => {
      writeProperty(element, key, value);
      if (key === "asset.source")
        element.src =
          typeof value === "string"
            ? doc.referenceAssets?.[value]?.source
            : undefined;
    },
    key.startsWith("transform."),
  );
}
export async function uploadContextualAsset(
  context: string,
  key: string,
  file: File,
) {
  const source = await readImageUpload(file);
  const state = useEditorStore.getState(),
    doc = state.doc;
  if (!doc || inspectorContext() !== context) return false;
  const selected = doc.elements.filter((el) =>
    state.selectedIds.includes(el.id),
  );
  if (
    !selected.length ||
    selected.some(
      (el) =>
        el.locked ||
        !el.visible ||
        (Array.isArray(
          el.contextualProperties?.["model.references.lockFields"],
        ) &&
          el.contextualProperties!["model.references.lockFields"].includes(
            key,
          )) ||
        !visibleFields(el).some(
          (field) => field.key === key && field.control === "asset_reference",
        ),
    )
  )
    return false;
  const id = `asset_${crypto.randomUUID()}`;
  state.mutate((next) => {
    (next.referenceAssets ??= {})[id] = {
      source,
      name: file.name,
      type: file.type,
    };
    next.elements
      .filter((el) => state.selectedIds.includes(el.id))
      .forEach((el) => {
        writeProperty(el, key, id);
        if (key === "asset.source") el.src = source;
      });
  });
  return true;
}
export function mixedProperty(elements: SpecElement[], key: string) {
  const values = elements.map((el) => readProperty(el, key));
  return values.every(
    (value) => JSON.stringify(value) === JSON.stringify(values[0]),
  )
    ? { mixed: false as const, value: values[0] }
    : { mixed: true as const, value: undefined };
}
