import {
  isTextKind,
  type ExternalToolRequirement,
  type SpecDocument,
  type SpecElement,
} from "./types.ts";
import { imageStyleLine } from "./image-styles.ts";
import { artDirectionLine } from "./art-direction.ts";
const priorities: Record<string, number> = {
  title: 1,
  heroImage: 1,
  productImage: 1,
  humanModelImage: 1,
  offer: 2,
  price: 3,
  subheading: 3,
  logo: 3,
  eyebrow: 4,
  badge: 4,
  cta: 4,
  body: 5,
  supportingImage: 5,
  brandMark: 6,
  shape: 7,
  divider: 8,
};
export function region(el: SpecElement, doc: SpecDocument) {
  const cx = (el.x + el.width / 2) / doc.format.width,
    cy = (el.y + el.height / 2) / doc.format.height;
  const h =
    cx < 0.2
      ? "far left"
      : cx < 0.4
        ? "left"
        : cx < 0.6
          ? "center"
          : cx < 0.8
            ? "right"
            : "far right";
  const v =
    cy < 0.2
      ? "top"
      : cy < 0.4
        ? "upper"
        : cy < 0.6
          ? "center"
          : cy < 0.8
            ? "lower"
            : "bottom";
  return `${v}-${h}`;
}
export function ratio(w: number, h: number) {
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  const d = g(w, h);
  return `${w / d}:${h / d}`;
}
export type PromptSeg =
  | string
  | {
      id: string;
      field: "content" | "aiDescription";
      value: string;
      fallback: string;
    };
export const segText = (segs: PromptSeg[]) =>
  segs.map((g) => (typeof g === "string" ? g : g.value || g.fallback)).join("");
function describeSegs(el: SpecElement, doc: SpecDocument): PromptSeg[] {
  const where = doc.promptOptions.relativePositioning
    ? ` in the ${region(el, doc)}`
    : "";
  const size = doc.promptOptions.dimensions
    ? `, sized approximately ${el.width} × ${el.height}`
    : "";
  const rotation = el.rotation ? `, rotated ${el.rotation}°` : "";
  if (isTextKind(el.kind) || el.content !== undefined)
    return [
      `${el.name} (${el.kind})${where}${size}: exact text “`,
      { id: el.id, field: "content", value: el.content ?? "", fallback: "" },
      `”${rotation}${doc.promptOptions.typography && el.style.fontSize ? `, ${el.style.fontSize}px ${el.style.fontWeight ?? 400}${el.style.fontStyle === "italic" ? " italic" : ""} ${el.style.fontFamily ?? "sans-serif"}` : ""}${doc.promptOptions.colors && el.style.color ? `, color ${el.style.color}` : ""}.`,
    ];
  return [
    `${el.name} (${el.kind})${where}${size}: `,
    {
      id: el.id,
      field: "aiDescription",
      value: el.aiDescription || "",
      fallback: "editable visual placeholder",
    },
    `${rotation}, ${el.style.objectFit || "contain"} fit.`,
  ];
}
/** Appends anti-slop directives for one element's constraint settings, gated by promptOptions. */
function describeConstraint(el: SpecElement, doc: SpecDocument): PromptSeg[] {
  const segs: PromptSeg[] = [];
  const c = el.constraint;
  if (!c) return segs;
  if (doc.promptOptions.elementConstraints && c.positiveConstraint)
    segs.push(` Must include: ${c.positiveConstraint}.`);
  if (doc.promptOptions.negativeConstraints && c.negativeConstraint)
    segs.push(` Must avoid: ${c.negativeConstraint}.`);
  if (c.lock === "exact")
    segs.push(
      ` This region is locked: reproduce exactly as specified, do not reinterpret.`,
    );
  return segs;
}
const describe = (el: SpecElement, doc: SpecDocument) =>
  segText([...describeSegs(el, doc), ...describeConstraint(el, doc)]);
export const an = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");
export type PromptLine = { key: string; segs: PromptSeg[]; custom: boolean };
/** The largest visible image layer: what the prompt calls the dominant visual. */
export const dominantVisual = (doc: SpecDocument) =>
  doc.elements
    .filter((e) => e.visible && e.kind.toLowerCase().includes("image"))
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];
/** The brief as a prompt line, e.g. "Purpose: Launch post for …". The panel
 * edits it in place as its own section, so it isn't a generated segment. */
export const purposeLine = (doc: SpecDocument) => {
  const brief = doc.imageBrief.trim().replace(/[.\s]+$/, "");
  return brief ? `Purpose: ${brief}.` : "";
};
export const withOverrides = (
  lines: [string, PromptSeg[]][],
  doc: SpecDocument,
) =>
  lines.map(([key, segs]) => {
    const o = doc.promptParts?.[key];
    return o != null
      ? { key, segs: [o], custom: true }
      : { key, segs, custom: false };
  });
export function compileVisualSegments(doc: SpecDocument): PromptLine[] {
  const els = doc.elements
    .filter((e) => e.visible)
    .sort(
      (a, b) =>
        (priorities[a.kind] ?? 9) - (priorities[b.kind] ?? 9) ||
        a.zIndex - b.zIndex,
    );
  const dominant = dominantVisual(doc);
  const lines: [string, PromptSeg[]][] = [
    [
      "format",
      [
        `Create ${an(doc.creativeDirection.style)} ${doc.creativeDirection.style.toLowerCase()} ${doc.format.subtitle} ${doc.format.label.toLowerCase()} at ${doc.format.width} × ${doc.format.height} (${ratio(doc.format.width, doc.format.height)}).`,
      ],
    ],
  ];
  const style = imageStyleLine(doc);
  if (style) lines.push(["imageStyle", [style]]);
  if (doc.promptOptions.colors)
    lines.push([
      "colors",
      [
        `Use ${doc.background.type === "gradient" ? `a ${doc.background.angle ?? 135}° gradient from ${doc.background.value} to ${doc.background.secondaryValue}` : `a ${doc.background.value} background`}, with ${doc.creativeDirection.primaryColor} as the primary color and ${doc.creativeDirection.secondaryColor} as the secondary color.`,
      ],
    ]);
  if (doc.promptOptions.brandDirectives && doc.creativeDirection.brandKitId) {
    const brandLocked = doc.elements
      .filter((e) => e.visible && e.constraint?.brandLocked)
      .map((e) => e.name);
    lines.push([
      "brand",
      [
        `Brand-mandatory values (non-negotiable, do not substitute): primary ${doc.creativeDirection.primaryColor}, secondary ${doc.creativeDirection.secondaryColor}, typography ${doc.creativeDirection.typography}.${brandLocked.length ? ` Elements ${brandLocked.join(", ")} are brand-locked and must match these exactly.` : ""}`,
      ],
    ]);
  }
  lines.push([
    "mood",
    [
      `Mood: ${doc.creativeDirection.mood.join(", ")}. Typography direction: ${doc.creativeDirection.typography}.`,
    ],
  ]);
  if (dominant)
    lines.push([
      "dominant",
      [
        "The dominant visual is ",
        {
          id: dominant.id,
          field: "aiDescription",
          value: dominant.aiDescription || "",
          fallback: dominant.name.toLowerCase(),
        },
        `, positioned ${region(dominant, doc)} and occupying roughly ${Math.round(((dominant.width * dominant.height) / (doc.format.width * doc.format.height)) * 100)}% of the canvas.`,
      ],
    ]);
  for (const e of els)
    lines.push([
      `el:${e.id}`,
      [...describeSegs(e, doc), ...describeConstraint(e, doc)],
    ]);
  lines.push([
    "layout",
    [
      "Maintain clear hierarchy, intentional alignment, and generous negative space.",
    ],
  ]);
  if (doc.promptOptions.negativeConstraints)
    lines.push([
      "avoid",
      [
        "Avoid additional text, clutter, generic stock-poster styling, illegible type, accidental overlaps, and elements outside the safe area.",
      ],
    ]);
  return withOverrides(lines, doc);
}
export function compileVisualPrompt(doc: SpecDocument) {
  const lines = compileVisualSegments(doc).map((l) => ({
    key: l.key,
    text: segText(l.segs),
  }));
  // Purpose follows the format line, matching where the panel shows it.
  const at = lines.findIndex((l) => l.key === "format") + 1;
  lines.splice(at, 0, { key: "purpose", text: purposeLine(doc) });
  lines.splice(at + 1, 0, {
    key: "artDirection",
    text: artDirectionLine(doc),
  });
  return lines
    .map((l) => l.text)
    .filter((t) => t.trim().length > 0)
    .join("\n\n");
}

export const defaultExternalToolRequirement = (): ExternalToolRequirement => ({
  enabled: false,
  destination: "chatgpt",
  toolName: "",
  toolType: "app",
  output: "standard",
});

export type ExternalToolError = {
  field: "toolName" | "assistantName" | "task";
  message: string;
};

export function validateExternalToolRequirement(
  settings?: ExternalToolRequirement,
): ExternalToolError | null {
  if (!settings?.enabled) return null;
  if (!settings.toolName.trim())
    return {
      field: "toolName",
      message: "Choose a tool before copying, or remove the requirement.",
    };
  if (settings.toolName.trim().length > 100)
    return {
      field: "toolName",
      message: "Keep the tool name under 100 characters.",
    };
  if (settings.destination === "other" && !settings.assistantName?.trim())
    return {
      field: "assistantName",
      message: "Enter the assistant name before copying.",
    };
  if ((settings.assistantName?.trim().length ?? 0) > 100)
    return {
      field: "assistantName",
      message: "Keep the assistant name under 100 characters.",
    };
  if ((settings.task?.trim().length ?? 0) > 500)
    return {
      field: "task",
      message: "Keep the tool task under 500 characters.",
    };
  return null;
}

/** A separately generated directive. Never store it in visualEdit or promptParts. */
export function compileExternalToolRequirement(
  settings: ExternalToolRequirement,
) {
  if (!settings.enabled || validateExternalToolRequirement(settings)) return "";
  const tool = settings.toolName.trim();
  const destination =
    settings.destination === "chatgpt"
      ? "this ChatGPT conversation"
      : `this ${settings.assistantName!.trim()} conversation`;
  const kind = settings.toolType === "other" ? "tool" : settings.toolType;
  const action = settings.task?.trim()
    ? `Use it to ${settings.task.trim().replace(/[.\s]+$/, "")}.`
    : "Use it to create the final design described below.";
  const lines = [
    "REQUIRED TOOL",
    `Use the ${tool} ${kind} available in ${destination}. ${action} Invoke that tool to perform the work; mentioning it or describing how to use it does not satisfy this requirement.`,
  ];
  if (settings.output === "editable_design")
    lines.push(
      "Create an editable design. Keep text editable and design objects separately selectable wherever supported. A flattened image alone does not satisfy the requested deliverable. Raster assets may remain raster assets within the design. Return the actual editable design link or source file produced through the tool. Do not invent a link, file, or claim that the tool was used.",
    );
  else
    lines.push(
      "Return the actual result produced through the tool. Do not invent a link, file, or claim that the tool was used.",
    );
  lines.push(
    `If ${tool} is unavailable, cannot create this deliverable, or requires access, explain what is missing and ask me to connect it or revise the requirement. Do not silently substitute another tool${settings.output === "editable_design" ? " or present a flattened image as completion" : ""}. Follow the destination assistant's permissions and approval requirements.`,
  );
  return lines.join("\n\n");
}

export function compilePromptEditorOutput(doc: SpecDocument) {
  const body = doc.visualEdit ?? compileVisualPrompt(doc);
  if (doc.promptMode !== "visual_prompt") return body;
  const directive = doc.externalToolRequirement
    ? compileExternalToolRequirement(doc.externalToolRequirement)
    : "";
  return directive ? `${directive}\n\nCREATIVE BRIEF\n${body}` : body;
}

/** Wraps the raw spec with an explicit generation instruction and the compiled
 * visual prompt, so a JSON export is directly actionable when pasted into an
 * image generator instead of being inert structured data. */
export function buildJsonExport(doc: SpecDocument) {
  return {
    instruction: `Generate a ${doc.format.width} × ${doc.format.height} image from this specification. Follow "prompt" as the primary creative brief, and use "spec" as the exact source of truth for copy, colors, and layout.`,
    prompt: compilePromptEditorOutput(doc),
    spec: doc,
  };
}

/** Compiles a prompt for regenerating a single element/region while leaving
 * the rest of the poster untouched (partial-region regenerate workflow). */
export function compileRegionPrompt(doc: SpecDocument, elementId: string) {
  const el = doc.elements.find((e) => e.id === elementId);
  if (!el) return "";
  const lines = [
    `Regenerate only the "${el.name}" region of this ${doc.format.label.toLowerCase()} (${doc.format.width} × ${doc.format.height}), positioned ${region(el, doc)} at (${el.x}, ${el.y}) sized ${el.width} × ${el.height}. Every other element must remain untouched.`,
    describe(el, doc),
  ];
  if (doc.promptOptions.brandDirectives && doc.creativeDirection.brandKitId)
    lines.push(
      `Brand-mandatory values: primary ${doc.creativeDirection.primaryColor}, secondary ${doc.creativeDirection.secondaryColor}, typography ${doc.creativeDirection.typography}.`,
    );
  return lines.join("\n\n");
}
