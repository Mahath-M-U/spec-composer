/** A single version's user-facing release notes. */
export type ReleaseNote = {
  version: string;
  /** ISO yyyy-mm-dd */
  date: string;
  highlights: readonly string[];
};

// Prepend new versions; keep package.json version in sync.
const v053: ReleaseNote = {
  version: "0.5.3",
  date: "2026-10-11",
  highlights: [
    "Asset library: browse assets by role, auto-place them into layout slots with one click, and swap them right on the canvas.",
    "Use your own photo or logo with new upload tiles in the asset library.",
    "Compiled prompts now open with a mockup framing line and describe assets by subject only.",
    "One-screen brand kit builder with a brand strategy profile, simpler select and multi-select pickers, and a font dropdown.",
    "Design kits: create and edit in one place, see better previews, and import a palette from an image.",
    "Art direction controls for scene and lighting, plus typography direction, carried into your prompts.",
    "Design editor cards for DESIGN.md with collapsible sections and live previews.",
    "Prompt and canvas linking: select an element to jump to its part of the prompt, with the style panel alongside.",
    "Layout tab presets and a refined tidy action; the style tab stays disabled until something is selected.",
    "Split Copy button with a dropdown to copy the prompt, JSON or spec in one click.",
    "Responsive editor for tablet and mobile with hideable left and right sidebars, and a better mobile home layout.",
    "Redesigned homepage hero with paired workflow previews, polished loading skeletons and toggles, and a Beta badge.",
    "Reliability and security: safer project saving to prevent data loss, and an updated app framework with a security fix.",
  ],
};

export const RELEASES: readonly ReleaseNote[] = [v053];
export const LATEST_RELEASE = v053;
