import {
  fieldOptions,
  getElementFields,
  getElementSchema,
  type Condition,
  type Field,
} from "./schema";

export type ReadProperty = (key: string) => unknown;
const empty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);
export function evaluateCondition(
  condition: Condition,
  read: ReadProperty,
): boolean {
  const value = read(condition.field);
  switch (condition.operator) {
    case "empty":
      return empty(value);
    case "not_empty":
      return !empty(value);
    case "eq":
      return !empty(value) && value === condition.value;
    case "neq":
      return !empty(value) && value !== condition.value;
    case "in":
      return !empty(value) && (condition.values ?? []).includes(value);
    case "gt":
      return (
        typeof value === "number" &&
        typeof condition.value === "number" &&
        value > condition.value
      );
    case "lt":
      return (
        typeof value === "number" &&
        typeof condition.value === "number" &&
        value < condition.value
      );
    default:
      return false;
  }
}
export function applicableFields(id: string, read: ReadProperty): Field[] {
  const schema = getElementSchema(id);
  if (!schema) return [];
  const fields = getElementFields(id);
  const byKey = new Map(fields.map((field) => [field.key, field]));
  const memo = new Map<string, boolean>();
  const visible = (key: string, ancestors = new Set<string>()): boolean => {
    if (memo.has(key)) return memo.get(key)!;
    if (ancestors.has(key)) return false;
    const field = byKey.get(key);
    if (!field) return false;
    const next = new Set(ancestors).add(key);
    const check = (condition: Condition) => {
      // An old hidden standing variation cannot activate turning fields while sitting.
      if (
        condition.field !== key &&
        byKey.has(condition.field) &&
        !visible(condition.field, next)
      )
        return false;
      return evaluateCondition(condition, read);
    };
    const facet = schema.facetVisibilityWhen?.[field.facetId];
    const rules =
      schema.contextualRules?.filter((rule) => rule.reveal?.includes(key)) ??
      [];
    // Normalize two source-schema inconsistencies: the relationship target must
    // be selectable before the action which itself depends on that target;
    // datasets are the input for every chart type, not only pie/donut charts.
    const prerequisite =
      key === "model.pose_action.interactingWith" || key === "data.dataset";
    if (prerequisite) {
      const result = !facet || check(facet);
      memo.set(key, result);
      return result;
    }
    const revealed = rules.some((rule) => check(rule.when));
    const direct = !field.visibleWhen || check(field.visibleWhen);
    // Product "Held by Model" explicitly reveals actor before interaction is set.
    const productActor =
      key === "item.actor" && schema.elementId === "subjects.product";
    const result =
      (!facet || check(facet)) &&
      (prerequisite ||
        ((productActor ? direct || revealed : direct) &&
          (!!field.visibleWhen || !rules.length || revealed)));
    memo.set(key, !!result);
    return !!result;
  };
  return fields.filter((field) => visible(field.key));
}
export function ageRestricted(read: ReadProperty) {
  return (
    ["child", "teen"].includes(String(read("model.identity.ageGroup"))) ||
    ["boy", "girl"].includes(String(read("model.identity.modelPreset")))
  );
}
// The supplied schema requests filtering but supplies no executable option policy.
// Keep an explicit, conservative list; never derive demographic attributes.
const adultOptions = new Set([
  "seductive",
  "sensual",
  "sultry",
  "lingerie",
  "underwear",
  "nude",
  "naked",
  "revealing",
  "bodycon",
  "glamour",
  "crop_top",
  "stilettos",
  "high_heels",
  "heels",
]);
export function availableOptions(field: Field, read: ReadProperty) {
  return fieldOptions(field).filter(
    (option) =>
      !ageRestricted(read) ||
      (!adultOptions.has(option.value) &&
        !(
          field.key === "model.appearance.build" &&
          ["curvy", "muscular"].includes(option.value)
        ) &&
        !(
          field.key === "model.appearance.makeup" &&
          ["soft_glam", "bold"].includes(option.value)
        )),
  );
}
