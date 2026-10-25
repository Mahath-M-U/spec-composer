import "fake-indexeddb/auto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as persistence from "./persistence";
import { ProjectConflictError } from "./storage/adapter";
import { createDocument } from "./templates";
import {
  duplicateRecentDesign,
  renameRecentDesign,
} from "./recent-design-actions";

const memory = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  });
});
afterEach(() => vi.restoreAllMocks());

describe("recent design actions", () => {
  it("duplicates all saved content with a fresh identity and dates, leaving the source intact", async () => {
    const source = {
      ...createDocument(),
      name: "Campaign",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-02T00:00:00.000Z",
      revision: 7,
      designEdit: "Hand edited design",
      designEditRevision: 7,
      visualEdit: "Hand edited prompt",
      visualEditRevision: 7,
      savedCustomText: { visual: "Saved prompt", design: "Saved design" },
      promptParts: { subject: "Subject" },
    };
    await persistence.saveProject(source);
    const saved = (await persistence.loadProjectVersion(source.id))!.doc;
    const copy = await duplicateRecentDesign(source.id);
    expect(copy.id).not.toBe(source.id);
    expect(copy.name).toBe("Campaign copy");
    expect(copy.createdAt).not.toBe(source.createdAt);
    expect(copy.updatedAt).toBe(copy.createdAt);
    expect(copy).toEqual({
      ...saved,
      id: copy.id,
      name: "Campaign copy",
      createdAt: copy.createdAt,
      updatedAt: copy.updatedAt,
    });
    expect((await persistence.loadProjectVersion(copy.id))!.doc).toEqual(copy);
    expect((await persistence.loadProjectVersion(source.id))!.doc).toEqual(
      saved,
    );
    expect(copy.elements).not.toBe(saved.elements);
  });

  it("renames the latest document, trimming the name and retaining edits and revision", async () => {
    const source = createDocument();
    await persistence.saveProject(source);
    const latest = { ...source, imageBrief: "Latest change", revision: 12 };
    await persistence.saveProject(latest);
    const renamed = await renameRecentDesign(source.id, "  Renamed campaign  ");
    expect(renamed.name).toBe("Renamed campaign");
    expect(renamed.imageBrief).toBe("Latest change");
    expect(renamed.revision).toBe(12);
    expect(renamed.createdAt).toBe(source.createdAt);
    expect((await persistence.loadProjectVersion(source.id))!.doc).toEqual(
      renamed,
    );
  });

  it("rejects an empty name before reading or writing storage", async () => {
    const read = vi.spyOn(persistence, "loadProjectVersion");
    const write = vi.spyOn(persistence, "saveProjectConditional");
    await expect(renameRecentDesign("missing", "   ")).rejects.toThrow(
      "Enter a design name",
    );
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it("reports missing designs without recreating them", async () => {
    const write = vi.spyOn(persistence, "saveProjectConditional");
    const insert = vi.spyOn(persistence, "saveProject");
    await expect(duplicateRecentDesign(crypto.randomUUID())).rejects.toThrow(
      "no longer available",
    );
    await expect(
      renameRecentDesign(crypto.randomUUID(), "Name"),
    ).rejects.toThrow("no longer available");
    expect(write).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("propagates storage failures without reporting a successful copy", async () => {
    const source = createDocument();
    await persistence.saveProject(source);
    vi.spyOn(persistence, "saveProject").mockRejectedValue(
      new Error("Storage full"),
    );
    await expect(duplicateRecentDesign(source.id)).rejects.toThrow(
      "Storage full",
    );
  });

  it("rejects a concurrent rename instead of overwriting a newer save", async () => {
    const source = createDocument();
    await persistence.saveProject(source);
    const write = persistence.saveProjectConditional;
    vi.spyOn(persistence, "saveProjectConditional").mockImplementationOnce(
      async (doc, token) => {
        await persistence.saveProject({
          ...source,
          name: "Other tab",
          imageBrief: "Keep me",
        });
        return write(doc, token);
      },
    );
    await expect(
      renameRecentDesign(source.id, "Stale rename"),
    ).rejects.toBeInstanceOf(ProjectConflictError);
    expect((await persistence.loadProjectVersion(source.id))!.doc.name).toBe(
      "Other tab",
    );
    expect(
      (await persistence.loadProjectVersion(source.id))!.doc.imageBrief,
    ).toBe("Keep me");
  });
});
