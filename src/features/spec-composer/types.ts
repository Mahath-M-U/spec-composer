import { z } from "zod";

export const TEXT_KINDS = [
  "title",
  "subheading",
  "body",
  "eyebrow",
  "offer",
  "price",
  "badge",
  "cta",
] as const;
export const IMAGE_KINDS = [
  "heroImage",
  "productImage",
  "humanModelImage",
  "supportingImage",
  "logo",
  "brandMark",
] as const;
export const STRUCTURE_KINDS = ["shape", "divider"] as const;
export const ELEMENT_KINDS = [
  ...TEXT_KINDS,
  ...IMAGE_KINDS,
  ...STRUCTURE_KINDS,
] as const;

export type TextKind = (typeof TEXT_KINDS)[number];
export type ImageKind = (typeof IMAGE_KINDS)[number];
export type ElementKind = (typeof ELEMENT_KINDS)[number];

export type PromptMode = "visual_prompt" | "design_skill";
export type PanelMode =
  "assets" | "layers" | "templates" | "brandKit" | "resize";
export type ToolMode = "select" | "hand";

export const isTextKind = (kind: ElementKind): kind is TextKind =>
  (TEXT_KINDS as readonly string[]).includes(kind);
export const isImageKind = (kind: ElementKind): kind is ImageKind =>
  (IMAGE_KINDS as readonly string[]).includes(kind);

const formatSchema = z.object({
  id: z.string(),
  label: z.string(),
  subtitle: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  category: z.string(),
  platform: z
    .enum([
      "instagram",
      "whatsapp",
      "facebook",
      "linkedin",
      "youtube",
      "x",
      "tiktok",
      "pinterest",
      "generic",
    ])
    .optional(),
  type: z
    .enum([
      "post",
      "story",
      "reel",
      "ad",
      "cover",
      "video",
      "profile",
      "carousel",
      "status",
      "thumbnail",
      "background",
    ])
    .optional(),
  usage: z.string().optional(),
  animated: z.boolean().optional(),
  popular: z.boolean().optional(),
  previewVariant: z.string().optional(),
  templateIds: z.array(z.string()).optional(),
  listedInPlatform: z.boolean().optional(),
});

const elementStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  alignment: z.enum(["left", "center", "right"]).optional(),
  color: z.string().optional(),
  background: z.string().optional(),
  objectFit: z.enum(["cover", "contain"]).optional(),
  focalX: z.number().optional(),
  focalY: z.number().optional(),
  opacity: z.number().optional(),
  borderRadius: z.number().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
  shapeType: z
    .enum(["rectangle", "rounded rectangle", "circle", "line"])
    .optional(),
});

/**
 * Per-element directives for the compiled AI image-gen prompt: how tightly
 * this region should be constrained so external generators don't drift into
 * generic "AI slop" when recomposing the poster.
 */
const elementConstraintSchema = z.object({
  lock: z.enum(["exact", "guided", "free"]).optional(),
  positiveConstraint: z.string().optional(),
  negativeConstraint: z.string().optional(),
  brandLocked: z.boolean().optional(),
});
export type ElementConstraint = z.infer<typeof elementConstraintSchema>;

const specElementSchema = z.object({
  id: z.string(),
  kind: z.enum(ELEMENT_KINDS),
  name: z.string(),
  content: z.string().optional(),
  src: z.string().optional(),
  /** Presentation-only motif key shown in an empty image slot; never compiled into prompts. */
  placeholderArt: z.string().optional(),
  aiDescription: z.string().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  zIndex: z.number(),
  visible: z.boolean(),
  locked: z.boolean(),
  groupId: z.string().optional(),
  style: elementStyleSchema,
  constraint: elementConstraintSchema.optional(),
});

const creativeDirectionSchema = z.object({
  style: z.string(),
  mood: z.array(z.string()),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  notes: z.string(),
  typography: z.string(),
  brandKitId: z.string().optional(),
  styleKitId: z.string().optional(),
});

const promptOptionsSchema = z.object({
  exactText: z.boolean(),
  relativePositioning: z.boolean(),
  dimensions: z.boolean(),
  colors: z.boolean(),
  typography: z.boolean(),
  negativeConstraints: z.boolean(),
  elementConstraints: z.boolean().optional(),
  brandDirectives: z.boolean().optional(),
});

export const externalToolRequirementSchema = z.object({
  enabled: z.boolean(),
  destination: z.enum(["chatgpt", "other"]),
  assistantName: z.string().optional(),
  toolName: z.string(),
  toolType: z.enum(["app", "connector", "plugin", "other"]),
  task: z.string().optional(),
  output: z.enum(["standard", "editable_design"]),
});
export type ExternalToolRequirement = z.infer<
  typeof externalToolRequirementSchema
>;

/** A 13-stop Material 3 tonal scale: tone (0-100, "0" = black, "100" = white) -> hex. */
const m3TonalScaleSchema = z.record(z.string(), z.string());

const materialColorKitSchema = z.object({
  seedHex: z.string(),
  primary: m3TonalScaleSchema,
  secondary: m3TonalScaleSchema,
  tertiary: m3TonalScaleSchema,
  neutral: m3TonalScaleSchema,
  neutralVariant: m3TonalScaleSchema,
  error: m3TonalScaleSchema,
});
export type MaterialColorKit = z.infer<typeof materialColorKitSchema>;

const styleKitSchema = z.object({
  id: z.string(),
  kind: z.literal("material3"),
  name: z.string(),
  materialColors: materialColorKitSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StyleKit = z.infer<typeof styleKitSchema>;

const specDocumentShape = z.object({
  id: z.string(),
  version: z.literal("1.0"),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  format: formatSchema,
  creativeDirection: creativeDirectionSchema,
  background: z.object({
    type: z.enum(["solid", "gradient"]),
    value: z.string(),
    secondaryValue: z.string().optional(),
    angle: z.number().optional(),
  }),
  elements: z.array(specElementSchema),
  imageBrief: z.string().default(""),
  promptMode: z.enum(["visual_prompt", "design_skill"]),
  promptOptions: promptOptionsSchema,
  externalToolRequirement: externalToolRequirementSchema.optional(),
  /** Prompt Editor image style id (see image-styles.ts); unknown ids add nothing. */
  imageStyle: z.string().optional(),
  /** Hand edit for the Design Editor (promptMode "design_skill"). */
  designEdit: z.string().optional(),
  designEditRevision: z.number().optional(),
  /** Hand edit for the Prompt Editor (promptMode "visual_prompt"). */
  visualEdit: z.string().optional(),
  visualEditRevision: z.number().optional(),
  promptParts: z.record(z.string(), z.string()).optional(),
  revision: z.number(),
});

/** Projects saved by the retired "agent_spec" mode open in the design editor;
 * their hand-edited spec text no longer matches that output, so it's dropped. */
const migrateLegacyPromptMode = (value: unknown) => {
  if (
    !value ||
    typeof value !== "object" ||
    (value as { promptMode?: unknown }).promptMode !== "agent_spec"
  )
    return value;
  const next: Record<string, unknown> = {
    ...value,
    promptMode: "design_skill",
  };
  delete next["promptEdit"];
  delete next["promptEditRevision"];
  return next;
};

/** A DESIGN.md, recognized by its heading markup — a leading `# Title` or
 * any `## Section` line — rather than by prose. */
const looksLikeDesignMd = (text: string) =>
  /^\s*# \S/.test(text) || /^## \S/m.test(text);

/** Projects saved before the Design Editor and Prompt Editor hand edits were
 * split share a single `promptEdit`/`promptEditRevision` pair. Route it to
 * `designEdit` when it reads like a DESIGN.md or the doc's promptMode was
 * "design_skill", otherwise to `visualEdit`, so the legacy edit lands in
 * exactly one mode instead of leaking into both. An edit already present in
 * the target field wins over the legacy one. */
const splitLegacyPromptEdit = (value: unknown) => {
  if (!value || typeof value !== "object") return value;
  const v = value as Record<string, unknown>;
  const next: Record<string, unknown> = { ...v };
  const text = next["promptEdit"];
  if (typeof text === "string") {
    const target =
      looksLikeDesignMd(text) || next["promptMode"] === "design_skill"
        ? "designEdit"
        : "visualEdit";
    if (typeof next[target] !== "string") {
      next[target] = text;
      const revision = next["promptEditRevision"];
      if (typeof revision === "number") next[`${target}Revision`] = revision;
    }
  }
  delete next["promptEdit"];
  delete next["promptEditRevision"];
  return next;
};

/** Section overrides saved for skills that were later retired — Surfaces and
 * the Agent Prompt Guide were dropped because Colors and Components already
 * cover the same ground; kept in `promptParts` they'd render as dangling
 * text with nothing to attach to. */
const RETIRED_PROMPT_PARTS = [
  "skill:quickstart",
  "skill:surfaces",
  "skill:agent",
];

function dropRetiredPromptParts(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const parts = (value as { promptParts?: unknown }).promptParts;
  if (!parts || typeof parts !== "object") return value;
  const entries = parts as Record<string, unknown>;
  if (!RETIRED_PROMPT_PARTS.some((k) => k in entries)) return value;
  const nextParts = { ...entries };
  for (const k of RETIRED_PROMPT_PARTS) delete nextParts[k];
  return { ...(value as Record<string, unknown>), promptParts: nextParts };
}

// Order matters: agent_spec docs already have their edit deleted by
// migrateLegacyPromptMode, so splitLegacyPromptEdit has nothing left to route.
const migrateSpecDocument = (v: unknown) =>
  dropRetiredPromptParts(splitLegacyPromptEdit(migrateLegacyPromptMode(v)));

export const specDocumentSchema = z.preprocess(
  migrateSpecDocument,
  specDocumentShape,
);

export type Format = z.infer<typeof formatSchema>;
export type ElementStyle = z.infer<typeof elementStyleSchema>;
export type SpecElement = z.infer<typeof specElementSchema>;
export type CreativeDirection = z.infer<typeof creativeDirectionSchema>;
export type PromptOptions = z.infer<typeof promptOptionsSchema>;
export type SpecDocument = z.infer<typeof specDocumentSchema>;

export interface HistoryState {
  past: SpecDocument[];
  future: SpecDocument[];
}

export interface BrandKitColor {
  id: string;
  hex: string;
  secondaryHex?: string;
  angle: number;
  type: "solid" | "gradient";
  role: "primary" | "secondary" | "background" | "text" | "accent";
  usecase: string;
}

export interface BrandKit {
  id: string;
  name: string;
  colors: BrandKitColor[];
  emotions: string[];
  style: string;
  typography: string;
  createdAt: string;
  updatedAt: string;
  sourceKind?: "material3";
  styleKitId?: string;
}

export function isSpecDocument(value: unknown): value is SpecDocument {
  return specDocumentSchema.safeParse(value).success;
}

export function parseSpecDocument(value: unknown): SpecDocument | undefined {
  const result = specDocumentSchema.safeParse(value);
  return result.success ? result.data : undefined;
}
