import { z } from "zod";

export type ContextualValue = string | number | boolean | null | ContextualValue[] | { [key: string]: ContextualValue };
const contextualValueSchema: z.ZodType<ContextualValue> = z.lazy(() => z.union([
  z.string(), z.number().finite(), z.boolean(), z.null(),
  z.array(contextualValueSchema), z.record(z.string(), contextualValueSchema),
]));

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
  | "assets"
  | "environment"
  | "layers"
  | "templates"
  | "brandKit"
  | "resize"
  | "style";
export type ToolMode = "select" | "hand";

export const SHAPE_ROLES = [
  "subject",
  "product",
  "background",
  "text_area",
  "decorative",
] as const;
export const shapeRoleSchema = z.enum(SHAPE_ROLES);
export type ShapeRole = z.infer<typeof shapeRoleSchema>;
export const CAMERA_ANGLES = [
  "Eye level",
  "Overhead",
  "Low angle",
  "Isometric",
] as const;
export const LIGHT_TYPES = [
  "Diffused light",
  "Sunlight",
  "Natural daylight",
  "Studio",
  "Directional",
  "Ambient",
] as const;
export const LIGHT_DIRECTIONS = [
  "Front",
  "Back",
  "Left",
  "Right",
  "Above",
] as const;
export const SHADOW_TYPES = ["None", "Soft", "Hard"] as const;
export const STUDIO_LIGHT_ROLES = ["Key", "Fill", "Rim", "Background"] as const;
export const STUDIO_LIGHT_SHAPES = ["Rectangle", "Disk"] as const;
export const STUDIO_LIGHT_MODIFIERS = [
  "Softbox",
  "Umbrella",
  "Diffusion panel",
  "Bare",
] as const;
export const MAX_STUDIO_LIGHTS = 6;
/** Scene objects (environment editor): a light's visual role in the 2D scene
 * canvas, distinct from its camera-relative STUDIO_LIGHT_ROLES. */
export const SCENE_LIGHT_KINDS = [
  "sun",
  "diffused",
  "spot",
  "point",
  "area",
] as const;
export type SceneLightKind = (typeof SCENE_LIGHT_KINDS)[number];
export const CAMERA_VIEW_ANGLES = [
  "eye-level",
  "low",
  "high",
  "top-down",
  "three-quarter",
] as const;
export type CameraViewAngle = (typeof CAMERA_VIEW_ANGLES)[number];
export const CAMERA_PROJECTIONS = [
  "normal",
  "wide",
  "telephoto",
  "orthographic",
] as const;
export type CameraProjection = (typeof CAMERA_PROJECTIONS)[number];
export const SCENE_DEPTHS = ["front", "side", "back"] as const;
export type SceneDepth = (typeof SCENE_DEPTHS)[number];
/** Shared cap for the number of scene lights (environment editor) and the
 * legacy studio lighting rig they're stored in. */
export const MAX_SCENE_LIGHTS = MAX_STUDIO_LIGHTS;
/** Normalized scene-canvas position: origin is the artboard centre, +x is
 * right, +y is up. */
export const sceneVec2Schema = z.object({
  x: z.number().finite().min(-1.5).max(1.5),
  y: z.number().finite().min(-1.5).max(1.5),
});
export type SceneVec2 = z.infer<typeof sceneVec2Schema>;
export const studioLightSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  enabled: z.boolean(),
  role: z.enum(STUDIO_LIGHT_ROLES),
  shape: z.enum(STUDIO_LIGHT_SHAPES),
  modifier: z.enum(STUDIO_LIGHT_MODIFIERS),
  azimuth: z.number().finite().min(-180).max(180),
  elevation: z.number().finite().min(-90).max(90),
  width: z.number().finite().min(0.1).max(5),
  height: z.number().finite().min(0.1).max(5),
  intensity: z.number().finite().min(0).max(100),
  diffusion: z.number().finite().min(0).max(100),
  temperature: z.number().finite().min(2000).max(10000),
  shadows: z.enum(SHADOW_TYPES),
  /** Scene editor (environment editor) fields, all optional so legacy rigs
   * parse unchanged; see scene-space.ts for the canvas <-> azimuth/elevation
   * mapping. */
  kind: z.enum(SCENE_LIGHT_KINDS).optional(),
  canvas: sceneVec2Schema.optional(),
  /** 2D aim on the scene canvas; 0 = pointing right, counter-clockwise. */
  rotation: z.number().finite().min(-180).max(180).optional(),
  depth: z.enum(SCENE_DEPTHS).optional(),
  coneAngle: z.number().finite().min(5).max(120).optional(),
  radius: z.number().finite().min(0.05).max(3).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  /** Hides this object's canvas guide without disabling it in the prompt. */
  guideHidden: z.boolean().optional(),
});
export type StudioLight = z.infer<typeof studioLightSchema>;
/** Environment editor camera; presence of this object means the scene has a
 * camera (there's at most one). */
export const sceneCameraSchema = z.object({
  enabled: z.boolean(),
  position: sceneVec2Schema,
  rotation: z.number().finite().min(-180).max(180),
  target: sceneVec2Schema,
  focalLength: z.number().finite().min(14).max(300),
  angle: z.enum(CAMERA_VIEW_ANGLES),
  projection: z.enum(CAMERA_PROJECTIONS),
  guideHidden: z.boolean().optional(),
});
export type SceneCamera = z.infer<typeof sceneCameraSchema>;
/** Global ambient fill; a scene setting rather than a positioned object, so
 * it has no canvas position. */
export const sceneAmbientSchema = z.object({
  enabled: z.boolean(),
  intensity: z.number().finite().min(0).max(100),
  temperature: z.number().finite().min(2000).max(10000),
});
export type SceneAmbient = z.infer<typeof sceneAmbientSchema>;
export const generationSettingsSchema = z.object({
  cameraAngle: z.enum(CAMERA_ANGLES).optional(),
  lightType: z.enum(LIGHT_TYPES).optional(),
  lightDirection: z.enum(LIGHT_DIRECTIONS).optional(),
  lightIntensity: z.number().finite().min(0).max(100).optional(),
  shadows: z.enum(SHADOW_TYPES).optional(),
  studioLights: z
    .array(studioLightSchema)
    .max(MAX_STUDIO_LIGHTS)
    .refine(
      (lights) =>
        new Set(lights.map((light) => light.id)).size === lights.length,
      "Studio light IDs must be unique.",
    )
    .optional(),
  camera: sceneCameraSchema.optional(),
  ambient: sceneAmbientSchema.optional(),
  /** Applied environment preset id (see environment-presets.ts, Step C). */
  scenePreset: z.string().optional(),
});

export type GenerationSettings = z.infer<typeof generationSettingsSchema>;

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
  alignment: z.enum(["left", "center", "right", "justify"]).optional(),
  color: z.string().optional(),
  background: z.string().optional(),
  objectFit: z.enum(["cover", "contain", "fill", "none"]).optional(),
  focalX: z.number().optional(),
  focalY: z.number().optional(),
  opacity: z.number().optional(),
  borderRadius: z.number().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
  shapeType: z
    .enum([
      "rectangle",
      "rounded rectangle",
      "circle",
      "ellipse",
      "triangle",
      "diamond",
      "line",
    ])
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

export const descriptionValuesSchema = z
  .record(z.string().min(1).max(40), z.string().max(200))
  .refine(
    (values) => Object.keys(values).length <= 8,
    "A description supports at most eight fields.",
  );
export const descriptionTemplateSelectionSchema = z.object({
  id: z.string().min(1).max(80),
  values: descriptionValuesSchema,
});
export const descriptionDraftsSchema = z.object({
  custom: z.string().max(20_000).optional(),
  templates: z
    .record(
      z.string().min(1).max(80),
      z.object({
        values: descriptionValuesSchema,
        rendered: z.string().max(20_000).optional(),
      }),
    )
    .refine(
      (templates) => Object.keys(templates).length <= 10,
      "At most ten description drafts can be saved.",
    )
    .optional(),
});
export type DescriptionTemplateSelection = z.infer<
  typeof descriptionTemplateSelectionSchema
>;
export type DescriptionDrafts = z.infer<typeof descriptionDraftsSchema>;

const specElementSchema = z.object({
  id: z.string(),
  /** Semantic catalog identity supplements the existing rendering kind. */
  catalogElementId: z.string().optional(),
  contextualProperties: z.record(z.string(), contextualValueSchema).optional(),
  kind: z.enum(ELEMENT_KINDS),
  name: z.string(),
  content: z.string().optional(),
  src: z.string().optional(),
  /** Presentation-only motif key shown in an empty image slot; never compiled into prompts. */
  placeholderArt: z.string().optional(),
  aiDescription: z.string().optional(),
  /** Material and texture, compiled into the element's prompt/slot line (see art-direction.ts). */
  material: z.string().optional(),
  /** Auto-slot role (an AssetRole id) this element was dropped into; a plain
   * string so unrecognized values still parse (see asset-catalog/roles.ts). */
  slot: z.string().optional(),
  semanticRole: shapeRoleSchema.optional(),
  /** Catalog item id this element was created or last slotted from. */
  assetId: z.string().optional(),
  /** User-entered subject detail, compiled into the prompt (see Phase 8). */
  detail: z.string().optional(),
  descriptionTemplate: descriptionTemplateSelectionSchema.optional(),
  descriptionDrafts: descriptionDraftsSchema.optional(),
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

/**
 * The 10-field brand strategy profile collected by the brand kit builder.
 * Every key is optional and unconstrained in length/count so stored docs and
 * kits always parse — the builder's own UI enforces sane limits (e.g. 5 core
 * values) on write.
 */
export const brandProfileSchema = z.object({
  visionThemes: z.array(z.string()).optional(),
  vision: z.string().optional(),
  missionFocus: z.array(z.string()).optional(),
  mission: z.string().optional(),
  values: z.array(z.string()).optional(),
  archetype: z.string().optional(),
  personality: z.record(z.string(), z.number()).optional(),
  audienceAges: z.array(z.string()).optional(),
  audienceSegments: z.array(z.string()).optional(),
  audienceInterests: z.array(z.string()).optional(),
  audience: z.string().optional(),
  positioningTier: z.string().optional(),
  differentiators: z.array(z.string()).optional(),
  positioning: z.string().optional(),
  voiceTone: z.record(z.string(), z.number()).optional(),
  voiceTraits: z.array(z.string()).optional(),
});
export type BrandProfile = z.infer<typeof brandProfileSchema>;

const creativeDirectionSchema = z.object({
  style: z.string(),
  mood: z.array(z.string()),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  notes: z.string(),
  typography: z.string(),
  brandKitId: z.string().optional(),
  styleKitId: z.string().optional(),
  brandProfile: brandProfileSchema.optional(),
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
  /** Whether the Mood section reaches prompt.md/design.md; see art-direction.ts. */
  mood: z.boolean().optional(),
  /** Whether the Scene section reaches prompt.md/design.md; see art-direction.ts. */
  scene: z.boolean().optional(),
  /** Whether the Lighting section reaches prompt.md/design.md; see art-direction.ts. */
  lighting: z.boolean().optional(),
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

export const layerGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  parentId: z.string().min(1).optional(),
});
export type LayerGroup = z.infer<typeof layerGroupSchema>;

const specDocumentShape = z
  .object({
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
    creativePurposeId: z.string().optional(),
    referenceAssets: z.record(z.string(), z.object({
      source: z.string(), name: z.string(), type: z.string(),
    })).optional(),
    groups: z.array(layerGroupSchema).optional(),
    imageBrief: z.string().default(""),
    promptMode: z.enum(["visual_prompt", "design_skill"]),
    promptOptions: promptOptionsSchema,
    externalToolRequirement: externalToolRequirementSchema.optional(),
    /** Prompt Editor image style id (see image-styles.ts); unknown ids add nothing. */
    imageStyle: z.string().optional(),
    /** Prompt Scene section; free text, see art-direction.ts. */
    scene: z.string().optional(),
    /** Prompt Lighting section; free text, see art-direction.ts. */
    lighting: z.string().optional(),
    generationSettings: generationSettingsSchema.optional(),
    savedCustomText: z
      .object({ visual: z.string().optional(), design: z.string().optional() })
      .optional(),
    /** Hand edit for the Design Editor (promptMode "design_skill"). */
    designEdit: z.string().optional(),
    designEditRevision: z.number().optional(),
    /** Hand edit for the Prompt Editor (promptMode "visual_prompt"). */
    visualEdit: z.string().optional(),
    visualEditRevision: z.number().optional(),
    promptParts: z.record(z.string(), z.string()).optional(),
    /** Last applied Compose layout id (see compose-layouts.ts isComposeLayout). */
    layout: z.string().optional(),
    revision: z.number(),
  })
  .superRefine((doc, ctx) => {
    const ids = new Set(doc.elements.map((el) => el.id));
    const groups = new Map(doc.groups?.map((group) => [group.id, group]));
    for (const group of doc.groups ?? []) {
      if (ids.has(group.id))
        ctx.addIssue({ code: "custom", message: "Layer IDs must be unique." });
      ids.add(group.id);
      if (group.parentId && !groups.has(group.parentId))
        ctx.addIssue({
          code: "custom",
          message: "Group parent does not exist.",
        });
      const seen = new Set([group.id]);
      let parent = group.parentId;
      while (parent) {
        if (seen.has(parent)) {
          ctx.addIssue({
            code: "custom",
            message: "Groups cannot contain cycles.",
          });
          break;
        }
        seen.add(parent);
        parent = groups.get(parent)?.parentId;
      }
    }
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

/** Docs saved before Mood, Scene and Lighting became opt-in sections lack
 * these flags: legacy docs keep Mood (unless it was explicitly blanked via
 * `promptParts.mood === ""`) and gain Scene/Lighting only when they already
 * have a value. New docs set all three explicitly in `createDocument`, so
 * this never touches them. Also drops any `""` override left behind for
 * these sections — they'd otherwise force an empty line back into the
 * compiled output despite the section being off. */
const OPTIONAL_SECTION_OVERRIDE_KEYS = [
  "mood",
  "scene",
  "lighting",
  "skill:scene",
  "skill:lighting",
];
function migrateOptionalSections(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const v = value as Record<string, unknown>;
  const options = v["promptOptions"];
  if (!options || typeof options !== "object") return value;
  const opts = options as Record<string, unknown>;
  const parts = v["promptParts"];
  const partsObj =
    parts && typeof parts === "object"
      ? (parts as Record<string, unknown>)
      : undefined;
  const needsFlag =
    typeof opts["mood"] !== "boolean" ||
    typeof opts["scene"] !== "boolean" ||
    typeof opts["lighting"] !== "boolean";
  const needsPartsCleanup =
    !!partsObj &&
    OPTIONAL_SECTION_OVERRIDE_KEYS.some((k) => partsObj[k] === "");
  if (!needsFlag && !needsPartsCleanup) return value;
  const nextOptions = { ...opts };
  if (typeof nextOptions["mood"] !== "boolean")
    nextOptions["mood"] = partsObj?.["mood"] !== "";
  if (typeof nextOptions["scene"] !== "boolean")
    nextOptions["scene"] =
      typeof v["scene"] === "string" && v["scene"].trim() !== "";
  if (typeof nextOptions["lighting"] !== "boolean")
    nextOptions["lighting"] =
      typeof v["lighting"] === "string" && v["lighting"].trim() !== "";
  const nextParts = partsObj ? { ...partsObj } : undefined;
  if (nextParts)
    for (const k of OPTIONAL_SECTION_OVERRIDE_KEYS)
      if (nextParts[k] === "") delete nextParts[k];
  return {
    ...v,
    promptOptions: nextOptions,
    ...(nextParts ? { promptParts: nextParts } : {}),
  };
}

// Order matters: agent_spec docs already have their edit deleted by
// migrateLegacyPromptMode, so splitLegacyPromptEdit has nothing left to route.
const migrateSpecDocument = (v: unknown) =>
  migrateOptionalSections(
    dropRetiredPromptParts(splitLegacyPromptEdit(migrateLegacyPromptMode(v))),
  );

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
  profile?: BrandProfile;
}

export function isSpecDocument(value: unknown): value is SpecDocument {
  return specDocumentSchema.safeParse(value).success;
}

export function parseSpecDocument(value: unknown): SpecDocument | undefined {
  const result = specDocumentSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

/** Limits for new writes and imports. Historical records remain readable so
 * users can export or repair them instead of losing access on upgrade. */
export function validateWritableDocument(value: unknown): SpecDocument {
  const doc = specDocumentSchema.parse(value);
  const { width, height } = doc.format;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 64 ||
    height < 64 ||
    width > 8192 ||
    height > 8192 ||
    width * height > 32_000_000
  )
    throw new Error(
      "Canvas must be 64–8192 px per side and at most 32 megapixels.",
    );
  if (doc.elements.length > 500)
    throw new Error("A design can contain at most 500 elements.");
  if (
    doc.elements.filter((element) => element.src?.startsWith("data:")).length >
    40
  )
    throw new Error("A design can contain at most 40 embedded images.");
  const finite = (value: number) =>
    Number.isFinite(value) && Math.abs(value) <= 100_000;
  for (const element of doc.elements) {
    if (
      ![
        element.x,
        element.y,
        element.width,
        element.height,
        element.rotation,
        element.zIndex,
      ].every(finite) ||
      element.width < 1 ||
      element.height < 1
    )
      throw new Error("An element has invalid geometry.");
    if (
      (element.content?.length ?? 0) > 20_000 ||
      (element.aiDescription?.length ?? 0) > 20_000 ||
      (element.material?.length ?? 0) > 20_000 ||
      (element.detail?.length ?? 0) > 20_000
    )
      throw new Error("An element's text is too long.");
    if (
      (element.slot?.length ?? 0) > 200 ||
      (element.assetId?.length ?? 0) > 200
    )
      throw new Error("An element's asset reference is too long.");
    if (element.src?.startsWith("data:") && element.src.length > 7_000_000)
      throw new Error("An embedded image is too large.");
  }
  if ((doc.layout?.length ?? 0) > 200)
    throw new Error("The design's layout id is too long.");
  if (
    Object.values(doc.savedCustomText ?? {}).some(
      (text) => (text?.length ?? 0) > 200_000,
    )
  )
    throw new Error("Saved custom output is too long.");
  const serialized = JSON.stringify(doc);
  if (serialized.length > 24_000_000)
    throw new Error("Design exceeds the 24 MB project limit.");
  return doc;
}
