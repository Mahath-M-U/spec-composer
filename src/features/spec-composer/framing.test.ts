import { describe, expect, it } from "vitest";
import {
  buildJsonExport,
  compilePromptEditorOutput,
  MOCKUP_FRAMING,
} from "./compiler";
import { createDocument } from "./templates";

describe("mockup framing line", () => {
  it("prepends MOCKUP_FRAMING to a compiled visual_prompt doc", () => {
    const doc = { ...createDocument(), promptMode: "visual_prompt" as const };
    expect(compilePromptEditorOutput(doc)).toMatch(
      new RegExp(`^${escapeRegExp(MOCKUP_FRAMING)}`),
    );
  });

  it("prepends MOCKUP_FRAMING when the doc has a hand edit (visualEdit)", () => {
    const doc = {
      ...createDocument(),
      promptMode: "visual_prompt" as const,
      visualEdit: "MY APPROVED FINAL BRIEF",
    };
    const result = compilePromptEditorOutput(doc);
    expect(result).toMatch(new RegExp(`^${escapeRegExp(MOCKUP_FRAMING)}`));
    expect(result).toContain("MY APPROVED FINAL BRIEF");
  });

  it("orders REQUIRED TOOL before CREATIVE BRIEF before MOCKUP_FRAMING", () => {
    const doc = {
      ...createDocument(),
      promptMode: "visual_prompt" as const,
      externalToolRequirement: {
        enabled: true,
        destination: "chatgpt" as const,
        toolName: "Canva",
        toolType: "app" as const,
        output: "standard" as const,
      },
    };
    const result = compilePromptEditorOutput(doc);
    const toolIndex = result.indexOf("REQUIRED TOOL");
    const briefIndex = result.indexOf("CREATIVE BRIEF");
    const framingIndex = result.indexOf(MOCKUP_FRAMING);
    expect(toolIndex).toBeGreaterThanOrEqual(0);
    expect(briefIndex).toBeGreaterThan(toolIndex);
    expect(framingIndex).toBeGreaterThan(briefIndex);
  });

  it("includes MOCKUP_FRAMING in the JSON export prompt", () => {
    const result = buildJsonExport(createDocument());
    expect(result.prompt).toContain(MOCKUP_FRAMING);
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
