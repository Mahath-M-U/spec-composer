import { describe, expect, it } from "vitest";
import { compileCopyText } from "./copy-output";
import { createDocument } from "./templates";
import { compileDesignSkill } from "./design-md";
import { compilePromptEditorOutput } from "./compiler";

describe("compileCopyText", () => {
  it("returns the compiled DESIGN.md for kind \"design\"", () => {
    const doc = createDocument();
    expect(compileCopyText(doc, undefined, "design")).toBe(
      compileDesignSkill(doc, undefined),
    );
  });

  it("returns the hand edit for kind \"design\" when designEdit is set", () => {
    const doc = { ...createDocument(), designEdit: "MY DESIGN EDIT" };
    expect(compileCopyText(doc, undefined, "design")).toBe("MY DESIGN EDIT");
  });

  it("compiles kind \"prompt\" as a visual prompt even in design_skill mode", () => {
    const doc = { ...createDocument(), promptMode: "design_skill" as const };
    expect(compileCopyText(doc, undefined, "prompt")).toBe(
      compilePromptEditorOutput({ ...doc, promptMode: "visual_prompt" }),
    );
  });

  it("leaves a visual_prompt doc unchanged for kind \"prompt\" and never returns designEdit", () => {
    const doc = {
      ...createDocument(),
      promptMode: "visual_prompt" as const,
      designEdit: "SHOULD NOT APPEAR",
    };
    const result = compileCopyText(doc, undefined, "prompt");
    expect(result).toBe(compilePromptEditorOutput(doc));
    expect(result).not.toContain("SHOULD NOT APPEAR");
  });

  it("drops Scene from prompt and design copy while its switch is off, and includes it once on", () => {
    const off = { ...createDocument(), scene: "Marble countertop" };
    expect(compileCopyText(off, undefined, "prompt")).not.toContain("Scene:");
    expect(compileCopyText(off, undefined, "design")).not.toContain(
      "## Scene",
    );
    const on = {
      ...off,
      promptOptions: { ...off.promptOptions, scene: true },
    };
    expect(compileCopyText(on, undefined, "prompt")).toContain(
      "Scene: Marble countertop.",
    );
    expect(compileCopyText(on, undefined, "design")).toContain(
      "## Scene\n\nMarble countertop.",
    );
  });
});
