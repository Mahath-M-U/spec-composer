import type { AssetItem } from "../types.ts";

/** Text presets: headline treatments plus the small supporting text kinds. */
export const textItems: AssetItem[] = [
  {
    id: "text-heading-bold",
    label: "Bold heading",
    category: "text",
    kind: "title",
    tags: ["headline", "title", "bold", "heading", "display"],
    prompt:
      "Bold display headline set in heavy Manrope, tight letter spacing, sits inside a generous safe margin above the fold, primary brand color for the boldest word, punchy and legible from a distance",
    content: "Your headline",
    style: {
      fontFamily: "Manrope",
      fontSize: 84,
      fontWeight: 800,
      lineHeight: 1,
      letterSpacing: 0,
      alignment: "left",
    },
    popularRank: 1,
  },
  {
    id: "text-editorial-serif",
    label: "Editorial serif",
    category: "text",
    kind: "title",
    tags: ["headline", "serif", "editorial", "elegant", "title"],
    prompt:
      "Editorial serif headline in Playfair Display, elegant high-contrast strokes, generous line height and a touch of letter spacing, secondary brand color for a single accent word, refined magazine-cover legibility",
    content: "Your headline",
    style: {
      fontFamily: "Playfair Display",
      fontSize: 76,
      fontWeight: 700,
      lineHeight: 1.1,
      alignment: "left",
    },
  },
  {
    id: "text-condensed-display",
    label: "Condensed display",
    category: "text",
    kind: "title",
    tags: ["headline", "condensed", "uppercase", "poster", "display"],
    prompt:
      "Condensed display headline in tall uppercase Bebas Neue, wide letter spacing for impact, centered inside a bold color block, primary brand color background with light high-contrast type, shouts from across a feed",
    content: "BIG ANNOUNCEMENT",
    style: {
      fontFamily: "Bebas Neue",
      fontSize: 90,
      fontWeight: 700,
      letterSpacing: 2,
      alignment: "center",
    },
  },
  {
    id: "text-script-accent",
    label: "Script accent",
    category: "text",
    kind: "title",
    tags: ["script", "handwritten", "accent", "romantic", "title"],
    prompt:
      "Flowing script accent headline in Great Vibes, delicate connected strokes with generous swash room above and below, secondary brand color ink on a light panel, romantic and legible at a glance",
    content: "Your headline",
    style: {
      fontFamily: "Great Vibes",
      fontSize: 96,
      fontWeight: 400,
      alignment: "left",
    },
  },
  {
    id: "text-subheading",
    label: "Subheading",
    category: "text",
    kind: "subheading",
    tags: ["subheading", "supporting", "secondary", "text"],
    prompt:
      "Supporting subheading in medium-weight Inter, calm sentence case with relaxed line height, sits directly beneath the headline in a narrow measure, primary brand color for emphasis words, easy secondary read",
    content: "Add supporting message",
    style: { fontFamily: "Inter", fontSize: 36, fontWeight: 600 },
    popularRank: 7,
  },
  {
    id: "text-body",
    label: "Body",
    category: "text",
    kind: "body",
    tags: ["body", "paragraph", "copy", "text"],
    prompt:
      "Body copy paragraph in regular Open Sans, comfortable line height and a narrow measure for easy scanning, neutral ink color with the primary brand color reserved for one linked phrase, quiet supporting read",
    content:
      "Add supporting copy that explains the offer in one or two short sentences.",
    style: { fontFamily: "Open Sans", fontSize: 30, fontWeight: 400 },
  },
  {
    id: "text-caption",
    label: "Caption",
    category: "text",
    kind: "body",
    tags: ["caption", "small", "label", "text"],
    prompt:
      "Small caption line in medium Inter, muted tone and tight line height, sits flush beneath an image or card, low-contrast ink with a hint of the secondary brand color, unobtrusive but legible",
    content: "Caption text",
    style: { fontFamily: "Inter", fontSize: 20, fontWeight: 500 },
  },
  {
    id: "text-eyebrow",
    label: "Eyebrow",
    category: "text",
    kind: "eyebrow",
    tags: ["eyebrow", "tag", "label", "uppercase"],
    prompt:
      "Small eyebrow label in bold uppercase Manrope, wide letter spacing and a short word count, sits above the headline as a category tag, primary brand color ink, crisp and legible at a glance",
    content: "NEW",
    style: {
      fontFamily: "Manrope",
      fontSize: 26,
      fontWeight: 800,
      letterSpacing: 2,
    },
  },
  {
    id: "text-pull-quote",
    label: "Pull quote",
    category: "text",
    kind: "body",
    tags: ["quote", "testimonial", "italic", "editorial"],
    prompt:
      "Editorial pull quote in italic Lora with visible quotation marks, generous line height and a centered narrow measure, secondary brand color ink, warm and legible long-form read",
    content: "“Say something memorable here.”",
    style: {
      fontFamily: "Lora",
      fontSize: 40,
      fontWeight: 500,
      fontStyle: "italic",
      alignment: "center",
    },
  },
  {
    id: "text-step-number",
    label: "Step number",
    category: "text",
    kind: "eyebrow",
    tags: ["number", "step", "badge", "sequence"],
    prompt:
      "Bold step number in heavy Archivo Black, sits inside a small circular badge, primary brand color fill with light high-contrast digits, reads instantly as a numbered sequence",
    content: "01",
    style: {
      fontFamily: "Archivo Black",
      fontSize: 48,
      fontWeight: 800,
      background: "$primary",
      color: "#FFFFFF",
      borderRadius: 999,
      alignment: "center",
    },
    size: { w: 0.12, aspect: 1 },
  },
  {
    id: "text-date-time",
    label: "Date & time",
    category: "text",
    kind: "eyebrow",
    tags: ["date", "time", "schedule", "event"],
    prompt:
      "Compact date-and-time label in medium Space Grotesk, evenly spaced uppercase characters separated by thin dots, secondary brand color ink, crisp at small sizes",
    content: "SAT · MAR 14 · 7PM",
    style: {
      fontFamily: "Space Grotesk",
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: 1,
      color: "$secondary",
    },
  },
  {
    id: "text-url",
    label: "URL",
    category: "text",
    kind: "body",
    tags: ["url", "website", "link", "footer"],
    prompt:
      "Short website URL in regular DM Sans, lowercase and evenly spaced, sits on its own line near the footer, primary brand color ink, unmistakably legible at a glance",
    content: "yourbrand.com",
    style: { fontFamily: "DM Sans", fontSize: 24, fontWeight: 500 },
  },
  {
    id: "text-hashtag",
    label: "Hashtag",
    category: "text",
    kind: "eyebrow",
    tags: ["hashtag", "social", "tag"],
    prompt:
      "Bold hashtag tag in Montserrat, no spaces and a single capitalized word, secondary brand color ink on a light background, reads clearly as a social handle",
    content: "#YourBrand",
    style: { fontFamily: "Montserrat", fontSize: 24, fontWeight: 700 },
  },
  {
    id: "text-bullet-list",
    label: "Bullet list",
    category: "text",
    kind: "body",
    tags: ["list", "bullets", "features", "text"],
    prompt:
      "Short bulleted list in regular Inter, three concise lines with even spacing and round bullet marks, primary brand color bullets against neutral ink text, scannable at a glance",
    content: "• Point one\n• Point two\n• Point three",
    style: {
      fontFamily: "Inter",
      fontSize: 26,
      fontWeight: 500,
      lineHeight: 1.5,
    },
  },
];
