import {
  loadProjectVersion,
  saveProject,
  saveProjectConditional,
} from "./persistence";

async function requireProject(id: string) {
  const project = await loadProjectVersion(id);
  if (!project) throw new Error("This design is no longer available.");
  return project;
}

/** Duplicate the latest saved document, including revision-dependent edits. */
export async function duplicateRecentDesign(id: string) {
  const { doc } = await requireProject(id);
  const copy = structuredClone(doc);
  const now = new Date().toISOString();
  copy.id = crypto.randomUUID();
  copy.name = `${doc.name} copy`;
  copy.createdAt = now;
  copy.updatedAt = now;
  await saveProject(copy);
  return copy;
}

/** Rename against the latest write token so another tab's edits stay safe. */
export async function renameRecentDesign(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Enter a design name.");
  const { doc, token } = await requireProject(id);
  const renamed = {
    ...doc,
    name: trimmed,
    updatedAt: new Date().toISOString(),
  };
  await saveProjectConditional(renamed, token);
  return renamed;
}
