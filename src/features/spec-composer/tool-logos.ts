import figmaLogo from "../../assets/tool-logos/figma.svg";
import gammaLogo from "../../assets/tool-logos/gamma.svg";
import githubLogo from "../../assets/tool-logos/github.svg";
import googleDriveLogo from "../../assets/tool-logos/google-drive.svg";
import lovableLogo from "../../assets/tool-logos/lovable.svg";
import notionLogo from "../../assets/tool-logos/notion.svg";
import slackLogo from "../../assets/tool-logos/slack.svg";
import { findCatalogTool } from "./tool-catalog";

/**
 * Brand marks for the tool catalog. Names and logos are trademarks of their
 * owners, shown only to identify the tool; no integration or endorsement is
 * implied.
 *
 * Sourcing, by catalog id (see `tool-catalog.ts`):
 * - figma: official icon, https://www.figma.com/using-the-figma-brand/ (via
 *   Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Figma-logo.svg)
 * - google-drive: official 2020 icon, https://developers.google.com/drive
 *   (via https://commons.wikimedia.org/wiki/File:Google_Drive_icon_(2020).svg)
 * - github: official Octicons mark, https://github.com/logos (via
 *   https://commons.wikimedia.org/wiki/File:Octicons-mark-github.svg)
 * - slack: official 2019 icon (via
 *   https://commons.wikimedia.org/wiki/File:Slack_icon_2019.svg)
 * - notion: official mark, https://www.notion.so (via
 *   https://commons.wikimedia.org/wiki/File:Notion-logo.svg)
 * - lovable: official icon, https://lovable.dev/icon.svg
 * - gamma: official favicon mark, https://static.gamma.app/favicons/favicon_light.svg
 * - miro: no official standalone SVG mark could be verified (site serves a
 *   PNG favicon only); falls back to the Simple Icons v16.32.0 glyph
 *   (CC0-1.0, simpleicons.org) below.
 * - canva, adobe-express: no official standalone SVG icon (not just a
 *   wordmark) or Simple Icons entry could be verified; these fall back to
 *   the monogram tile.
 */
export const TOOL_LOGO_ASSETS: Record<string, string> = {
  figma: figmaLogo,
  "google-drive": googleDriveLogo,
  github: githubLogo,
  slack: slackLogo,
  notion: notionLogo,
  lovable: lovableLogo,
  gamma: gammaLogo,
};

/** Single-color Simple Icons v16.32.0 fallback glyphs (CC0-1.0), used only
 * where no official standalone SVG mark could be sourced and verified. */
export const TOOL_LOGO_FALLBACKS: Record<
  string,
  { hex: string; path: string }
> = {
  miro: {
    hex: "050038",
    path: "M17.392 0H13.9L17 4.808 10.444 0H6.949l3.102 6.3L3.494 0H0l3.05 8.131L0 24h3.494L10.05 6.985 6.949 24h3.494L17 5.494 13.899 24h3.493L24 3.672 17.392 0z",
  },
};

/** sRGB relative luminance of a "RRGGBB" hex string, per WCAG. */
function relativeLuminance(hex: string) {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(hex.slice(0, 2), 16));
  const g = channel(parseInt(hex.slice(2, 4), 16));
  const b = channel(parseInt(hex.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Whether a brand hex is dark enough to need an adaptive (foreground-colored)
 * fill instead of its literal brand color, so a single-color fallback glyph
 * stays visible on both a light and a dark tile. */
export function isDarkBrandHex(hex: string) {
  return relativeLuminance(hex) < 0.05;
}

/** A catalog tool's logo by id: an image asset when an original brand SVG is
 * available, else a single-color fallback glyph, else null (monogram). */
export function toolLogoById(
  id: string,
):
  | { kind: "asset"; src: string }
  | { kind: "glyph"; hex: string; path: string; adaptive: boolean }
  | null {
  const asset = TOOL_LOGO_ASSETS[id];
  if (asset) return { kind: "asset", src: asset };
  const fallback = TOOL_LOGO_FALLBACKS[id];
  if (fallback)
    return {
      kind: "glyph",
      hex: fallback.hex,
      path: fallback.path,
      adaptive: isDarkBrandHex(fallback.hex),
    };
  return null;
}

/** Same as `toolLogoById`, but looks the tool up by name (as stored on an
 * `ExternalToolRequirement`) against the catalog first. */
export function toolLogo(name: string) {
  const id = findCatalogTool(name)?.id;
  return id ? toolLogoById(id) : null;
}
