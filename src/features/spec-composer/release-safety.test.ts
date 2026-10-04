import "fake-indexeddb/auto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createDocument, starterTemplates } from "./templates";
import { buildJsonExport, compileVisualPrompt } from "./compiler";
import {
  idbAdapter,
  localStorageAdapter,
  ProjectConflictError,
} from "./storage/adapter";
import { createProjectBackup, importProjectBackup } from "./project-backup";
import { loadProject, loadProjectVersion, saveProject } from "./persistence";
import { useEditorStore } from "./store";
import { validateWritableDocument } from "./types";
import { detectImageType, validateImageUpload } from "./image-validation";
import { withSecurityHeaders } from "@/lib/security-headers";
import { encryptJson } from "@/lib/storage/crypto";
import { done, openDb, STORES } from "@/lib/storage/idb";

const memory = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
  });
});

const doc = (name: string) => ({
  ...createDocument(),
  id: crypto.randomUUID(),
  name,
});

describe("project persistence", () => {
  it("retains more than 40 projects in both adapters", async () => {
    const prefix = crypto.randomUUID();
    for (let i = 0; i < 41; i++) {
      const project = { id: `${prefix}-${i}` };
      await idbAdapter.putProject(project);
      await localStorageAdapter.putProject(project);
    }
    expect(await idbAdapter.getProject(`${prefix}-0`)).toBeDefined();
    expect(await localStorageAdapter.getProject(`${prefix}-0`)).toBeDefined();
  });

  it("rejects a stale tab's token without changing the winner", async () => {
    const original = doc("First tab");
    await idbAdapter.putProject(original);
    const token = (await idbAdapter.getProjectVersion(original.id))!.token;
    const winner = { ...original, name: "Winner" };
    const newer = await idbAdapter.putProjectConditional(winner, token);
    expect(newer).not.toBe(token);
    const stale = { ...original, name: "Stale" };
    await expect(
      idbAdapter.putProjectConditional(stale, token),
    ).rejects.toBeInstanceOf(ProjectConflictError);
    expect(
      ((await idbAdapter.getProject(original.id)) as typeof original).name,
    ).toBe("Winner");
  });

  it("rejects stale localStorage fallback writes", async () => {
    const original = doc("Fallback first");
    await localStorageAdapter.putProject(original);
    const token = (await localStorageAdapter.getProjectVersion(original.id))!.token;
    const winner = { ...original, name: "Fallback winner" };
    await localStorageAdapter.putProjectConditional(winner, token);
    const stale = { ...original, name: "Fallback stale" };
    await expect(localStorageAdapter.putProjectConditional(stale, token)).rejects.toBeInstanceOf(ProjectConflictError);
    expect((await localStorageAdapter.getProject(original.id) as typeof original).name).toBe("Fallback winner");
  });

  it("upgrades a legacy record without a write token on its first edit", async () => {
    const legacy = doc("Legacy");
    const payload = await encryptJson(legacy);
    const db = await openDb();
    const tx = db.transaction(STORES.projects, "readwrite");
    tx.objectStore(STORES.projects).put({ id: legacy.id, savedAt: Date.now(), ...payload });
    await done(tx);
    expect((await idbAdapter.getProjectVersion(legacy.id))?.token).toBeNull();
    const edited = { ...legacy, name: "Legacy edited" };
    const token = await idbAdapter.putProjectConditional(edited, null);
    expect(token).toBeTruthy();
    expect((await idbAdapter.getProject(legacy.id) as typeof legacy).name).toBe("Legacy edited");
  });

  it("keeps a template change undoable and saves it", async () => {
    const original = doc("Original");
    await saveProject(original);
    const loaded = (await loadProjectVersion(original.id))!;
    useEditorStore.getState().setDocument(loaded.doc, loaded.token);
    const replacement = {
      ...createDocument("instagram-post", "Flash Sale"),
      id: crypto.randomUUID(),
    };
    useEditorStore.getState().applyTemplate(replacement, "Flash Sale");
    const state = useEditorStore.getState();
    expect(state.doc?.id).toBe(original.id);
    expect(state.doc?.createdAt).toBe(original.createdAt);
    expect(state.doc?.revision).toBe(original.revision + 1);
    expect(state.past).toHaveLength(1);
    expect(state.saveStatus).toBe("saving");
    await state.saveNow();
    expect((await loadProjectVersion(original.id))?.doc.name).toBe(
      "Flash Sale",
    );
    expect(useEditorStore.getState().saveStatus).toBe("saved");
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().doc?.name).toBe("Original");
    useEditorStore.getState().closeDocument();
  });

  it("keeps the expected token when navigation closes a pending save", async () => {
    const original = doc("Before close");
    await saveProject(original);
    const loaded = (await loadProjectVersion(original.id))!;
    useEditorStore.getState().setDocument(loaded.doc, loaded.token);
    useEditorStore.getState().mutate((current) => {
      current.name = "After close";
    });
    const conditional = vi.spyOn(idbAdapter, "putProjectConditional");
    const unconditional = vi.spyOn(idbAdapter, "putProject");
    useEditorStore.getState().closeDocument();
    await vi.waitFor(async () =>
      expect((await loadProjectVersion(original.id))?.doc.name).toBe(
        "After close",
      ),
    );
    expect(conditional).toHaveBeenCalledWith(
      expect.objectContaining({ name: "After close" }),
      loaded.token,
    );
    expect(unconditional).not.toHaveBeenCalled();
    conditional.mockRestore();
    unconditional.mockRestore();
  });

  it("preserves both versions and continues updating one conflict copy", async () => {
    const original = doc("Shared");
    await saveProject(original);
    const loaded = (await loadProjectVersion(original.id))!;
    useEditorStore.getState().setDocument(loaded.doc, loaded.token);
    const otherTab = { ...original, name: "Other tab" };
    await idbAdapter.putProjectConditional(otherTab, loaded.token);
    useEditorStore.getState().mutate((current) => {
      current.name = "My edit";
    });
    await useEditorStore.getState().saveNow();
    let all = (await idbAdapter.listProjects()) as (typeof original)[];
    expect(all.find((d) => d.id === original.id)?.name).toBe("Other tab");
    const copies = all.filter((d) => d.name === "My edit (conflict copy)");
    expect(copies).toHaveLength(1);
    useEditorStore.getState().mutate((current) => {
      current.imageBrief = "Next edit";
    });
    await useEditorStore.getState().saveNow();
    all = (await idbAdapter.listProjects()) as (typeof original)[];
    expect(
      all.filter((d) => d.name === "My edit (conflict copy)"),
    ).toHaveLength(1);
    expect(all.find((d) => d.id === copies[0]?.id)?.imageBrief).toBe(
      "Next edit",
    );
    useEditorStore.getState().closeDocument();
  });
});

describe("export and restore", () => {
  it("uses hand edits and required-tool instructions in JSON and describes rotation", () => {
    const original = {
      ...createDocument("instagram-post", "Product Launch"),
      id: crypto.randomUUID(),
    };
    original.elements[0]!.rotation = 37;
    expect(compileVisualPrompt(original)).toContain("rotated 37°");
    original.visualEdit = "MY APPROVED FINAL BRIEF";
    original.externalToolRequirement = {
      enabled: true,
      destination: "chatgpt",
      toolName: "Canva",
      toolType: "app",
      output: "editable_design",
    };
    original.promptMode = "visual_prompt";
    const result = buildJsonExport(original);
    expect(result.prompt).toContain("MY APPROVED FINAL BRIEF");
    expect(result.prompt).toContain("REQUIRED TOOL");
  });

  it("round-trips embedded images and avoids collisions", async () => {
    const original = {
      ...createDocument("instagram-post", "Product Launch"),
      id: crypto.randomUUID(),
      name: "Backup source",
    };
    original.elements[0]!.src = "data:image/png;base64,aGVsbG8=";
    await saveProject(original);
    const backup = await createProjectBackup();
    const imported = await importProjectBackup(backup);
    expect(imported.renamed).toBeGreaterThan(0);
    const parsed = JSON.parse(backup) as { projects: (typeof original)[] };
    expect(
      parsed.projects.find((d) => d.id === original.id)?.elements[0]?.src,
    ).toBe(original.elements[0]?.src);
    const all = (await idbAdapter.listProjects()) as (typeof original)[];
    expect(all.some((d) => d.name === "Backup source (imported)")).toBe(true);
    const single = await importProjectBackup(JSON.stringify(buildJsonExport(original)));
    expect(single.imported).toBe(1);
    expect(single.renamed).toBe(1);
  });

  it("restores identical projects after exporting and re-importing a backup", async () => {
    const first = doc("Round trip Alpha");
    const second = doc("Round trip Beta");
    await saveProject(first);
    await saveProject(second);
    const expectedFirst = await loadProject(first.id);
    const expectedSecond = await loadProject(second.id);
    const backup = await createProjectBackup();
    await idbAdapter.deleteProject(first.id);
    await idbAdapter.deleteProject(second.id);
    const result = await importProjectBackup(backup);
    expect(result.imported).toBeGreaterThanOrEqual(2);
    expect(await idbAdapter.getProject(first.id)).toEqual(expectedFirst);
    expect(await idbAdapter.getProject(second.id)).toEqual(expectedSecond);
    // Restoring into the same empty slots must not rename them.
    expect((await idbAdapter.getProject(first.id) as typeof first).name).toBe("Round trip Alpha");
    expect((await idbAdapter.getProject(second.id) as typeof second).name).toBe("Round trip Beta");
  });

  it("rejects corrupt backups before writing", async () => {
    await expect(importProjectBackup("{")).rejects.toThrow("valid JSON");
    const bad = JSON.stringify({
      kind: "spec-composer-project-backup",
      version: 1,
      projects: [doc("valid"), { bad: true }],
    });
    await expect(importProjectBackup(bad)).rejects.toThrow(
      "Nothing was imported",
    );
  });

  it("leaves existing projects untouched when a backup is rejected for corruption", async () => {
    const existing = doc("Untouched by corrupt import");
    await saveProject(existing);
    const before = await loadProject(existing.id);
    const bad = JSON.stringify({
      kind: "spec-composer-project-backup",
      version: 1,
      projects: [doc("Should not be saved"), { bad: true }],
    });
    await expect(importProjectBackup(bad)).rejects.toThrow("Nothing was imported");
    expect(await loadProject(existing.id)).toEqual(before);
    const all = (await idbAdapter.listProjects()) as { name?: string }[];
    expect(all.some((d) => d.name === "Should not be saved")).toBe(false);
  });

  it("keeps damaged stored records and reports their exclusion from backup", async () => {
    const damagedId = `damaged-${crypto.randomUUID()}`;
    await idbAdapter.putProject({ id: damagedId });
    const backup = JSON.parse(await createProjectBackup()) as {
      skippedDamagedRecords: number;
    };
    expect(backup.skippedDamagedRecords).toBeGreaterThan(0);
    expect(await idbAdapter.getProject(damagedId)).toEqual({ id: damagedId });
  });

  it("leaves the source backup available when storage rejects an import", async () => {
    const original = doc("Quota import");
    const source = JSON.stringify({
      kind: "spec-composer-project-backup",
      version: 1,
      projects: [original],
    });
    const write = vi
      .spyOn(idbAdapter, "putProject")
      .mockRejectedValueOnce(new DOMException("full", "QuotaExceededError"));
    await expect(importProjectBackup(source)).rejects.toThrow(
      "Keep your backup file",
    );
    expect(JSON.parse(source).projects[0].name).toBe("Quota import");
    write.mockRestore();
  });
});

it("rejects unbounded new documents and spoofed image headers", () => {
  const original = doc("Too large");
  original.format.width = 10_000_000;
  expect(() => validateWritableDocument(original)).toThrow("Canvas");
  expect(detectImageType(new Uint8Array([60, 115, 118, 103]))).toBeUndefined();
});

it("accepts every bundled starter template under the new write limits", () => {
  for (const template of starterTemplates) {
    expect(() => validateWritableDocument(template.document), template.name).not.toThrow();
  }
});

it("rejects oversized image dimensions before decoding", async () => {
  const png = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 1, 0, 0, 0,
    1, 0, 0,
  ]);
  const decode = vi.fn();
  vi.stubGlobal("createImageBitmap", decode);
  await expect(
    validateImageUpload(new File([png], "huge.png", { type: "image/png" })),
  ).rejects.toThrow("8192 px");
  expect(decode).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

it("adds framing and content-type headers while keeping CSP report-only", () => {
  const response = withSecurityHeaders(new Response("ok"));
  expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Content-Security-Policy-Report-Only")).toContain(
    "frame-ancestors 'none'",
  );
  expect(response.headers.get("Content-Security-Policy")).toBeNull();
});
