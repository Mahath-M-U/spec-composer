import { notifyStorageChange } from "@/lib/storage/events";
import { readJson, writeJson } from "@/lib/storage/local";
import { getStorage, LS_KEYS } from "./storage";
import { parseSpecDocument, type SpecDocument } from "./types";

const DEFAULT_PROJECT_NAME = "Untitled design";

export interface UiPrefs {
  panel: string;
  zoom: number;
}

const isBrowser = () => typeof window !== "undefined";

/** All saved projects, most recently saved first. Invalid records are dropped;
 * valid ones come back parsed, so legacy fields are migrated on read. */
export async function loadProjects(): Promise<SpecDocument[]> {
  if (!isBrowser()) return [];
  const storage = await getStorage();
  return (await storage.listProjects())
    .map(parseSpecDocument)
    .filter((doc): doc is SpecDocument => !!doc);
}

export async function loadProject(
  id: string,
): Promise<SpecDocument | undefined> {
  if (!isBrowser()) return undefined;
  const storage = await getStorage();
  return parseSpecDocument(await storage.getProject(id));
}

export function getNextProjectName(projects: SpecDocument[]): string {
  const pattern = /^Untitled design (\d+)$/i;
  const highestNumber = projects.reduce((highest, project) => {
    const match = project.name.trim().match(pattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `${DEFAULT_PROJECT_NAME} ${highestNumber + 1}`;
}

/** Saves one project and moves it to the front of the recent list. */
export async function saveProject(doc: SpecDocument) {
  if (!isBrowser()) return;
  await (await getStorage()).putProject(doc);
  notifyStorageChange("projects");
}

/** Saves many projects in place, without changing their recency order. */
export async function saveProjects(projects: SpecDocument[]) {
  if (!isBrowser() || !projects.length) return;
  await (await getStorage()).putProjects(projects);
  notifyStorageChange("projects");
}

export async function removeProject(id: string) {
  if (!isBrowser()) return;
  await (await getStorage()).deleteProject(id);
  notifyStorageChange("projects");
}

// UI prefs are tiny and needed synchronously, so they stay in localStorage.
export function loadUi(): UiPrefs {
  const fallback = { panel: "assets", zoom: 1 };
  const stored = readJson<Partial<UiPrefs> | null>(LS_KEYS.ui, null);
  return stored && typeof stored === "object"
    ? { ...fallback, ...stored }
    : fallback;
}

export function saveUi(ui: UiPrefs) {
  try {
    writeJson(LS_KEYS.ui, ui);
  } catch {
    // Losing a UI preference is harmless.
  }
}
