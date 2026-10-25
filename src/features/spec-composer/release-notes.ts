/** One emoji-prefixed bullet in a release's "features" or "improvements" group. */
export type ReleaseItem = { emoji: string; text: string };

/** A single version's user-facing release notes. */
export type ReleaseNote = {
  version: string;
  /** ISO yyyy-mm-dd */
  date: string;
  features: readonly ReleaseItem[];
  improvements: readonly ReleaseItem[];
  notes?: string;
};

export const RELEASE_CADENCE = "Updates ship every two weeks.";

// Prepend new versions; keep package.json version in sync; older entries
// automatically appear under Previous versions.
const v060: ReleaseNote = {
  version: "0.6.0",
  date: "2026-10-26",
  features: [
    {
      emoji: "🎬",
      text: "Scene editing: shape your environment with lighting and camera guides, shared object controls, and ready-made environment presets.",
    },
    {
      emoji: "🧍",
      text: "Editable model artwork: adjust portrait framing and model details with contextual controls alongside your design.",
    },
    {
      emoji: "📐",
      text: "More formats: explore expanded social media and resize presets with visual previews before choosing a canvas size.",
    },
  ],
  improvements: [
    {
      emoji: "🖼️",
      text: "Redesigned asset, template, and design cards with refreshed template previews and a masonry layout for your projects.",
    },
    {
      emoji: "🎨",
      text: "Clearer layers, inspector, tool rail, brand kit, and text color controls help you refine designs with fewer distractions.",
    },
  ],
};

const v053: ReleaseNote = {
  version: "0.5.3",
  date: "2026-10-11",
  features: [
    {
      emoji: "🧩",
      text: "Asset library: browse assets by role, add your own photo or logo, place them into layout slots in one click, and swap them right on the canvas.",
    },
    {
      emoji: "🎨",
      text: "Brand and design kits: a one-screen brand kit builder with a brand strategy profile, simpler pickers and a font dropdown; create and edit design kits in one place and import a palette from an image.",
    },
    {
      emoji: "🎬",
      text: "Art direction: scene, lighting and typography controls that flow straight into your prompts, which now open with a mockup framing line.",
    },
    {
      emoji: "🔗",
      text: "Prompt and canvas linking: select an element to jump to its part of the prompt, with the style panel alongside.",
    },
  ],
  improvements: [
    {
      emoji: "📱",
      text: "Responsive editor for tablet and mobile with hideable sidebars, plus a better mobile home layout.",
    },
    {
      emoji: "🖼️",
      text: "Redesigned homepage hero with paired workflow previews.",
    },
    {
      emoji: "🛡️",
      text: "Safer project saving to prevent data loss, plus a security update to the app framework.",
    },
  ],
  notes:
    "Your designs stay in this browser and are never uploaded. You can back up your designs to a JSON file anytime from My designs. Spec Composer is in Beta, so some features may still change.",
};

export const RELEASES: readonly ReleaseNote[] = [v060, v053];
export const LATEST_RELEASE = v060;
export const PREVIOUS_RELEASES: readonly ReleaseNote[] = RELEASES.slice(1);
