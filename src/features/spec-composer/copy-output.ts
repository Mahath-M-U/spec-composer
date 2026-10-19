import { resolveEditorText } from "./output-sync";
import { compilePromptEditorOutput } from "./compiler";
import { compileDesignSkill } from "./design-md";
import type { BrandKit, SpecDocument } from "./types";

export type CopyKind = "prompt" | "design";

/** The text a copy action puts on the clipboard: the design's DESIGN.md
 * (hand edit if present, else compiled) or the prompt editor's output,
 * always compiled as a visual prompt regardless of the doc's own mode. */
export function compileCopyText(
  doc: SpecDocument,
  kit: BrandKit | undefined,
  kind: CopyKind,
): string {
  if (kind === "design")
    return resolveEditorText(doc, "design_skill", compileDesignSkill(doc, kit));
  return compilePromptEditorOutput(
    doc.promptMode === "visual_prompt" ? doc : { ...doc, promptMode: "visual_prompt" },
  );
}
