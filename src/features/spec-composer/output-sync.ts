import type { PromptMode, SpecDocument } from "./types";

export const resolveEditorText = (
  doc: SpecDocument,
  mode: PromptMode,
  generated: string,
) => (mode === "design_skill" ? doc.designEdit : doc.visualEdit) ?? generated;

/** Runs inside the same history transaction as structured changes. */
export function synchronizeStructuredOutput(
  previous: SpecDocument,
  next: SpecDocument,
) {
  const keys = new Set<string>();
  const changed = (a: unknown, b: unknown) =>
    JSON.stringify(a) !== JSON.stringify(b);
  const before = new Map(previous.elements.map((el) => [el.id, el]));
  const after = new Map(next.elements.map((el) => [el.id, el]));
  for (const id of new Set([...before.keys(), ...after.keys()])) {
    const a = before.get(id),
      b = after.get(id);
    if (
      !(
        a?.semanticRole ||
        b?.semanticRole ||
        a?.descriptionTemplate ||
        b?.descriptionTemplate
      ) ||
      !changed(a, b)
    )
      continue;
    for (const key of [
      `el:${id}`,
      `skill:el:${id}`,
      "dominant",
      "skill:overview",
      "skill:components",
      "skill:imagery",
      "skill:layout",
      "skill:spacing",
      "skill:rules",
      "skill:elevation",
      "annotations",
      "skill:annotations",
    ])
      keys.add(key);
  }
  if (previous.imageStyle !== next.imageStyle) {
    keys.add("imageStyle");
    keys.add("skill:imageStyle");
    keys.add("skill:elevation");
  }
  for (const field of ["scene", "lighting"] as const) {
    const settingKeys =
      field === "scene"
        ? (["cameraAngle"] as const)
        : ([
            "lightType",
            "lightDirection",
            "lightIntensity",
            "shadows",
          ] as const);
    if (
      previous[field] !== next[field] ||
      previous.promptOptions[field] !== next.promptOptions[field] ||
      settingKeys.some(
        (key) =>
          previous.generationSettings?.[key] !== next.generationSettings?.[key],
      ) ||
      (field === "lighting" &&
        changed(
          previous.generationSettings?.studioLights,
          next.generationSettings?.studioLights,
        ))
    ) {
      keys.add(field);
      keys.add(`skill:${field}`);
      keys.add("imageStyle");
      keys.add("skill:imageStyle");
      keys.add("skill:elevation");
    }
  }
  if (!keys.size) return;
  for (const [field, revision, snapshot] of [
    ["visualEdit", "visualEditRevision", "visual"],
    ["designEdit", "designEditRevision", "design"],
  ] as const) {
    if (previous[field] != null) {
      next.savedCustomText = {
        ...next.savedCustomText,
        [snapshot]: previous[field],
      };
      delete next[field];
      delete next[revision];
    }
  }
  if (next.promptParts) for (const key of keys) delete next.promptParts[key];
}
