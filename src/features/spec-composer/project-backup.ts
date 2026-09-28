import { getStorage } from "./storage";
import { loadProjects, saveProject } from "./persistence";
import { validateWritableDocument, type SpecDocument } from "./types";

const MAX_BACKUP_BYTES = 100_000_000;
const MAX_BACKUP_PROJECTS = 10_000;

export async function createProjectBackup(): Promise<string> {
  const documents = await loadProjects();
  if (documents.length > MAX_BACKUP_PROJECTS)
    throw new Error("More than 10,000 designs cannot fit in one backup.");
  const skipped = Math.max(
    0,
    (await (await getStorage()).countProjects()) - documents.length,
  );
  const content = JSON.stringify({
    kind: "spec-composer-project-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: documents,
    skippedDamagedRecords: skipped,
  });
  if (new Blob([content]).size > MAX_BACKUP_BYTES)
    throw new Error(
      "Backup is over 100 MB. Export large designs individually first.",
    );
  return content;
}

/** Validates the entire backup before writing; existing IDs are never overwritten. */
export async function importProjectBackup(
  content: string,
): Promise<{ imported: number; renamed: number }> {
  if (new Blob([content]).size > MAX_BACKUP_BYTES)
    throw new Error("Backup exceeds 100 MB.");
  let source: unknown;
  try {
    source = JSON.parse(content);
  } catch {
    throw new Error("Backup is not valid JSON.");
  }
  const backup = source as {
    kind?: unknown;
    version?: unknown;
    projects?: unknown;
    spec?: unknown;
  };
  const items =
    backup?.kind === "spec-composer-project-backup" &&
    backup.version === 1 &&
    Array.isArray(backup.projects)
      ? backup.projects
      : backup?.spec
        ? [backup.spec]
        : undefined;
  if (!items)
    throw new Error(
      "This is not a supported Spec Composer backup or JSON design export.",
    );
  if (items.length > MAX_BACKUP_PROJECTS)
    throw new Error("Backup contains too many designs.");
  const documents: SpecDocument[] = items.map((raw, index) => {
    try {
      return validateWritableDocument(raw);
    } catch {
      throw new Error(
        `Design ${index + 1} in the backup is damaged or exceeds current limits. Nothing was imported.`,
      );
    }
  });
  const storage = await getStorage();
  const ids = new Set(
    (await storage.listProjects()).flatMap((value) => {
      const id = (value as { id?: unknown } | null)?.id;
      return typeof id === "string" ? [id] : [];
    }),
  );
  // A damaged record may not appear in listProjects, but its ID must still
  // remain reserved so restoring cannot overwrite its encrypted bytes.
  for (const doc of documents) {
    if (await storage.getProjectVersion(doc.id)) ids.add(doc.id);
  }
  let renamed = 0;
  const prepared = documents.map((doc) => {
    if (!ids.has(doc.id)) {
      ids.add(doc.id);
      return doc;
    }
    renamed += 1;
    const id = crypto.randomUUID();
    ids.add(id);
    return { ...doc, id, name: `${doc.name} (imported)` };
  });
  let imported = 0;
  for (const doc of prepared) {
    try {
      await saveProject(doc);
      imported += 1;
    } catch (error) {
      throw new Error(
        `Storage stopped after ${imported} of ${prepared.length} designs. Keep your backup file and free browser space before trying again.`,
        { cause: error },
      );
    }
  }
  return { imported, renamed };
}
