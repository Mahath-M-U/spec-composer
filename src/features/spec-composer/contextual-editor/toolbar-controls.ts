import type { SpecElement } from "../types";
import { inferCatalogId } from "./catalog";
import { availableOptions } from "./conditions";
import { getElementSchema, type Field } from "./schema";
import { readProperty, visibleFields } from "./properties";
import { POSE_VARIATION_KEYS } from "./model-poses";

export interface QuickControl {
  label: string;
  field: Field;
  fields: Field[];
}
export function toolbarControls(elements: SpecElement[]) {
  const first = elements[0];
  if (!first) return { primary: [] as QuickControl[], overflow: [] as Field[] };
  const fields = visibleFields(first).flatMap((field) => {
    const matches = elements.map((el) =>
      visibleFields(el).find(
        (other) => other.key === field.key && other.control === field.control,
      ),
    );
    if (matches.some((match) => !match)) return [];
    if (field.control === "select" || field.control === "multiselect") {
      const options = availableOptions(field, (key) =>
        readProperty(first, key),
      ).filter((option) =>
        elements.every((el, index) =>
          availableOptions(matches[index]!, (key) =>
            readProperty(el, key),
          ).some((other) => other.value === option.value),
        ),
      );
      return [{ ...field, options }];
    }
    return [field];
  });
  const schema = getElementSchema(inferCatalogId(first));
  const byKey = new Map(fields.map((field) => [field.key, field]));
  if(elements.every(element=>inferCatalogId(element)==="subjects.person")){
    const presetKeys=new Set(["model.pose_action.action",...Object.values(POSE_VARIATION_KEYS).map(key=>`model.pose_action.${key}`)]);
    const owns=(label:string,field:Field)=>label==="Model"?field.key.startsWith("model.identity.")||field.key.startsWith("model.appearance.")||["item.personMode","asset.source"].includes(field.key):label==="Pose"?presetKeys.has(field.key):label==="Variation"?field.key.startsWith("model.pose_action.")&&!presetKeys.has(field.key)&&!field.key.includes("interact"):label==="Outfit"?field.key.startsWith("model.outfit."):label==="Look"?["model.appearance.","model.expression.","model.visual_treatment.","model.framing."].some(prefix=>field.key.startsWith(prefix)):false;
    const slots=[{label:"Model",key:"model.identity.modelPreset"},{label:"Pose",key:"model.pose_action.action"},{label:"Variation",key:fields.find(field=>presetKeys.has(field.key)&&field.key!=="model.pose_action.action")?.key??"model.pose_action.headDirection"},{label:"Outfit",key:"model.outfit.category"},{label:"Look",key:"model.visual_treatment.renderStyle"}];
    const primary=slots.flatMap(slot=>{const field=byKey.get(slot.key);return field?[{label:slot.label,field,fields:fields.filter(candidate=>owns(slot.label,candidate))}]:[];});
    return {primary,overflow:fields.filter(field=>!slots.some(slot=>owns(slot.label,field)))};
  }
  const primary: QuickControl[] = [];
  const used = new Set<string>();
  const add = (field: Field | undefined, label?: string, group?: string) => {
    if (!field || used.has(field.key) || primary.length === 5) return;
    used.add(field.key);
    const groupFields = schema?.toolbar.popoverGroups?.[group ?? ""]?.flatMap(
      (key) => byKey.get(key) ?? [],
    ) ?? [field];
    primary.push({
      label: label ?? field.label,
      field,
      fields: [
        ...new Map(
          [field, ...groupFields].map((item) => [item.key, item]),
        ).values(),
      ],
    });
  };
  for (const slot of schema?.toolbar.defaultComposedSlots ?? [])
    add(
      byKey.get(
        slot.field ??
          slot.adaptiveFieldPaths?.find((key) => byKey.has(key)) ??
          "",
      ),
      slot.slot,
      slot.popover,
    );
  const candidates =
    schema?.toolbar.quickControlCandidates
      ?.slice()
      .sort((a, b) => a.priority - b.priority) ??
    schema?.toolbar.quickFields.map((fieldKey, priority) => ({
      fieldKey,
      priority,
    }));
  for (const candidate of candidates ?? []) add(byKey.get(candidate.fieldKey));
  for (const field of fields) add(field);
  return { primary, overflow: fields.filter((field) => !used.has(field.key)) };
}
export function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "Choose";
  if (Array.isArray(value)) return `${value.length} selected`;
  if (typeof value === "boolean") return value ? "On" : "Off";
  return String(value).replace(/_/g, " ").slice(0, 28);
}
