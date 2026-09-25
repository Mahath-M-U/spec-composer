import type { ExternalToolRequirement } from "./types";

export type ToolType = ExternalToolRequirement["toolType"];

export type CatalogTool = {
  id: string;
  name: string;
  type: Exclude<ToolType, "other">;
  blurb: string;
};

/** Catalog metadata only — no logo data here so this module stays a plain
 * type-only-import-friendly value module (node tests import it directly).
 * Brand marks live in ./tool-logos, keyed by `id`; see that module for
 * sourcing and the trademark note. */
export const TOOL_CATALOG: readonly CatalogTool[] = [
  {
    id: "canva",
    name: "Canva",
    type: "app",
    blurb: "Posters, social posts and presentations",
  },
  {
    id: "figma",
    name: "Figma",
    type: "app",
    blurb: "Interface and graphic design files",
  },
  {
    id: "adobe-express",
    name: "Adobe Express",
    type: "app",
    blurb: "Quick social graphics and flyers",
  },
  {
    id: "lovable",
    name: "Lovable",
    type: "app",
    blurb: "Build web apps from a prompt",
  },
  {
    id: "gamma",
    name: "Gamma",
    type: "app",
    blurb: "Presentations, docs and web pages",
  },
  {
    id: "miro",
    name: "Miro",
    type: "app",
    blurb: "Whiteboards and visual collaboration",
  },
  {
    id: "notion",
    name: "Notion",
    type: "connector",
    blurb: "Docs, wikis and project notes",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    type: "connector",
    blurb: "Files, Docs and Slides in your Drive",
  },
  {
    id: "github",
    name: "GitHub",
    type: "connector",
    blurb: "Repositories, issues and pull requests",
  },
  {
    id: "slack",
    name: "Slack",
    type: "connector",
    blurb: "Channels and team messages",
  },
];

export const TOOL_TYPE_LABEL: Record<ToolType, string> = {
  app: "App",
  connector: "Connector",
  plugin: "Plugin",
  other: "Tool",
};

/** Collapses incidental whitespace so "  Canva   Pro " reads as "Canva Pro". */
export function normalizeToolName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function findCatalogTool(name: string): CatalogTool | undefined {
  const normalized = normalizeToolName(name).toLowerCase();
  if (!normalized) return undefined;
  return TOOL_CATALOG.find((tool) => tool.name.toLowerCase() === normalized);
}

/** Substring match on name, case-insensitive, in catalog order. An empty
 * query returns the full catalog. */
export function filterCatalog(query: string): readonly CatalogTool[] {
  const normalized = normalizeToolName(query).toLowerCase();
  if (!normalized) return TOOL_CATALOG;
  return TOOL_CATALOG.filter((tool) =>
    tool.name.toLowerCase().includes(normalized),
  );
}

/** The name to offer as a custom tool for the current query, or null when
 * the query is blank, too long, or already an exact catalog match. */
export function customToolCandidate(query: string): string | null {
  const normalized = normalizeToolName(query);
  if (!normalized || normalized.length > 100) return null;
  if (findCatalogTool(normalized)) return null;
  return normalized;
}

/** Uppercase initials from the first two words, e.g. "Adobe Express" -> "AE". */
export function toolMonogram(name: string) {
  const words = normalizeToolName(name).split(" ").filter(Boolean);
  if (!words.length) return "?";
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0]?.toUpperCase() ?? "")
    .join("");
}

export function selectTool(
  base: ExternalToolRequirement,
  tool: { name: string; type: ToolType },
): ExternalToolRequirement {
  return {
    ...base,
    enabled: true,
    toolName: tool.name,
    toolType: tool.type,
  };
}

export function isAddedTool(
  settings: ExternalToolRequirement | undefined,
  name: string,
) {
  if (!settings?.enabled) return false;
  return (
    normalizeToolName(settings.toolName).toLowerCase() ===
    normalizeToolName(name).toLowerCase()
  );
}
